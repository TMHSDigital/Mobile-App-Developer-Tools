import { z } from "zod";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Framework (default: expo)."),
};

interface CompatIssue {
  severity: "critical" | "warning" | "info";
  package_name: string;
  message: string;
  recommendation: string;
}

const KNOWN_BRIDGE_ONLY_PACKAGES = new Set([
  "react-native-camera",
  "react-native-image-picker",
  "react-native-video",
  "react-native-fbsdk",
  "react-native-firebase",
  "react-native-push-notification",
  "react-native-sound",
  "react-native-background-geolocation",
  "@react-native-community/netinfo",
  "react-native-bluetooth-serial",
]);

const DEPRECATED_PACKAGES: Record<string, string> = {
  "react-native-camera": "expo-camera or react-native-vision-camera",
  "react-native-image-picker": "expo-image-picker or react-native-image-picker@5+",
  "react-native-fbsdk": "@react-native-fbsdk-next/fbsdk-next",
  "react-native-push-notification": "expo-notifications or @notifee/react-native",
  "react-native-sound": "expo-av or react-native-track-player",
  "@react-native-community/netinfo": "@react-native-community/netinfo@11+ (New Arch support)",
  "react-native-navigation": "expo-router or @react-navigation/native@7+",
  "react-native-vector-icons": "@expo/vector-icons (Expo) or react-native-vector-icons@10+",
};

const NEW_ARCH_READY_PACKAGES = new Set([
  "react-native-reanimated",
  "react-native-gesture-handler",
  "react-native-screens",
  "react-native-safe-area-context",
  "@react-native-async-storage/async-storage",
  "react-native-svg",
  "react-native-webview",
  "react-native-maps",
  "@react-native-community/datetimepicker",
  "react-native-pager-view",
  "react-native-vision-camera",
  "expo-camera",
  "expo-location",
  "expo-notifications",
  "expo-file-system",
  "expo-image-picker",
  "expo-av",
  "expo-haptics",
  "expo-secure-store",
  "expo-sqlite",
]);

function auditExpoProject(root: string): CompatIssue[] {
  const issues: CompatIssue[] = [];
  const pkgPath = join(root, "package.json");

  if (!existsSync(pkgPath)) {
    issues.push({
      severity: "critical",
      package_name: "package.json",
      message: "No package.json found at project root.",
      recommendation: "Ensure you are pointing to the correct project directory.",
    });
    return issues;
  }

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    issues.push({
      severity: "critical",
      package_name: "package.json",
      message: "Failed to parse package.json.",
      recommendation: "Fix JSON syntax errors in package.json.",
    });
    return issues;
  }

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const [name, version] of Object.entries(allDeps)) {
    if (DEPRECATED_PACKAGES[name]) {
      issues.push({
        severity: "critical",
        package_name: name,
        message: `Deprecated package. Use ${DEPRECATED_PACKAGES[name]} instead.`,
        recommendation: `Replace ${name} with ${DEPRECATED_PACKAGES[name]} for New Architecture support.`,
      });
    } else if (KNOWN_BRIDGE_ONLY_PACKAGES.has(name)) {
      issues.push({
        severity: "warning",
        package_name: name,
        message: "This package may not support the New Architecture (Fabric/TurboModules).",
        recommendation: "Check the package README for New Architecture support or find an alternative.",
      });
    }

    if (name.startsWith("react-native-") && !name.startsWith("@") && !NEW_ARCH_READY_PACKAGES.has(name)) {
      const isKnownIssue = DEPRECATED_PACKAGES[name] || KNOWN_BRIDGE_ONLY_PACKAGES.has(name);
      if (!isKnownIssue) {
        issues.push({
          severity: "info",
          package_name: name,
          message: "Unverified New Architecture compatibility. Check package docs.",
          recommendation: `Verify ${name} supports Fabric/TurboModules before enabling New Architecture.`,
        });
      }
    }
  }

  const appJsonPath = join(root, "app.json");
  if (existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(readFileSync(appJsonPath, "utf-8"));
      const newArchEnabled = appJson?.expo?.newArchEnabled;
      if (newArchEnabled === undefined) {
        issues.push({
          severity: "info",
          package_name: "app.json",
          message: 'New Architecture not explicitly configured. Set "newArchEnabled" in app.json.',
          recommendation: 'Add "newArchEnabled": true under expo key to enable Fabric and TurboModules.',
        });
      }
    } catch { /* skip parse errors */ }
  }

  if (issues.length === 0) {
    issues.push({
      severity: "info",
      package_name: "project",
      message: "No known compatibility issues detected. All checked packages appear New Architecture ready.",
      recommendation: "Enable New Architecture in app.json and test thoroughly on both platforms.",
    });
  }

  return issues;
}

function auditFlutterProject(root: string): CompatIssue[] {
  const issues: CompatIssue[] = [];
  const pubspecPath = join(root, "pubspec.yaml");

  if (!existsSync(pubspecPath)) {
    issues.push({
      severity: "critical",
      package_name: "pubspec.yaml",
      message: "No pubspec.yaml found at project root.",
      recommendation: "Ensure you are pointing to the correct Flutter project directory.",
    });
    return issues;
  }

  let content: string;
  try {
    content = readFileSync(pubspecPath, "utf-8");
  } catch {
    issues.push({
      severity: "critical",
      package_name: "pubspec.yaml",
      message: "Failed to read pubspec.yaml.",
      recommendation: "Check file permissions.",
    });
    return issues;
  }

  const sdkMatch = content.match(/sdk:\s*['"]?>=?\s*([\d.]+)/);
  if (sdkMatch) {
    const minSdk = sdkMatch[1];
    const parts = minSdk.split(".").map(Number);
    if (parts[0] < 3) {
      issues.push({
        severity: "critical",
        package_name: "dart-sdk",
        message: `Dart SDK constraint starts at ${minSdk}. Dart 3+ is required for modern Flutter.`,
        recommendation: "Update sdk constraint to >=3.0.0 in pubspec.yaml.",
      });
    }
  }

  const androidDir = join(root, "android");
  if (existsSync(androidDir)) {
    const buildGradlePath = join(androidDir, "app", "build.gradle");
    if (existsSync(buildGradlePath)) {
      try {
        const gradle = readFileSync(buildGradlePath, "utf-8");
        const minSdkMatch = gradle.match(/minSdkVersion\s+(\d+)/);
        if (minSdkMatch && parseInt(minSdkMatch[1], 10) < 21) {
          issues.push({
            severity: "warning",
            package_name: "android/app/build.gradle",
            message: `minSdkVersion ${minSdkMatch[1]} is below 21. Most modern packages require 21+.`,
            recommendation: "Update minSdkVersion to at least 21 (or 23 for best compatibility).",
          });
        }
      } catch { /* skip */ }
    }
  }

  const deprecatedFlutterPackages: Record<string, string> = {
    "flutter_webview_plugin": "webview_flutter",
    "flutter_calendar_carousel": "table_calendar",
    "flutter_slidable": "flutter_slidable@3+ (check API migration)",
    "cached_network_image": "cached_network_image@3+ (null safety)",
    "sqflite": "drift or sqflite@2+ (null safety)",
  };

  for (const [name, replacement] of Object.entries(deprecatedFlutterPackages)) {
    if (content.includes(name + ":")) {
      issues.push({
        severity: "warning",
        package_name: name,
        message: `Consider upgrading or replacing with ${replacement}.`,
        recommendation: `Migrate from ${name} to ${replacement} for better compatibility.`,
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      severity: "info",
      package_name: "project",
      message: "No known compatibility issues detected.",
      recommendation: "Run flutter analyze and flutter test to verify full compatibility.",
    });
  }

  return issues;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_checkNativeCompat",
    "Audit installed packages for New Architecture (Fabric/TurboModules) support. Flag bridge-only dependencies, deprecated native APIs, and packages without JSI support.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        if (!existsSync(root)) {
          return errorResponse(new Error(`Project path does not exist: ${root}`));
        }

        const issues = args.framework === "flutter"
          ? auditFlutterProject(root)
          : auditExpoProject(root);

        const criticalCount = issues.filter((i) => i.severity === "critical").length;
        const warningCount = issues.filter((i) => i.severity === "warning").length;
        const infoCount = issues.filter((i) => i.severity === "info").length;

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: args.framework,
              summary: {
                total_issues: issues.length,
                critical: criticalCount,
                warnings: warningCount,
                info: infoCount,
              },
              issues,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

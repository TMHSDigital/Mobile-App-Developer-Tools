import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
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
    .describe("Framework to audit (default: expo)."),
};

interface AuditFinding {
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  fix: string;
}

function readJsonSafe(filePath: string): Record<string, unknown> | null {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function readFileSafe(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function auditExpoProject(root: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const pkg = readJsonSafe(join(root, "package.json")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } | null;

  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (!allDeps["react-native-ssl-pinning"] && !allDeps["react-native-cert-pinner"]) {
      findings.push({
        severity: "high",
        category: "SSL Pinning",
        message: "No SSL pinning library detected. API traffic is vulnerable to MITM attacks.",
        fix: "Install react-native-ssl-pinning and configure certificate pins for your API endpoints.",
      });
    }

    if (!allDeps["expo-secure-store"] && !allDeps["react-native-keychain"] && !allDeps["react-native-encrypted-storage"]) {
      findings.push({
        severity: "high",
        category: "Secure Storage",
        message: "No secure storage library found. Tokens stored in AsyncStorage are readable on rooted devices.",
        fix: "Use expo-secure-store or react-native-keychain for auth tokens and secrets.",
      });
    }

    if (!allDeps["jail-monkey"] && !allDeps["react-native-device-info"]) {
      findings.push({
        severity: "medium",
        category: "Root/Jailbreak Detection",
        message: "No jailbreak/root detection library found.",
        fix: "Add jail-monkey to detect compromised devices and warn users or restrict functionality.",
      });
    }

    const heavyDebugDeps = ["reactotron-react-native", "flipper-plugin", "react-native-flipper"];
    for (const dep of heavyDebugDeps) {
      if (pkg.dependencies?.[dep]) {
        findings.push({
          severity: "medium",
          category: "Debug in Production",
          message: `${dep} is in dependencies (not devDependencies). It will ship in production builds.`,
          fix: `Move ${dep} to devDependencies.`,
        });
      }
    }
  }

  const appJson = readJsonSafe(join(root, "app.json")) as {
    expo?: {
      android?: { permissions?: string[]; usesCleartextTraffic?: boolean };
      ios?: { infoPlist?: Record<string, unknown> };
    };
  } | null;

  if (appJson?.expo?.android?.usesCleartextTraffic === true) {
    findings.push({
      severity: "high",
      category: "Cleartext Traffic",
      message: "Cleartext (HTTP) traffic is enabled for Android. All network data can be intercepted.",
      fix: "Set android.usesCleartextTraffic to false in app.json and use HTTPS endpoints.",
    });
  }

  const appConfig = readFileSafe(join(root, "app.config.ts")) ?? readFileSafe(join(root, "app.config.js")) ?? "";
  if (appConfig.includes("usesCleartextTraffic: true")) {
    findings.push({
      severity: "high",
      category: "Cleartext Traffic",
      message: "Cleartext traffic enabled in app.config. All HTTP traffic is unencrypted.",
      fix: "Remove usesCleartextTraffic or set it to false.",
    });
  }

  const easJson = readJsonSafe(join(root, "eas.json")) as Record<string, unknown> | null;
  if (easJson) {
    const easStr = JSON.stringify(easJson);
    if (easStr.includes("credentialsSource") && easStr.includes('"local"')) {
      const keystoreInRepo = existsSync(join(root, "android", "app", "release.keystore")) ||
        existsSync(join(root, "credentials"));
      if (keystoreInRepo) {
        findings.push({
          severity: "high",
          category: "Signing Credentials",
          message: "Local signing credentials detected in the repository. Keystores should not be committed.",
          fix: "Use EAS managed credentials or store keystores outside the repo and reference via environment variables.",
        });
      }
    }
  }

  if (findings.length === 0) {
    findings.push({
      severity: "low",
      category: "General",
      message: "No obvious security issues detected. Consider a manual review for business logic vulnerabilities.",
      fix: "Review OWASP Mobile Top 10 for comprehensive coverage.",
    });
  }

  return findings;
}

function auditFlutterProject(root: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const pubspec = readFileSafe(join(root, "pubspec.yaml")) ?? "";

  if (!pubspec.includes("flutter_jailbreak_detection") && !pubspec.includes("safe_device")) {
    findings.push({
      severity: "medium",
      category: "Root/Jailbreak Detection",
      message: "No jailbreak/root detection package found in pubspec.yaml.",
      fix: "Add flutter_jailbreak_detection or safe_device to detect compromised devices.",
    });
  }

  if (!pubspec.includes("flutter_secure_storage")) {
    findings.push({
      severity: "high",
      category: "Secure Storage",
      message: "flutter_secure_storage not found. SharedPreferences stores data in plaintext.",
      fix: "Add flutter_secure_storage for auth tokens and sensitive data.",
    });
  }

  if (!pubspec.includes("ssl_pinning_plugin") && !pubspec.includes("dio_http_certificate_pinning")) {
    findings.push({
      severity: "high",
      category: "SSL Pinning",
      message: "No SSL pinning package detected.",
      fix: "Add ssl_pinning_plugin or configure certificate pinning in your HTTP client.",
    });
  }

  const androidManifest = readFileSafe(join(root, "android", "app", "src", "main", "AndroidManifest.xml")) ?? "";
  if (androidManifest.includes('android:usesCleartextTraffic="true"')) {
    findings.push({
      severity: "high",
      category: "Cleartext Traffic",
      message: "Cleartext traffic is allowed in AndroidManifest.xml.",
      fix: 'Set android:usesCleartextTraffic="false" or remove the attribute.',
    });
  }

  if (androidManifest.includes("android:debuggable")) {
    findings.push({
      severity: "high",
      category: "Debug Flag",
      message: "android:debuggable is set in AndroidManifest.xml. Ensure it is false for release builds.",
      fix: "Remove android:debuggable from AndroidManifest.xml; Gradle sets it automatically per build type.",
    });
  }

  const buildGradle = readFileSafe(join(root, "android", "app", "build.gradle")) ?? "";
  if (buildGradle.includes("minifyEnabled false") || !buildGradle.includes("minifyEnabled")) {
    findings.push({
      severity: "medium",
      category: "Code Obfuscation",
      message: "ProGuard/R8 code shrinking may be disabled for release builds.",
      fix: "Set minifyEnabled true and shrinkResources true in the release buildType.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: "low",
      category: "General",
      message: "No obvious security issues detected. Review OWASP Mobile Top 10 for additional coverage.",
      fix: "Consider manual penetration testing for business logic vulnerabilities.",
    });
  }

  return findings;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_securityAudit",
    "Scan a mobile project for common security anti-patterns: insecure storage, missing SSL pinning, debug flags in release, cleartext traffic, exposed credentials.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        if (!existsSync(root)) {
          return errorResponse(new Error(`Project path does not exist: ${root}`));
        }

        const findings = args.framework === "flutter"
          ? auditFlutterProject(root)
          : auditExpoProject(root);

        const highCount = findings.filter((f) => f.severity === "high").length;
        const mediumCount = findings.filter((f) => f.severity === "medium").length;

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: args.framework,
              summary: {
                total_findings: findings.length,
                high: highCount,
                medium: mediumCount,
                low: findings.length - highCount - mediumCount,
              },
              findings,
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

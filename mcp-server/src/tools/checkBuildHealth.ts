import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  platform: z
    .enum(["ios", "android", "both"])
    .optional()
    .default("both")
    .describe("Platform to check build health for"),
};

interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

function checkAppJson(root: string): HealthCheck {
  const appJsonPath = join(root, "app.json");
  if (!existsSync(appJsonPath)) {
    return { name: "app.json", status: "fail", message: "app.json not found" };
  }

  try {
    const content = readFileSync(appJsonPath, "utf-8");
    const config = JSON.parse(content);

    if (!config.expo) {
      return {
        name: "app.json",
        status: "fail",
        message: 'app.json missing "expo" key',
      };
    }

    const warnings: string[] = [];
    if (!config.expo.name) warnings.push("missing expo.name");
    if (!config.expo.slug) warnings.push("missing expo.slug");
    if (!config.expo.version) warnings.push("missing expo.version");
    if (!config.expo.scheme) warnings.push("missing expo.scheme (needed for deep linking)");

    if (warnings.length > 0) {
      return {
        name: "app.json",
        status: "warn",
        message: `Valid JSON but: ${warnings.join(", ")}`,
      };
    }

    return { name: "app.json", status: "pass", message: "Valid configuration" };
  } catch (e) {
    return {
      name: "app.json",
      status: "fail",
      message: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

function checkPackageJson(root: string): HealthCheck {
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) {
    return {
      name: "package.json",
      status: "fail",
      message: "package.json not found",
    };
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (!deps.expo) {
      return {
        name: "package.json",
        status: "fail",
        message: "expo is not listed as a dependency",
      };
    }

    return {
      name: "package.json",
      status: "pass",
      message: `Expo ${deps.expo} detected`,
    };
  } catch (e) {
    return {
      name: "package.json",
      status: "fail",
      message: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

function checkNodeModules(root: string): HealthCheck {
  if (!existsSync(join(root, "node_modules"))) {
    return {
      name: "node_modules",
      status: "fail",
      message: 'node_modules not found. Run "npm install".',
    };
  }
  return { name: "node_modules", status: "pass", message: "Installed" };
}

function checkTypeScript(root: string): HealthCheck {
  const tsconfigPath = join(root, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    return {
      name: "TypeScript",
      status: "warn",
      message: "No tsconfig.json found. TypeScript is recommended.",
    };
  }

  try {
    execSync("npx tsc --noEmit", {
      cwd: root,
      encoding: "utf-8",
      timeout: 60000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return {
      name: "TypeScript",
      status: "pass",
      message: "Compiles without errors",
    };
  } catch (e) {
    const stderr =
      e instanceof Error && "stderr" in e ? (e as any).stderr : String(e);
    const errorCount = (stderr.match(/error TS/g) || []).length;
    return {
      name: "TypeScript",
      status: "fail",
      message: `${errorCount} TypeScript error(s) found`,
    };
  }
}

function checkNativeModules(root: string, platform: string): HealthCheck {
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) {
    return {
      name: "Native modules",
      status: "warn",
      message: "Cannot check without package.json",
    };
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const deps = Object.keys(pkg.dependencies || {});

  const nativePackages = deps.filter(
    (d) =>
      d.startsWith("expo-camera") ||
      d.startsWith("expo-location") ||
      d.startsWith("expo-contacts") ||
      d.startsWith("expo-media-library") ||
      d.startsWith("expo-notifications") ||
      d.startsWith("expo-sensors") ||
      d.startsWith("expo-local-authentication") ||
      d.startsWith("react-native-reanimated") ||
      d.startsWith("react-native-gesture-handler") ||
      d.startsWith("react-native-maps") ||
      d.startsWith("react-native-webview"),
  );

  if (nativePackages.length === 0) {
    return {
      name: "Native modules",
      status: "pass",
      message: "No native modules detected (Expo Go compatible)",
    };
  }

  const hasIosBuild = existsSync(join(root, "ios"));
  const hasAndroidBuild = existsSync(join(root, "android"));
  const needsIos = platform === "ios" || platform === "both";
  const needsAndroid = platform === "android" || platform === "both";

  const warnings: string[] = [];
  if (needsIos && !hasIosBuild) warnings.push("ios/ directory missing");
  if (needsAndroid && !hasAndroidBuild)
    warnings.push("android/ directory missing");

  if (warnings.length > 0) {
    return {
      name: "Native modules",
      status: "warn",
      message: `${nativePackages.length} native module(s) found but ${warnings.join(", ")}. Run "npx expo prebuild".`,
    };
  }

  return {
    name: "Native modules",
    status: "pass",
    message: `${nativePackages.length} native module(s), native directories present`,
  };
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_checkBuildHealth",
    "Run build health checks on an Expo project: validate app.json, check dependencies, verify TypeScript, detect native module issues.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();

        if (!existsSync(join(root, "app.json")) && !existsSync(join(root, "package.json"))) {
          return errorResponse(
            new Error(`Not an Expo project: no app.json or package.json at ${root}`),
          );
        }

        const checks: HealthCheck[] = [
          checkAppJson(root),
          checkPackageJson(root),
          checkNodeModules(root),
          checkTypeScript(root),
          checkNativeModules(root, args.platform),
        ];

        const passed = checks.filter((c) => c.status === "pass").length;
        const failed = checks.filter((c) => c.status === "fail").length;
        const warned = checks.filter((c) => c.status === "warn").length;

        const result = {
          project_path: root,
          platform: args.platform,
          summary: `${passed} passed, ${failed} failed, ${warned} warnings`,
          healthy: failed === 0,
          checks,
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
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
  target_version: z
    .string()
    .optional()
    .describe("Target SDK version to upgrade to. If omitted, detects latest."),
};

interface UpgradeReport {
  framework: string;
  current_version: string | null;
  target_version: string | null;
  upgrade_steps: string[];
  breaking_changes: string[];
  dependency_actions: string[];
  pre_upgrade_checklist: string[];
  rollback_strategy: string[];
}

function detectExpoVersion(root: string): string | null {
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const expoVersion = pkg.dependencies?.expo || pkg.devDependencies?.expo;
    if (!expoVersion) return null;
    return expoVersion.replace(/[\^~>=<]/g, "").trim();
  } catch {
    return null;
  }
}

function detectFlutterVersion(root: string): string | null {
  try {
    const output = execSync("flutter --version --machine", {
      cwd: root,
      timeout: 15000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const parsed = JSON.parse(output);
    return parsed.frameworkVersion || null;
  } catch {
    const pubspecPath = join(root, "pubspec.yaml");
    if (!existsSync(pubspecPath)) return null;
    try {
      const content = readFileSync(pubspecPath, "utf-8");
      const match = content.match(/sdk:\s*['"]?>=?\s*([\d.]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

function getExpoUpgradeSteps(current: string | null, target: string | null): UpgradeReport {
  return {
    framework: "expo",
    current_version: current,
    target_version: target || "latest",
    pre_upgrade_checklist: [
      "Commit all current changes to git (create a clean restore point)",
      "Run existing tests and confirm they pass",
      "Review CHANGELOG for target SDK version at expo.dev/changelog",
      "Run npx expo-doctor to check current project health",
      "Back up app.json / app.config.js",
    ],
    upgrade_steps: [
      `Run: npx expo install expo@${target || "latest"} --fix`,
      "Run: npx expo install --fix (updates all Expo packages to compatible versions)",
      "Run: npx expo-doctor (check for remaining compatibility issues)",
      "Update app.json sdkVersion if present",
      "Run: npx expo prebuild --clean (regenerate native projects)",
      "Run: npx expo start --clear (clear Metro cache)",
      "Test on both iOS and Android simulators/devices",
    ],
    breaking_changes: [
      "Check for deprecated APIs removed in the new SDK version",
      "Review Expo Router version compatibility if using file-based routing",
      "Check if any config plugins need updates for the new SDK",
      "Verify native module compatibility with expo-doctor",
      "Check React Native version bump (Expo SDK pins a specific RN version)",
    ],
    dependency_actions: [
      "Run: npx expo install --check (list packages needing updates)",
      "Update @react-navigation/* packages if using React Navigation directly",
      "Update react-native-reanimated, react-native-gesture-handler to compatible versions",
      "Check third-party native modules for SDK compatibility",
      "Run: npm outdated (check for other stale dependencies)",
    ],
    rollback_strategy: [
      "git stash or git checkout to restore pre-upgrade state",
      "Restore package.json and package-lock.json from git",
      "Run npm install to restore node_modules",
      "Run npx expo prebuild --clean to regenerate native projects",
      "If using EAS, the previous build is still available for download",
    ],
  };
}

function getFlutterUpgradeSteps(current: string | null, target: string | null): UpgradeReport {
  return {
    framework: "flutter",
    current_version: current,
    target_version: target || "latest stable",
    pre_upgrade_checklist: [
      "Commit all current changes to git",
      "Run flutter test and confirm tests pass",
      "Run flutter analyze to check for existing issues",
      "Review Flutter release notes at docs.flutter.dev/release/release-notes",
      "Back up pubspec.yaml and pubspec.lock",
    ],
    upgrade_steps: [
      `Run: flutter upgrade${target ? ` ${target}` : ""}`,
      "Run: flutter pub upgrade --major-versions (update dependencies)",
      "Run: flutter pub get",
      "Run: flutter analyze (check for new lint warnings)",
      "Run: dart fix --apply (auto-fix deprecations)",
      "Run: flutter clean && flutter pub get",
      "Test on both iOS and Android",
    ],
    breaking_changes: [
      "Check for deprecated Widget APIs removed in the new version",
      "Review Material 3 migration status if upgrading across major versions",
      "Check Gradle and AGP version requirements for Android",
      "Verify CocoaPods and Xcode version compatibility for iOS",
      "Check for Dart language version changes affecting your code",
    ],
    dependency_actions: [
      "Run: flutter pub outdated (list packages needing updates)",
      "Update go_router, riverpod, bloc if using those packages",
      "Check native plugin compatibility (firebase, maps, camera)",
      "Update build.gradle minSdkVersion if required by new Flutter",
      "Update Podfile deployment target if required",
    ],
    rollback_strategy: [
      "git checkout to restore pre-upgrade state",
      "Restore pubspec.yaml and pubspec.lock from git",
      "Run flutter pub get to restore packages",
      "Run flutter clean to clear build artifacts",
      "Use flutter downgrade if needed (only works for latest->previous)",
    ],
  };
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_upgradeSDK",
    "Detect current SDK version, compare to target, and generate a step-by-step upgrade plan with dependency fixes, breaking change warnings, and rollback strategy.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        if (!existsSync(root)) {
          return errorResponse(new Error(`Project path does not exist: ${root}`));
        }

        const isFlutter = args.framework === "flutter";
        const currentVersion = isFlutter
          ? detectFlutterVersion(root)
          : detectExpoVersion(root);

        const report = isFlutter
          ? getFlutterUpgradeSteps(currentVersion, args.target_version ?? null)
          : getExpoUpgradeSteps(currentVersion, args.target_version ?? null);

        return textResponse(JSON.stringify(report, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

import { z } from "zod";
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  include_pods: z
    .boolean()
    .optional()
    .default(false)
    .describe("Remove ios/Pods and run pod install (macOS only)"),
  include_gradle: z
    .boolean()
    .optional()
    .default(false)
    .describe("Clean Android Gradle build cache"),
};

interface CleanStep {
  name: string;
  status: "cleaned" | "skipped" | "error";
  message: string;
}

function safeRemove(path: string): boolean {
  if (!existsSync(path)) return false;
  try {
    rmSync(path, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_resetDevEnvironment",
    "Nuclear reset for a stuck Expo dev environment: clear Metro cache, node_modules cache, .expo directory, and optionally iOS Pods and Android Gradle cache.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const steps: CleanStep[] = [];

        if (!existsSync(join(root, "package.json"))) {
          return errorResponse(
            new Error(`No package.json at ${root}. Is this a project root?`),
          );
        }

        // Metro cache
        const metroCache = join(root, "node_modules", ".cache", "metro");
        steps.push({
          name: "Metro cache",
          status: safeRemove(metroCache) ? "cleaned" : "skipped",
          message: safeRemove(metroCache)
            ? "Removed node_modules/.cache/metro"
            : "Metro cache not found",
        });

        // General node_modules cache
        const nmCache = join(root, "node_modules", ".cache");
        if (existsSync(nmCache)) {
          safeRemove(nmCache);
          steps.push({
            name: "node_modules/.cache",
            status: "cleaned",
            message: "Removed all cached build artifacts",
          });
        } else {
          steps.push({
            name: "node_modules/.cache",
            status: "skipped",
            message: "No cache directory found",
          });
        }

        // .expo directory
        const expoDir = join(root, ".expo");
        steps.push({
          name: ".expo directory",
          status: safeRemove(expoDir) ? "cleaned" : "skipped",
          message: existsSync(expoDir)
            ? "Removed .expo directory"
            : ".expo directory not found",
        });

        // Temp directory
        const tmpDir = join(root, "tmp");
        if (existsSync(tmpDir)) {
          safeRemove(tmpDir);
          steps.push({
            name: "tmp directory",
            status: "cleaned",
            message: "Removed tmp directory",
          });
        }

        // iOS Pods
        if (args.include_pods) {
          const podsDir = join(root, "ios", "Pods");
          const podfileLock = join(root, "ios", "Podfile.lock");

          if (existsSync(podsDir)) {
            safeRemove(podsDir);
            if (existsSync(podfileLock)) safeRemove(podfileLock);

            try {
              execSync("pod install", {
                cwd: join(root, "ios"),
                encoding: "utf-8",
                timeout: 120000,
                stdio: ["pipe", "pipe", "pipe"],
              });
              steps.push({
                name: "iOS Pods",
                status: "cleaned",
                message: "Removed Pods, reinstalled via pod install",
              });
            } catch {
              steps.push({
                name: "iOS Pods",
                status: "error",
                message:
                  "Removed Pods but pod install failed. Run manually: cd ios && pod install",
              });
            }
          } else {
            steps.push({
              name: "iOS Pods",
              status: "skipped",
              message: "ios/Pods not found",
            });
          }
        }

        // Android Gradle cache
        if (args.include_gradle) {
          const gradleBuild = join(root, "android", "build");
          const appBuild = join(root, "android", "app", "build");

          let cleaned = false;
          if (existsSync(gradleBuild)) {
            safeRemove(gradleBuild);
            cleaned = true;
          }
          if (existsSync(appBuild)) {
            safeRemove(appBuild);
            cleaned = true;
          }

          steps.push({
            name: "Android Gradle",
            status: cleaned ? "cleaned" : "skipped",
            message: cleaned
              ? "Removed android/build and android/app/build"
              : "Android build directories not found",
          });
        }

        const cleaned = steps.filter((s) => s.status === "cleaned").length;
        const result = {
          success: true,
          project_path: root,
          summary: `${cleaned} of ${steps.length} items cleaned`,
          steps,
          next_steps: [
            "Run: npx expo start --clear",
            "If issues persist: rm -rf node_modules && npm install",
            "For native rebuild: npx expo prebuild --clean",
          ],
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

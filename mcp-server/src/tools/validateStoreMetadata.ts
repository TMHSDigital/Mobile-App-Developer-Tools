import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
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
    .describe("Which platform to validate metadata for"),
};

interface CheckResult {
  field: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_validateStoreMetadata",
    "Check that an Expo project has all required app store listing fields: name, bundle ID, version, icon, splash, privacy policy. Returns a pass/fail checklist.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const appJsonPath = join(root, "app.json");

        if (!existsSync(appJsonPath)) {
          return errorResponse(
            new Error(`No app.json found at ${root}. Is this an Expo project?`),
          );
        }

        const appJson = JSON.parse(readFileSync(appJsonPath, "utf-8"));
        const expo = appJson.expo || {};
        const checks: CheckResult[] = [];
        const platform = args.platform;

        // Shared checks
        checks.push({
          field: "expo.name",
          status: expo.name ? "pass" : "fail",
          message: expo.name
            ? `"${expo.name}" (${expo.name.length} chars)`
            : "Missing app name",
        });

        if (expo.name && expo.name.length > 30) {
          checks.push({
            field: "expo.name (length)",
            status: "warn",
            message: `Name is ${expo.name.length} chars. Both stores limit to 30.`,
          });
        }

        checks.push({
          field: "expo.version",
          status: expo.version ? "pass" : "fail",
          message: expo.version
            ? `"${expo.version}"`
            : "Missing version string",
        });

        checks.push({
          field: "expo.icon",
          status: expo.icon ? "pass" : "fail",
          message: expo.icon
            ? existsSync(join(root, expo.icon))
              ? `Found: ${expo.icon}`
              : `Configured as ${expo.icon} but file not found`
            : "Missing app icon",
        });

        if (expo.icon && existsSync(join(root, expo.icon))) {
          checks[checks.length - 1].status = "pass";
        } else if (expo.icon) {
          checks[checks.length - 1].status = "fail";
        }

        checks.push({
          field: "expo.splash",
          status: expo.splash?.image ? "pass" : "warn",
          message: expo.splash?.image
            ? `Found: ${expo.splash.image}`
            : "No splash screen configured (recommended)",
        });

        // iOS-specific
        if (platform === "ios" || platform === "both") {
          checks.push({
            field: "expo.ios.bundleIdentifier",
            status: expo.ios?.bundleIdentifier ? "pass" : "fail",
            message: expo.ios?.bundleIdentifier
              ? `"${expo.ios.bundleIdentifier}"`
              : "Missing iOS bundle identifier",
          });

          if (expo.ios?.bundleIdentifier) {
            const validBundle = /^[a-zA-Z][a-zA-Z0-9.-]*$/.test(
              expo.ios.bundleIdentifier,
            );
            if (!validBundle) {
              checks.push({
                field: "expo.ios.bundleIdentifier (format)",
                status: "fail",
                message:
                  "Invalid format. Must start with a letter and contain only alphanumerics, dots, and hyphens.",
              });
            }
          }

          checks.push({
            field: "expo.ios.buildNumber",
            status: expo.ios?.buildNumber ? "pass" : "warn",
            message: expo.ios?.buildNumber
              ? `"${expo.ios.buildNumber}"`
              : "Not set. Will default to 1. Set autoIncrement in eas.json for production.",
          });
        }

        // Android-specific
        if (platform === "android" || platform === "both") {
          checks.push({
            field: "expo.android.package",
            status: expo.android?.package ? "pass" : "fail",
            message: expo.android?.package
              ? `"${expo.android.package}"`
              : "Missing Android package name",
          });

          if (expo.android?.package) {
            const validPackage = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(
              expo.android.package,
            );
            if (!validPackage) {
              checks.push({
                field: "expo.android.package (format)",
                status: "fail",
                message:
                  "Invalid format. Must be reverse domain notation (e.g. com.example.myapp).",
              });
            }
          }

          checks.push({
            field: "expo.android.versionCode",
            status:
              expo.android?.versionCode !== undefined ? "pass" : "warn",
            message:
              expo.android?.versionCode !== undefined
                ? `${expo.android.versionCode}`
                : "Not set. Will default to 1. Set autoIncrement in eas.json for production.",
          });

          checks.push({
            field: "expo.android.adaptiveIcon",
            status: expo.android?.adaptiveIcon?.foregroundImage
              ? "pass"
              : "warn",
            message: expo.android?.adaptiveIcon?.foregroundImage
              ? `Found: ${expo.android.adaptiveIcon.foregroundImage}`
              : "No adaptive icon configured (recommended for Android)",
          });
        }

        const passed = checks.filter((c) => c.status === "pass").length;
        const failed = checks.filter((c) => c.status === "fail").length;
        const warned = checks.filter((c) => c.status === "warn").length;

        const result = {
          project_path: root,
          platform,
          summary: `${passed} passed, ${failed} failed, ${warned} warnings out of ${checks.length} checks`,
          ready: failed === 0,
          checks,
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

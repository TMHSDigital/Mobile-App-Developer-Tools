import { z } from "zod";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  platform: z
    .enum(["ios", "android", "both"])
    .describe("Target platform for the production build"),
  profile: z
    .string()
    .optional()
    .default("production")
    .describe("EAS build profile name (default: production)"),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
};

function validateAppJson(
  root: string,
  platform: string,
): { valid: boolean; errors: string[] } {
  const appJsonPath = join(root, "app.json");
  if (!existsSync(appJsonPath)) {
    return { valid: false, errors: ["app.json not found"] };
  }

  const appJson = JSON.parse(readFileSync(appJsonPath, "utf-8"));
  const expo = appJson.expo || {};
  const errors: string[] = [];

  if (!expo.version) errors.push("Missing expo.version");
  if (!expo.icon) errors.push("Missing expo.icon");

  if (platform === "ios" || platform === "both") {
    if (!expo.ios?.bundleIdentifier) {
      errors.push("Missing expo.ios.bundleIdentifier");
    }
  }

  if (platform === "android" || platform === "both") {
    if (!expo.android?.package) {
      errors.push("Missing expo.android.package");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_buildForStore",
    "Create a production build for app store submission using EAS Build. Validates app.json before building.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const platforms =
          args.platform === "both" ? ["ios", "android"] : [args.platform];

        const validation = validateAppJson(root, args.platform);
        if (!validation.valid) {
          return textResponse(
            JSON.stringify(
              {
                success: false,
                message: "app.json validation failed. Fix these before building:",
                errors: validation.errors,
              },
              null,
              2,
            ),
          );
        }

        const results: Array<{
          platform: string;
          status: string;
          output: string;
        }> = [];

        for (const platform of platforms) {
          try {
            const cmd = `npx eas-cli build --platform ${platform} --profile ${args.profile} --non-interactive`;
            const output = execSync(cmd, {
              cwd: root,
              encoding: "utf-8",
              timeout: 600000,
              stdio: ["pipe", "pipe", "pipe"],
            });

            results.push({
              platform,
              status: "submitted",
              output: output.slice(-500),
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            results.push({
              platform,
              status: "error",
              output: message.slice(-500),
            });
          }
        }

        const result = {
          success: results.every((r) => r.status === "submitted"),
          profile: args.profile,
          builds: results,
          next_steps: [
            "Monitor build progress at https://expo.dev",
            "Once complete, use mobile_submitToAppStore for iOS",
            "For Android, use eas submit --platform android",
          ],
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

import { z } from "zod";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  apple_id: z
    .string()
    .optional()
    .describe("Apple ID email for App Store Connect. Falls back to EAS config or env."),
  asc_app_id: z
    .string()
    .optional()
    .describe("App Store Connect app ID (numeric). Falls back to EAS config."),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_submitToAppStore",
    "Submit the latest iOS production build to App Store Connect via EAS Submit. Validates that EAS CLI is available.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();

        if (!existsSync(join(root, "app.json"))) {
          return errorResponse(
            new Error(`No app.json at ${root}. Is this an Expo project?`),
          );
        }

        // Check EAS CLI is available
        try {
          execSync("npx eas-cli --version", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 15000,
          });
        } catch {
          return textResponse(
            JSON.stringify(
              {
                success: false,
                message:
                  "EAS CLI not found. Install with: npm install -g eas-cli",
              },
              null,
              2,
            ),
          );
        }

        // Build the submit command
        const cmdParts = [
          "npx eas-cli submit",
          "--platform ios",
          "--non-interactive",
        ];

        if (args.apple_id) {
          cmdParts.push(`--apple-id ${args.apple_id}`);
        }

        if (args.asc_app_id) {
          cmdParts.push(`--asc-app-id ${args.asc_app_id}`);
        }

        const cmd = cmdParts.join(" ");

        try {
          const output = execSync(cmd, {
            cwd: root,
            encoding: "utf-8",
            timeout: 300000,
            stdio: ["pipe", "pipe", "pipe"],
          });

          return textResponse(
            JSON.stringify(
              {
                success: true,
                message: "Build submitted to App Store Connect",
                output: output.slice(-1000),
                next_steps: [
                  "Check App Store Connect for the build status",
                  "Add the build to a TestFlight group for testing",
                  "Once tested, submit for App Review",
                  "Provide demo credentials in App Review Information if login is required",
                ],
              },
              null,
              2,
            ),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return textResponse(
            JSON.stringify(
              {
                success: false,
                message: "Submission failed",
                error: message.slice(-1000),
                troubleshooting: [
                  "Ensure you have a recent production build: eas build --platform ios --profile production",
                  "Check Apple credentials: eas credentials --platform ios",
                  "Verify Apple Developer account is active",
                  "If using ASC API key, ensure it has App Manager role",
                ],
              },
              null,
              2,
            ),
          );
        }
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

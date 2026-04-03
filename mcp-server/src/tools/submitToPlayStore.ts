import { z } from "zod";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  track: z
    .enum(["internal", "alpha", "beta", "production"])
    .optional()
    .default("internal")
    .describe(
      "Play Console release track (default: internal). Use internal for testing, production for public release.",
    ),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_submitToPlayStore",
    "Submit the latest Android production build to Google Play Console via EAS Submit. Validates that EAS CLI is available and app.json has an Android package.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const appJsonPath = join(root, "app.json");

        if (!existsSync(appJsonPath)) {
          return errorResponse(
            new Error(`No app.json at ${root}. Is this an Expo project?`),
          );
        }

        const appJson = JSON.parse(readFileSync(appJsonPath, "utf-8"));
        const androidPackage = appJson.expo?.android?.package;
        if (!androidPackage) {
          return textResponse(
            JSON.stringify(
              {
                success: false,
                message:
                  "Missing expo.android.package in app.json. Set it before submitting.",
                example: "com.example.myapp",
              },
              null,
              2,
            ),
          );
        }

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

        const cmd = `npx eas-cli submit --platform android --non-interactive`;

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
                message: `Build submitted to Google Play Console (${args.track} track)`,
                package: androidPackage,
                track: args.track,
                output: output.slice(-1000),
                next_steps: [
                  `Check Play Console for the build on the ${args.track} track`,
                  "Add release notes in Play Console",
                  args.track === "internal"
                    ? "Share the internal test link with testers"
                    : "Monitor the staged rollout in Play Console",
                  "If on internal/alpha/beta, promote to production when ready",
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
                  "Ensure you have a recent production build: eas build --platform android --profile production",
                  "Check Play Console service account: eas credentials --platform android",
                  "Verify the service account JSON key has Play Console API access",
                  "The app must be created in Play Console before first submission",
                  "First submission requires manual upload via Play Console",
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

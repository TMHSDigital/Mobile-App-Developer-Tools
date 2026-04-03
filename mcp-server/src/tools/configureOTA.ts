import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  channel: z
    .string()
    .optional()
    .default("production")
    .describe(
      "Default update channel name (default: production). Common values: production, staging, preview.",
    ),
  runtime_version_policy: z
    .enum(["appVersion", "nativeVersion", "fingerprint"])
    .optional()
    .default("fingerprint")
    .describe(
      "How to determine runtime version compatibility (default: fingerprint). fingerprint auto-detects native changes.",
    ),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_configureOTA",
    "Configure EAS Update for over-the-air JavaScript updates. Sets runtime version policy and update URL in app.json, and verifies eas.json channel config.",
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
        const expo = appJson.expo || {};

        const projectId = expo.extra?.eas?.projectId;
        if (!projectId) {
          return textResponse(
            JSON.stringify(
              {
                success: false,
                message:
                  "No EAS project ID found. Run `eas init` to link this project to EAS.",
                fix: "eas init",
              },
              null,
              2,
            ),
          );
        }

        const changes: string[] = [];

        if (args.runtime_version_policy === "fingerprint") {
          if (
            typeof expo.runtimeVersion !== "object" ||
            expo.runtimeVersion?.policy !== "fingerprint"
          ) {
            expo.runtimeVersion = { policy: "fingerprint" };
            changes.push(
              'Set runtimeVersion to { policy: "fingerprint" }',
            );
          }
        } else {
          if (
            typeof expo.runtimeVersion !== "object" ||
            expo.runtimeVersion?.policy !== args.runtime_version_policy
          ) {
            expo.runtimeVersion = { policy: args.runtime_version_policy };
            changes.push(
              `Set runtimeVersion to { policy: "${args.runtime_version_policy}" }`,
            );
          }
        }

        if (!expo.updates) {
          expo.updates = {};
        }

        const updateUrl = `https://u.expo.dev/${projectId}`;
        if (expo.updates.url !== updateUrl) {
          expo.updates.url = updateUrl;
          changes.push(`Set updates.url to ${updateUrl}`);
        }

        if (expo.updates.enabled !== true) {
          expo.updates.enabled = true;
          changes.push("Enabled updates");
        }

        if (expo.updates.checkAutomatically !== "ON_LOAD") {
          expo.updates.checkAutomatically = "ON_LOAD";
          changes.push("Set checkAutomatically to ON_LOAD");
        }

        if (expo.updates.fallbackToCacheTimeout !== 0) {
          expo.updates.fallbackToCacheTimeout = 0;
          changes.push(
            "Set fallbackToCacheTimeout to 0 (loads cached bundle immediately, downloads update in background)",
          );
        }

        appJson.expo = expo;

        if (changes.length > 0) {
          writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n", "utf-8");
        }

        const easJsonPath = join(root, "eas.json");
        let easJsonWarning: string | null = null;

        if (!existsSync(easJsonPath)) {
          easJsonWarning =
            "No eas.json found. Run `eas build:configure` to create it, then add channel config to your build profiles.";
        } else {
          const easJson = JSON.parse(readFileSync(easJsonPath, "utf-8"));
          const profiles = easJson.build || {};
          const hasChannel = Object.values(profiles).some(
            (p: any) => p.channel,
          );
          if (!hasChannel) {
            easJsonWarning = `No channel configured in eas.json build profiles. Add "channel": "${args.channel}" to your production profile.`;
          }
        }

        return textResponse(
          JSON.stringify(
            {
              success: true,
              message:
                changes.length > 0
                  ? "EAS Update configured in app.json"
                  : "EAS Update already configured, no changes needed",
              changes,
              config: {
                runtime_version_policy: args.runtime_version_policy,
                update_url: `https://u.expo.dev/${projectId}`,
                channel: args.channel,
              },
              eas_json_warning: easJsonWarning,
              next_steps: [
                `Ensure eas.json production profile has "channel": "${args.channel}"`,
                "Create a production build: eas build --platform all --profile production",
                `Publish an update: eas update --channel ${args.channel} --message "description"`,
                "For staged rollouts: eas update --channel production --rollout-percentage 10",
                "Monitor updates at https://expo.dev",
              ],
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

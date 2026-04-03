import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  scheme: z
    .string()
    .describe("URL scheme for deep linking (e.g. 'myapp')"),
  domain: z
    .string()
    .optional()
    .describe("Domain for universal/app links (e.g. 'example.com'). Omit for scheme-only deep links."),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
};

const AASA_TEMPLATE = `{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["TEAM_ID.BUNDLE_ID"],
        "paths": ["*"]
      }
    ]
  }
}
`;

export function register(server: McpServer): void {
  server.tool(
    "mobile_configureDeepLinks",
    "Configure deep linking for an Expo project: set scheme, add intent filters for Android App Links, add associated domains for iOS Universal Links.",
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
        if (!appJson.expo) appJson.expo = {};

        appJson.expo.scheme = args.scheme;

        const filesCreated: string[] = [];

        if (args.domain) {
          if (!appJson.expo.ios) appJson.expo.ios = {};
          appJson.expo.ios.associatedDomains = [
            `applinks:${args.domain}`,
          ];

          if (!appJson.expo.android) appJson.expo.android = {};
          appJson.expo.android.intentFilters = [
            {
              action: "VIEW",
              autoVerify: true,
              data: [
                {
                  scheme: "https",
                  host: args.domain,
                  pathPrefix: "/",
                },
              ],
              category: ["BROWSABLE", "DEFAULT"],
            },
          ];

          const wellKnownDir = join(root, "docs", ".well-known");
          mkdirSync(wellKnownDir, { recursive: true });
          const aasaFile = join(wellKnownDir, "apple-app-site-association");
          if (!existsSync(aasaFile)) {
            writeFileSync(aasaFile, AASA_TEMPLATE);
            filesCreated.push(aasaFile);
          }
        }

        writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

        const result = {
          success: true,
          scheme: args.scheme,
          domain: args.domain || null,
          app_json_updated: true,
          files_created: filesCreated,
          deep_link_examples: [
            `${args.scheme}://` + " (opens app root)",
            `${args.scheme}://settings` + " (opens /settings route)",
            `${args.scheme}://chat/123` + " (opens /chat/[id] with id=123)",
          ],
          universal_link_examples: args.domain
            ? [
                `https://${args.domain}/settings`,
                `https://${args.domain}/chat/123`,
              ]
            : [],
          next_steps: [
            "Run npx expo prebuild to regenerate native projects",
            args.domain
              ? `Host the apple-app-site-association file at https://${args.domain}/.well-known/apple-app-site-association`
              : null,
            args.domain
              ? "Replace TEAM_ID.BUNDLE_ID in the AASA file with your Apple Team ID and bundle identifier"
              : null,
            args.domain
              ? `Verify Android App Links at https://developers.google.com/digital-asset-links/tools/generator for ${args.domain}`
              : null,
            "Expo Router handles route matching automatically from the file system",
          ].filter(Boolean),
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const PERMISSION_CONFIGS: Record<
  string,
  { package: string; plugin: string; keys: Record<string, string> }
> = {
  camera: {
    package: "expo-camera",
    plugin: "expo-camera",
    keys: {
      cameraPermission: "This app uses the camera to take photos and videos.",
    },
  },
  location: {
    package: "expo-location",
    plugin: "expo-location",
    keys: {
      locationWhenInUsePermission:
        "This app uses your location to provide location-based features.",
    },
  },
  contacts: {
    package: "expo-contacts",
    plugin: "expo-contacts",
    keys: {
      contactsPermission:
        "This app accesses your contacts to help you connect with friends.",
    },
  },
  "media-library": {
    package: "expo-media-library",
    plugin: "expo-media-library",
    keys: {
      photosPermission: "This app accesses your photo library to select photos.",
      savePhotosPermission: "This app saves photos to your library.",
    },
  },
  notifications: {
    package: "expo-notifications",
    plugin: "expo-notifications",
    keys: {},
  },
  microphone: {
    package: "expo-av",
    plugin: "expo-av",
    keys: {
      microphonePermission:
        "This app uses the microphone for audio recording.",
    },
  },
};

const inputSchema = {
  permission_type: z
    .enum([
      "camera",
      "location",
      "contacts",
      "media-library",
      "notifications",
      "microphone",
    ])
    .describe("Type of permission to add"),
  rationale: z
    .string()
    .optional()
    .describe(
      "Custom iOS usage description string. If not provided, a sensible default is used.",
    ),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_addPermission",
    "Add a platform permission to an Expo project with iOS rationale string in app.json.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const appJsonPath = join(root, "app.json");

        if (!existsSync(appJsonPath)) {
          return errorResponse(
            new Error(
              `No app.json found at ${root}. Is this an Expo project root?`,
            ),
          );
        }

        const config = PERMISSION_CONFIGS[args.permission_type];
        if (!config) {
          return errorResponse(
            new Error(`Unknown permission type: ${args.permission_type}`),
          );
        }

        const appJson = JSON.parse(readFileSync(appJsonPath, "utf-8"));
        if (!appJson.expo) {
          appJson.expo = {};
        }
        if (!appJson.expo.plugins) {
          appJson.expo.plugins = [];
        }

        const existingIndex = appJson.expo.plugins.findIndex(
          (p: unknown) =>
            (Array.isArray(p) && p[0] === config.plugin) || p === config.plugin,
        );

        const pluginKeys = { ...config.keys };
        if (args.rationale) {
          const firstKey = Object.keys(pluginKeys)[0];
          if (firstKey) {
            pluginKeys[firstKey] = args.rationale;
          }
        }

        const pluginEntry =
          Object.keys(pluginKeys).length > 0
            ? [config.plugin, pluginKeys]
            : config.plugin;

        if (existingIndex >= 0) {
          appJson.expo.plugins[existingIndex] = pluginEntry;
        } else {
          appJson.expo.plugins.push(pluginEntry);
        }

        writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

        const result = {
          success: true,
          permission_type: args.permission_type,
          package: config.package,
          plugin_added: pluginEntry,
          app_json_updated: appJsonPath,
          next_steps: [
            `Install the package: npx expo install ${config.package}`,
            "Run npx expo prebuild to regenerate native projects",
            "Test on a physical device (permissions behave differently on simulators)",
          ],
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

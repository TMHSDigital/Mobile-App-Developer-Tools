import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  channel_name: z
    .string()
    .optional()
    .default("default")
    .describe("Android notification channel name"),
};

const NOTIFICATION_HANDLER_CODE = `import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}
`;

export function register(server: McpServer): void {
  server.tool(
    "mobile_addPushNotifications",
    "Wire up push notifications in an Expo project: add plugin to app.json, create notification handler utility, configure Android channel.",
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
        if (!appJson.expo.plugins) appJson.expo.plugins = [];

        const hasPlugin = appJson.expo.plugins.some(
          (p: unknown) =>
            (Array.isArray(p) && p[0] === "expo-notifications") ||
            p === "expo-notifications",
        );

        if (!hasPlugin) {
          appJson.expo.plugins.push([
            "expo-notifications",
            {
              icon: "./assets/notification-icon.png",
              color: "#ffffff",
              defaultChannel: args.channel_name,
            },
          ]);
        }

        if (!appJson.expo.android) appJson.expo.android = {};
        appJson.expo.android.useNextNotificationsApi = true;

        writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

        const libDir = join(root, "lib");
        mkdirSync(libDir, { recursive: true });
        const handlerFile = join(libDir, "notifications.ts");
        let handlerCreated = false;

        if (!existsSync(handlerFile)) {
          writeFileSync(handlerFile, NOTIFICATION_HANDLER_CODE);
          handlerCreated = true;
        }

        const result = {
          success: true,
          app_json_updated: true,
          notification_plugin_added: !hasPlugin,
          handler_file: handlerCreated ? handlerFile : null,
          channel_name: args.channel_name,
          next_steps: [
            "Install packages: npx expo install expo-notifications expo-device expo-constants",
            "Run npx expo prebuild to regenerate native projects",
            handlerCreated
              ? "Import registerForPushNotifications from lib/notifications.ts in your root layout"
              : "Notification handler already exists",
            "Create assets/notification-icon.png (96x96, white on transparent, Android only)",
            "Send push token to your backend after registration",
          ],
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

import { z } from "zod";
import { platform } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Path to the Expo project (defaults to current directory)"),
  target_platform: z
    .enum(["ios", "android"])
    .optional()
    .describe("Target device platform"),
  connection: z
    .enum(["lan", "tunnel", "usb"])
    .optional()
    .default("lan")
    .describe("Connection method between dev server and device"),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_runOnDevice",
    "Provide step-by-step instructions for connecting a physical device to the Expo dev server via LAN, tunnel, or USB.",
    inputSchema,
    async (args) => {
      try {
      const os = platform();
      const connection = args.connection;
      const targetPlatform = args.target_platform;

      const startCommand =
        connection === "tunnel"
          ? "npx expo start --tunnel"
          : "npx expo start";

      const instructions: string[] = [
        `## Run on Device`,
        ``,
        `**Start the dev server:**`,
        `\`\`\`bash`,
        `cd ${args.project_path || "."}`,
        startCommand,
        `\`\`\``,
        ``,
      ];

      if (connection === "tunnel") {
        instructions.push(
          `**Tunnel mode** routes through Expo's servers. Slower but works across different networks and through firewalls.`,
          ``,
        );
      }

      if (!targetPlatform || targetPlatform === "ios") {
        instructions.push(
          `### iOS Device`,
          `1. Install **Expo Go** from the App Store`,
          `2. Open the **Camera** app on your iPhone/iPad`,
          `3. Point it at the QR code shown in the terminal`,
          `4. Tap the notification to open in Expo Go`,
          ``,
        );

        if (os !== "darwin") {
          instructions.push(
            `> Note: You are not on macOS. You can test via Expo Go but cannot create native iOS builds locally. Use EAS Build for cloud-based iOS builds.`,
            ``,
          );
        }
      }

      if (!targetPlatform || targetPlatform === "android") {
        instructions.push(
          `### Android Device`,
          `1. Install **Expo Go** from the Play Store`,
          `2. Open Expo Go and tap **Scan QR Code**`,
          `3. Scan the QR code from the terminal`,
          ``,
        );

        if (connection === "usb") {
          instructions.push(
            `### USB Debugging (Android)`,
            `1. Enable Developer Options: Settings > About phone > tap "Build number" 7 times`,
            `2. Enable USB Debugging: Settings > Developer options > USB debugging`,
            `3. Connect USB cable`,
            `4. Accept "Allow USB debugging" prompt on the phone`,
            `5. Run: \`npx expo run:android\``,
            ``,
          );
        }
      }

      instructions.push(
        `### Troubleshooting`,
        ``,
        `| Problem | Fix |`,
        `|---------|-----|`,
        `| QR code won't scan | Type the URL manually in Expo Go |`,
        `| "Network response timed out" | Use \`npx expo start --tunnel\` |`,
        `| Red error screen | Read the error. Usually a missing dependency or syntax error |`,
        `| Hot reload not working | Shake device > enable Fast Refresh |`,
        `| "Untrusted Developer" (iOS) | Settings > General > VPN & Device Management > trust certificate |`,
      );

      const result = {
        start_command: startCommand,
        project_path: args.project_path || ".",
        connection_method: connection,
        target_platform: targetPlatform || "both",
        host_os: os,
        instructions: instructions.join("\n"),
      };

      return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

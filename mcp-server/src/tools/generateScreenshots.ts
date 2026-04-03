import { z } from "zod";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const IOS_DEVICES = [
  { name: '6.7" Display', width: 1290, height: 2796, label: "iPhone 15 Pro Max / 16 Pro Max" },
  { name: '6.5" Display', width: 1284, height: 2778, label: "iPhone 14 Plus / 15 Plus" },
  { name: '5.5" Display', width: 1242, height: 2208, label: "iPhone 8 Plus (legacy)" },
  { name: '12.9" iPad Pro', width: 2048, height: 2732, label: "iPad Pro 12.9-inch" },
];

const ANDROID_DEVICES = [
  { name: "Phone", width: 1080, height: 1920, label: "Standard phone (1080x1920)" },
  { name: "Phone Hi-Res", width: 1440, height: 3120, label: "Flagship phone (1440x3120)" },
  { name: '7" Tablet', width: 1200, height: 1920, label: "7-inch tablet" },
  { name: '10" Tablet', width: 1600, height: 2560, label: "10-inch tablet" },
];

const HELPER_SCRIPT = `#!/usr/bin/env node
/**
 * Screenshot helper - captures screenshots at store-required dimensions.
 * Run from your project root with a running dev server.
 *
 * Usage:
 *   node scripts/capture-screenshots.js --platform ios
 *   node scripts/capture-screenshots.js --platform android
 *
 * Prerequisites:
 *   - Simulator/emulator running with your app loaded
 *   - For iOS: Xcode command line tools (xcrun simctl)
 *   - For Android: adb in PATH
 */

const { execSync } = require("child_process");
const { mkdirSync, existsSync } = require("fs");
const path = require("path");

const platform = process.argv.includes("--android") ? "android" : "ios";
const outDir = path.join("screenshots", platform);

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

if (platform === "ios") {
  const timestamp = Date.now();
  const file = path.join(outDir, \`screenshot_\${timestamp}.png\`);
  try {
    execSync(\`xcrun simctl io booted screenshot "\${file}"\`, { stdio: "pipe" });
    console.log("Saved:", file);
  } catch (e) {
    console.error("Failed. Is the iOS Simulator running?");
    process.exit(1);
  }
} else {
  const timestamp = Date.now();
  const file = path.join(outDir, \`screenshot_\${timestamp}.png\`);
  try {
    execSync(\`adb exec-out screencap -p > "\${file}"\`, { stdio: "pipe", shell: true });
    console.log("Saved:", file);
  } catch (e) {
    console.error("Failed. Is an Android device/emulator connected?");
    process.exit(1);
  }
}
`;

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  platform: z
    .enum(["ios", "android", "both"])
    .optional()
    .default("both")
    .describe("Target platform for screenshot dimensions (default: both)"),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_generateScreenshots",
    "Generate a screenshot capture helper script and list required App Store and Play Store screenshot dimensions. Creates scripts/capture-screenshots.js.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const scriptsDir = join(root, "scripts");

        if (!existsSync(scriptsDir)) {
          mkdirSync(scriptsDir, { recursive: true });
        }

        const scriptPath = join(scriptsDir, "capture-screenshots.js");
        writeFileSync(scriptPath, HELPER_SCRIPT, "utf-8");

        const devices: Array<{
          platform: string;
          name: string;
          width: number;
          height: number;
          label: string;
        }> = [];

        if (args.platform === "ios" || args.platform === "both") {
          devices.push(...IOS_DEVICES.map((d) => ({ platform: "ios", ...d })));
        }

        if (args.platform === "android" || args.platform === "both") {
          devices.push(
            ...ANDROID_DEVICES.map((d) => ({ platform: "android", ...d })),
          );
        }

        return textResponse(
          JSON.stringify(
            {
              success: true,
              message:
                "Screenshot helper script created and dimension reference generated",
              script: "scripts/capture-screenshots.js",
              usage: [
                "node scripts/capture-screenshots.js --ios",
                "node scripts/capture-screenshots.js --android",
              ],
              required_dimensions: devices,
              guidelines: {
                ios: [
                  "Minimum 3 screenshots, maximum 10 per device size",
                  "6.7-inch and 6.5-inch displays are required for current iPhones",
                  "5.5-inch is required if supporting older iPhones",
                  "No device frames, status bars, or alpha transparency",
                  "PNG or JPEG, RGB color space",
                ],
                android: [
                  "Minimum 2 screenshots, maximum 8",
                  "JPEG or 24-bit PNG, minimum 320px, maximum 3840px per side",
                  "16:9 aspect ratio recommended for phones",
                  "At least one phone and one 7-inch or 10-inch tablet screenshot",
                ],
              },
              next_steps: [
                "Navigate to each key screen in your app",
                "Run the capture script for each screen",
                "Resize captures to required dimensions if needed",
                "Upload to App Store Connect / Play Console",
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

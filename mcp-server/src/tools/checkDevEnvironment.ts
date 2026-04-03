import { z } from "zod";
import { execSync } from "node:child_process";
import { platform } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

interface ToolCheck {
  name: string;
  command: string;
  required: boolean;
  platforms?: string[];
}

const TOOLS: ToolCheck[] = [
  { name: "Node.js", command: "node --version", required: true },
  { name: "npm", command: "npm --version", required: true },
  { name: "Git", command: "git --version", required: true },
  { name: "Expo CLI", command: "npx expo --version", required: false },
  { name: "Watchman", command: "watchman --version", required: false },
  { name: "Xcode CLI Tools", command: "xcode-select -p", required: false, platforms: ["darwin"] },
  { name: "CocoaPods", command: "pod --version", required: false, platforms: ["darwin"] },
  { name: "JDK", command: "java -version", required: false },
];

function tryCommand(command: string): string | null {
  try {
    return execSync(command, {
      encoding: "utf-8",
      timeout: 15000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function checkAndroidSdk(): string | null {
  const androidHome =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    null;

  if (androidHome) {
    return androidHome;
  }
  return null;
}

const inputSchema = {
  target_platform: z
    .enum(["ios", "android", "both"])
    .optional()
    .default("both")
    .describe("Target platform to check requirements for"),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_checkDevEnvironment",
    "Detect installed mobile development tools and SDKs (Node, Expo CLI, Watchman, Xcode, Android Studio, JDK). Report what is installed and what is missing with install instructions.",
    inputSchema,
    async (args) => {
      try {
        const os = platform();
        const targetPlatform = args.target_platform;
        const results: Array<{
          name: string;
          status: "installed" | "missing";
          version: string;
          required: boolean;
          note?: string;
        }> = [];

        for (const tool of TOOLS) {
          if (tool.platforms && !tool.platforms.includes(os)) {
            continue;
          }

          const output = tryCommand(tool.command);
          results.push({
            name: tool.name,
            status: output ? "installed" : "missing",
            version: output || "-",
            required: tool.required,
          });
        }

        const androidSdk = checkAndroidSdk();
        if (targetPlatform === "android" || targetPlatform === "both") {
          results.push({
            name: "Android SDK",
            status: androidSdk ? "installed" : "missing",
            version: androidSdk || "-",
            required: targetPlatform === "android",
            note: androidSdk
              ? `ANDROID_HOME=${androidSdk}`
              : "Set ANDROID_HOME environment variable",
          });
        }

        if (os !== "darwin" && (targetPlatform === "ios" || targetPlatform === "both")) {
          results.push({
            name: "iOS Build Support",
            status: "missing",
            version: "-",
            required: false,
            note: "iOS builds require macOS. Use Expo Go or EAS Build (cloud) on this platform.",
          });
        }

        const installed = results.filter((r) => r.status === "installed");
        const missing = results.filter((r) => r.status === "missing");
        const missingRequired = missing.filter((r) => r.required);

        const summary = {
          os,
          target_platform: targetPlatform,
          total_checked: results.length,
          installed: installed.length,
          missing: missing.length,
          missing_required: missingRequired.length,
          ready: missingRequired.length === 0,
          tools: results,
        };

        return textResponse(JSON.stringify(summary, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

import { z } from "zod";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const NATIVE_MODULE_INDICATORS = [
  "react-native-reanimated",
  "react-native-gesture-handler",
  "react-native-screens",
  "react-native-svg",
  "react-native-maps",
  "react-native-webview",
  "expo-camera",
  "expo-location",
  "expo-notifications",
  "expo-sensors",
  "expo-media-library",
  "expo-contacts",
  "expo-calendar",
  "expo-barcode-scanner",
  "expo-print",
  "expo-local-authentication",
  "expo-audio",
  "expo-video",
];

const inputSchema = {
  package_name: z
    .string()
    .describe(
      "Package to install (e.g. 'zustand' or '@tanstack/react-query'). Multiple packages separated by spaces.",
    ),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
  dev: z
    .boolean()
    .optional()
    .default(false)
    .describe("Install as a dev dependency"),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_installDependency",
    "Install a package using npx expo install for Expo compatibility. Detects native modules and warns about Expo Go limitations.",
    inputSchema,
    async (args) => {
      try {
        const cwd = args.project_path || process.cwd();
        const packages = args.package_name.split(/\s+/).filter(Boolean);

        const appJsonPath = join(cwd, "app.json");
        if (!existsSync(appJsonPath)) {
          return errorResponse(
            new Error(
              `No app.json found at ${cwd}. Is this an Expo project root?`,
            ),
          );
        }

        const nativePackages = packages.filter((p) =>
          NATIVE_MODULE_INDICATORS.some(
            (n) => p === n || p.startsWith(n + "@"),
          ),
        );

        const devFlag = args.dev ? "-- --save-dev" : "";
        const command =
          `npx expo install ${packages.join(" ")} ${devFlag}`.trim();

        const output = execSync(command, {
          cwd,
          encoding: "utf-8",
          timeout: 120000,
          stdio: ["pipe", "pipe", "pipe"],
        });

        const warnings: string[] = [];
        if (nativePackages.length > 0) {
          warnings.push(
            `Native modules detected: ${nativePackages.join(", ")}. These require a development build (npx expo run:ios / npx expo run:android) and will not work in Expo Go.`,
          );
          warnings.push(
            "Run `npx expo prebuild` or use EAS Build to create a dev client.",
          );
        }

        const result = {
          success: true,
          packages_installed: packages,
          command_used: command,
          output: output.trim(),
          native_modules_detected: nativePackages,
          warnings,
          needs_dev_build: nativePackages.length > 0,
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

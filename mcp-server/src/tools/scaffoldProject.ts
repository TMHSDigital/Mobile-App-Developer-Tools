import { z } from "zod";
import { execSync } from "node:child_process";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  name: z
    .string()
    .describe("Project name (lowercase, no spaces, used as directory name)"),
  template: z
    .enum(["default", "blank", "tabs"])
    .optional()
    .default("default")
    .describe("Expo template to use"),
  directory: z
    .string()
    .optional()
    .describe("Parent directory to create the project in (defaults to current directory)"),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_scaffoldProject",
    "Generate a new Expo project using create-expo-app with the default or specified template.",
    inputSchema,
    async (args) => {
      try {
        const cwd = args.directory || process.cwd();
        const templateArg =
          args.template === "blank"
            ? "--template blank"
            : args.template === "tabs"
              ? "--template tabs"
              : "";

        const command = `npx create-expo-app@latest ${args.name} ${templateArg}`.trim();

        const output = execSync(command, {
          cwd,
          encoding: "utf-8",
          timeout: 120000,
          stdio: ["pipe", "pipe", "pipe"],
        });

        const result = {
          success: true,
          project_name: args.name,
          template: args.template,
          path: `${cwd}/${args.name}`,
          command_used: command,
          output: output.trim(),
          next_steps: [
            `cd ${args.name}`,
            "npx expo start",
            "Scan the QR code with Expo Go (iOS: Camera app, Android: Expo Go app)",
          ],
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  name: z
    .string()
    .describe("Screen name (lowercase, used as filename e.g. 'profile')"),
  type: z
    .enum(["tab", "stack", "modal"])
    .describe("Navigation type for this screen"),
  layout_group: z
    .string()
    .optional()
    .default("")
    .describe("Route group directory (e.g. '(tabs)' or 'settings'). Empty for root-level screen."),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
};

function generateScreenContent(name: string, type: string): string {
  const componentName = name.charAt(0).toUpperCase() + name.slice(1) + "Screen";

  return `import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function ${componentName}() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "${name.charAt(0).toUpperCase() + name.slice(1)}" }} />
      <Text style={styles.title}>${name.charAt(0).toUpperCase() + name.slice(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
});
`;
}

function generateLayoutContent(group: string, type: string): string {
  if (type === "tab") {
    return `import { Tabs } from "expo-router";

export default function ${group.replace(/[()]/g, "")}Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
      }}
    />
  );
}
`;
  }

  return `import { Stack } from "expo-router";

export default function ${group.replace(/[()]/g, "")}Layout() {
  return <Stack />;
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_generateScreen",
    "Create a new Expo Router screen file with navigation wiring and boilerplate.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const appDir = join(root, "app");
        const screenDir = args.layout_group
          ? join(appDir, args.layout_group)
          : appDir;

        mkdirSync(screenDir, { recursive: true });

        const screenFile = join(screenDir, `${args.name}.tsx`);
        if (existsSync(screenFile)) {
          return errorResponse(
            new Error(`Screen already exists: ${screenFile}`),
          );
        }

        writeFileSync(screenFile, generateScreenContent(args.name, args.type));

        const layoutFile = join(screenDir, "_layout.tsx");
        let layoutCreated = false;
        if (!existsSync(layoutFile) && args.layout_group) {
          writeFileSync(
            layoutFile,
            generateLayoutContent(args.layout_group, args.type),
          );
          layoutCreated = true;
        }

        const result = {
          success: true,
          screen_file: screenFile,
          layout_file: layoutCreated ? layoutFile : null,
          layout_created: layoutCreated,
          name: args.name,
          type: args.type,
          layout_group: args.layout_group || "(root)",
          next_steps: [
            layoutCreated
              ? `Review the generated _layout.tsx in ${args.layout_group}`
              : null,
            `Edit ${screenFile} to add your screen content`,
            args.type === "tab"
              ? "Add a tabBarIcon to the Tabs.Screen options in the layout"
              : null,
            args.type === "modal"
              ? 'Add presentation: "modal" to the Stack.Screen options in the parent layout'
              : null,
          ].filter(Boolean),
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

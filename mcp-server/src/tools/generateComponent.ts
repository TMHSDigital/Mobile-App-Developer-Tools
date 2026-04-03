import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  name: z
    .string()
    .describe("Component name in PascalCase (e.g. 'Avatar', 'ProductCard')"),
  directory: z
    .string()
    .optional()
    .default("components")
    .describe("Directory relative to project root (e.g. 'components/ui')"),
  with_tests: z
    .boolean()
    .optional()
    .default(false)
    .describe("Generate a companion test file alongside the component"),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
};

function generateComponentContent(name: string): string {
  return `import { View, Text, StyleSheet } from "react-native";

interface ${name}Props {
  // TODO: define props
}

export function ${name}({}: ${name}Props) {
  return (
    <View style={styles.container}>
      <Text>${name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // TODO: add styles
  },
});
`;
}

function generateTestContent(name: string): string {
  return `import { render, screen } from "@testing-library/react-native";
import { ${name} } from "../${name}";

describe("${name}", () => {
  it("renders without crashing", () => {
    render(<${name} />);
    expect(screen.getByText("${name}")).toBeTruthy();
  });
});
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_generateComponent",
    "Create a React Native component file with typed props, StyleSheet, and optional test file.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const componentDir = join(root, args.directory);

        mkdirSync(componentDir, { recursive: true });

        const componentFile = join(componentDir, `${args.name}.tsx`);
        if (existsSync(componentFile)) {
          return errorResponse(
            new Error(`Component already exists: ${componentFile}`),
          );
        }

        writeFileSync(componentFile, generateComponentContent(args.name));

        const filesCreated = [componentFile];

        if (args.with_tests) {
          const testDir = join(componentDir, "__tests__");
          mkdirSync(testDir, { recursive: true });
          const testFile = join(testDir, `${args.name}.test.tsx`);
          writeFileSync(testFile, generateTestContent(args.name));
          filesCreated.push(testFile);
        }

        const result = {
          success: true,
          files_created: filesCreated,
          component_name: args.name,
          directory: args.directory,
          has_tests: args.with_tests,
          next_steps: [
            `Define props in the ${args.name}Props interface`,
            "Add styles to the StyleSheet",
            args.with_tests
              ? "Update the test to match your final props"
              : "Consider adding tests later with with_tests: true",
          ],
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

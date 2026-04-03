import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  source_file: z
    .string()
    .describe("Path to the source file to generate a test for (relative to project root or absolute)."),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Project framework (default: expo). Determines test file conventions."),
  test_location: z
    .enum(["__tests__", "colocated"])
    .optional()
    .default("__tests__")
    .describe("Where to place test files. __tests__: sibling directory. colocated: same directory as source."),
};

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const patterns = [
    /export\s+(?:default\s+)?function\s+(\w+)/g,
    /export\s+(?:default\s+)?class\s+(\w+)/g,
    /export\s+const\s+(\w+)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      exports.push(match[1]);
    }
  }
  return exports;
}

function isComponent(content: string): boolean {
  return (
    content.includes("from \"react-native\"") ||
    content.includes("from 'react-native'") ||
    content.includes("from \"react\"") ||
    content.includes("from 'react'") ||
    /<\w+/.test(content)
  );
}

function generateExpoTest(
  sourceName: string,
  exports: string[],
  isReactComponent: boolean,
  importPath: string,
): string {
  const lines: string[] = [];

  if (isReactComponent) {
    lines.push(`import { render, screen } from "@testing-library/react-native";`);
    const named = exports.filter((e) => e !== "default");
    if (named.length > 0) {
      lines.push(`import { ${named.join(", ")} } from "${importPath}";`);
    } else {
      lines.push(`import ${sourceName} from "${importPath}";`);
    }

    lines.push("");
    const componentName = exports[0] || sourceName;
    lines.push(`describe("${componentName}", () => {`);
    lines.push(`  it("renders without crashing", () => {`);
    lines.push(`    render(<${componentName} />);`);
    lines.push(`  });`);
    lines.push("");
    lines.push(`  it.todo("handles user interaction");`);
    lines.push(`});`);
  } else {
    if (exports.length > 0) {
      lines.push(`import { ${exports.join(", ")} } from "${importPath}";`);
    } else {
      lines.push(`import "${importPath}";`);
    }

    lines.push("");
    lines.push(`describe("${sourceName}", () => {`);
    for (const exp of exports) {
      lines.push(`  describe("${exp}", () => {`);
      lines.push(`    it.todo("works correctly");`);
      lines.push(`  });`);
      lines.push("");
    }
    if (exports.length === 0) {
      lines.push(`  it.todo("works correctly");`);
    }
    lines.push(`});`);
  }

  lines.push("");
  return lines.join("\n");
}

function generateFlutterTest(
  sourceName: string,
  importPath: string,
): string {
  return `import 'package:flutter_test/flutter_test.dart';
import '${importPath}';

void main() {
  group('${sourceName}', () {
    test('exists', () {
      // Placeholder: replace with real assertions
      expect(true, isTrue);
    });

    // TODO: add widget tests with testWidgets() if this is a widget
  });
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_generateTestFile",
    "Scaffold a test file for an existing component or module. Reads exports from the source file and generates matching test boilerplate.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const sourceAbsolute = args.source_file.startsWith("/") || args.source_file.match(/^[A-Z]:\\/)
          ? args.source_file
          : join(root, args.source_file);

        if (!existsSync(sourceAbsolute)) {
          return errorResponse(new Error(`Source file not found: ${sourceAbsolute}`));
        }

        const content = readFileSync(sourceAbsolute, "utf-8");
        const ext = extname(sourceAbsolute);
        const nameWithoutExt = basename(sourceAbsolute, ext);
        const sourceDir = dirname(sourceAbsolute);

        if (args.framework === "flutter") {
          const testDir = join(root, "test");
          const relativePath = sourceAbsolute.replace(join(root, "lib"), "").replace(/\\/g, "/");
          const testFile = join(testDir, relativePath.replace(ext, "_test.dart"));

          if (existsSync(testFile)) {
            return errorResponse(new Error(`Test file already exists: ${testFile}`));
          }

          const packageName = basename(root);
          const importPath = `package:${packageName}${relativePath.replace(/\\/g, "/")}`;

          mkdirSync(dirname(testFile), { recursive: true });
          writeFileSync(testFile, generateFlutterTest(nameWithoutExt, importPath), "utf-8");

          return textResponse(
            JSON.stringify(
              {
                success: true,
                file_created: testFile,
                source_file: sourceAbsolute,
                framework: "flutter",
                next_steps: [
                  "Replace placeholder assertions with real tests",
                  "Add testWidgets() calls for widget tests",
                  "Run: flutter test " + testFile,
                ],
              },
              null,
              2,
            ),
          );
        }

        const exports = extractExports(content);
        const isComp = isComponent(content);

        let testFile: string;
        let importPath: string;

        if (args.test_location === "colocated") {
          testFile = join(sourceDir, `${nameWithoutExt}.test${ext}`);
          importPath = `./${nameWithoutExt}`;
        } else {
          const testDir = join(sourceDir, "__tests__");
          testFile = join(testDir, `${nameWithoutExt}.test${ext}`);
          importPath = `../${nameWithoutExt}`;
          mkdirSync(testDir, { recursive: true });
        }

        if (existsSync(testFile)) {
          return errorResponse(new Error(`Test file already exists: ${testFile}`));
        }

        const testContent = generateExpoTest(nameWithoutExt, exports, isComp, importPath);
        writeFileSync(testFile, testContent, "utf-8");

        return textResponse(
          JSON.stringify(
            {
              success: true,
              file_created: testFile,
              source_file: sourceAbsolute,
              framework: "expo",
              detected_exports: exports,
              is_component: isComp,
              test_location: args.test_location,
              next_steps: [
                "Fill in the placeholder test cases",
                isComp
                  ? "Add interaction tests with fireEvent/userEvent"
                  : "Add assertions for each exported function",
                "Run: npx jest " + testFile,
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

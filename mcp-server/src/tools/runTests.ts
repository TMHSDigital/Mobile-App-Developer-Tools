import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Project framework (default: expo). Determines which test runner to invoke."),
  test_path: z
    .string()
    .optional()
    .describe("Specific test file or directory to run. Omit to run the full suite."),
  coverage: z
    .boolean()
    .optional()
    .default(false)
    .describe("Collect code coverage (default: false)."),
};

interface TestSummary {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

function parseJestJson(raw: string): { summary: TestSummary; failures: string[] } {
  try {
    const result = JSON.parse(raw);
    const summary: TestSummary = {
      passed: result.numPassedTests ?? 0,
      failed: result.numFailedTests ?? 0,
      skipped: result.numPendingTests ?? 0,
      total: result.numTotalTests ?? 0,
    };

    const failures: string[] = [];
    for (const suite of result.testResults ?? []) {
      for (const test of suite.assertionResults ?? []) {
        if (test.status === "failed") {
          const msg = (test.failureMessages ?? []).join("\n").slice(0, 500);
          failures.push(`${test.ancestorTitles?.join(" > ")} > ${test.title}\n${msg}`);
        }
      }
    }

    return { summary, failures };
  } catch {
    return {
      summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      failures: ["Could not parse Jest JSON output."],
    };
  }
}

function parseFlutterOutput(raw: string): { summary: TestSummary; failures: string[] } {
  const lines = raw.split("\n");
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const line of lines) {
    if (/^\+\d+/.test(line)) {
      const passMatch = line.match(/\+(\d+)/);
      const failMatch = line.match(/-(\d+)/);
      const skipMatch = line.match(/~(\d+)/);
      if (passMatch) passed = parseInt(passMatch[1], 10);
      if (failMatch) failed = parseInt(failMatch[1], 10);
      if (skipMatch) skipped = parseInt(skipMatch[1], 10);
    }
    if (line.includes("FAILED") || line.includes("Expected:") || line.includes("Actual:")) {
      failures.push(line.trim());
    }
  }

  return {
    summary: { passed, failed, skipped, total: passed + failed + skipped },
    failures: failures.slice(0, 20),
  };
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_runTests",
    "Execute the project test suite (Jest for Expo, flutter test for Flutter) and return a structured pass/fail summary with failure details.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();

        if (args.framework === "flutter") {
          const pubspecPath = join(root, "pubspec.yaml");
          if (!existsSync(pubspecPath)) {
            return errorResponse(new Error(`No pubspec.yaml at ${root}. Is this a Flutter project?`));
          }

          const cmd = ["flutter", "test"];
          if (args.test_path) cmd.push(args.test_path);
          if (args.coverage) cmd.push("--coverage");

          let output: string;
          let exitCode = 0;
          try {
            output = execSync(cmd.join(" "), { cwd: root, encoding: "utf-8", timeout: 300_000 });
          } catch (err: any) {
            output = err.stdout || err.message;
            exitCode = err.status ?? 1;
          }

          const { summary, failures } = parseFlutterOutput(output);

          return textResponse(
            JSON.stringify(
              {
                success: exitCode === 0,
                framework: "flutter",
                summary,
                failures: failures.length > 0 ? failures : undefined,
                coverage_collected: args.coverage,
                raw_output_tail: output.split("\n").slice(-15).join("\n"),
              },
              null,
              2,
            ),
          );
        }

        const pkgPath = join(root, "package.json");
        if (!existsSync(pkgPath)) {
          return errorResponse(new Error(`No package.json at ${root}. Is this a Node.js project?`));
        }

        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        const hasJest =
          pkg.devDependencies?.jest ||
          pkg.dependencies?.jest ||
          pkg.devDependencies?.["@jest/core"];
        if (!hasJest) {
          return textResponse(
            JSON.stringify(
              {
                success: false,
                message: "Jest is not installed. Run: npx expo install jest @testing-library/react-native",
                next_steps: [
                  "Install Jest: npx expo install jest jest-expo @testing-library/react-native",
                  'Add to package.json: "jest": { "preset": "jest-expo" }',
                  "Create your first test in __tests__/",
                ],
              },
              null,
              2,
            ),
          );
        }

        const cmd = ["npx", "jest", "--json"];
        if (args.test_path) cmd.push(args.test_path);
        if (args.coverage) cmd.push("--coverage");

        let output: string;
        let exitCode = 0;
        try {
          output = execSync(cmd.join(" "), { cwd: root, encoding: "utf-8", timeout: 300_000 });
        } catch (err: any) {
          output = err.stdout || err.message;
          exitCode = err.status ?? 1;
        }

        const jsonStart = output.indexOf("{");
        const jsonStr = jsonStart >= 0 ? output.slice(jsonStart) : output;
        const { summary, failures } = parseJestJson(jsonStr);

        return textResponse(
          JSON.stringify(
            {
              success: exitCode === 0,
              framework: "expo",
              summary,
              failures: failures.length > 0 ? failures : undefined,
              coverage_collected: args.coverage,
              next_steps:
                exitCode !== 0
                  ? ["Fix the failing tests above", "Run again with mobile_runTests"]
                  : ["All tests passed"],
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

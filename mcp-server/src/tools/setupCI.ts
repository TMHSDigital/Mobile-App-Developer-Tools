import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
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
    .describe("Project framework (default: expo)."),
  platforms: z
    .enum(["ios", "android", "both"])
    .optional()
    .default("both")
    .describe("Target platforms for CI builds (default: both)."),
  include_tests: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include a test step in the workflow (default: true)."),
  include_eas_build: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include EAS Build step for Expo projects (default: false). Requires EXPO_TOKEN secret."),
};

function generateExpoWorkflow(platforms: string, includeTests: boolean, includeEas: boolean): string {
  const platformList =
    platforms === "both" ? "ios, android" : platforms;

  let testStep = "";
  if (includeTests) {
    testStep = `
    - name: Run tests
      run: npx jest --ci --coverage`;
  }

  let easStep = "";
  if (includeEas) {
    const platformFlag = platforms === "both" ? "all" : platforms;
    easStep = `

  eas-build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        platform: [${platformList}]
    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: npm

    - run: npm ci

    - uses: expo/expo-github-action@v8
      with:
        eas-version: latest
        token: \${{ secrets.EXPO_TOKEN }}

    - name: Build for \${{ matrix.platform }}
      run: eas build --platform \${{ matrix.platform }} --profile production --non-interactive`;
  }

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: npm

    - run: npm ci

    - name: Type check
      run: npx tsc --noEmit

    - name: Lint
      run: npx expo lint
${testStep}
${easStep}
`;
}

function generateFlutterWorkflow(platforms: string, includeTests: boolean): string {
  let testStep = "";
  if (includeTests) {
    testStep = `
    - name: Run tests
      run: flutter test --coverage`;
  }

  let buildSteps = "";
  if (platforms === "android" || platforms === "both") {
    buildSteps += `
    - name: Build Android APK
      run: flutter build apk --release`;
  }
  if (platforms === "ios" || platforms === "both") {
    buildSteps += `

  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
    - uses: actions/checkout@v4

    - uses: subosito/flutter-action@v2
      with:
        channel: stable
        cache: true

    - run: flutter pub get

    - name: Build iOS
      run: flutter build ios --release --no-codesign`;
  }

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - uses: subosito/flutter-action@v2
      with:
        channel: stable
        cache: true

    - run: flutter pub get

    - name: Analyze
      run: flutter analyze
${testStep}
${buildSteps}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_setupCI",
    "Generate a GitHub Actions CI workflow for build, test, and optional EAS Build deployment. Creates .github/workflows/ci.yml.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const workflowPath = join(root, ".github", "workflows", "ci.yml");

        if (existsSync(workflowPath)) {
          return textResponse(
            JSON.stringify(
              {
                success: false,
                message: `Workflow already exists at ${workflowPath}. Delete or rename it before generating a new one.`,
                existing_file: workflowPath,
              },
              null,
              2,
            ),
          );
        }

        const workflow =
          args.framework === "flutter"
            ? generateFlutterWorkflow(args.platforms, args.include_tests)
            : generateExpoWorkflow(args.platforms, args.include_tests, args.include_eas_build);

        mkdirSync(dirname(workflowPath), { recursive: true });
        writeFileSync(workflowPath, workflow, "utf-8");

        const secrets: string[] = [];
        if (args.include_eas_build && args.framework === "expo") {
          secrets.push("EXPO_TOKEN - EAS CLI authentication token");
        }

        return textResponse(
          JSON.stringify(
            {
              success: true,
              file_created: workflowPath,
              framework: args.framework,
              platforms: args.platforms,
              includes_tests: args.include_tests,
              includes_eas_build: args.include_eas_build,
              required_secrets: secrets.length > 0 ? secrets : undefined,
              next_steps: [
                "Review the generated workflow at .github/workflows/ci.yml",
                "Commit and push to trigger the first run",
                ...(secrets.length > 0
                  ? ["Add required secrets in GitHub repo Settings > Secrets and variables > Actions"]
                  : []),
                "Consider adding branch protection rules to require CI to pass",
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

import { z } from "zod";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const KNOWN_HEAVY_PACKAGES: Record<string, { size: string; alternative: string }> = {
  moment: { size: "~300KB", alternative: "date-fns or dayjs" },
  "moment-timezone": { size: "~200KB", alternative: "date-fns-tz" },
  lodash: { size: "~70KB", alternative: "lodash-es or individual lodash/* imports" },
  "aws-sdk": { size: "~50MB", alternative: "@aws-sdk/client-* (v3 modular)" },
  firebase: { size: "~500KB", alternative: "@react-native-firebase/* (modular)" },
  antd: { size: "~1MB", alternative: "Not suitable for React Native" },
  "react-native-maps": { size: "~15MB native", alternative: "Only if maps are essential" },
  underscore: { size: "~25KB", alternative: "Native Array/Object methods or lodash-es" },
  axios: { size: "~15KB", alternative: "Built-in fetch API" },
  "crypto-js": { size: "~40KB", alternative: "expo-crypto for basic hashing" },
};

const LARGE_ASSET_THRESHOLD = 500 * 1024;
const ASSET_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".ttf", ".otf", ".json"]);

function scanAssets(dir: string): Array<{ path: string; size: number }> {
  const results: Array<{ path: string; size: number }> = [];
  if (!existsSync(dir)) return results;

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
        results.push(...scanAssets(fullPath));
      } else if (entry.isFile() && ASSET_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        const stat = statSync(fullPath);
        if (stat.size > LARGE_ASSET_THRESHOLD) {
          results.push({ path: fullPath, size: stat.size });
        }
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return results;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  platform: z
    .enum(["ios", "android", "both"])
    .optional()
    .default("both")
    .describe("Target platform for analysis context (default: both)"),
};

export function register(server: McpServer): void {
  server.tool(
    "mobile_analyzeBundle",
    "Analyze app bundle for large dependencies, heavy assets, and optimization opportunities. Reads package.json and scans the project for bloat.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const pkgPath = join(root, "package.json");

        if (!existsSync(pkgPath)) {
          return errorResponse(
            new Error(`No package.json at ${root}. Is this a Node.js project?`),
          );
        }

        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        const deps = Object.keys(pkg.dependencies || {});
        const devDeps = Object.keys(pkg.devDependencies || {});

        const heavyDeps: Array<{
          name: string;
          estimated_size: string;
          alternative: string;
        }> = [];

        for (const dep of deps) {
          const info = KNOWN_HEAVY_PACKAGES[dep];
          if (info) {
            heavyDeps.push({
              name: dep,
              estimated_size: info.size,
              alternative: info.alternative,
            });
          }
        }

        const assetsDir = join(root, "assets");
        const largeAssets = scanAssets(assetsDir).map((a) => ({
          path: a.path.replace(root, "."),
          size: formatBytes(a.size),
          size_bytes: a.size,
        }));

        const recommendations: string[] = [];

        if (heavyDeps.length > 0) {
          recommendations.push(
            `Replace ${heavyDeps.length} heavy dependenc${heavyDeps.length === 1 ? "y" : "ies"} with lighter alternatives`,
          );
        }

        if (largeAssets.length > 0) {
          recommendations.push(
            `Optimize ${largeAssets.length} large asset${largeAssets.length === 1 ? "" : "s"} (>500KB each)`,
          );
          recommendations.push("Convert PNG/JPEG assets to WebP for 30-50% size reduction");
        }

        if (deps.length > 50) {
          recommendations.push(
            `${deps.length} production dependencies is high. Run npx depcheck to find unused packages.`,
          );
        }

        if (deps.includes("lodash") && !deps.includes("lodash-es")) {
          recommendations.push(
            "Switch from lodash to lodash-es for proper tree shaking",
          );
        }

        recommendations.push("Run `npx expo export` to measure actual bundle size");

        return textResponse(
          JSON.stringify(
            {
              success: true,
              summary: {
                production_dependencies: deps.length,
                dev_dependencies: devDeps.length,
                heavy_packages_found: heavyDeps.length,
                large_assets_found: largeAssets.length,
              },
              heavy_dependencies: heavyDeps,
              large_assets: largeAssets,
              recommendations,
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

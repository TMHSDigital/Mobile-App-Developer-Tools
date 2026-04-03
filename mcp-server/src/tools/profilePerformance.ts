import { z } from "zod";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
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
    .describe("Framework to profile (default: expo)."),
};

interface PerfIssue {
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  fix: string;
  file?: string;
}

function collectFiles(dir: string, extensions: string[], maxDepth = 5, depth = 0): string[] {
  if (depth >= maxDepth || !existsSync(dir)) return [];
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "build" || entry === ".dart_tool") continue;
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          results.push(...collectFiles(full, extensions, maxDepth, depth + 1));
        } else if (extensions.includes(extname(entry))) {
          results.push(full);
        }
      } catch { /* skip inaccessible */ }
    }
  } catch { /* skip unreadable dirs */ }
  return results;
}

function profileExpo(root: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const srcDir = existsSync(join(root, "src")) ? join(root, "src") : join(root, "app");
  const files = collectFiles(srcDir, [".tsx", ".ts", ".jsx", ".js"]);

  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const rel = file.replace(root, "").replace(/\\/g, "/");

    if (content.includes("FlatList") && !content.includes("getItemLayout")) {
      issues.push({
        severity: "medium",
        category: "List Performance",
        message: "FlatList used without getItemLayout. Scroll-to-index and initial render will be slower.",
        fix: "Add getItemLayout prop with fixed item heights for O(1) scroll offset calculation.",
        file: rel,
      });
    }

    if (content.includes("FlatList") && !content.includes("React.memo") && !content.includes("memo(")) {
      issues.push({
        severity: "medium",
        category: "List Performance",
        message: "FlatList renderItem component may not be memoized. Every parent re-render re-creates list items.",
        fix: "Wrap the list item component in React.memo() and extract renderItem to a stable reference.",
        file: rel,
      });
    }

    const inlineStyleRegex = /style=\{\{[^}]+\}\}/g;
    const inlineCount = (content.match(inlineStyleRegex) || []).length;
    if (inlineCount > 5) {
      issues.push({
        severity: "low",
        category: "Style Allocation",
        message: `${inlineCount} inline style objects found. Each creates a new object on every render.`,
        fix: "Move styles to StyleSheet.create() outside the component.",
        file: rel,
      });
    }

    if (/useEffect\(\s*\(\)\s*=>\s*\{[^}]*fetch\(/s.test(content) && !content.includes("useQuery") && !content.includes("useSWR")) {
      issues.push({
        severity: "low",
        category: "Data Fetching",
        message: "Data fetched in useEffect without a caching layer. Refetches on every mount.",
        fix: "Use React Query (useQuery) or SWR for automatic caching, deduplication, and background refresh.",
        file: rel,
      });
    }

    const imageImports = (content.match(/<Image[^>]+source=\{\{[^}]*uri:/g) || []).length;
    if (imageImports > 0 && !content.includes("cachePolicy") && !content.includes("expo-image") && !content.includes("FastImage")) {
      issues.push({
        severity: "medium",
        category: "Image Performance",
        message: "Remote images loaded without a caching library.",
        fix: "Use expo-image (with cachePolicy) or react-native-fast-image for disk caching and progressive loading.",
        file: rel,
      });
    }
  }

  const pkg = existsSync(join(root, "package.json"))
    ? JSON.parse(readFileSync(join(root, "package.json"), "utf-8"))
    : { dependencies: {} };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (!deps["react-native-reanimated"] && files.some((f) => {
    try { return readFileSync(f, "utf-8").includes("Animated."); } catch { return false; }
  })) {
    issues.push({
      severity: "medium",
      category: "Animation Performance",
      message: "Using the legacy Animated API. Animations run on the JS thread, causing jank.",
      fix: "Migrate to react-native-reanimated for worklet-based animations on the UI thread.",
    });
  }

  if (issues.length === 0) {
    issues.push({
      severity: "low",
      category: "General",
      message: "No common performance anti-patterns detected in source files.",
      fix: "Profile with Flipper or React DevTools Profiler for render-time analysis.",
    });
  }

  return issues;
}

function profileFlutter(root: string): PerfIssue[] {
  const issues: PerfIssue[] = [];
  const libDir = join(root, "lib");
  const files = collectFiles(libDir, [".dart"]);

  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const rel = file.replace(root, "").replace(/\\/g, "/");

    const buildMethodRegex = /Widget\s+build\(BuildContext/g;
    const widgetCreations = (content.match(/new\s+\w+Widget\(|(?<!\bconst\s)\b[A-Z]\w+\(/g) || []).length;
    if (buildMethodRegex.test(content) && widgetCreations > 15) {
      issues.push({
        severity: "medium",
        category: "Widget Rebuilds",
        message: "Large build method with many widget instantiations. Likely causes expensive rebuilds.",
        fix: "Extract subtrees into separate widgets and use const constructors where possible.",
        file: rel,
      });
    }

    if (content.includes("setState") && content.includes("ListView")) {
      issues.push({
        severity: "medium",
        category: "List Performance",
        message: "setState used alongside ListView. The entire list may rebuild on every state change.",
        fix: "Use ListView.builder with itemExtent for efficient rendering, or scope state with a focused widget.",
        file: rel,
      });
    }

    if (content.includes("Opacity(") && !content.includes("AnimatedOpacity")) {
      issues.push({
        severity: "low",
        category: "Render Performance",
        message: "Opacity widget causes an offscreen buffer. Expensive for complex subtrees.",
        fix: "Use AnimatedOpacity for transitions, or FadeTransition. For static transparency, set color alpha.",
        file: rel,
      });
    }

    if (content.includes("RepaintBoundary") === false && (content.match(/CustomPaint/g) || []).length > 0) {
      issues.push({
        severity: "medium",
        category: "Paint Performance",
        message: "CustomPaint without RepaintBoundary. The canvas repaints with every ancestor rebuild.",
        fix: "Wrap CustomPaint in a RepaintBoundary to isolate repaints.",
        file: rel,
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      severity: "low",
      category: "General",
      message: "No common performance anti-patterns detected.",
      fix: "Use Flutter DevTools Timeline to profile frame rendering and identify jank.",
    });
  }

  return issues;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_profilePerformance",
    "Analyze a mobile project for common performance anti-patterns: slow lists, unnecessary re-renders, inline styles, uncached images, and animation issues.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        if (!existsSync(root)) {
          return errorResponse(new Error(`Project path does not exist: ${root}`));
        }

        const issues = args.framework === "flutter"
          ? profileFlutter(root)
          : profileExpo(root);

        const highCount = issues.filter((i) => i.severity === "high").length;
        const mediumCount = issues.filter((i) => i.severity === "medium").length;

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: args.framework,
              summary: {
                total_issues: issues.length,
                high: highCount,
                medium: mediumCount,
                low: issues.length - highCount - mediumCount,
              },
              issues,
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

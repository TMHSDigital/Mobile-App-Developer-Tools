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
    .describe("Framework to audit (default: expo)."),
};

interface A11yViolation {
  severity: "critical" | "serious" | "moderate" | "minor";
  wcag: string;
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
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}

function auditExpo(root: string): A11yViolation[] {
  const violations: A11yViolation[] = [];
  const srcDir = existsSync(join(root, "src")) ? join(root, "src") : join(root, "app");
  const files = collectFiles(srcDir, [".tsx", ".jsx"]);

  for (const file of files) {
    let content: string;
    try { content = readFileSync(file, "utf-8"); } catch { continue; }
    const rel = file.replace(root, "").replace(/\\/g, "/");

    const touchableRegex = /<(TouchableOpacity|TouchableHighlight|Pressable|TouchableWithoutFeedback)\b/g;
    let match: RegExpExecArray | null;
    while ((match = touchableRegex.exec(content)) !== null) {
      const afterTag = content.slice(match.index, match.index + 300);
      if (!afterTag.includes("accessibilityLabel") && !afterTag.includes("aria-label") && !afterTag.includes("accessible={false}")) {
        violations.push({
          severity: "critical",
          wcag: "1.1.1 Non-text Content",
          message: `<${match[1]}> without accessibilityLabel. Screen readers cannot describe this control.`,
          fix: `Add accessibilityLabel="descriptive text" to the <${match[1]}>.`,
          file: rel,
        });
      }
      if (!afterTag.includes("accessibilityRole") && !afterTag.includes("role=")) {
        violations.push({
          severity: "serious",
          wcag: "4.1.2 Name, Role, Value",
          message: `<${match[1]}> without accessibilityRole. Screen readers do not know this is a button.`,
          fix: `Add accessibilityRole="button" (or "link", "tab", etc.).`,
          file: rel,
        });
      }
    }

    const imageRegex = /<Image\b/g;
    while ((match = imageRegex.exec(content)) !== null) {
      const afterTag = content.slice(match.index, match.index + 300);
      if (!afterTag.includes("accessibilityLabel") && !afterTag.includes("aria-label") && !afterTag.includes("accessible={false}")) {
        violations.push({
          severity: "serious",
          wcag: "1.1.1 Non-text Content",
          message: "<Image> without accessibilityLabel. Decorative images should set accessible={false}.",
          fix: "Add accessibilityLabel describing the image, or accessible={false} for decorative images.",
          file: rel,
        });
      }
    }

    const smallSizeRegex = /(?:width|height|minWidth|minHeight)\s*:\s*(\d+)/g;
    while ((match = smallSizeRegex.exec(content)) !== null) {
      const size = parseInt(match[1], 10);
      if (size > 0 && size < 44) {
        const context = content.slice(Math.max(0, match.index - 100), match.index + 50);
        if (/Touchable|Pressable|Button|onPress/i.test(context)) {
          violations.push({
            severity: "serious",
            wcag: "2.5.5 Target Size",
            message: `Touch target size ${size}px is below the 44px minimum. Difficult for users with motor impairments.`,
            fix: "Set minimum width and height to 44 (or use hitSlop to expand the tappable area).",
            file: rel,
          });
        }
      }
    }

    if (content.includes("color:") && !content.includes("accessibilityLabel") && /color:\s*["']?(red|green|#ff0000|#00ff00)/i.test(content)) {
      violations.push({
        severity: "moderate",
        wcag: "1.4.1 Use of Color",
        message: "Color may be the only indicator of state. Color-blind users cannot distinguish this.",
        fix: "Add a text label, icon, or pattern in addition to the color change.",
        file: rel,
      });
    }
  }

  if (violations.length === 0) {
    violations.push({
      severity: "minor",
      wcag: "General",
      message: "No common a11y violations detected in source files. Test with VoiceOver/TalkBack for full coverage.",
      fix: "Run the app with a screen reader and verify all flows are navigable.",
    });
  }

  return violations;
}

function auditFlutter(root: string): A11yViolation[] {
  const violations: A11yViolation[] = [];
  const libDir = join(root, "lib");
  const files = collectFiles(libDir, [".dart"]);

  for (const file of files) {
    let content: string;
    try { content = readFileSync(file, "utf-8"); } catch { continue; }
    const rel = file.replace(root, "").replace(/\\/g, "/");

    const gestureDetectorRegex = /GestureDetector\(/g;
    let match: RegExpExecArray | null;
    while ((match = gestureDetectorRegex.exec(content)) !== null) {
      const afterTag = content.slice(match.index, match.index + 500);
      if (!afterTag.includes("Semantics") && !afterTag.includes("Tooltip")) {
        violations.push({
          severity: "critical",
          wcag: "1.1.1 Non-text Content",
          message: "GestureDetector without Semantics wrapper. Invisible to screen readers.",
          fix: "Wrap in Semantics(label: '...', button: true, child: GestureDetector(...)).",
          file: rel,
        });
      }
    }

    const inkwellRegex = /InkWell\(/g;
    while ((match = inkwellRegex.exec(content)) !== null) {
      const afterTag = content.slice(match.index, match.index + 500);
      if (!afterTag.includes("Semantics") && !afterTag.includes("Tooltip") && !afterTag.includes("semanticsLabel")) {
        violations.push({
          severity: "serious",
          wcag: "4.1.2 Name, Role, Value",
          message: "InkWell without Semantics. Screen readers cannot describe this interactive element.",
          fix: "Wrap in Semantics(label: '...', button: true) or use a named widget like ElevatedButton.",
          file: rel,
        });
      }
    }

    const imageRegex = /Image\.(asset|network|file|memory)\(/g;
    while ((match = imageRegex.exec(content)) !== null) {
      const afterTag = content.slice(match.index, match.index + 300);
      if (!afterTag.includes("semanticsLabel") && !afterTag.includes("Semantics") && !afterTag.includes("excludeFromSemantics")) {
        violations.push({
          severity: "serious",
          wcag: "1.1.1 Non-text Content",
          message: `Image.${match[1]}() without semanticsLabel. Screen readers skip this image.`,
          fix: "Add semanticsLabel: '...' or excludeFromSemantics: true for decorative images.",
          file: rel,
        });
      }
    }

    const sizedBoxRegex = /SizedBox\(\s*(?:width|height)\s*:\s*(\d+)/g;
    while ((match = sizedBoxRegex.exec(content)) !== null) {
      const size = parseInt(match[1], 10);
      if (size > 0 && size < 44) {
        const context = content.slice(Math.max(0, match.index - 200), match.index + 100);
        if (/onTap|onPressed|InkWell|GestureDetector|IconButton/i.test(context)) {
          violations.push({
            severity: "serious",
            wcag: "2.5.5 Target Size",
            message: `Touch target constrained to ${size}px. Below the 44px minimum.`,
            fix: "Ensure interactive elements have at least 48x48 logical pixels (Material guideline).",
            file: rel,
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    violations.push({
      severity: "minor",
      wcag: "General",
      message: "No common a11y violations detected. Test with TalkBack (Android) and VoiceOver (iOS).",
      fix: "Enable TalkBack in device settings and navigate the entire app by swipe gestures.",
    });
  }

  return violations;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_auditAccessibility",
    "Scan a mobile project for accessibility violations: missing labels, small touch targets, images without alt text, color-only indicators. Reports WCAG level for each finding.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        if (!existsSync(root)) {
          return errorResponse(new Error(`Project path does not exist: ${root}`));
        }

        const violations = args.framework === "flutter"
          ? auditFlutter(root)
          : auditExpo(root);

        const criticalCount = violations.filter((v) => v.severity === "critical").length;
        const seriousCount = violations.filter((v) => v.severity === "serious").length;
        const moderateCount = violations.filter((v) => v.severity === "moderate").length;

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: args.framework,
              summary: {
                total_violations: violations.length,
                critical: criticalCount,
                serious: seriousCount,
                moderate: moderateCount,
                minor: violations.length - criticalCount - seriousCount - moderateCount,
              },
              violations,
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

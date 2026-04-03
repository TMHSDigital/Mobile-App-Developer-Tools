import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
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
    .describe("Framework to check (default: expo)."),
};

interface OfflineCheck {
  category: string;
  status: "pass" | "warn" | "fail";
  message: string;
  fix?: string;
}

function readFileSafe(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function checkExpoOffline(root: string): OfflineCheck[] {
  const checks: OfflineCheck[] = [];

  const pkgStr = readFileSafe(join(root, "package.json"));
  const deps = pkgStr
    ? (() => {
        const pkg = JSON.parse(pkgStr);
        return { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
      })()
    : {};

  const localDbLibs = ["@nozbe/watermelondb", "expo-sqlite", "realm", "powersync", "react-native-mmkv"];
  const foundDb = localDbLibs.filter((lib) => deps[lib]);
  if (foundDb.length > 0) {
    checks.push({
      category: "Local Database",
      status: "pass",
      message: `Local database found: ${foundDb.join(", ")}.`,
    });
  } else {
    checks.push({
      category: "Local Database",
      status: "fail",
      message: "No local database library detected. Offline data persistence requires a local DB.",
      fix: "Install @nozbe/watermelondb, expo-sqlite, or react-native-mmkv for local data storage.",
    });
  }

  const networkLibs = ["@react-native-community/netinfo", "expo-network"];
  const foundNet = networkLibs.filter((lib) => deps[lib]);
  if (foundNet.length > 0) {
    checks.push({
      category: "Network Status",
      status: "pass",
      message: `Network status library found: ${foundNet.join(", ")}.`,
    });
  } else {
    checks.push({
      category: "Network Status",
      status: "fail",
      message: "No network status listener detected. The app cannot detect offline/online transitions.",
      fix: "Install @react-native-community/netinfo to detect connectivity changes and adapt the UI.",
    });
  }

  if (deps["@tanstack/react-query"] || deps["react-query"]) {
    checks.push({
      category: "Query Caching",
      status: "pass",
      message: "React Query detected. Use its offline persistence plugin for cached query survival across restarts.",
    });
  } else if (deps["swr"]) {
    checks.push({
      category: "Query Caching",
      status: "pass",
      message: "SWR detected. Configure a persistent cache provider for offline reads.",
    });
  } else {
    checks.push({
      category: "Query Caching",
      status: "warn",
      message: "No query caching library found. API responses are lost when the app restarts.",
      fix: "Add @tanstack/react-query with persistQueryClient for automatic offline caching.",
    });
  }

  if (deps["@tanstack/react-query"]) {
    checks.push({
      category: "Mutation Queue",
      status: "warn",
      message: "Verify that useMutation calls include onMutate for optimistic updates and a retry/queue for offline writes.",
      fix: "Use React Query's onlineMutationManager or build a custom queue with MMKV persistence.",
    });
  } else {
    checks.push({
      category: "Mutation Queue",
      status: "warn",
      message: "No mutation queue pattern detected. Writes made offline may be lost.",
      fix: "Implement an offline mutation queue that persists pending writes and replays them when connectivity returns.",
    });
  }

  return checks;
}

function checkFlutterOffline(root: string): OfflineCheck[] {
  const checks: OfflineCheck[] = [];

  const pubspec = readFileSafe(join(root, "pubspec.yaml")) ?? "";

  const localDbLibs = ["drift", "isar", "sqflite", "hive", "objectbox"];
  const foundDb = localDbLibs.filter((lib) => pubspec.includes(lib));
  if (foundDb.length > 0) {
    checks.push({
      category: "Local Database",
      status: "pass",
      message: `Local database found: ${foundDb.join(", ")}.`,
    });
  } else {
    checks.push({
      category: "Local Database",
      status: "fail",
      message: "No local database package detected in pubspec.yaml.",
      fix: "Add drift (recommended) or isar for typed, reactive local persistence.",
    });
  }

  if (pubspec.includes("connectivity_plus")) {
    checks.push({
      category: "Network Status",
      status: "pass",
      message: "connectivity_plus found for network state monitoring.",
    });
  } else {
    checks.push({
      category: "Network Status",
      status: "fail",
      message: "No connectivity monitoring package found.",
      fix: "Add connectivity_plus to detect online/offline transitions.",
    });
  }

  if (pubspec.includes("dio") || pubspec.includes("http")) {
    checks.push({
      category: "HTTP Client",
      status: "pass",
      message: "HTTP client package detected. Ensure requests handle SocketException for offline scenarios.",
    });
  }

  checks.push({
    category: "Mutation Queue",
    status: "warn",
    message: "Verify you have a pending-operations queue that persists writes and replays on reconnect.",
    fix: "Store failed mutations in the local DB with a sync status column and replay via a background isolate.",
  });

  return checks;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_checkOfflineReady",
    "Validate a mobile project's offline-first readiness: local database, network status listener, query caching, and mutation queue.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        if (!existsSync(root)) {
          return errorResponse(new Error(`Project path does not exist: ${root}`));
        }

        const checks = args.framework === "flutter"
          ? checkFlutterOffline(root)
          : checkExpoOffline(root);

        const passCount = checks.filter((c) => c.status === "pass").length;
        const warnCount = checks.filter((c) => c.status === "warn").length;
        const failCount = checks.filter((c) => c.status === "fail").length;

        const readiness =
          failCount === 0 && warnCount === 0
            ? "ready"
            : failCount === 0
              ? "partial"
              : "not_ready";

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: args.framework,
              readiness,
              summary: { pass: passCount, warn: warnCount, fail: failCount },
              checks,
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

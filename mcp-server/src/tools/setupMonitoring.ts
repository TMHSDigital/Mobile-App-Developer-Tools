import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  provider: z
    .enum(["sentry", "datadog"])
    .optional()
    .default("sentry")
    .describe("APM provider (default: sentry)."),
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Framework (default: expo)."),
  output_directory: z
    .string()
    .optional()
    .default("lib")
    .describe("Output directory relative to project root (default: lib)."),
};

function generateSentryExpo(): string {
  return `import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  profilesSampleRate: __DEV__ ? 1.0 : 0.1,
  enableAutoSessionTracking: true,
  environment: __DEV__ ? "development" : "production",
});

export function startSpan(name: string, op: string): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({ name, op });
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, { extra: context });
}

export function setUser(id: string, email?: string): void {
  Sentry.setUser({ id, email });
}

export function clearUser(): void {
  Sentry.setUser(null);
}

export function addBreadcrumb(
  category: string,
  message: string,
  level: Sentry.SeverityLevel = "info",
): void {
  Sentry.addBreadcrumb({ category, message, level });
}

export const SentryWrap = Sentry.wrap;
`;
}

function generateSentryFlutter(): string {
  return `import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> initMonitoring() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      options.tracesSampleRate = 0.2;
      options.profilesSampleRate = 0.1;
      options.environment =
          const bool.fromEnvironment('dart.vm.product') ? 'production' : 'development';
    },
  );
}

Future<void> captureError(dynamic error, StackTrace stackTrace, {Map<String, dynamic>? extra}) async {
  await Sentry.captureException(error, stackTrace: stackTrace, withScope: (scope) {
    if (extra != null) {
      for (final entry in extra.entries) {
        scope.setExtra(entry.key, entry.value);
      }
    }
  });
}

ISentrySpan startSpan(String operation, String description) {
  final transaction = Sentry.startTransaction(operation, description);
  return transaction;
}

void setUser(String id, {String? email}) {
  Sentry.configureScope((scope) {
    scope.setUser(SentryUser(id: id, email: email));
  });
}

void clearUser() {
  Sentry.configureScope((scope) {
    scope.setUser(null);
  });
}
`;
}

function generateDatadogExpo(): string {
  return `import {
  DdSdkReactNative,
  DdSdkReactNativeConfiguration,
  DdLogs,
  DdTrace,
  DdRum,
} from "@datadog/mobile-react-native";

const config = new DdSdkReactNativeConfiguration(
  process.env.EXPO_PUBLIC_DD_CLIENT_TOKEN!,
  __DEV__ ? "development" : "production",
  process.env.EXPO_PUBLIC_DD_APPLICATION_ID!,
  true,  // track interactions
  true,  // track XHR
  true,  // track errors
);

config.site = "US1";
config.nativeCrashReportEnabled = true;
config.sessionSamplingRate = __DEV__ ? 100 : 20;

export async function initMonitoring(): Promise<void> {
  await DdSdkReactNative.initialize(config);
}

export async function startSpan(name: string, resourceName: string): Promise<string> {
  return DdTrace.startSpan(name, { "resource.name": resourceName });
}

export async function finishSpan(spanId: string): Promise<void> {
  await DdTrace.finishSpan(spanId);
}

export function logError(message: string, context?: Record<string, unknown>): void {
  DdLogs.error(message, context ?? {});
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  DdLogs.info(message, context ?? {});
}

export function trackAction(name: string, context?: Record<string, unknown>): void {
  DdRum.addAction("custom", name, context ?? {});
}

export function setUser(id: string, name?: string, email?: string): void {
  DdSdkReactNative.setUser({ id, name, email });
}
`;
}

function generateDatadogFlutter(): string {
  return `import 'package:datadog_flutter_plugin/datadog_flutter_plugin.dart';

Future<void> initMonitoring() async {
  final configuration = DatadogConfiguration(
    clientToken: const String.fromEnvironment('DD_CLIENT_TOKEN'),
    env: const bool.fromEnvironment('dart.vm.product') ? 'production' : 'development',
    site: DatadogSite.us1,
    nativeCrashReportEnabled: true,
    loggingConfiguration: DatadogLoggingConfiguration(),
    rumConfiguration: DatadogRumConfiguration(
      applicationId: const String.fromEnvironment('DD_APPLICATION_ID'),
      sessionSamplingRate: 20,
      traceSamplingRate: 20,
    ),
  );

  await DatadogSdk.instance.initialize(configuration, TrackingConsent.granted);
}

void logError(String message, {Map<String, dynamic>? attributes}) {
  DatadogSdk.instance.logs?.error(message, attributes: attributes ?? {});
}

void logInfo(String message, {Map<String, dynamic>? attributes}) {
  DatadogSdk.instance.logs?.info(message, attributes: attributes ?? {});
}

void trackAction(String name, {Map<String, dynamic>? attributes}) {
  DatadogSdk.instance.rum?.addAction(RumActionType.custom, name, attributes ?? {});
}

void setUser(String id, {String? name, String? email}) {
  DatadogSdk.instance.setUserInfo(id: id, name: name, email: email);
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_setupMonitoring",
    "Configure application performance monitoring (APM) with Sentry Performance or Datadog RUM. Generates a monitoring module with error capture, tracing, user context, and breadcrumbs.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const outDir = join(root, args.output_directory);
        mkdirSync(outDir, { recursive: true });

        const isFlutter = args.framework === "flutter";
        const ext = isFlutter ? "dart" : "ts";
        const fileName = `monitoring.${ext}`;
        const filePath = join(outDir, fileName);

        if (existsSync(filePath)) {
          return errorResponse(new Error(`File already exists: ${filePath}`));
        }

        let content: string;
        let dependencies: string[];
        const nextSteps: string[] = [];

        if (args.provider === "datadog") {
          if (isFlutter) {
            content = generateDatadogFlutter();
            dependencies = ["datadog_flutter_plugin"];
            nextSteps.push(
              "Add DD_CLIENT_TOKEN and DD_APPLICATION_ID to --dart-define or .env",
              "Call initMonitoring() in main() before runApp()",
              "Wrap MaterialApp with DatadogNavigationObserver for auto route tracking",
            );
          } else {
            content = generateDatadogExpo();
            dependencies = ["@datadog/mobile-react-native"];
            nextSteps.push(
              "Set EXPO_PUBLIC_DD_CLIENT_TOKEN and EXPO_PUBLIC_DD_APPLICATION_ID in .env",
              "Call initMonitoring() in your app root (_layout.tsx)",
              "Wrap navigation with DatadogProvider for auto view tracking",
            );
          }
        } else {
          if (isFlutter) {
            content = generateSentryFlutter();
            dependencies = ["sentry_flutter"];
            nextSteps.push(
              "Add SENTRY_DSN to --dart-define or .env",
              "Call initMonitoring() in main() before runApp()",
              "Wrap runApp with Sentry's runZonedGuarded for automatic error capture",
            );
          } else {
            content = generateSentryExpo();
            dependencies = ["@sentry/react-native"];
            nextSteps.push(
              "Set EXPO_PUBLIC_SENTRY_DSN in .env",
              "Wrap your root component with SentryWrap (e.g., export default SentryWrap(App))",
              "Run npx sentry-expo-upload-sourcemaps for production source maps",
              "Configure EAS Build to include Sentry plugin in app.config",
            );
          }
        }

        writeFileSync(filePath, content, "utf-8");

        return textResponse(
          JSON.stringify(
            {
              success: true,
              provider: args.provider,
              framework: args.framework,
              file_created: filePath,
              dependencies_needed: dependencies,
              next_steps: nextSteps,
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

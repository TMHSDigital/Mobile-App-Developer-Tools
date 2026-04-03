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
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Framework (default: expo)."),
  provider: z
    .enum(["posthog", "launchdarkly", "firebase"])
    .optional()
    .default("posthog")
    .describe("Feature flag provider (default: posthog)."),
  output_directory: z
    .string()
    .optional()
    .default("lib")
    .describe("Output directory relative to project root (default: lib)."),
};

function generatePostHogExpo(): string {
  return `import PostHog from "posthog-react-native";

const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
});

export type FeatureFlags = {
  new_onboarding: boolean;
  premium_features: boolean;
  experimental_ui: boolean;
};

const FLAG_DEFAULTS: FeatureFlags = {
  new_onboarding: false,
  premium_features: false,
  experimental_ui: false,
};

export function getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  const value = posthog.getFeatureFlag(key);
  if (value === undefined || value === null) return FLAG_DEFAULTS[key];
  return value as FeatureFlags[K];
}

export function useFeatureFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  const value = posthog.useFeatureFlag(key);
  if (value === undefined || value === null) return FLAG_DEFAULTS[key];
  return value as FeatureFlags[K];
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  posthog.identify(userId, properties);
}

export function resetUser(): void {
  posthog.reset();
}

export { posthog };
`;
}

function generateLaunchDarklyExpo(): string {
  return `import { LDClient, LDConfig, LDContext } from "@launchdarkly/react-native-client-sdk";

const config: LDConfig = {
  mobileKey: process.env.EXPO_PUBLIC_LAUNCHDARKLY_KEY!,
  debug: __DEV__,
};

const client = new LDClient();

export type FeatureFlags = {
  new_onboarding: boolean;
  premium_features: boolean;
  experimental_ui: boolean;
};

const FLAG_DEFAULTS: FeatureFlags = {
  new_onboarding: false,
  premium_features: false,
  experimental_ui: false,
};

let initialized = false;

export async function initFeatureFlags(userId: string): Promise<void> {
  if (initialized) return;
  const context: LDContext = { kind: "user", key: userId };
  await client.configure(config, context);
  initialized = true;
}

export function getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  return (client.boolVariation(key, FLAG_DEFAULTS[key]) as FeatureFlags[K]);
}

export function onFlagChange(key: keyof FeatureFlags, callback: (value: boolean) => void): () => void {
  const listener = (flagKey: string, value: unknown) => {
    if (flagKey === key) callback(value as boolean);
  };
  client.registerFeatureFlagListener(key, listener);
  return () => client.unregisterFeatureFlagListener(key, listener);
}

export { client as ldClient };
`;
}

function generateFirebaseExpo(): string {
  return `import remoteConfig from "@react-native-firebase/remote-config";

export type FeatureFlags = {
  new_onboarding: boolean;
  premium_features: boolean;
  experimental_ui: boolean;
};

const FLAG_DEFAULTS: FeatureFlags = {
  new_onboarding: false,
  premium_features: false,
  experimental_ui: false,
};

export async function initFeatureFlags(): Promise<void> {
  await remoteConfig().setDefaults(FLAG_DEFAULTS as Record<string, boolean>);
  await remoteConfig().setConfigSettings({
    minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000,
  });
  await remoteConfig().fetchAndActivate();
}

export function getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  return remoteConfig().getBoolean(key) as FeatureFlags[K];
}

export function getAllFlags(): FeatureFlags {
  return {
    new_onboarding: remoteConfig().getBoolean("new_onboarding"),
    premium_features: remoteConfig().getBoolean("premium_features"),
    experimental_ui: remoteConfig().getBoolean("experimental_ui"),
  };
}

export async function refreshFlags(): Promise<void> {
  await remoteConfig().fetchAndActivate();
}
`;
}

function generateFlutterFeatureFlags(provider: string): string {
  const providerImport = provider === "firebase"
    ? "import 'package:firebase_remote_config/firebase_remote_config.dart';"
    : "// Add your feature flag provider package import here";

  return `${providerImport}

enum FeatureFlag {
  newOnboarding('new_onboarding', false),
  premiumFeatures('premium_features', false),
  experimentalUi('experimental_ui', false);

  const FeatureFlag(this.key, this.defaultValue);
  final String key;
  final bool defaultValue;
}

class FeatureFlagService {
  static final FeatureFlagService _instance = FeatureFlagService._();
  factory FeatureFlagService() => _instance;
  FeatureFlagService._();

  final Map<String, bool> _overrides = {};

  Future<void> init() async {
${provider === "firebase" ? `    final rc = FirebaseRemoteConfig.instance;
    await rc.setDefaults({
      for (final flag in FeatureFlag.values) flag.key: flag.defaultValue,
    });
    await rc.setConfigSettings(RemoteConfigSettings(
      fetchTimeout: const Duration(seconds: 10),
      minimumFetchInterval: const Duration(hours: 1),
    ));
    await rc.fetchAndActivate();` : `    // Initialize your feature flag provider here
    // Load remote flag values`}
  }

  bool isEnabled(FeatureFlag flag) {
    if (_overrides.containsKey(flag.key)) return _overrides[flag.key]!;
${provider === "firebase" ? `    return FirebaseRemoteConfig.instance.getBool(flag.key);` : `    return flag.defaultValue;`}
  }

  void setOverride(FeatureFlag flag, bool value) {
    _overrides[flag.key] = value;
  }

  void clearOverrides() {
    _overrides.clear();
  }

  Future<void> refresh() async {
${provider === "firebase" ? `    await FirebaseRemoteConfig.instance.fetchAndActivate();` : `    // Refresh from remote provider`}
  }
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_setupFeatureFlags",
    "Add a typed feature flag system with default values, remote sync, and provider integration (PostHog, LaunchDarkly, or Firebase Remote Config).",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const outDir = join(root, args.output_directory);
        mkdirSync(outDir, { recursive: true });

        const isFlutter = args.framework === "flutter";
        const ext = isFlutter ? "dart" : "ts";
        const fileName = `feature-flags.${ext}`;
        const filePath = join(outDir, fileName);

        if (existsSync(filePath)) {
          return errorResponse(new Error(`File already exists: ${filePath}`));
        }

        let content: string;
        let dependencies: string[];
        const nextSteps: string[] = [];

        if (isFlutter) {
          content = generateFlutterFeatureFlags(args.provider);
          dependencies = args.provider === "firebase"
            ? ["firebase_remote_config"]
            : [];
          nextSteps.push(
            "Call FeatureFlagService().init() in main() before runApp()",
            "Use FeatureFlagService().isEnabled(FeatureFlag.newOnboarding) to check flags",
            "Add new flags to the FeatureFlag enum as needed",
            `Configure ${args.provider} dashboard with matching flag keys`,
          );
        } else {
          switch (args.provider) {
            case "launchdarkly":
              content = generateLaunchDarklyExpo();
              dependencies = ["@launchdarkly/react-native-client-sdk"];
              nextSteps.push(
                "Set EXPO_PUBLIC_LAUNCHDARKLY_KEY in .env",
                "Call initFeatureFlags(userId) after authentication",
                "Use getFlag('new_onboarding') to check flags",
              );
              break;
            case "firebase":
              content = generateFirebaseExpo();
              dependencies = ["@react-native-firebase/remote-config", "@react-native-firebase/app"];
              nextSteps.push(
                "Ensure Firebase is configured (google-services.json / GoogleService-Info.plist)",
                "Call initFeatureFlags() in app root before rendering",
                "Use getFlag('new_onboarding') to check flags",
              );
              break;
            default:
              content = generatePostHogExpo();
              dependencies = ["posthog-react-native"];
              nextSteps.push(
                "Set EXPO_PUBLIC_POSTHOG_KEY in .env",
                "Use useFeatureFlag('new_onboarding') in components",
                "Call identifyUser(userId) after authentication",
              );
              break;
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

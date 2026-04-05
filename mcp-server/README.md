# @tmhs/mobile-mcp

MCP server for mobile app development. **36 tools** that let AI agents scaffold, build, test, and ship React Native/Expo and Flutter apps.

Part of [Mobile App Developer Tools](https://github.com/TMHSDigital/Mobile-App-Developer-Tools), a Cursor plugin with 43 skills, 12 rules, and this companion MCP server.

## Install

```bash
npm install -g @tmhs/mobile-mcp
```

Requires **Node 20+**.

## Quick start

Add to your MCP client config (e.g. Cursor, Claude Desktop):

```json
{
  "mcpServers": {
    "mobile-mcp": {
      "command": "npx",
      "args": ["-y", "@tmhs/mobile-mcp"]
    }
  }
}
```

Or run directly:

```bash
npx @tmhs/mobile-mcp
```

The server communicates over **stdio** using the [Model Context Protocol](https://modelcontextprotocol.io/).

## Tools (36)

All tools use the `mobile_` prefix.

| Tool | Description |
| --- | --- |
| `mobile_checkDevEnvironment` | Detect installed tools and SDKs (Node, Expo CLI, Watchman, Xcode, Android Studio, JDK) |
| `mobile_scaffoldProject` | Generate a new Expo project from a template with chosen options |
| `mobile_runOnDevice` | Start dev server and provide instructions for connecting a physical device |
| `mobile_generateScreen` | Create a new Expo Router screen file with navigation wiring |
| `mobile_generateComponent` | Create a React Native component with typed props, StyleSheet, and optional tests |
| `mobile_installDependency` | Install a package via `npx expo install` with native module detection |
| `mobile_addPermission` | Add platform permission with iOS rationale string to app.json |
| `mobile_integrateAI` | Scaffold AI API client with provider config, error handling, and TypeScript types |
| `mobile_checkBuildHealth` | Validate app.json, check dependencies, verify TypeScript, detect native module issues |
| `mobile_addPushNotifications` | Add expo-notifications plugin, create notification handler, configure Android channel |
| `mobile_configureDeepLinks` | Set scheme, add intent filters, iOS associated domains, generate AASA template |
| `mobile_resetDevEnvironment` | Clear Metro cache, .expo dir, node_modules cache, optionally Pods and Gradle |
| `mobile_buildForStore` | Create a production build for app store submission via EAS Build |
| `mobile_validateStoreMetadata` | Check app.json for required store listing fields |
| `mobile_submitToAppStore` | Submit latest iOS build to App Store Connect via EAS Submit |
| `mobile_submitToPlayStore` | Submit latest Android build to Google Play Console via EAS Submit |
| `mobile_generateScreenshots` | Generate screenshot capture script and list required store dimensions |
| `mobile_analyzeBundle` | Analyze bundle for large dependencies, heavy assets, and optimization opportunities |
| `mobile_configureOTA` | Configure EAS Update for over-the-air JavaScript updates |
| `mobile_runTests` | Execute test suite (Jest or flutter test) and return structured results |
| `mobile_setupCI` | Generate GitHub Actions CI workflow for build, test, and EAS Build |
| `mobile_generateTestFile` | Scaffold a test file for an existing component or module |
| `mobile_setupI18n` | Initialize i18n config with locale files and translation structure |
| `mobile_addMap` | Add map view with provider config, permissions, and marker support |
| `mobile_generateForm` | Scaffold a validated form with typed fields and error handling |
| `mobile_setupRealtime` | Add real-time client with connection management and typed events |
| `mobile_securityAudit` | Scan project for common mobile security anti-patterns |
| `mobile_profilePerformance` | Analyze project for performance anti-patterns and flag jank/memory issues |
| `mobile_checkOfflineReady` | Validate offline-first setup: local DB, network listener, query cache |
| `mobile_setupMonitoring` | Configure APM with Sentry Performance or Datadog RUM |
| `mobile_setupTheming` | Initialize design token system with light/dark themes and semantic colors |
| `mobile_auditAccessibility` | Scan project for a11y violations: labels, touch targets, alt text |
| `mobile_setupFeatureFlags` | Add typed feature flag provider with default values and remote sync |
| `mobile_createNativeModule` | Scaffold an Expo Module or Flutter plugin with Swift/Kotlin stubs |
| `mobile_upgradeSDK` | Generate SDK upgrade plan with dependency fixes and breaking changes |
| `mobile_checkNativeCompat` | Audit packages for New Architecture support and deprecated dependencies |

## Development

```bash
git clone https://github.com/TMHSDigital/Mobile-App-Developer-Tools.git
cd Mobile-App-Developer-Tools/mcp-server
npm install
npm run build
```

## License

[CC-BY-NC-ND-4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) - Copyright 2026 TM Hospitality Strategies.

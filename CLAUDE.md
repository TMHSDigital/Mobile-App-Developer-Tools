# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **Mobile App Developer Tools** Cursor plugin is at **v0.12.0**. It helps developers go from zero to a published app in the stores. Supports React Native/Expo and Flutter with **43 skills**, **12 rules**, and a companion MCP server exposing **36 tools**.

## Demo App

[SnapLog](https://github.com/TMHSDigital/Demo-Mobile-App) is a companion photo journal app that demonstrates 16 of the 20 skills in a real project. Reference it when explaining what the plugin can do.

## Plugin Architecture

```
.cursor-plugin/plugin.json   - Plugin manifest
skills/<skill-name>/SKILL.md - AI workflow definitions
rules/<rule-name>.mdc        - Code quality and security rules
mcp-server/                  - MCP server with 36 tools
packages/mobile-dev-tools/   - NPM package (stub for name claim)
```

## Skills (43 total)

### React Native / Expo

| Skill | Purpose |
| --- | --- |
| mobile-project-setup | Guided Expo project creation with TypeScript, file-based routing, ESLint |
| mobile-dev-environment | Cross-platform dependency detection (Node, Watchman, Xcode, Android Studio, Expo CLI) |
| mobile-run-on-device | Running on a physical device via Expo Go, dev builds, QR code, tunnel mode |
| mobile-navigation-setup | Expo Router file-based navigation: tabs, stack, drawer, typed routes, deep linking |
| mobile-state-management | When to use React state vs Zustand vs Jotai vs React Query; patterns and examples |
| mobile-component-patterns | Reusable component architecture, compound components, StyleSheet vs NativeWind, testing |
| mobile-camera-integration | expo-camera setup, permissions, photo capture, barcode scanning, video recording |
| mobile-ai-features | AI API integration (OpenAI, Anthropic, Google) with backend proxy, vision, text, audio |
| mobile-permissions | Cross-platform permission request patterns, rationale strings, denied/blocked handling |
| mobile-auth-setup | Authentication with Supabase, Firebase, Clerk; secure token storage, protected routes |
| mobile-push-notifications | expo-notifications, EAS Push, Android channels, deep link on tap, local notifications |
| mobile-local-storage | AsyncStorage, expo-sqlite, expo-secure-store, MMKV; migrations and data cleanup |
| mobile-api-integration | REST/GraphQL clients, React Query, auth headers, retry, offline queue, optimistic updates |
| mobile-ios-submission | EAS Build/Submit, certificates, provisioning profiles, TestFlight, App Store review |
| mobile-android-submission | Play Console, signing keys, AAB, service accounts, staged rollouts |

### Flutter

| Skill | Purpose |
| --- | --- |
| mobile-flutter-project-setup | Guided flutter create with structure, linting, packages, flavors |
| mobile-flutter-navigation | GoRouter: declarative routing, shell routes for tabs, auth guards, deep linking |
| mobile-flutter-run-on-device | USB/wireless debugging, hot reload vs restart, build modes, troubleshooting |
| mobile-flutter-state-management | Riverpod (recommended), Bloc, Provider, setState; async data, code generation |

### Shared

| Skill | Purpose |
| --- | --- |
| mobile-app-store-prep | App icons, screenshots, metadata, privacy policy, age ratings, review guidelines |
| mobile-monetization | In-app purchases, subscriptions, RevenueCat, StoreKit 2, sandbox testing |
| mobile-deep-links | Universal links, app links, URL schemes, deferred deep links, attribution |
| mobile-analytics | Crash reporting (Sentry, Crashlytics), event tracking (PostHog), source maps |
| mobile-ota-updates | EAS Update channels, runtime versions, staged rollouts, rollback, Shorebird |
| mobile-testing | Unit and integration testing with Jest, React Native Testing Library, flutter_test, snapshot testing |
| mobile-e2e-testing | End-to-end testing with Detox, Maestro, Patrol; device farm setup |
| mobile-ci-cd | GitHub Actions workflows, EAS Build pipelines, build caching, code signing in CI |
| mobile-animations | Reanimated, Lottie, Rive for React Native; implicit/explicit animations for Flutter |
| mobile-maps-location | MapView, geolocation, geofencing, background location tracking |
| mobile-i18n | Internationalization, RTL layout, locale detection, pluralization, translation files |
| mobile-forms-validation | React Hook Form + Zod for RN, Form + TextFormField for Flutter; multi-step forms |
| mobile-real-time | WebSockets, Supabase Realtime, Socket.IO, SSE; reconnection and presence |
| mobile-security | SSL pinning, code obfuscation, jailbreak/root detection, certificate transparency |
| mobile-offline-sync | Offline-first architecture, background sync, conflict resolution, operation queuing |
| mobile-background-tasks | Background fetch, WorkManager (Android), BGTaskScheduler (iOS), headless JS |
| mobile-debugging | Flipper, React DevTools, Flutter DevTools, memory leak detection, network inspection |
| mobile-app-monitoring | Production APM with Sentry Performance, Datadog, Instabug; OpenTelemetry spans, Apdex scoring |
| mobile-theming | Design tokens, dark mode, system appearance detection, NativeWind, Material 3, persistent preference |
| mobile-feature-flags | Feature toggles with PostHog, LaunchDarkly, Firebase Remote Config; A/B testing, staged rollouts |
| mobile-accessibility-testing | Automated a11y audits, WCAG compliance, screen reader testing, CI integration |
| mobile-native-modules | Expo Modules API (Swift/Kotlin), Turbo Modules, JSI bridging, native view components |
| mobile-config-plugins | Config plugin authoring, CNG patterns, Xcode/Gradle automation, modifier previews |
| mobile-sdk-upgrade | SDK version migration, dependency audit, breaking change detection, rollback strategy |

## Rules (12 total)

| Rule | Scope | Purpose |
| --- | --- | --- |
| mobile-secrets.mdc | Global | Flags API keys, signing credentials, keystore passwords, Firebase config, EAS tokens |
| mobile-platform-check.mdc | `.ts`, `.tsx` | Flags platform-specific APIs used without Platform.OS or Platform.select() guards |
| mobile-image-assets.mdc | `.ts`, `.tsx`, `.json` | Flags oversized images, unoptimized formats, missing density variants, uncached remote images |
| mobile-env-safety.mdc | `.ts`, `.tsx`, `.json` | Flags hardcoded production endpoints, missing EXPO_PUBLIC_ prefix, server-only secrets in client code |
| mobile-performance.mdc | `.ts`, `.tsx`, `.dart` | Flags inline styles, missing list keys, unnecessary re-renders (RN); missing const constructors, inline widgets (Flutter) |
| mobile-accessibility.mdc | `.ts`, `.tsx`, `.dart` | Flags missing a11y labels, small touch targets, images without alt text, color-only indicators |
| mobile-bundle-size.mdc | `.ts`, `.tsx`, `.json`, `.dart` | Flags large dependencies, unoptimized imports, heavy packages with lighter alternatives |
| mobile-test-coverage.mdc | `.ts`, `.tsx`, `.dart` | Flags untested components, missing test files, low coverage thresholds, snapshot-only tests |
| mobile-i18n-strings.mdc | `.ts`, `.tsx`, `.dart` | Flags hardcoded user-facing strings not wrapped in a translation function |
| mobile-security-audit.mdc | `.ts`, `.tsx`, `.dart`, `.json`, `.xml` | Flags insecure storage, missing SSL pinning, debug flags in release builds, cleartext traffic |
| mobile-color-contrast.mdc | `.ts`, `.tsx`, `.dart` | Flags insufficient color contrast, missing dark mode variants, non-semantic color usage |
| mobile-native-compat.mdc | `.ts`, `.tsx`, `.dart` | Flags deprecated native APIs, bridge-only patterns, New Architecture incompatibilities |

## Companion MCP Server

Tools use the `mobile_` prefix (for example `mobile_checkDevEnvironment`).

### Tools (36 total)

| Tool | Description |
| --- | --- |
| mobile_checkDevEnvironment | Detect installed tools and SDKs (Node, Expo CLI, Watchman, Xcode, Android Studio, JDK); report what is missing |
| mobile_scaffoldProject | Generate a new Expo project from a template with chosen options |
| mobile_runOnDevice | Start dev server and provide instructions for connecting a physical device |
| mobile_generateScreen | Create a new Expo Router screen file with navigation wiring and boilerplate |
| mobile_generateComponent | Create a React Native component with typed props, StyleSheet, and optional tests |
| mobile_installDependency | Install a package via npx expo install with native module detection and warnings |
| mobile_addPermission | Add platform permission with iOS rationale string to app.json config plugins |
| mobile_integrateAI | Scaffold AI API client with provider config, error handling, and TypeScript types |
| mobile_checkBuildHealth | Validate app.json, check dependencies, verify TypeScript, detect native module issues |
| mobile_addPushNotifications | Add expo-notifications plugin to app.json, create notification handler, configure Android channel |
| mobile_configureDeepLinks | Set scheme, add Android intent filters, iOS associated domains, generate AASA template |
| mobile_resetDevEnvironment | Nuclear reset: clear Metro cache, .expo dir, node_modules cache, optionally Pods and Gradle |
| mobile_buildForStore | Create a production build for app store submission via EAS Build |
| mobile_validateStoreMetadata | Check app.json for all required store listing fields (name, bundle ID, icon, etc.) |
| mobile_submitToAppStore | Submit latest iOS production build to App Store Connect via EAS Submit |
| mobile_submitToPlayStore | Submit latest Android production build to Google Play Console via EAS Submit |
| mobile_generateScreenshots | Generate screenshot capture script and list required store dimensions |
| mobile_analyzeBundle | Analyze app bundle for large dependencies, heavy assets, and optimization opportunities |
| mobile_configureOTA | Configure EAS Update for over-the-air JavaScript updates with channels and runtime versions |
| mobile_runTests | Execute test suite (Jest or flutter test) and return structured pass/fail summary |
| mobile_setupCI | Generate GitHub Actions CI workflow for build, test, and optional EAS Build deployment |
| mobile_generateTestFile | Scaffold a test file for an existing component or module with matching boilerplate |
| mobile_setupI18n | Initialize i18n config with locale files and translation structure |
| mobile_addMap | Add map view with provider config, permissions, and marker support |
| mobile_generateForm | Scaffold a validated form with typed fields, validation, and error handling |
| mobile_setupRealtime | Add real-time client with connection management, reconnection, and typed events |
| mobile_securityAudit | Scan project for common mobile security anti-patterns |
| mobile_profilePerformance | Analyze project for performance anti-patterns and flag jank, slow renders, memory issues |
| mobile_checkOfflineReady | Validate offline-first setup: local DB, network listener, query cache, mutation queue |
| mobile_setupMonitoring | Configure APM with Sentry Performance or Datadog RUM; error capture, tracing, release health |
| mobile_setupTheming | Initialize design token system with light/dark themes, semantic colors, and persistent preference |
| mobile_auditAccessibility | Scan project for a11y violations: missing labels, small touch targets, images without alt text |
| mobile_setupFeatureFlags | Add typed feature flag provider with default values, remote sync, and provider integration |
| mobile_createNativeModule | Scaffold an Expo Module or Flutter plugin with Swift/Kotlin stubs and TS/Dart bindings |
| mobile_upgradeSDK | Generate SDK upgrade plan with dependency fixes, breaking changes, and rollback strategy |
| mobile_checkNativeCompat | Audit packages for New Architecture support, flag bridge-only and deprecated dependencies |

## Development Workflow

- **Skills and rules**: No build step; edit `SKILL.md` and `.mdc` files directly.
- **MCP server**: From repo root, run `cd mcp-server && npm install && npm run build`.
- **NPM package**: From repo root, run `cd packages/mobile-dev-tools && npm install && npm run build`.

**Symlink the plugin for local Cursor development**

- **Windows (PowerShell)** - run as Administrator if required for symlink creation:

```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.cursor\plugins\mobile-app-developer-tools" -Target (Get-Location)
```

- **macOS / Linux**:

```bash
ln -s "$(pwd)" ~/.cursor/plugins/mobile-app-developer-tools
```

Run each command from the repo root. Adjust paths if your clone is elsewhere.

## Key Conventions

- **Default framework**: Expo (React Native) with TypeScript.
- **File-based routing**: Use Expo Router, not React Navigation stack config.
- **MCP tool prefix**: `mobile_` (e.g. `mobile_checkDevEnvironment`).
- **Never hardcode** API keys, signing credentials, or tokens. Use environment variables or `.env` files.
- **Platform checks**: Always use `Platform.OS` when writing platform-specific code.

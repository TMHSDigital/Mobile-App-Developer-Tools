# Changelog

All notable changes to this project will be documented in this file.

## [0.11.0] - 2026-04-03

### Added

- **3 new skills**: `mobile-theming` (design tokens, dark mode, system appearance detection, NativeWind, Material 3, persistent theme preference), `mobile-feature-flags` (PostHog, LaunchDarkly, Firebase Remote Config, A/B testing, staged rollouts, kill switches), `mobile-accessibility-testing` (automated a11y audits, WCAG compliance, screen reader testing, CI integration)
- **1 new rule**: `mobile-color-contrast` (flags insufficient color contrast, missing dark mode variants, non-semantic color usage, hardcoded colors without theme tokens)
- **3 new MCP tools**: `mobile_setupTheming`, `mobile_auditAccessibility`, `mobile_setupFeatureFlags`
- Totals: 40 skills, 11 rules, 33 MCP tools

## [0.10.0] - 2026-04-03

### Added

- **5 new skills**: `mobile-security` (SSL pinning, code obfuscation, jailbreak/root detection, certificate transparency, secure key storage), `mobile-offline-sync` (offline-first architecture, WatermelonDB, PowerSync, Drift, conflict resolution, operation queuing), `mobile-background-tasks` (expo-task-manager, expo-background-fetch, WorkManager, BGTaskScheduler, headless JS, Flutter Workmanager), `mobile-debugging` (Flipper, React DevTools, Flutter DevTools, memory leak detection, network inspection), `mobile-app-monitoring` (Sentry Performance, Datadog RUM, Instabug, OpenTelemetry spans, Apdex scoring, session replay)
- **1 new rule**: `mobile-security-audit` (flags insecure storage, missing SSL pinning, debug flags in release builds, cleartext traffic, hardcoded signing credentials)
- **4 new MCP tools**: `mobile_securityAudit`, `mobile_profilePerformance`, `mobile_checkOfflineReady`, `mobile_setupMonitoring`
- Totals: 37 skills, 10 rules, 30 MCP tools

## [0.9.0] - 2026-04-03

### Added

- **5 new skills**: `mobile-animations` (Reanimated, Lottie, Rive, Flutter implicit/explicit animations), `mobile-maps-location` (react-native-maps, google_maps_flutter, expo-location, geofencing, background tracking), `mobile-i18n` (i18next, flutter_localizations, RTL, pluralization, locale detection), `mobile-forms-validation` (React Hook Form + Zod, TextFormField, keyboard avoidance, multi-step wizards), `mobile-real-time` (WebSockets, Supabase Realtime, Socket.IO, SSE, reconnection, presence)
- **1 new rule**: `mobile-i18n-strings` (flags hardcoded user-facing strings not wrapped in translation functions, string concatenation, missing plurals)
- **4 new MCP tools**: `mobile_setupI18n`, `mobile_addMap`, `mobile_generateForm`, `mobile_setupRealtime`
- Totals: 32 skills, 9 rules, 26 MCP tools

## [0.8.0] - 2026-04-03

### Added

- **3 new skills**: `mobile-testing` (unit and integration testing with Jest, React Native Testing Library, flutter_test, snapshot testing), `mobile-e2e-testing` (end-to-end testing with Detox, Maestro, Patrol, device farm setup), `mobile-ci-cd` (GitHub Actions workflows, EAS Build pipelines, build caching, code signing in CI)
- **1 new rule**: `mobile-test-coverage` (flags untested components, missing test files, low coverage thresholds, snapshot-only tests)
- **3 new MCP tools**: `mobile_runTests`, `mobile_setupCI`, `mobile_generateTestFile`
- Totals: 27 skills, 8 rules, 22 MCP tools

## [0.7.0] - 2026-04-03

### Added

- **4 new skills**: `mobile-monetization` (in-app purchases, subscriptions, RevenueCat, StoreKit 2), `mobile-deep-links` (universal links, app links, URL schemes, deferred deep links), `mobile-analytics` (Sentry, Firebase Crashlytics, PostHog, source maps, GDPR), `mobile-ota-updates` (EAS Update, channels, staged rollouts, rollback, Shorebird)
- **1 new rule**: `mobile-bundle-size` (flags large dependencies, unoptimized imports, heavy packages with lighter alternatives)
- **4 new MCP tools**: `mobile_submitToPlayStore`, `mobile_generateScreenshots`, `mobile_analyzeBundle`, `mobile_configureOTA`
- Totals: 24 skills, 7 rules, 19 MCP tools

## [0.6.0] - 2026-04-03

### Added

- **3 new skills**: `mobile-app-store-prep` (app icons, screenshots, metadata, privacy policy, review guidelines), `mobile-ios-submission` (EAS Build/Submit, certificates, TestFlight, App Store review), `mobile-android-submission` (Play Console, signing keys, AAB, service accounts, staged rollouts)
- **1 new rule**: `mobile-accessibility` (missing a11y labels, small touch targets, images without alt text, color-only indicators for RN + Flutter)
- **3 new MCP tools**: `mobile_buildForStore`, `mobile_validateStoreMetadata`, `mobile_submitToAppStore`
- Totals: 20 skills, 6 rules, 15 MCP tools

## [0.5.0] - 2026-04-03

### Added

- **4 new Flutter skills**: `mobile-flutter-project-setup` (guided flutter create with structure, linting, packages, flavors), `mobile-flutter-navigation` (GoRouter, shell routes, auth guards, deep links), `mobile-flutter-run-on-device` (USB/wireless debugging, hot reload, build modes), `mobile-flutter-state-management` (Riverpod, Bloc, Provider patterns)
- **1 new rule**: `mobile-performance` (cross-framework performance anti-patterns for React Native and Flutter)
- Totals: 17 skills, 5 rules, 12 MCP tools

## [0.4.0] - 2026-04-03

### Added

- **4 new skills**: `mobile-auth-setup` (Supabase, Firebase, Clerk auth with secure token storage), `mobile-push-notifications` (expo-notifications, EAS Push, Android channels), `mobile-local-storage` (AsyncStorage, SQLite, SecureStore, MMKV), `mobile-api-integration` (REST/GraphQL clients, React Query, offline, retry)
- **1 new rule**: `mobile-env-safety` (flags hardcoded production endpoints, missing EXPO_PUBLIC_ prefix, server-only secrets in client code)
- **3 new MCP tools**: `mobile_addPushNotifications`, `mobile_configureDeepLinks`, `mobile_resetDevEnvironment`
- Totals: 13 skills, 4 rules, 12 MCP tools

## [0.3.0] - 2026-04-03

### Added

- **3 new skills**: `mobile-camera-integration` (expo-camera, photo capture, barcode scanning), `mobile-ai-features` (AI API integration with backend proxy patterns), `mobile-permissions` (cross-platform permission handling)
- **1 new rule**: `mobile-image-assets` (flags oversized images, unoptimized formats, missing density variants)
- **3 new MCP tools**: `mobile_addPermission`, `mobile_integrateAI`, `mobile_checkBuildHealth`
- Totals: 9 skills, 3 rules, 9 MCP tools

## [0.2.0] - 2026-04-03

### Added

- **3 new skills**: `mobile-navigation-setup` (Expo Router patterns), `mobile-state-management` (Zustand, Jotai, React Query), `mobile-component-patterns` (reusable component architecture)
- **1 new rule**: `mobile-platform-check` (flags platform-specific APIs without Platform.OS guards)
- **3 new MCP tools**: `mobile_generateScreen`, `mobile_generateComponent`, `mobile_installDependency`
- Cursor release process rule at `.cursor/rules/release-process.mdc`
- Totals: 6 skills, 2 rules, 6 MCP tools

## [0.1.0] - 2026-04-03

### Added

- Plugin scaffold with `.cursor-plugin/plugin.json` manifest
- **3 skills**: `mobile-project-setup`, `mobile-dev-environment`, `mobile-run-on-device`
- **1 rule**: `mobile-secrets` (always-on credential detection)
- **3 MCP tools**: `mobile_checkDevEnvironment`, `mobile_scaffoldProject`, `mobile_runOnDevice`
- NPM package stub (`@tmhs/mobile-dev-tools`) to reserve the name
- CI workflows for pytest validation and MCP server build
- Plugin structure validation (skill frontmatter, rule frontmatter, version consistency)
- `CLAUDE.md` for Claude Code compatibility
- `ROADMAP.md` with full version plan (extended through v2.0.0)

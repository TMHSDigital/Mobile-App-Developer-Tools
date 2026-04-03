# Changelog

All notable changes to this project will be documented in this file.

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
- `ROADMAP.md` with full version plan through v1.0.0

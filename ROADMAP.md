# Roadmap

## Release Plan

| Version | Theme | Skills | Rules | MCP Tools | Highlights |
|---------|-------|--------|-------|-----------|------------|
| **v0.1.0** | Zero to Phone | 3 | 1 | 3 | Project scaffolding, env check, run-on-device, secrets rule |
| **v0.2.0** | Navigate & State | +3 | +1 | +3 | Navigation setup, state management, component generation, platform-check rule |
| **v0.3.0** | Camera & AI | +3 | +1 | +3 | Camera integration, AI features, permissions skill, image-assets rule |
| **v0.4.0** | Users & Data | +4 | +1 | +3 | Auth, push notifications, local storage, API integration, env-safety rule |
| **v0.5.0** | Flutter | +4 | +1 | +0 | Flutter project setup, navigation, run-on-device, state management, performance rule |
| **v0.6.0** | Ship It | +3 | +1 | +3 | App store prep, iOS submission, Android submission, accessibility rule |
| **v0.7.0** | Grow & Measure | +4 | +1 | +4 | Monetization, deep links, analytics/crash reporting, OTA updates, bundle analysis |
| **v0.8.0** | Test & Automate | +3 | +1 | +3 | Unit/E2E testing, CI/CD pipelines, test file generation |
| **v0.9.0** | Rich Features | +5 | +1 | +4 | Animations, maps/location, i18n, forms/validation, real-time/WebSockets |
| **v0.10.0** | Harden | +5 | +1 | +4 | Security, offline-sync, background tasks, debugging, production APM **(current)** |
| **v0.11.0** | Design & Adapt | +3 | +1 | +3 | Theming/dark mode, feature flags/remote config, accessibility testing automation |
| **v0.12.0** | Extend & Evolve | +3 | +1 | +3 | Native module authoring, config plugins, SDK upgrade migration |
| **v1.0.0** | Stable | +0 | +0 | +0 | Polish, docs, production release: 43 skills, 12 rules, 36 MCP tools |

## v0.1.0 - Zero to Phone

**Skills:**
- `mobile-project-setup` - Guided Expo project creation with opinionated defaults
- `mobile-dev-environment` - Cross-platform dependency detection and setup
- `mobile-run-on-device` - Physical device deployment via Expo Go and dev builds

**Rules:**
- `mobile-secrets` - Flag hardcoded API keys, signing credentials, tokens

**MCP Tools:**
- `mobile_checkDevEnvironment` - Detect installed tools and report gaps
- `mobile_scaffoldProject` - Generate a new Expo project from templates
- `mobile_runOnDevice` - Start dev server and connect to a device

## v0.2.0 - Navigate & State

**Skills:**
- `mobile-navigation-setup` (Expo) - Expo Router file-based navigation patterns
- `mobile-state-management` (Shared) - Zustand/Jotai for React Native, Riverpod/Bloc for Flutter
- `mobile-component-patterns` (Shared) - Reusable component architecture

**Rules:**
- `mobile-platform-check` - Platform-specific code without proper `Platform.OS` checks

**MCP Tools:**
- `mobile_generateScreen` - Create a new screen with navigation wiring
- `mobile_generateComponent` - Create a component with props, styles, tests
- `mobile_installDependency` - Add and configure a library with linking and pod install

## v0.3.0 - Camera & AI

**Skills:**
- `mobile-camera-integration` (Expo) - expo-camera setup, permissions, photo capture
- `mobile-ai-features` (Shared) - AI API integration (vision, text, audio)
- `mobile-permissions` (Shared) - Permission request patterns and rationale strings

**Rules:**
- `mobile-image-assets` - Oversized images that bloat the app bundle

**MCP Tools:**
- `mobile_addPermission` - Add platform permissions with rationale strings
- `mobile_integrateAI` - Add AI API integration with error handling
- `mobile_checkBuildHealth` - Verify the project builds cleanly

## v0.4.0 - Users & Data

**Skills:**
- `mobile-auth-setup` (Shared) - Auth patterns with Supabase, Firebase, Clerk
- `mobile-push-notifications` (Expo) - expo-notifications and EAS push service
- `mobile-local-storage` (Shared) - AsyncStorage, SQLite, encrypted storage
- `mobile-api-integration` (Shared) - REST/GraphQL clients, caching, offline-first

**Rules:**
- `mobile-env-safety` - Production endpoints in development builds

**MCP Tools:**
- `mobile_addPushNotifications` - Wire up push notification service
- `mobile_configureDeepLinks` - Set up universal links and app links
- `mobile_resetDevEnvironment` - Clear caches, reinstall pods, reset Metro/Gradle

## v0.5.0 - Flutter

**Skills:**
- `mobile-project-setup` (Flutter) - Guided `flutter create` with recommended structure
- `mobile-navigation-setup` (Flutter) - GoRouter or Navigator 2.0 patterns
- `mobile-run-on-device` (Flutter) - USB debugging and wireless deploy
- `mobile-state-management` (Flutter) - Riverpod and Bloc patterns

**Rules:**
- `mobile-performance` - Common performance anti-patterns (inline styles, missing keys, heavy re-renders)

## v0.6.0 - Ship It

**Skills:**
- `mobile-app-store-prep` (Shared) - Screenshots, descriptions, metadata, review guidelines
- `mobile-ios-submission` (Expo) - EAS Submit, certificates, provisioning profiles
- `mobile-android-submission` (Expo) - EAS Submit, signing keys, Play Console

**Rules:**
- `mobile-accessibility` - Missing accessibility labels, small touch targets

**MCP Tools:**
- `mobile_buildForStore` - Create production build
- `mobile_validateStoreMetadata` - Check store listing fields
- `mobile_submitToAppStore` - Trigger iOS submission

## v0.7.0 - Grow & Measure

**Skills:**
- `mobile-monetization` (Shared) - In-app purchases, subscriptions, RevenueCat, StoreKit 2
- `mobile-deep-links` (Shared) - Universal links, app links, deferred deep links, attribution
- `mobile-analytics` (Shared) - Crash reporting and event tracking with Sentry, Firebase Crashlytics, PostHog
- `mobile-ota-updates` (Shared) - EAS Update for Expo, Shorebird for Flutter, rollback strategies

**Rules:**
- `mobile-bundle-size` - Large dependencies, unused imports, unoptimized assets, tree shaking issues

**MCP Tools:**
- `mobile_submitToPlayStore` - Trigger Android submission via EAS Submit
- `mobile_generateScreenshots` - Capture screenshots at store-required dimensions
- `mobile_analyzeBundle` - Report app binary size, flag bloated dependencies
- `mobile_configureOTA` - Set up over-the-air update channels and deployment targets

## v0.8.0 - Test & Automate

**Skills:**
- `mobile-testing` (Shared) - Unit and integration testing with Jest, React Native Testing Library, flutter_test, snapshot testing
- `mobile-e2e-testing` (Shared) - End-to-end testing with Detox, Maestro, Patrol; device farm setup
- `mobile-ci-cd` (Shared) - GitHub Actions workflows, EAS Build pipelines, build caching, code signing in CI

**Rules:**
- `mobile-test-coverage` - Untested screens, missing test files, low coverage thresholds

**MCP Tools:**
- `mobile_runTests` - Execute test suite and report pass/fail summary
- `mobile_setupCI` - Generate GitHub Actions workflow for build, test, deploy
- `mobile_generateTestFile` - Scaffold a test file for an existing component or screen

## v0.9.0 - Rich Features

**Skills:**
- `mobile-animations` (Shared) - Reanimated, Lottie, Rive for React Native; implicit and explicit animations for Flutter
- `mobile-maps-location` (Shared) - MapView, geolocation, geofencing, background location tracking
- `mobile-i18n` (Shared) - Internationalization, RTL layout, locale detection, pluralization, react-intl and intl packages
- `mobile-forms-validation` (Shared) - Form patterns, validation schemas, keyboard avoidance, multi-step forms
- `mobile-real-time` (Shared) - WebSockets, Supabase Realtime, Socket.IO, server-sent events, reconnection patterns

**Rules:**
- `mobile-i18n-strings` - Hardcoded user-facing strings not going through i18n translation layer

**MCP Tools:**
- `mobile_setupI18n` - Initialize i18n config with locale files and extraction pipeline
- `mobile_addMap` - Add map view with provider config, permissions, and marker support
- `mobile_generateForm` - Scaffold a validated form with typed fields and error handling
- `mobile_setupRealtime` - Add WebSocket or Supabase Realtime client with reconnection and typed events

## v0.10.0 - Harden (current)

**Skills:**
- `mobile-security` (Shared) - SSL pinning, code obfuscation, jailbreak/root detection, certificate transparency
- `mobile-offline-sync` (Shared) - Offline-first architecture, background sync, conflict resolution, operation queuing
- `mobile-background-tasks` (Shared) - Background fetch, WorkManager (Android), BGTaskScheduler (iOS), headless JS
- `mobile-debugging` (Shared) - Flipper, React DevTools, Flutter DevTools, memory leak detection, network inspection
- `mobile-app-monitoring` (Shared) - Production APM with Sentry Performance, Datadog, Instabug; OpenTelemetry spans, app launch tracking, Apdex scoring

**Rules:**
- `mobile-security-audit` - Insecure storage, missing SSL pinning, debug flags in release builds, cleartext traffic

**MCP Tools:**
- `mobile_securityAudit` - Scan project for common mobile security anti-patterns
- `mobile_profilePerformance` - Run performance profiling and flag jank, slow renders, memory issues
- `mobile_checkOfflineReady` - Validate offline-first setup: cached queries, queued mutations, sync status
- `mobile_setupMonitoring` - Wire up APM SDK with dashboards, alerts, and release tracking

## v0.11.0 - Design & Adapt

**Skills:**
- `mobile-theming` (Shared) - Design tokens, dark mode, system appearance, NativeWind for RN, Material 3 and ThemeKit for Flutter, persistent theme preference
- `mobile-feature-flags` (Shared) - Feature toggles with PostHog, LaunchDarkly, Firebase Remote Config; A/B testing, staged rollouts, kill switches
- `mobile-accessibility-testing` (Shared) - Automated a11y audits with axe DevTools, WCAG compliance mapping, CI pipeline integration, screen reader testing

**Rules:**
- `mobile-color-contrast` - Insufficient color contrast ratios, missing dark mode variants, non-semantic color usage

**MCP Tools:**
- `mobile_setupTheming` - Initialize design token system with light/dark themes and persistence
- `mobile_auditAccessibility` - Run automated accessibility scan and report WCAG violations
- `mobile_setupFeatureFlags` - Add feature flag provider with typed flags, defaults, and remote sync

## v0.12.0 - Extend & Evolve

**Skills:**
- `mobile-native-modules` (Shared) - Expo Modules API (Swift/Kotlin), Turbo Modules, JSI bridging, native view components
- `mobile-config-plugins` (Expo) - Config plugin authoring, CNG patterns, modifier previews, Xcode and Gradle automation
- `mobile-sdk-upgrade` (Shared) - SDK version migration, dependency audit, breaking change detection, rollback strategy, expo-doctor integration

**Rules:**
- `mobile-native-compat` - Deprecated native APIs, New Architecture incompatibility, missing JSI support in dependencies

**MCP Tools:**
- `mobile_createNativeModule` - Scaffold an Expo Module or Turbo Module with Swift/Kotlin stubs and TypeScript bindings
- `mobile_upgradeSDK` - Run guided SDK upgrade with dependency fixes, config migration, and compatibility checks
- `mobile_checkNativeCompat` - Audit installed packages for New Architecture support and flag bridge-only dependencies

## v1.0.0 - Stable

Production release. All skills polished, all MCP tools tested, documentation complete.

**Final counts:** 43 skills, 12 rules, 36 MCP tools.

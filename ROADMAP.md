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
| **v0.10.0** | Harden | +5 | +1 | +4 | Security, offline-sync, background tasks, debugging, production APM |
| **v0.11.0** | Design & Adapt | +3 | +1 | +3 | Theming/dark mode, feature flags/remote config, accessibility testing automation |
| **v0.12.0** | Extend & Evolve | +3 | +1 | +3 | Native module authoring, config plugins, SDK upgrade migration |
| **v1.0.0** | Stable | +0 | +0 | +0 | Polish, docs, production release: 43 skills, 12 rules, 36 MCP tools **(current)** |
| **v1.1.0** | Polish & Platform | +5 | +1 | +3 | Media handling, social sharing, biometrics, haptics, app lifecycle; privacy-compliance rule |
| **v1.2.0** | Data & Payments | +5 | +1 | +4 | Payments/checkout, data visualization, widgets/shortcuts, error boundaries, network awareness |
| **v1.3.0** | Engage & Comply | +5 | +1 | +3 | Onboarding, advanced notifications, privacy compliance, file management, multi-environment |
| **v1.4.0** | Connect & Input | +4 | +1 | +3 | WebView/hybrid, keyboard/input, audio playback, contacts/calendar; input-validation rule |
| **v1.5.0** | Specialize | +3 | +1 | +3 | Bluetooth/IoT, data model generation, EAS Workflows; deprecated-api rule |
| **v2.0.0** | Complete | +0 | +0 | +0 | Polish, docs, production release: 65 skills, 17 rules, 52 MCP tools |

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

## v0.10.0 - Harden

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

---

# Post-1.0 Roadmap

Based on gap analysis against the full mobile development landscape and competitor tooling.

## v1.1.0 - Polish & Platform

**Skills:**
- `mobile-media-handling` (Shared) - Image/video picker from gallery, compression, thumbnails, resumable file uploads, expo-image-picker, image_picker (Flutter)
- `mobile-social-sharing` (Shared) - Native share sheet, share extensions (iOS), share targets (Android), social login (Apple, Google), expo-sharing, share_plus
- `mobile-biometrics` (Shared) - Face ID, Touch ID, fingerprint, expo-local-authentication, local_auth (Flutter), biometric-gated storage, passcode fallback
- `mobile-haptics` (Shared) - Haptic feedback patterns (impact, notification, selection), expo-haptics, HapticFeedback (Flutter), vibration, UX guidelines
- `mobile-app-lifecycle` (Shared) - App state transitions (foreground/background/inactive), splash config, versioning strategy, force-update prompts, in-app review API, minimum OS targeting

**Rules:**
- `mobile-privacy-compliance` - Missing ATT prompt, absent privacy manifest, user data collected without consent declaration, tracking without consent

**MCP Tools:**
- `mobile_setupBiometrics` - Add biometric authentication with fallback to passcode and secure storage gating
- `mobile_addShareSheet` - Configure native share sheet with content types and social login providers
- `mobile_setupMediaPicker` - Add image/video picker with compression, cropping, and upload helpers

## v1.2.0 - Data & Payments

**Skills:**
- `mobile-payments-checkout` (Shared) - Stripe mobile SDK, Apple Pay, Google Pay, payment sheets, one-time payments, PCI compliance, checkout flows
- `mobile-data-visualization` (Shared) - Charts (line, bar, pie, area), victory-native, fl_chart, react-native-skia, sparklines, dashboard patterns
- `mobile-widgets-shortcuts` (Shared) - iOS WidgetKit, Android Glance/AppWidget, Quick Actions (3D Touch), App Clips (iOS), Instant Apps (Android), Siri Shortcuts
- `mobile-error-boundaries` (Shared) - Global error boundaries, ErrorWidget.builder (Flutter), crash recovery UI, retry patterns, fallback screens, graceful degradation
- `mobile-network-awareness` (Shared) - Online/offline UI indicators, bandwidth detection, adaptive quality, timeout strategies, retry with exponential backoff, airplane mode handling

**Rules:**
- `mobile-error-handling` - Unhandled promise rejections, missing error boundaries around async operations, catch blocks that swallow errors silently

**MCP Tools:**
- `mobile_setupPayments` - Configure Stripe SDK with Apple Pay/Google Pay and generate a checkout flow
- `mobile_addChart` - Scaffold a chart component with typed data series and theming
- `mobile_setupWidget` - Generate iOS WidgetKit or Android Glance widget with shared data bridge
- `mobile_addErrorBoundary` - Wrap app sections with error boundaries, fallback UI, and recovery actions

## v1.3.0 - Engage & Comply

**Skills:**
- `mobile-onboarding` (Shared) - Walkthrough/intro screens, progressive disclosure, permission priming (pre-permission dialogs), feature tooltips, first-run experience, skip/defer patterns
- `mobile-notifications-advanced` (Shared) - Scheduled/recurring local notifications, notification actions, badge management, grouping, Do Not Disturb awareness, in-app notification center
- `mobile-privacy-compliance` (Shared) - GDPR consent banners, App Tracking Transparency (ATT), Privacy Manifests (iOS), CCPA, COPPA, data deletion requests, consent management platforms
- `mobile-file-management` (Shared) - File system access, document picker, PDF viewing, file downloads, expo-file-system, expo-document-picker, path_provider, file caching strategies
- `mobile-multi-environment` (Shared) - Dev/staging/prod environment management, EAS profiles, build variants (Android flavors, iOS schemes), .env per environment, API base URL switching

**Rules:**
- `mobile-data-retention` - User data stored without expiration, missing data deletion endpoints, PII in logs, analytics events with identifiable data

**MCP Tools:**
- `mobile_setupOnboarding` - Generate walkthrough screens with permission priming and skip logic
- `mobile_setupEnvironments` - Configure multi-environment setup with EAS profiles and typed env config
- `mobile_validatePrivacy` - Audit project for privacy compliance: ATT, Privacy Manifests, consent flows

## v1.4.0 - Connect & Input

**Skills:**
- `mobile-webview-hybrid` (Shared) - WebView integration, JS bridge communication, cookie/session sharing, embedded browsers, OAuth in WebView, react-native-webview, webview_flutter
- `mobile-keyboard-input` (Shared) - Custom keyboard accessories, input accessory views, keyboard-aware scroll, OTP auto-fill, autofill (password, address), input masking, numeric/email keyboard types
- `mobile-audio-playback` (Shared) - Background audio, audio session management (iOS), audio focus (Android), lock screen/control center controls, expo-av advanced, just_audio (Flutter), text-to-speech
- `mobile-contacts-calendar` (Shared) - Contacts API, calendar integration, expo-contacts, expo-calendar, event creation, contact picker, reminder sync

**Rules:**
- `mobile-input-validation` - User input rendered without sanitization, missing keyboard type for data format, text fields without maxLength on free-form input

**MCP Tools:**
- `mobile_addWebView` - Configure WebView with JS bridge, cookie sharing, and navigation controls
- `mobile_setupAudio` - Add audio playback with background mode, media controls, and session management
- `mobile_addContactsPicker` - Wire up contacts/calendar access with permission handling and picker UI

## v1.5.0 - Specialize

**Skills:**
- `mobile-bluetooth-iot` (Shared) - BLE scanning/connecting, react-native-ble-plx, flutter_blue_plus, peripheral communication, NFC, IoT device management, health device protocols
- `mobile-data-models` (Shared) - JSON-to-typed model generation, data class patterns, serialization (TypeScript interfaces, Dart freezed/json_serializable), schema-first development
- `mobile-eas-workflows` (Expo) - EAS Workflows YAML authoring, pre-packaged jobs (build, submit, update, maestro), fingerprint-based skip logic, Slack notifications, workflow monitoring

**Rules:**
- `mobile-deprecated-api` - Usage of deprecated Expo SDK APIs, removed React Native APIs, sunset Flutter packages, APIs with known replacements

**MCP Tools:**
- `mobile_setupBluetooth` - Configure BLE scanning and connection with permission handling and device discovery
- `mobile_generateModel` - Generate typed data models from JSON schema or sample data with serialization
- `mobile_setupEASWorkflow` - Generate .eas/workflows/*.yml with build, test, and deploy jobs

## v2.0.0 - Complete

Full-coverage production release. All skills polished, all MCP tools tested, documentation complete.

**Final counts:** 65 skills, 17 rules, 52 MCP tools.

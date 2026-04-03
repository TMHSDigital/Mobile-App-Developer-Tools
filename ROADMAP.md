# Roadmap

## Release Plan

| Version | Theme | Skills | Rules | MCP Tools | Highlights |
|---------|-------|--------|-------|-----------|------------|
| **v0.1.0** | Zero to Phone | 3 | 1 | 3 | Project scaffolding, env check, run-on-device, secrets rule |
| **v0.2.0** | Navigate & State | +3 | +1 | +3 | Navigation setup, state management, component generation, platform-check rule |
| **v0.3.0** | Camera & AI | +3 | +1 | +3 | Camera integration, AI features, permissions skill, image-assets rule **(current)** |
| **v0.4.0** | Users & Data | +4 | +1 | +3 | Auth, push notifications, local storage, API integration, env-safety rule |
| **v0.5.0** | Flutter | +4 | +1 | +0 | Flutter project setup, navigation, run-on-device, state management, performance rule |
| **v0.6.0** | Ship It | +3 | +1 | +3 | App store prep, iOS submission, Android submission, accessibility rule |
| **v0.7.0** | Grow | +2 | +0 | +3 | Monetization, deep links, build-for-store, screenshots, bundle analysis |
| **v1.0.0** | Stable | +0 | +0 | +0 | Polish, docs, production release: 22 skills, 7 rules, 18 MCP tools |

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

## v0.3.0 - Camera & AI (current)

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

## v0.7.0 - Grow

**Skills:**
- `mobile-monetization` (Shared) - In-app purchases, subscriptions, RevenueCat
- `mobile-deep-links` (Shared) - Universal links, app links, deferred deep links

**MCP Tools:**
- `mobile_submitToPlayStore` - Trigger Android submission
- `mobile_generateScreenshots` - Capture screenshots at store dimensions
- `mobile_analyzeBundle` - Check app size and identify bloat

## v1.0.0 - Stable

Production release. All skills polished, all MCP tools tested, documentation complete.

**Final counts:** 22 skills, 7 rules, 18 MCP tools.

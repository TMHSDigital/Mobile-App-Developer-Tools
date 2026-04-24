---
name: mobile-sdk-upgrade
description: SDK version migration, dependency audit, breaking change detection, and rollback strategy for Expo and Flutter
standards-version: 1.6.3
---

# Mobile SDK Upgrade

## Trigger

Use this skill when the developer asks about:
- Upgrading Expo SDK version
- Upgrading Flutter version
- Migration guides for SDK version bumps
- Dependency compatibility after upgrades
- Breaking changes between SDK versions
- expo-doctor or flutter doctor issues
- Rollback strategy after a failed upgrade
- React Native version bumps (via Expo SDK)

## Required Inputs

| Input | Description |
| --- | --- |
| Framework | `expo` (React Native) or `flutter` |
| Current version | Current SDK version (auto-detected if possible) |
| Target version | Desired SDK version (optional, defaults to latest) |

## Workflow

### 1. Generate Upgrade Plan

Run `mobile_upgradeSDK` to get a structured upgrade plan:

```
Use MCP tool: mobile_upgradeSDK
  framework: "expo"
  target_version: "52"
```

This returns:
- Current and target versions
- Pre-upgrade checklist
- Step-by-step upgrade commands
- Known breaking changes
- Dependency actions needed
- Rollback strategy

### 2. Expo SDK Upgrade

#### Pre-Upgrade

```bash
# Check current health
npx expo-doctor

# Commit current state
git add -A && git commit -m "chore: pre-upgrade snapshot"

# Run tests
npm test
```

#### Upgrade

```bash
# Upgrade Expo SDK
npx expo install expo@latest --fix

# Fix all Expo package versions
npx expo install --fix

# Check for remaining issues
npx expo-doctor

# Clean prebuild
npx expo prebuild --clean

# Clear caches and start fresh
npx expo start --clear
```

#### Post-Upgrade Checks

```bash
# Check for deprecated APIs
npx expo-doctor

# Verify TypeScript compiles
npx tsc --noEmit

# Run tests
npm test

# Test on both platforms
npx expo run:ios
npx expo run:android
```

### 3. Flutter Upgrade

#### Pre-Upgrade

```bash
# Check current health
flutter doctor -v
flutter analyze

# Commit current state
git add -A && git commit -m "chore: pre-upgrade snapshot"

# Run tests
flutter test
```

#### Upgrade

```bash
# Upgrade Flutter SDK
flutter upgrade

# Update dependencies
flutter pub upgrade --major-versions
flutter pub get

# Auto-fix deprecations
dart fix --apply

# Clean and rebuild
flutter clean
flutter pub get
```

#### Post-Upgrade Checks

```bash
# Check for issues
flutter analyze
flutter doctor -v

# Run tests
flutter test

# Test on both platforms
flutter run -d ios
flutter run -d android
```

### 4. Dependency Compatibility Audit

Run `mobile_checkNativeCompat` to find incompatible packages:

```
Use MCP tool: mobile_checkNativeCompat
  framework: "expo"
```

This flags:
- Bridge-only packages that don't support New Architecture
- Deprecated packages with modern replacements
- Packages with known version constraints

### 5. Common Breaking Changes by SDK

#### Expo SDK Upgrades (General)

| Change | Impact |
| --- | --- |
| React Native version bump | API changes, removed deprecated APIs |
| Expo Router major version | Route API changes, new conventions |
| Metro bundler updates | Config changes, resolver updates |
| New Architecture default | Some packages may not work |
| Minimum iOS/Android version | Drops support for older devices |

#### Flutter Upgrades (General)

| Change | Impact |
| --- | --- |
| Material 3 default | Theme appearance changes |
| Dart language version | New syntax, removed deprecated APIs |
| Gradle/AGP version | Android build changes |
| CocoaPods/Xcode version | iOS build requirements |
| Plugin API changes | Platform channel updates |

### 6. Rollback Strategy

#### If Upgrade Fails

```bash
# Expo
git checkout -- .
npm install
npx expo prebuild --clean

# Flutter
git checkout -- .
flutter pub get
flutter clean
```

#### Partial Rollback (Keep Some Changes)

```bash
# Restore specific files
git checkout HEAD -- package.json package-lock.json
npm install

# Or use stash
git stash
# ... fix issues ...
git stash pop
```

## Example Interaction

**User:** "I need to upgrade my Expo app from SDK 50 to SDK 52"

**Assistant:**
1. Runs `mobile_upgradeSDK` to generate the full upgrade plan
2. Lists breaking changes between SDK 50 and 52 (React Native bump, Expo Router changes)
3. Runs `mobile_checkNativeCompat` to flag packages needing updates
4. Guides through the upgrade commands step by step
5. Runs `mobile_checkBuildHealth` to verify the project builds after upgrade
6. Suggests running tests and testing on both platforms before committing

## Key References

| Resource | URL |
| --- | --- |
| Expo SDK Upgrade | https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/ |
| Expo Changelog | https://expo.dev/changelog |
| expo-doctor | https://www.npmjs.com/package/expo-doctor |
| Flutter Upgrade Guide | https://docs.flutter.dev/release/upgrade |
| Flutter Release Notes | https://docs.flutter.dev/release/release-notes |
| dart fix | https://dart.dev/tools/dart-fix |

## MCP Usage

| Tool | When |
| --- | --- |
| `mobile_upgradeSDK` | Generate the full upgrade plan with steps and rollback |
| `mobile_checkNativeCompat` | Audit packages for compatibility with target SDK |
| `mobile_checkBuildHealth` | Verify project health after upgrading |
| `mobile_runTests` | Run test suite to catch regressions |

## Common Pitfalls

- **Skipping pre-upgrade commit**  - always create a restore point before upgrading.
- **Upgrading multiple major versions at once**  - upgrade one major version at a time.
- **Ignoring expo-doctor warnings**  - fix all warnings before proceeding; they become errors later.
- **Not clearing caches**  - stale Metro/Gradle/CocoaPods caches cause mysterious build failures.
- **Forgetting native rebuild**  - after SDK upgrade, always run `npx expo prebuild --clean`.
- **Testing one platform only**  - upgrades can break iOS and Android differently; test both.
- **Not checking CI**  - update CI workflow to use the new SDK version and compatible Node/Xcode/Java.

## See Also

- `mobile-native-modules`  - ensure custom modules remain compatible after upgrades
- `mobile-ci-cd`  - update CI configuration for new SDK requirements
- `mobile-debugging`  - debug build failures after SDK upgrades

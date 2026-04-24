---
name: mobile-ota-updates
description: Deploy over-the-air JavaScript updates to a React Native/Expo app using EAS Update. Covers channels, runtime versions, staged rollouts, rollback, bandwidth management, and testing published updates. For Flutter, covers Shorebird. Use when the user wants to push fixes without a full app store release.
standards-version: 1.6.3
---

# Mobile OTA Updates

## Trigger

Use this skill when the user:

- Wants to push bug fixes or content changes without a store release
- Asks about EAS Update, CodePush, or Shorebird
- Needs staged rollouts or rollback for updates
- Wants to manage multiple update channels (production, staging, preview)
- Mentions "OTA", "over-the-air", "eas update", "hot update", "code push", or "shorebird"

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Channel strategy**: single channel or multi-channel (production, staging)
- **Runtime version policy**: appVersion, nativeVersion, or fingerprint (Expo)

## Workflow

1. **Understand what OTA can and cannot update.**

   | Can update (JS/assets) | Cannot update (requires new binary) |
   |---|---|
   | Bug fixes in TypeScript/JavaScript | New native modules (e.g. adding expo-camera) |
   | UI changes, styling | app.json config plugin changes |
   | Business logic | Expo SDK version upgrades |
   | Images, fonts, JSON data | Android/iOS permission additions |
   | Navigation structure | Native code changes (Swift/Kotlin) |

   If the change touches native code, you must submit a new binary through the app stores.

2. **Configure EAS Update in app.json.** Use `mobile_configureOTA` to automate this:

   ```json
   {
     "expo": {
       "runtimeVersion": {
         "policy": "fingerprint"
       },
       "updates": {
         "url": "https://u.expo.dev/YOUR_PROJECT_ID",
         "enabled": true,
         "fallbackToCacheTimeout": 0,
         "checkAutomatically": "ON_LOAD"
       }
     }
   }
   ```

   Runtime version policies:
   - `fingerprint` (recommended): auto-generated hash of native config. Updates are only delivered to compatible binaries.
   - `appVersion`: uses `expo.version`. You manually control compatibility.
   - `nativeVersion`: uses `expo.ios.buildNumber` / `expo.android.versionCode`.

3. **Set up channels in eas.json.** Each build profile targets a channel:

   ```json
   {
     "build": {
       "production": {
         "channel": "production"
       },
       "preview": {
         "channel": "preview",
         "distribution": "internal"
       }
     }
   }
   ```

4. **Publish an update.** After making a JS-only change:

   ```bash
   eas update --channel production --message "Fix checkout crash on Android"
   ```

   For staged rollouts, limit the percentage of users who receive the update:

   ```bash
   eas update --channel production --message "New onboarding flow" --rollout-percentage 10
   ```

   Increase the rollout after monitoring:

   ```bash
   eas update:rollout --channel production --percentage 50
   eas update:rollout --channel production --percentage 100
   ```

5. **Roll back a bad update.** If an update causes issues, republish the previous known-good bundle:

   ```bash
   # List recent updates
   eas update:list --channel production

   # Rollback to the previous update
   eas update:rollback --channel production
   ```

   The rollback takes effect on the next app launch (users must close and reopen).

6. **Test updates before production.** Publish to a preview channel first:

   ```bash
   eas update --channel preview --message "Testing new feature"
   ```

   Open the update in a development build using Expo Orbit or by scanning the QR code from the EAS dashboard. Force-close and reopen the app twice to ensure the update loads.

7. **Monitor update adoption.** In the EAS dashboard, check:

   - How many users are on the latest update
   - Error rates per update (combine with Sentry release tracking)
   - Bandwidth consumption (users download the full JS bundle on each update)

8. **Flutter: Shorebird (alternative).** For Flutter apps, Shorebird provides OTA updates:

   ```bash
   # Install Shorebird CLI
   curl --proto '=https' --tlsv1.2 https://raw.githubusercontent.com/shorebirdtech/install/main/install.sh -sSf | bash

   # Initialize in your Flutter project
   shorebird init

   # Create a release build
   shorebird release android
   shorebird release ios

   # Push a patch (OTA update)
   shorebird patch android
   shorebird patch ios
   ```

   Shorebird patches Dart code at the AOT level, not JavaScript. Limitations are similar: no native code changes, no new plugins.

## Key References

- [EAS Update: Getting started](https://docs.expo.dev/eas-update/getting-started/)
- [EAS Update: Best practices](https://expo.dev/blog/eas-update-best-practices)
- [EAS Update: Rollouts](https://docs.expo.dev/eas-update/rollouts/)
- [EAS Update: Runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [Shorebird: Getting started](https://docs.shorebird.dev/)

## Example Interaction

**User:** "I found a crash in production and need to push a fix without going through app review."

**Agent:**
1. Confirms the fix is JS-only (no native code changes)
2. Verifies EAS Update is configured with `mobile_configureOTA`
3. Walks through fixing the bug locally
4. Publishes to the preview channel for testing: `eas update --channel preview`
5. After testing, publishes to production at 10% rollout: `eas update --channel production --rollout-percentage 10`
6. Monitors crash rates via Sentry, then increases to 100%
7. Explains that users get the fix on next app launch without a store update

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Configure OTA | `mobile_configureOTA` | Set up EAS Update config in app.json with channels and runtime version |
| Check build health | `mobile_checkBuildHealth` | Verify app.json has valid update config |
| Build baseline | `mobile_buildForStore` | Create the initial binary that OTA updates will target |
| Analyze impact | `mobile_analyzeBundle` | Check bundle size before publishing (affects download bandwidth) |

## Common Pitfalls

1. **Pushing native changes via OTA** - If you added a new native module or changed a config plugin, the update will crash on incompatible binaries. The `fingerprint` runtime version policy prevents this automatically.
2. **Not testing updates** - Always publish to a preview channel first. A broken OTA update affects all users immediately (unlike store releases, which can take days to propagate).
3. **Ignoring bandwidth** - Each OTA update downloads the full JS bundle. For apps with frequent updates and large bundles, this adds up. Use `mobile_analyzeBundle` to minimize bundle size.
4. **Forgetting fallbackToCacheTimeout** - Setting this to `0` means the app loads the cached bundle immediately and downloads updates in the background. Setting it higher blocks launch until the update downloads, which hurts perceived performance.
5. **Runtime version mismatch** - If you change the runtime version policy mid-project, existing users may stop receiving updates. Stick with one policy.
6. **Rollback delay** - Rollbacks take effect on the next app launch. Users who have already loaded the bad update will keep it until they restart the app.
7. **EAS Update requires EAS Build** - Updates are tied to builds created with EAS Build. Locally built binaries (expo run:ios) do not receive EAS Updates.

## See Also

- [Mobile Analytics](../mobile-analytics/SKILL.md) - track crash rates per update release
- [Mobile iOS Submission](../mobile-ios-submission/SKILL.md) - when OTA is not enough and a store release is needed
- [Mobile Android Submission](../mobile-android-submission/SKILL.md) - Play Store releases for native changes

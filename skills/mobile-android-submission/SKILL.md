---
name: mobile-android-submission
description: Submit an Expo/React Native app to the Google Play Store. Covers Play Console setup, signing keys, AAB format, EAS Build and Submit, service accounts, content ratings, and staged rollouts. Use when the user wants to publish to Google Play.
standards-version: 1.9.0
---

# Google Play Store Submission

## Trigger

Use this skill when the user:

- Wants to submit their app to the Google Play Store
- Needs help with Android signing keys or Play App Signing
- Asks about Play Console, AAB format, or staged rollouts
- Gets a build or submission error for Android
- Mentions "play store", "android submit", "google play", "aab", "signing key", or "eas submit android"

## Required Inputs

- **Google Play Developer account**: enrolled ($25 one-time fee)
- **Project path**: where the Expo project lives
- **Package name**: e.g. `com.example.myapp` (set in `app.json`)

## Workflow

1. **Configure app.json for production.**

   ```json
   {
     "expo": {
       "name": "My App",
       "slug": "my-app",
       "version": "1.0.0",
       "icon": "./assets/icon.png",
       "android": {
         "package": "com.example.myapp",
         "versionCode": 1,
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#FFFFFF"
         },
         "permissions": []
       }
     }
   }
   ```

   Set `permissions` to an empty array to avoid requesting unnecessary permissions. Expo adds only what your code actually uses.

2. **Set up EAS Build.**

   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

   Configure `eas.json` for production:

   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "app-bundle"
         },
         "autoIncrement": true
       }
     }
   }
   ```

   `app-bundle` produces an AAB (Android App Bundle), which is required by Google Play since August 2021.

3. **Signing keys and Play App Signing.**

   EAS manages signing automatically. On first build:
   - EAS generates an upload key (used to sign uploads)
   - You opt into Play App Signing in Play Console (Google holds the app signing key)

   This is the recommended flow. If you need to use your own keystore:

   ```bash
   eas credentials
   ```

   Select Android > production > manage keystore. You can upload an existing `.jks` file.

   To export the upload key certificate for Play Console:

   ```bash
   eas credentials --platform android
   # Select "Download credentials" to get the keystore
   keytool -exportcert -alias <alias> -keystore <keystore.jks> | openssl sha1 -binary | openssl base64
   ```

4. **Build for Play Store.**

   ```bash
   eas build --platform android --profile production
   ```

   This produces an `.aab` file. Build typically takes 10-20 minutes.

5. **Create a Google Play Console listing.** Before the first submission:

   - Go to [play.google.com/console](https://play.google.com/console)
   - Create a new app (select app or game, free or paid)
   - Fill the **store listing**: app name, short description (80 chars), full description (4000 chars)
   - Upload **screenshots**: minimum 2 phone screenshots, optional tablet
   - Upload **feature graphic**: 1024 x 500 px (required)
   - Fill **content rating** questionnaire (IARC)
   - Set **target audience and content** (is it for children?)
   - Fill **data safety** section (what data the app collects)

6. **Submit to Play Store.**

   ```bash
   eas submit --platform android
   ```

   For automated submission, create a Google Cloud service account:

   1. Go to Google Cloud Console > IAM > Service Accounts
   2. Create a service account
   3. Grant "Service Account User" role
   4. Create a JSON key and download it
   5. In Play Console > Settings > API access > link the service account
   6. Grant the service account "Release manager" permission

   Then configure in `eas.json`:

   ```json
   {
     "submit": {
       "production": {
         "android": {
           "serviceAccountKeyPath": "./google-service-account.json",
           "track": "internal"
         }
       }
     }
   }
   ```

   **Do not commit the service account JSON.** Add it to `.gitignore`.

   Track options:
   - `internal` - up to 100 testers, no review required
   - `alpha` - closed testing
   - `beta` - open testing
   - `production` - public release

7. **Staged rollouts.** For production releases:

   ```json
   {
     "submit": {
       "production": {
         "android": {
           "track": "production",
           "rollout": 0.1
         }
       }
     }
   }
   ```

   Start with 10% rollout, monitor crash rates, then increase to 100%.

8. **Target API level.** Google Play requires targeting recent API levels:

   | Deadline | Minimum targetSdkVersion |
   |----------|-------------------------|
   | Aug 2025 | API 35 (Android 15) |
   | Aug 2026 | API 36 (Android 16) |

   Expo SDK handles this automatically. Check with:

   ```bash
   npx expo config --type public | grep -i sdk
   ```

## Key References

- [EAS Submit: Android](https://docs.expo.dev/submit/android/)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Play App Signing](https://developer.android.com/studio/publish/app-signing#app-signing-google-play)
- [Data Safety form](https://support.google.com/googleplay/android-developer/answer/10787469)

## Example Interaction

**User:** "I want to publish my Expo app on Google Play for the first time."

**Agent:**
1. Verifies `app.json` has `package`, `versionCode`, icon, and adaptive icon
2. Runs `mobile_validateStoreMetadata` for Android-specific checks
3. Builds with `eas build --platform android --profile production`
4. Guides user through Play Console: create app, fill listing, upload screenshots
5. Helps create a service account for automated submission
6. Submits to internal track first for testing
7. After testing, promotes to production with a 10% staged rollout

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Validate config | `mobile_validateStoreMetadata` | Check app.json has all required Android fields |
| Build | `mobile_buildForStore` | Trigger `eas build --platform android --profile production` |
| Check build | `mobile_checkBuildHealth` | Verify project compiles before EAS build |

## Common Pitfalls

1. **Not using AAB format** - Google Play requires AAB (not APK) for new apps. Set `buildType: "app-bundle"` in `eas.json`.
2. **Committing the service account key** - The JSON key grants full Play Console access. Add it to `.gitignore` immediately.
3. **versionCode not incrementing** - Play Console rejects uploads with a versionCode equal to or lower than the current published version. Use `autoIncrement: true`.
4. **Missing data safety section** - Google requires declaring all data the app collects. Incomplete declarations can result in app removal.
5. **Targeting an old API level** - Google rejects updates that do not target a recent API level. Use the latest Expo SDK to stay compliant.
6. **Feature graphic missing** - The 1024x500 feature graphic is required. Without it, you cannot publish.
7. **Content rating not completed** - The IARC questionnaire must be filled before the app can go live. It takes 5 minutes but is easy to forget.

## See Also

- [App Store Prep](../mobile-app-store-prep/SKILL.md) - prepare metadata and assets before submission
- [Mobile iOS Submission](../mobile-ios-submission/SKILL.md) - equivalent flow for Apple App Store
- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - auth patterns (relevant for data safety disclosure)

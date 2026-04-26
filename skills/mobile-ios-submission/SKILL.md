---
name: mobile-ios-submission
description: Submit an Expo/React Native app to the iOS App Store. Covers Apple Developer account, certificates, provisioning profiles, EAS Build and Submit, TestFlight, build versioning, and common rejection reasons. Use when the user wants to publish to the App Store.
standards-version: 1.9.0
---

# iOS App Store Submission

## Trigger

Use this skill when the user:

- Wants to submit their app to the iOS App Store
- Needs help with Apple certificates or provisioning profiles
- Asks about TestFlight, EAS Submit, or App Store Connect
- Gets a build or submission error for iOS
- Mentions "app store", "ios submit", "testflight", "eas submit", "apple review", or "provisioning profile"

## Required Inputs

- **Apple Developer account**: enrolled in Apple Developer Program ($99/year)
- **Project path**: where the Expo project lives
- **Bundle identifier**: e.g. `com.example.myapp` (set in `app.json`)

## Workflow

1. **Configure app.json for production.**

   ```json
   {
     "expo": {
       "name": "My App",
       "slug": "my-app",
       "version": "1.0.0",
       "icon": "./assets/icon.png",
       "splash": {
         "image": "./assets/splash.png",
         "resizeMode": "contain",
         "backgroundColor": "#ffffff"
       },
       "ios": {
         "bundleIdentifier": "com.example.myapp",
         "buildNumber": "1",
         "supportsTablet": false,
         "infoPlist": {
           "NSCameraUsageDescription": "This app uses the camera to...",
           "NSPhotoLibraryUsageDescription": "This app accesses photos to..."
         }
       }
     }
   }
   ```

   Every `NS*UsageDescription` string must clearly explain why the app needs that permission. Vague reasons cause rejections.

2. **Set up EAS Build.** Install and configure:

   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

   This creates `eas.json` with build profiles:

   ```json
   {
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal"
       },
       "production": {
         "autoIncrement": true
       }
     }
   }
   ```

   Set `"autoIncrement": true` on the production profile to auto-bump `buildNumber`.

3. **Certificates and provisioning profiles.** EAS handles this automatically:

   ```bash
   eas build --platform ios --profile production
   ```

   On first run, EAS will:
   - Create a distribution certificate (or reuse an existing one)
   - Create a provisioning profile for your bundle ID
   - Store credentials in Expo's secure servers

   To manage credentials manually:

   ```bash
   eas credentials
   ```

   To use your own certificates, configure in `eas.json`:

   ```json
   {
     "build": {
       "production": {
         "ios": {
           "credentialsSource": "local"
         }
       }
     }
   }
   ```

4. **Build for the App Store.**

   ```bash
   eas build --platform ios --profile production
   ```

   This produces an `.ipa` file uploaded to Expo's servers. The build typically takes 15-30 minutes.

   Monitor at: `https://expo.dev/accounts/<username>/projects/<slug>/builds`

5. **Submit to App Store Connect.**

   ```bash
   eas submit --platform ios
   ```

   EAS Submit will:
   - Upload the latest production build to App Store Connect
   - Prompt for Apple ID and app-specific password (or use ASC API key)

   For automated submissions, create an App Store Connect API key:

   ```bash
   eas submit --platform ios \
     --asc-app-id 1234567890 \
     --apple-id your@email.com
   ```

   Or configure in `eas.json`:

   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "your@email.com",
           "ascAppId": "1234567890",
           "appleTeamId": "ABCDE12345"
         }
       }
     }
   }
   ```

6. **TestFlight distribution.** After upload, the build appears in App Store Connect under TestFlight:
   - Add internal testers (up to 100, instant access)
   - Add external testers (up to 10,000, requires beta review)
   - Set "What to Test" notes for testers
   - External testing requires a privacy policy URL

7. **Submit for App Review.** In App Store Connect:
   - Select the build
   - Fill in "What's New in This Version"
   - Attach screenshots for each required device size
   - Provide demo credentials in "App Review Information" if the app requires login
   - Submit for review

   Review typically takes 24-48 hours. Expedited reviews are available for critical bug fixes.

8. **SDK and Xcode requirements.** Apple enforces minimum SDK versions:

   | Deadline | Requirement |
   |----------|-------------|
   | April 24, 2025 | iOS 18 SDK, Xcode 16 |
   | April 28, 2026 | iOS 26 SDK, Xcode 26 |

   Apps uploaded after the deadline must be built with the required Xcode version. Expo SDK 55+ with EAS Build handles this automatically.

9. **AI disclosure.** If the app uses AI features, Apple requires:
   - Clear explanation of what the AI does
   - Disclosure of what data the AI uses
   - User controls for AI behavior
   
   Add this information in the App Store Connect app description and in-app where AI features are used.

10. **Age rating.** Apple updated the age rating system in January 2026. Review and update responses in App Store Connect to avoid submission delays.

11. **Common rejection reasons and fixes.**

   | Rejection | Fix |
   |-----------|-----|
   | Guideline 2.1 - App crashes | Test on real devices; fix all crash paths |
   | Guideline 2.3 - Inaccurate metadata | Screenshots must show current UI |
   | Guideline 3.1.1 - In-App Purchase | Use IAP for digital content; no external payment links |
   | Guideline 4.0 - Design minimum | Must provide meaningful functionality beyond a website wrapper |
   | Guideline 5.1.1 - Data Collection | Disclose all data collected in privacy labels |
   | Guideline 5.1.2 - Data Use | App Tracking Transparency required if using IDFA |
   | Missing purpose string | Every permission must have a clear `NS*UsageDescription` |

## Key References

- [EAS Build docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit docs](https://docs.expo.dev/submit/ios/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)

## Example Interaction

**User:** "I want to submit my Expo app to the App Store for the first time."

**Agent:**
1. Verifies `app.json` has `bundleIdentifier`, `version`, `buildNumber`, icon, and splash
2. Runs `mobile_validateStoreMetadata` to check for missing fields
3. Runs `eas build --platform ios --profile production`
4. After build completes, runs `eas submit --platform ios`
5. Guides through App Store Connect: screenshots, description, keywords
6. Adds internal TestFlight testers for a smoke test before review
7. Submits for App Review with demo credentials

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Validate config | `mobile_validateStoreMetadata` | Check app.json has all required iOS fields |
| Build | `mobile_buildForStore` | Trigger `eas build --platform ios --profile production` |
| Submit | `mobile_submitToAppStore` | Trigger `eas submit --platform ios` |
| Check build | `mobile_checkBuildHealth` | Verify project compiles before EAS build |

## Common Pitfalls

1. **Not incrementing buildNumber** - App Store Connect rejects uploads with a buildNumber that has already been used. Set `autoIncrement: true` in `eas.json`.
2. **Missing NSUsageDescription strings** - Every permission the app requests must have a clear, specific purpose string. Apple rejects apps with vague or missing descriptions.
3. **Testing only on simulator** - Simulators do not test push notifications, camera, or performance accurately. Always test on a real device before submitting.
4. **Forgetting demo credentials** - If the app requires login, provide a working test account in the App Review Information section. Reviewers will not create their own account.
5. **Privacy nutrition labels mismatch** - The privacy labels in App Store Connect must match what the app actually collects. Third-party SDKs (analytics, crash reporting) often collect data you need to disclose.
6. **App Tracking Transparency** - If any SDK uses IDFA (even for attribution), you must show the ATT prompt. Missing this is an automatic rejection on iOS 14.5+.

## See Also

- [App Store Prep](../mobile-app-store-prep/SKILL.md) - prepare metadata and assets before submission
- [Mobile Android Submission](../mobile-android-submission/SKILL.md) - equivalent flow for Google Play
- [Mobile Permissions](../mobile-permissions/SKILL.md) - permission rationale strings required for review

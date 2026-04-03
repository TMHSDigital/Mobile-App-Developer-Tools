---
name: mobile-app-store-prep
description: Prepare a mobile app for App Store and Play Store submission. Covers app icons, screenshots, metadata, privacy policy, age ratings, and review guideline compliance. Use when the user is getting ready to publish their app.
---

# App Store Prep

## Trigger

Use this skill when the user:

- Wants to publish their app to the App Store or Play Store
- Asks about app store requirements, screenshots, or metadata
- Needs help with app icons, descriptions, or keywords
- Mentions "publish", "submit", "app store", "play store", "release", or "store listing"

## Required Inputs

- **Target stores**: App Store (iOS), Play Store (Android), or both
- **App name**: final display name (may differ from project name)
- **Current state**: has the app been submitted before, or is this the first release

## Workflow

1. **App icon requirements.**

   | Platform | Size | Format | Notes |
   |----------|------|--------|-------|
   | iOS | 1024x1024 px | PNG, no alpha | Single icon; iOS generates all sizes |
   | Android | 512x512 px | PNG, 32-bit | Used in Play Store listing |
   | Adaptive (Android) | 108x108 dp foreground + background | PNG | For launcher; configure in `app.json` |

   In Expo `app.json`:

   ```json
   {
     "expo": {
       "icon": "./assets/icon.png",
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#FFFFFF"
         }
       }
     }
   }
   ```

   Tips: no transparency on iOS (Apple rejects it), no text in the icon (does not scale), test on dark and light wallpapers.

2. **Screenshot requirements.**

   **iOS (App Store Connect):**

   | Device | Size (portrait) | Required |
   |--------|----------------|----------|
   | iPhone 6.7" (15 Pro Max) | 1290 x 2796 | Yes (at minimum one set) |
   | iPhone 6.5" (11 Pro Max) | 1242 x 2688 | Recommended |
   | iPhone 5.5" (8 Plus) | 1242 x 2208 | Only if supporting older devices |
   | iPad Pro 12.9" | 2048 x 2732 | Required if iPad app |

   Minimum 1 screenshot, maximum 10 per device size. First 3 are visible in search results.

   **Android (Play Console):**

   | Type | Size | Required |
   |------|------|----------|
   | Phone | 320-3840 px, 16:9 or 9:16 | Min 2, max 8 |
   | Tablet 7" | 320-3840 px | If targeting tablets |
   | Tablet 10" | 320-3840 px | If targeting tablets |
   | Feature graphic | 1024 x 500 | Required |

   Tips: use real device screenshots with a clean status bar, or design marketing frames. Tools: Fastlane `screengrab`/`snapshot`, or design in Figma with device frames.

3. **App metadata.**

   **iOS:**

   | Field | Limit | Notes |
   |-------|-------|-------|
   | App Name | 30 chars | Shown below icon; cannot include generic terms alone |
   | Subtitle | 30 chars | Appears below name in search |
   | Keywords | 100 chars | Comma-separated, not visible to users |
   | Description | 4000 chars | Not indexed for search; sell the app |
   | Promotional Text | 170 chars | Can update without new build |
   | What's New | 4000 chars | Release notes |

   **Android:**

   | Field | Limit | Notes |
   |-------|-------|-------|
   | App Name | 30 chars | Title in Play Store |
   | Short Description | 80 chars | Shown in listing header |
   | Full Description | 4000 chars | Indexed for search |

4. **Privacy policy.** Both stores require a publicly accessible privacy policy URL. Must cover:
   - What data is collected
   - How data is used
   - Third-party services (analytics, crash reporting, ads)
   - Data retention and deletion policy
   - Contact information

   Set in `app.json`:

   ```json
   {
     "expo": {
       "ios": {
         "privacyManifests": {
           "NSPrivacyAccessedAPITypes": []
         }
       }
     }
   }
   ```

   And provide the URL in App Store Connect / Play Console.

5. **Age rating / content rating.**
   - **iOS**: Fill the age rating questionnaire in App Store Connect (violence, language, etc.). Apple updated the age rating system in January 2026; review your responses.
   - **Android**: Complete the content rating questionnaire in Play Console (uses IARC system)

   Both are required before the first submission.

6. **Review guideline checklist.** Common rejection reasons:

   | Issue | Platform | How to avoid |
   |-------|----------|--------------|
   | Crashes on launch | Both | Test on real devices, not just simulators |
   | Placeholder content | Both | Remove "lorem ipsum" and test data |
   | Missing login credentials | iOS | Provide demo account in review notes |
   | No privacy policy | Both | Add URL before submitting |
   | Misleading metadata | Both | Screenshots must show actual app UI |
   | External payment links | iOS | Do not link to web payment outside IAP |
   | Missing App Tracking Transparency | iOS | Add ATT prompt if using IDFA |
   | Missing AI disclosure | iOS | If using AI, explain what it does and what data it uses |
   | Target API too low | Android | Must target latest or latest-1 API level (API 36 from Aug 2026) |

7. **Version numbering.**

   ```json
   {
     "expo": {
       "version": "1.0.0",
       "ios": {
         "buildNumber": "1"
       },
       "android": {
         "versionCode": 1
       }
     }
   }
   ```

   - `version` (semver): displayed to users in the store
   - `buildNumber` (iOS): must increment for each upload to App Store Connect
   - `versionCode` (Android): must increment for each upload to Play Console

## Key References

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [Expo: Deploying to app stores](https://docs.expo.dev/deploy/submit-to-app-stores/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

## Example Interaction

**User:** "I'm ready to publish my app. What do I need?"

**Agent:**
1. Runs `mobile_validateStoreMetadata` to check app.json for missing fields
2. Reviews icon size and format
3. Lists required screenshots per device
4. Checks for privacy policy URL
5. Walks through metadata fields (name, description, keywords)
6. Reminds about age rating questionnaire
7. Points to `mobile-ios-submission` or `mobile-android-submission` for the actual submission flow

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Validate metadata | `mobile_validateStoreMetadata` | Check all required store fields are present |
| Build for store | `mobile_buildForStore` | Create production build (EAS Build) |
| Check build health | `mobile_checkBuildHealth` | Verify project compiles before building |

## Common Pitfalls

1. **Icon with alpha channel on iOS** - Apple rejects icons with transparency. Export as PNG with a solid background.
2. **Screenshots from simulator with debug overlay** - Status bars with debug info, development banners, or Expo Go branding will get rejected.
3. **Forgetting buildNumber / versionCode increment** - Each upload must have a higher number than the previous. Build will be rejected otherwise.
4. **Generic app name** - Apple rejects names like "Calculator" or "Weather" that are too generic. Add a unique qualifier.
5. **Missing privacy manifest on iOS** - iOS 17+ requires declaring API usage reasons. Expo handles common ones, but custom native code needs manual entries.
6. **Screenshots not matching current UI** - Both stores reject screenshots that misrepresent the app. Update screenshots with every major UI change.

## See Also

- [Mobile iOS Submission](../mobile-ios-submission/SKILL.md) - submit to App Store after prep
- [Mobile Android Submission](../mobile-android-submission/SKILL.md) - submit to Play Store after prep
- [Mobile Permissions](../mobile-permissions/SKILL.md) - ATT and permission prompts required for review

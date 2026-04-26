---
name: mobile-deep-links
description: Set up universal links (iOS), app links (Android), URL schemes, and deferred deep links in a React Native/Expo or Flutter app. Covers AASA hosting, assetlinks.json, Expo Linking API, link-to-screen routing, and install attribution. Use when the user wants URLs to open specific screens in their app.
standards-version: 1.9.0
---

# Mobile Deep Links

## Trigger

Use this skill when the user:

- Wants URLs to open specific screens in their app
- Needs universal links (iOS) or app links (Android)
- Asks about URL schemes, deferred deep links, or install attribution
- Wants to share content links that open the app (or the store if not installed)
- Mentions "deep link", "universal link", "app link", "URL scheme", "expo-linking", or "branch.io"

## Required Inputs

- **Link type**: URL scheme only, universal/app links, or deferred deep links
- **Domain** (for universal/app links): the domain that will host the association files
- **Routes**: which URL paths map to which screens

## Workflow

1. **Understand the three link types.**

   | Type | Format | Opens app if installed | Fallback | Install attribution |
   |---|---|---|---|---|
   | URL scheme | `myapp://chat/123` | Yes | No (fails silently) | No |
   | Universal/app link | `https://example.com/chat/123` | Yes | Opens in browser | No |
   | Deferred deep link | `https://example.com/chat/123` | Yes | Store, then routes after install | Yes |

   URL schemes are simplest but least reliable. Universal/app links are recommended for production. Deferred deep links require a service like Branch or Expo's built-in linking.

2. **Configure URL scheme in app.json.** This is the baseline:

   ```json
   {
     "expo": {
       "scheme": "myapp"
     }
   }
   ```

   Use `mobile_configureDeepLinks` to automate this step.

3. **Set up universal links (iOS).** Create an Apple App Site Association (AASA) file and host it at `https://example.com/.well-known/apple-app-site-association`:

   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appIDs": ["TEAMID.com.example.myapp"],
           "components": [
             { "/": "/chat/*", "comment": "Chat screens" },
             { "/": "/profile/*", "comment": "Profile screens" }
           ]
         }
       ]
     }
   }
   ```

   Add associated domains in `app.json`:

   ```json
   {
     "expo": {
       "ios": {
         "associatedDomains": ["applinks:example.com"]
       }
     }
   }
   ```

4. **Set up app links (Android).** Create `assetlinks.json` and host it at `https://example.com/.well-known/assetlinks.json`:

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.example.myapp",
         "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
       }
     }
   ]
   ```

   Get your SHA256 fingerprint from the Play Console or with:

   ```bash
   keytool -list -v -keystore your-keystore.jks
   ```

   Add intent filters in `app.json`:

   ```json
   {
     "expo": {
       "android": {
         "intentFilters": [
           {
             "action": "VIEW",
             "autoVerify": true,
             "data": [
               { "scheme": "https", "host": "example.com", "pathPrefix": "/chat" },
               { "scheme": "https", "host": "example.com", "pathPrefix": "/profile" }
             ],
             "category": ["BROWSABLE", "DEFAULT"]
           }
         ]
       }
     }
   }
   ```

5. **Handle incoming links in your app.** Use Expo Linking API:

   ```tsx
   import { useEffect } from "react";
   import * as Linking from "expo-linking";
   import { useRouter } from "expo-router";

   export function useDeepLinkHandler() {
     const router = useRouter();

     useEffect(() => {
       const handleUrl = (event: { url: string }) => {
         const parsed = Linking.parse(event.url);
         if (parsed.path) {
           router.push(parsed.path as any);
         }
       };

       const subscription = Linking.addEventListener("url", handleUrl);

       Linking.getInitialURL().then((url) => {
         if (url) handleUrl({ url });
       });

       return () => subscription.remove();
     }, []);
   }
   ```

   With Expo Router, file-based routing handles most deep links automatically if your URL paths match your file structure.

6. **Test deep links.** During development:

   ```bash
   # URL scheme (iOS Simulator)
   xcrun simctl openurl booted "myapp://chat/123"

   # URL scheme (Android Emulator)
   adb shell am start -a android.intent.action.VIEW -d "myapp://chat/123"

   # Universal link (iOS - requires dev build + AASA)
   xcrun simctl openurl booted "https://example.com/chat/123"
   ```

   Use `npx uri-scheme` for quick testing:

   ```bash
   npx uri-scheme open "myapp://chat/123" --ios
   npx uri-scheme open "myapp://chat/123" --android
   ```

7. **Deferred deep links (optional).** For install attribution (user clicks a link, installs the app, then lands on the right screen), use Branch or a custom solution:

   ```bash
   npx expo install react-native-branch
   ```

   Branch tracks the link pre-install and delivers the deep link data on first open after install. This is critical for marketing campaigns and referral programs.

## Key References

- [Expo Linking docs](https://docs.expo.dev/guides/linking/)
- [Expo Router: Linking](https://docs.expo.dev/router/reference/url/)
- [Apple: Supporting universal links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Android: App Links](https://developer.android.com/training/app-links)
- [AASA validator](https://branch.io/resources/aasa-validator/)

## Example Interaction

**User:** "I want shared recipe links like example.com/recipe/42 to open the recipe screen in my app."

**Agent:**
1. Configures URL scheme and associated domains with `mobile_configureDeepLinks`
2. Creates AASA file template for `example.com` with `/recipe/*` path
3. Creates Android intent filter for `https://example.com/recipe/*`
4. Implements deep link handler using Expo Linking API
5. Ensures Expo Router file structure matches: `app/recipe/[id].tsx`
6. Shows how to test with `xcrun simctl openurl` and `adb shell am start`
7. Reminds user to host AASA and assetlinks.json on their domain

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Configure scheme and domains | `mobile_configureDeepLinks` | Set URL scheme, intent filters, associated domains, generate AASA template |
| Add permissions | `mobile_addPermission` | Add any required permissions for link handling |
| Create screen | `mobile_generateScreen` | Scaffold the target screen for deep link routes |
| Check build | `mobile_checkBuildHealth` | Verify project builds with deep link config |

## Common Pitfalls

1. **AASA not served correctly** - The file must be served at `/.well-known/apple-app-site-association` with `Content-Type: application/json`. No redirects. HTTPS only. No file extension.
2. **Android autoVerify failing** - The `assetlinks.json` must contain the correct SHA256 fingerprint for your signing key. EAS builds use a different key than local debug builds.
3. **Testing universal links in Safari** - Typing a URL directly in Safari does not trigger universal links. You must tap a link from another app (Messages, Notes, or a web page).
4. **Expo Go limitations** - Custom URL schemes and universal links require a development build. Expo Go uses its own `exp://` scheme.
5. **Path matching too broad** - Do not set `"/"` as your only path. This captures all links to your domain and breaks normal web browsing.
6. **Not handling cold start** - `Linking.getInitialURL()` returns the URL that launched the app from a killed state. If you only listen for the `url` event, cold-start deep links are missed.

## See Also

- [Mobile Push Notifications](../mobile-push-notifications/SKILL.md) - notification tap deep linking
- [Mobile Navigation Setup](../mobile-navigation-setup/SKILL.md) - Expo Router file-based routing for deep links
- [Mobile Analytics](../mobile-analytics/SKILL.md) - tracking deep link attribution and conversion

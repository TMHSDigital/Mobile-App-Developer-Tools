---
name: mobile-security
description: Harden a React Native/Expo or Flutter app against common mobile security threats. Covers SSL pinning, certificate transparency, code obfuscation (ProGuard/R8, Hermes bytecode), jailbreak and root detection, secure key storage, runtime tamper detection, and data-at-rest encryption. Use when the user needs to protect API traffic, prevent reverse engineering, detect compromised devices, or store sensitive data securely.
standards-version: 1.7.0
---

# Mobile Security

## Trigger

Use this skill when the user:

- Wants to secure API communication (SSL pinning, certificate transparency)
- Asks about code obfuscation or preventing reverse engineering
- Needs jailbreak or root detection
- Mentions "security", "SSL pinning", "obfuscation", "ProGuard", "jailbreak", "root detection", "tamper detection", or "secure storage"
- Wants to encrypt local data or protect signing credentials
- Is preparing for a security audit or compliance review

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Threat model**: which assets to protect (API keys, user data, payment info, intellectual property)
- **Target platforms**: iOS, Android, or both

## Workflow

1. **Audit current security posture.** Run the security audit tool to identify gaps:

   ```
   Use mobile_securityAudit to scan the project for insecure patterns.
   ```

2. **Add SSL pinning.** Prevent man-in-the-middle attacks by pinning server certificates:

   **React Native:**

   ```bash
   npx expo install react-native-ssl-pinning
   ```

   ```tsx
   import { fetch as pinnedFetch } from "react-native-ssl-pinning";

   const response = await pinnedFetch("https://api.example.com/data", {
     method: "GET",
     sslPinning: {
       certs: ["my-server-cert"],
     },
     headers: {
       Authorization: `Bearer ${token}`,
     },
   });
   ```

   Place `.cer` files in `android/app/src/main/assets/` and the iOS bundle.

   **Flutter:**

   ```yaml
   dependencies:
     ssl_pinning_plugin: ^2.0.0
   ```

   ```dart
   import 'package:ssl_pinning_plugin/ssl_pinning_plugin.dart';

   Future<bool> checkPin() async {
     try {
       await SslPinningPlugin.check(
         serverURL: 'https://api.example.com',
         headerHttp: {},
         sha: SHA.SHA256,
         allowedSHAFingerprints: ['AA:BB:CC:...'],
         timeout: 60,
       );
       return true;
     } catch (_) {
       return false;
     }
   }
   ```

3. **Enable code obfuscation.**

   **Android (ProGuard/R8):** In `android/app/build.gradle`:

   ```groovy
   android {
     buildTypes {
       release {
         minifyEnabled true
         shrinkResources true
         proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
     }
   }
   ```

   **iOS:** Hermes bytecode is already harder to reverse than plain JavaScript. For additional protection, consider commercial obfuscators.

   **Flutter:** Dart AOT compilation provides baseline obfuscation. Add `--obfuscate --split-debug-info=build/debug-info` to release builds.

4. **Add jailbreak/root detection.**

   **React Native:**

   ```bash
   npx expo install jail-monkey
   ```

   ```tsx
   import JailMonkey from "jail-monkey";

   if (JailMonkey.isJailBroken()) {
     Alert.alert(
       "Security Warning",
       "This device appears to be compromised. Some features may be restricted.",
     );
   }
   ```

   **Flutter:**

   ```yaml
   dependencies:
     flutter_jailbreak_detection: ^1.10.0
   ```

   ```dart
   import 'package:flutter_jailbreak_detection/flutter_jailbreak_detection.dart';

   final isJailbroken = await FlutterJailbreakDetection.jailbroken;
   if (isJailbroken) {
     // Warn or restrict functionality
   }
   ```

5. **Use secure storage for tokens and secrets.**

   **React Native:**

   ```bash
   npx expo install expo-secure-store
   ```

   ```tsx
   import * as SecureStore from "expo-secure-store";

   await SecureStore.setItemAsync("auth_token", token);
   const stored = await SecureStore.getItemAsync("auth_token");
   ```

   **Flutter:**

   ```yaml
   dependencies:
     flutter_secure_storage: ^9.0.0
   ```

   ```dart
   final storage = const FlutterSecureStorage();
   await storage.write(key: 'auth_token', value: token);
   final stored = await storage.read(key: 'auth_token');
   ```

6. **Disable cleartext traffic.** Ensure all network requests use HTTPS:

   **Expo:** In `app.json`:

   ```json
   {
     "expo": {
       "android": {
         "usesCleartextTraffic": false
       }
     }
   }
   ```

   **Flutter:** In `AndroidManifest.xml`:

   ```xml
   <application android:usesCleartextTraffic="false" />
   ```

7. **Add runtime tamper detection.** Check at startup whether the app binary has been modified:

   - Verify app signature at runtime (Android: `PackageManager.GET_SIGNATURES`)
   - Detect debugger attachment (`isDebuggerConnected`)
   - Check for Frida, Xposed, and hooking frameworks
   - Consider a commercial RASP (Runtime Application Self-Protection) solution for high-security apps

## Key References

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
- [Flutter Security FAQ](https://docs.flutter.dev/reference/security-false-positives)
- [react-native-ssl-pinning](https://github.com/niccoloLG/react-native-ssl-pinning)
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)

## Example Interaction

**User:** "My app handles payment data. How do I secure it for production?"

**Agent:**
1. Runs `mobile_securityAudit` to identify current gaps
2. Installs `react-native-ssl-pinning` and configures certificate pins for the payment API
3. Enables ProGuard/R8 in the release build config
4. Adds `jail-monkey` for jailbreak detection with a user warning
5. Migrates token storage from AsyncStorage to `expo-secure-store`
6. Disables cleartext traffic in `app.json`
7. Adds `.env` validation to ensure API keys are not hardcoded
8. Recommends a penetration test before launch

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Audit | `mobile_securityAudit` | Scan for insecure storage, missing pinning, cleartext traffic |
| Install packages | `mobile_installDependency` | Install security libraries |
| Check build | `mobile_checkBuildHealth` | Verify ProGuard config compiles |
| Store prep | `mobile_validateStoreMetadata` | Ensure privacy policy URL is set |

## Common Pitfalls

1. **Storing tokens in AsyncStorage** - AsyncStorage is unencrypted plaintext on both platforms. Always use expo-secure-store or react-native-keychain for auth tokens, refresh tokens, and API keys.
2. **Pinning to leaf certificates** - Leaf certs rotate frequently. Pin to the intermediate CA or use public key pinning (SPKI) for longer validity.
3. **Debug code in production** - Remove `console.log` statements, Flipper plugins, and Reactotron from production builds. Move them to devDependencies and gate with `__DEV__`.
4. **Hardcoded API keys** - Never commit API keys. Use environment variables with the `EXPO_PUBLIC_` prefix for client-safe keys, and a backend proxy for server-only secrets.
5. **Ignoring Android backup** - By default, Android backs up app data (including SharedPreferences) to Google Drive. Set `android:allowBackup="false"` or use `android:fullBackupContent` to exclude sensitive data.
6. **No certificate transparency** - Certificate Transparency (CT) logs help detect rogue certificates. Modern browsers enforce CT; mobile apps should verify CT headers or use a library.

## See Also

- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - authentication patterns and secure token handling
- [Mobile Local Storage](../mobile-local-storage/SKILL.md) - encrypted storage options
- [Mobile Permissions](../mobile-permissions/SKILL.md) - requesting sensitive permissions with rationale
- [Mobile App Store Prep](../mobile-app-store-prep/SKILL.md) - privacy policy and data handling declarations

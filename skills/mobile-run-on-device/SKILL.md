---
name: mobile-run-on-device
description: Run an Expo/React Native app on a physical phone or tablet. Use when the user wants to test on a real device, is having trouble connecting, or needs to switch from simulator to physical hardware.
---

# Mobile Run on Device

## Trigger

Use this skill when the user:

- Wants to run their app on a physical phone or tablet
- Is stuck on simulator/emulator and wants to test on real hardware
- Gets connection errors between the dev server and their device
- Mentions "run on phone", "test on device", "QR code", "can't connect", or "Expo Go"
- Needs to set up USB debugging or wireless deployment

## Required Inputs

- **Project path**: Where the Expo project lives on disk
- **Target device**: iOS or Android physical device
- **Connection method** (optional): Same network (default), tunnel, or USB

## Workflow

1. **Start the dev server.** From the project root:

   ```bash
   npx expo start
   ```

   This shows a QR code in the terminal and opens the Expo DevTools.

2. **Connect via Expo Go (fastest path):**

   **iOS:**
   - Install "Expo Go" from the App Store
   - Open the Camera app and scan the QR code in the terminal
   - The app opens in Expo Go automatically

   **Android:**
   - Install "Expo Go" from the Play Store
   - Open Expo Go and tap "Scan QR Code"
   - Scan the QR code from the terminal

3. **Same-network requirement.** The phone and the dev machine must be on the same Wi-Fi network. If they are not:
   - Connect both to the same Wi-Fi
   - Or use tunnel mode: `npx expo start --tunnel`
   - Tunnel mode routes through Expo's servers (slower but works across networks)

4. **Tunnel mode.** If same-network connection fails:

   ```bash
   npx expo start --tunnel
   ```

   This requires `@expo/ngrok` (installed automatically on first use). Tunnel mode is slower but works when:
   - The phone and computer are on different networks
   - Corporate firewalls block local connections
   - You're developing on a VPN

5. **Dev builds (for native modules).** Expo Go does not support custom native modules. If the app uses `expo-camera`, `expo-notifications`, or any package with native code beyond Expo's built-in set:

   ```bash
   # Install the dev client
   npx expo install expo-dev-client

   # Build for your device
   npx expo run:ios --device    # iOS (requires Xcode + Apple Developer account)
   npx expo run:android         # Android (requires Android SDK)
   ```

   Or use EAS Build for cloud builds:
   ```bash
   npm install -g eas-cli
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

6. **USB debugging (Android):**

   - Enable Developer Options: Settings > About phone > tap "Build number" 7 times
   - Enable USB Debugging: Settings > Developer options > USB debugging
   - Connect via USB cable
   - Run: `npx expo run:android`
   - Accept the "Allow USB debugging" prompt on the phone

7. **Troubleshooting connection issues:**

   | Problem | Fix |
   |---------|-----|
   | QR code won't scan | Type the URL manually in Expo Go. The URL is shown in the terminal (e.g. `exp://192.168.1.5:8081`). |
   | "Network response timed out" | Switch to tunnel mode: `npx expo start --tunnel` |
   | App loads but shows red error screen | Read the error message. Common: missing dependency, syntax error, or import issue. |
   | "Could not connect to development server" | Check firewall settings. Allow Node.js through the firewall. |
   | Hot reload not working | Shake the device to open the dev menu, enable "Fast Refresh". |
   | iOS device says "Untrusted Developer" | Settings > General > VPN & Device Management > trust your developer certificate. |

## Key References

- [Expo: Run on device](https://docs.expo.dev/get-started/set-up-your-environment/)
- [Expo Go: Overview](https://docs.expo.dev/get-started/expo-go/)
- [Expo: Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android: USB debugging](https://developer.android.com/studio/debug/dev-options)

## Example Interaction

**User:** "I created my Expo app but I can't get it running on my Android phone."

**Agent:**
1. Asks if the phone and computer are on the same Wi-Fi network
2. Runs `mobile_runOnDevice` with framework "expo" and platform "android"
3. Guides through installing Expo Go from the Play Store
4. Starts the dev server and provides the QR code
5. If connection fails, switches to tunnel mode
6. Confirms the app is running on the device with hot reload

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Start and connect | `mobile_runOnDevice` | Start dev server and provide device connection instructions |
| Check prerequisites | `mobile_checkDevEnvironment` | Verify SDK and tools are installed before attempting device deployment |

## Common Pitfalls

1. **Phone and computer on different networks** - The most common connection failure. Use `--tunnel` to work around it.
2. **Firewall blocking port 8081** - The Expo dev server runs on port 8081 by default. Allow it through your firewall.
3. **Using Expo Go with native modules** - Expo Go only supports the Expo SDK built-in modules. For custom native code, you need a dev build.
4. **Outdated Expo Go** - The Expo Go app version must match your Expo SDK version. Update Expo Go from the app store.
5. **VPN interference** - VPNs often block local network discovery. Disconnect the VPN or use tunnel mode.
6. **iOS requires Apple Developer account for device builds** - Expo Go works without one, but `expo run:ios --device` requires a free or paid Apple Developer account.
7. **Android USB drivers on Windows** - Some Android phones need manufacturer-specific USB drivers. Check your phone manufacturer's website.

## See Also

- [Mobile Dev Environment](../mobile-dev-environment/SKILL.md) - install prerequisites before running on device
- [Mobile Project Setup](../mobile-project-setup/SKILL.md) - create a project to run

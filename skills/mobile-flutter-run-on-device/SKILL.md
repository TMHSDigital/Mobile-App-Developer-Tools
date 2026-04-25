---
name: mobile-flutter-run-on-device
description: Run a Flutter app on a physical phone or tablet. Covers USB and wireless debugging, hot reload vs hot restart, build modes, common connection issues, and platform-specific setup. Use when the user wants to test on real hardware.
standards-version: 1.7.0
---

# Flutter Run on Device

## Trigger

Use this skill when the user:

- Wants to run their Flutter app on a physical phone or tablet
- Is stuck on emulator and wants real hardware
- Gets device connection errors
- Asks about USB debugging, wireless debugging, or `adb`
- Mentions "run on phone", "hot reload", "device not found", or "flutter run"

## Required Inputs

- **Target platform**: Android, iOS, or both
- **Connection method** (optional): USB (default) or wireless
- **Build mode** (optional): debug (default), profile, or release

## Workflow

1. **Check connected devices.**

   ```bash
   flutter devices
   ```

   This lists all available devices (physical, emulators, desktop). If the target device does not appear, proceed to platform-specific setup.

2. **Android setup.**

   Enable Developer Options on the device:
   - Go to Settings > About Phone
   - Tap "Build Number" seven times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"

   Connect via USB and verify:

   ```bash
   adb devices
   ```

   If the device shows as "unauthorized", check the phone for a USB debugging authorization prompt and accept it.

   For **wireless debugging** (Android 11+):
   - Enable "Wireless debugging" in Developer Options
   - On the phone, tap "Pair device with pairing code"
   - On your machine:

   ```bash
   adb pair <ip>:<pairing_port>    # enter the pairing code
   adb connect <ip>:<connect_port>
   ```

   Then `flutter devices` should show the wireless device.

3. **iOS setup.**

   Prerequisites:
   - macOS with Xcode installed (`xcode-select --install` for command-line tools)
   - Apple Developer account (free works for development, paid for distribution)
   - CocoaPods: `sudo gem install cocoapods`

   Connect iPhone via USB, then:

   ```bash
   flutter run
   ```

   On first run, you must configure signing in Xcode:
   - Open `ios/Runner.xcworkspace` in Xcode
   - Select the Runner target > Signing & Capabilities
   - Choose your Team (Apple ID)
   - Set a unique Bundle Identifier

   On the iPhone, trust the developer certificate:
   - Settings > General > VPN & Device Management > tap your developer profile > Trust

   For **wireless debugging** (iOS 14+, Xcode 13+):
   - Connect via USB first
   - In Xcode: Window > Devices and Simulators
   - Check "Connect via network" for your device
   - Disconnect USB; the device should still appear in `flutter devices`

4. **Run the app.**

   ```bash
   # Debug mode (default) - hot reload enabled
   flutter run

   # Target a specific device
   flutter run -d <device_id>

   # Profile mode - performance profiling, no debugger
   flutter run --profile

   # Release mode - optimized, no debugging
   flutter run --release

   # Specific entry point (for flavors)
   flutter run -t lib/main_dev.dart
   ```

5. **Hot reload and hot restart.**

   While the app is running in debug mode:

   | Action | Shortcut | What it does |
   |--------|----------|--------------|
   | Hot reload | `r` in terminal | Injects updated code, preserves state |
   | Hot restart | `R` in terminal | Restarts app, resets state |
   | Quit | `q` in terminal | Stop the app |
   | Open DevTools | `d` in terminal | Launch Flutter DevTools in browser |
   | Widget inspector | `w` in terminal | Toggle widget inspector overlay |

   Hot reload works for most UI changes. It does NOT work for:
   - Changes to `main()` or `initState()`
   - Changes to global variables or static fields
   - Changes to enums or generic type parameters
   - Adding/removing native plugins (requires full rebuild)

6. **Troubleshoot common issues.**

   | Problem | Solution |
   |---------|----------|
   | "No devices found" | Check USB cable, enable USB debugging, run `adb devices` |
   | "adb not found" | Add Android SDK `platform-tools` to PATH |
   | iOS "device locked" | Unlock the phone before running |
   | iOS signing error | Open Xcode, set Team in Signing & Capabilities |
   | "Untrusted developer" | iPhone Settings > General > VPN & Device Management > Trust |
   | Gradle build slow | First build is slow; subsequent builds use cache. Run `flutter clean` if stuck |
   | CocoaPods error | `cd ios && pod install --repo-update` |
   | "flutter run" hangs | Kill existing processes: `flutter clean && flutter run` |
   | App crashes on launch | Run `flutter run --verbose` for detailed logs |

## Key References

- [Flutter: Set up devices](https://docs.flutter.dev/get-started/install)
- [Android USB debugging](https://developer.android.com/studio/debug/dev-options)
- [iOS device setup](https://docs.flutter.dev/get-started/install/macos/mobile-ios#configure-your-target-ios-device)
- [Hot reload](https://docs.flutter.dev/tools/hot-reload)
- [Build modes](https://docs.flutter.dev/testing/build-modes)

## Example Interaction

**User:** "My Android phone doesn't show up when I run flutter devices."

**Agent:**
1. Asks the user to check USB Debugging is enabled in Developer Options
2. Runs `adb devices` to check if ADB sees the device
3. If unauthorized, instructs to accept the prompt on the phone
4. If ADB not found, shows how to add `platform-tools` to PATH
5. Once device appears, runs `flutter run -d <device_id>`
6. Verifies hot reload works by asking user to press `r`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Check environment | `mobile_checkDevEnvironment` | Verify Flutter, ADB, Xcode are installed and on PATH |
| Reset if stuck | `mobile_resetDevEnvironment` | Clear build caches if the app won't launch |

## Common Pitfalls

1. **USB cable is charge-only** - Some cheap USB cables do not support data transfer. Try a different cable if `adb devices` shows nothing.
2. **Multiple devices connected** - If both an emulator and phone are connected, `flutter run` fails. Specify `-d <device_id>` or disconnect one.
3. **iOS requires macOS** - You cannot build or run iOS Flutter apps on Windows or Linux. You need a Mac (or a macOS CI service).
4. **Forgetting to trust the developer profile** - iOS blocks unsigned apps. The user must manually trust the profile in Settings after the first install.
5. **Hot reload not reflecting changes** - Changes to native code, `main()`, or plugins require a full restart (`R`) or a rebuild (`flutter run`).
6. **Release mode on iOS without paid account** - Free Apple Developer accounts cannot build release mode. They only support debug builds on physical devices.

## See Also

- [Flutter Project Setup](../mobile-flutter-project-setup/SKILL.md) - create the project before running
- [Mobile Dev Environment](../mobile-dev-environment/SKILL.md) - environment detection covers Flutter SDK
- [Mobile Run on Device (Expo)](../mobile-run-on-device/SKILL.md) - equivalent workflow for React Native/Expo

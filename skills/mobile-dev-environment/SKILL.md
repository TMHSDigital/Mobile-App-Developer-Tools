---
name: mobile-dev-environment
description: Detect and set up mobile development prerequisites across macOS, Windows, and Linux. Use when the user needs to verify their environment, install missing tools, or fix common setup issues.
standards-version: 1.9.0
---

# Mobile Dev Environment

## Trigger

Use this skill when the user:

- Asks if their machine is ready for mobile development
- Gets build errors related to missing tools or SDKs
- Needs to install Node, Watchman, Xcode, Android Studio, or JDK
- Mentions "setup", "install", "environment", "prerequisites", or "can't build"
- Is starting mobile development for the first time

## Required Inputs

- **Operating system**: Detected automatically via `process.platform` or user statement
- **Target platform**: iOS, Android, or both
- **Framework**: Expo (default) or React Native CLI

## Workflow

1. **Detect the operating system.** Check `process.platform` or ask the user:
   - `darwin` = macOS
   - `win32` = Windows
   - `linux` = Linux

2. **Check required tools.** Run version checks for each dependency:

   ```bash
   node --version          # Required: >= 18.0.0
   npm --version           # Comes with Node
   npx expo --version      # Expo CLI (installed via npx, no global install needed)
   git --version           # Required for version control
   ```

3. **Check platform-specific tools:**

   **macOS (iOS + Android):**
   ```bash
   xcode-select -p         # Xcode command line tools
   xcodebuild -version     # Full Xcode (required for iOS device builds)
   watchman --version       # File watcher (recommended for performance)
   pod --version            # CocoaPods (required for iOS native modules)
   java -version            # JDK 17 or 21 (required for Android)
   ```

   **Windows (Android only):**
   ```powershell
   java -version            # JDK 17 or 21
   # Android Studio: check ANDROID_HOME environment variable
   echo $env:ANDROID_HOME
   ```

   **Linux (Android only):**
   ```bash
   java -version            # JDK 17 or 21
   echo $ANDROID_HOME       # Android SDK path
   watchman --version        # Recommended
   ```

4. **Report results.** Present a checklist:

   | Tool | Status | Version | Action |
   |------|--------|---------|--------|
   | Node.js | Installed | v20.19.0 | - |
   | Expo CLI | Available | latest | - |
   | Watchman | Missing | - | `brew install watchman` |
   | Xcode | Installed | 16.1 | Upgrade to Xcode 26 for iOS 26 SDK (required from April 28, 2026) |
   | Android Studio | Missing | - | Download from developer.android.com |

5. **Provide install commands for missing tools:**

   **Node.js (all platforms):**
   ```bash
   # macOS
   brew install node

   # Windows (use installer)
   # Download from https://nodejs.org/

   # Linux
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

   **Watchman (macOS):**
   ```bash
   brew install watchman
   ```

   **Xcode (macOS):**
   ```bash
   xcode-select --install
   # For full Xcode: install from the Mac App Store
   ```

   **JDK 17 or 21 (all platforms):**
   ```bash
   # macOS
   brew install --cask zulu@17

   # Windows
   # Download Azul Zulu JDK 17 or 21 from https://www.azul.com/downloads/

   # Linux
   sudo apt install openjdk-17-jdk
   ```

   **Android Studio:**
   Download from https://developer.android.com/studio. During setup, install:
   - Android SDK
   - Android SDK Platform 36 (or latest)
   - Android Virtual Device (AVD)

   Set `ANDROID_HOME`:
   ```bash
   # macOS/Linux (~/.zshrc or ~/.bashrc)
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

   ```powershell
   # Windows (System Environment Variables)
   # ANDROID_HOME = C:\Users\<user>\AppData\Local\Android\Sdk
   ```

6. **Verify the fix.** After installing missing tools, re-run the checks to confirm everything works.

## Key References

- [Expo: Environment setup](https://docs.expo.dev/get-started/set-up-your-environment/)
- [React Native: Setting up the development environment](https://reactnative.dev/docs/set-up-your-environment)
- [Android Studio: Install](https://developer.android.com/studio/install)
- [Xcode: Downloads](https://developer.apple.com/xcode/)

## Example Interaction

**User:** "I want to build a mobile app but I'm not sure if my Mac is set up for it."

**Agent:**
1. Runs `mobile_checkDevEnvironment` to scan installed tools
2. Reports: Node 20.19.0 installed, Watchman missing, Xcode 16.1 installed, Android Studio missing
3. Provides `brew install watchman` command
4. Asks if the user wants Android support (if yes, links to Android Studio download)
5. Confirms the environment is ready for Expo/iOS development

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Scan environment | `mobile_checkDevEnvironment` | Detect all installed tools and SDKs, report gaps |

## Common Pitfalls

1. **Wrong Node version** - Expo SDK 55+ requires Node 20+. If you have an older version, use `nvm` or `fnm` to manage versions.
2. **Missing ANDROID_HOME** - Android builds fail silently if this env var is not set. Check with `echo $ANDROID_HOME` (macOS/Linux) or `echo $env:ANDROID_HOME` (Windows).
3. **Xcode CLI tools without full Xcode** - `xcode-select --install` gives you command line tools, but iOS device builds require the full Xcode from the App Store.
4. **JDK version mismatch** - Android Gradle builds require JDK 17 or 21. JDK 21 ships with recent Android Studio versions and is the recommended choice for new projects.
5. **Windows and iOS** - You cannot build iOS apps on Windows. Use Expo Go for testing or EAS Build for cloud-based iOS builds.
6. **CocoaPods not installed** - Run `sudo gem install cocoapods` on macOS if `pod --version` fails. On Apple Silicon, you may need `sudo arch -x86_64 gem install ffi` first.

## See Also

- [Mobile Project Setup](../mobile-project-setup/SKILL.md) - create a project after environment is ready
- [Mobile Run on Device](../mobile-run-on-device/SKILL.md) - connect to a physical device

---
name: mobile-debugging
description: Debug React Native/Expo and Flutter apps effectively. Covers Flipper, React DevTools, React Native Debugger for RN and Flutter DevTools (widget inspector, timeline, memory view) for Flutter. Includes memory leak detection with LeakCanary and Instruments, network inspection, console logging, native breakpoints, performance profiling, and common debugging workflows. Use when the user needs to find and fix bugs, inspect state, profile performance, or detect memory leaks.
standards-version: 1.6.3
---

# Mobile Debugging

## Trigger

Use this skill when the user:

- Has a bug they cannot find or fix
- Asks about debugging tools (Flipper, DevTools, Debugger)
- Needs to inspect network requests, state, or component trees
- Wants to detect memory leaks or performance issues
- Mentions "debug", "Flipper", "DevTools", "memory leak", "profiler", "breakpoint", or "network inspector"
- Is troubleshooting crashes, freezes, or unexpected behavior

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Issue type**: crash, performance, UI rendering, network, state, memory leak
- **Platform**: iOS, Android, or both
- **Build mode**: development, preview, or production

## Workflow

1. **Choose the right debugging tool:**

   | Tool | Framework | Best for | Setup |
   |------|-----------|----------|-------|
   | React DevTools | React Native | Component tree, props, state inspection | `npx react-devtools` |
   | Flipper | React Native | Network, layout, databases, logs, plugins | Desktop app |
   | React Native Debugger | React Native | Chrome DevTools + React DevTools + Redux | Desktop app |
   | Expo Dev Client | Expo | Element inspector, network, performance | Built into dev builds |
   | Flutter DevTools | Flutter | Widget inspector, timeline, memory, network | `dart devtools` |
   | Xcode Instruments | iOS (both) | Memory leaks, CPU profiling, energy impact | Xcode |
   | Android Studio Profiler | Android (both) | Memory, CPU, network, energy | Android Studio |

2. **React DevTools for component debugging:**

   ```bash
   npx react-devtools
   ```

   - Inspect component hierarchy in the tree view
   - Click a component to see its props, state, and hooks
   - Use the search bar to find components by name
   - Enable "Highlight updates" to see which components re-render
   - Use the Profiler tab to record renders and measure render time

3. **Flipper for React Native:**

   Download from [fbflipper.com](https://fbflipper.com/). Built-in plugins:

   - **Network Inspector** - view all HTTP requests, headers, payloads, and timing
   - **Layout Inspector** - visual element inspection (like browser DevTools)
   - **React DevTools** - component tree embedded in Flipper
   - **Databases** - browse AsyncStorage, SQLite, WatermelonDB
   - **Shared Preferences** - inspect key-value storage
   - **Crash Reporter** - native crash logs

   For Expo dev builds, add Flipper via config plugin:

   ```bash
   npx expo install react-native-flipper expo-community-flipper
   ```

4. **Flutter DevTools:**

   ```bash
   dart devtools
   ```

   Or launch from VS Code / Android Studio.

   - **Widget Inspector** - visual tree with layout constraints, padding, alignment
   - **Timeline** - frame rendering timeline, identify jank (>16ms frames)
   - **Memory** - heap snapshots, allocation tracking, leak detection
   - **Network** - HTTP request/response inspector
   - **CPU Profiler** - call stacks, flame charts, hot functions
   - **Logging** - structured log viewer with filters

5. **Detect memory leaks (React Native):**

   Common causes:
   - Uncleared `setInterval` or `setTimeout` in useEffect without cleanup
   - Event listeners not removed on unmount
   - Closure references keeping large objects alive
   - Images cached without eviction policy

   ```tsx
   // Memory leak pattern
   useEffect(() => {
     const interval = setInterval(fetchData, 5000);
     // Missing: return () => clearInterval(interval);
   }, []);

   // Fixed
   useEffect(() => {
     const interval = setInterval(fetchData, 5000);
     return () => clearInterval(interval);
   }, []);
   ```

   Use **Xcode Instruments > Leaks** to detect native memory leaks. Use the React DevTools Profiler to detect retained component trees.

6. **Detect memory leaks (Flutter):**

   Use Flutter DevTools > Memory tab:
   - Take heap snapshots before and after navigating to/from a screen
   - Compare snapshots to find objects that should have been collected
   - Look for listeners, streams, and animation controllers not disposed

   ```dart
   // Memory leak pattern
   class _MyState extends State<MyWidget> {
     late final StreamSubscription _sub;

     @override
     void initState() {
       super.initState();
       _sub = myStream.listen((_) {});
       // Missing: dispose() that cancels _sub
     }

     // Fixed
     @override
     void dispose() {
       _sub.cancel();
       super.dispose();
     }
   }
   ```

7. **Network debugging.** Inspect API calls:

   - **Flipper Network plugin** for React Native
   - **Flutter DevTools Network tab** for Flutter
   - **Charles Proxy** or **Proxyman** for HTTPS inspection (requires certificate trust)
   - Add request/response logging in your HTTP client:

   ```tsx
   // Axios interceptor for debugging
   axios.interceptors.request.use((config) => {
     if (__DEV__) {
       console.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
     }
     return config;
   });
   ```

8. **Native breakpoints.** When JS debugging is not enough:

   - **Xcode**: Open the iOS project, set breakpoints in Swift/Objective-C files
   - **Android Studio**: Open the Android project, set breakpoints in Kotlin/Java files
   - For React Native: use `debugger;` statement in JS code to trigger Chrome DevTools breakpoint
   - For Flutter: standard VS Code/Android Studio breakpoints work on Dart code

## Key References

- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Flipper](https://fbflipper.com/)
- [Flutter DevTools](https://docs.flutter.dev/tools/devtools/overview)
- [Xcode Instruments](https://developer.apple.com/instruments/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

## Example Interaction

**User:** "My app is getting slower over time. I think there's a memory leak."

**Agent:**
1. Asks which framework (Expo/Flutter) and platform
2. For Expo: launches React DevTools Profiler to record renders
3. Checks useEffect hooks for missing cleanup functions
4. Runs `mobile_profilePerformance` to scan for common anti-patterns
5. Guides the user through Xcode Instruments > Leaks for native-side leaks
6. Identifies an uncleared setInterval in a dashboard component
7. Fixes the leak by adding a cleanup function in useEffect
8. Verifies the fix by comparing memory snapshots before and after

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Profile | `mobile_profilePerformance` | Scan for performance anti-patterns |
| Check environment | `mobile_checkDevEnvironment` | Verify debugging tools are installed |
| Check build | `mobile_checkBuildHealth` | Verify dev build is working |
| Reset environment | `mobile_resetDevEnvironment` | Clear caches when debugging Metro/Gradle issues |

## Common Pitfalls

1. **Debugging in production mode** - Production builds strip `__DEV__`, console logs, and source maps. Always debug in development mode. For production crashes, use Sentry or Crashlytics.
2. **Remote debugging kills performance** - Chrome remote debugging serializes the JS bridge and makes the app 5-10x slower. Use Hermes debugger (via Flipper) instead for accurate performance measurement.
3. **Missing source maps** - Without source maps, stack traces show minified code. Configure source map generation in Metro (RN) or add `--split-debug-info` (Flutter).
4. **Not using the element inspector** - Before writing console.log, use the built-in element inspector (shake device > "Show Element Inspector" in RN, or Widget Inspector in Flutter) to visually identify which component is rendering unexpectedly.
5. **Ignoring native logs** - Some crashes happen in native code (ObjC/Swift/Kotlin/Java). Check `adb logcat` for Android and Xcode console for iOS alongside JS logs.
6. **Flipper connection issues** - If Flipper cannot connect, check: correct SDK version, Metro running, device on same network. Use `adb reverse tcp:8081 tcp:8081` for Android emulator.

## See Also

- [Mobile App Monitoring](../mobile-app-monitoring/SKILL.md) - production error tracking and APM
- [Mobile Testing](../mobile-testing/SKILL.md) - catch bugs before they reach production
- [Mobile CI/CD](../mobile-ci-cd/SKILL.md) - automated testing in the pipeline
- [Mobile Dev Environment](../mobile-dev-environment/SKILL.md) - setting up development tools

---
name: mobile-native-modules
description: Building native modules with Expo Modules API, Turbo Modules, JSI bridging, and Flutter platform plugins
standards-version: 1.6.3
---

# Mobile Native Modules

## Trigger

Use this skill when the developer asks about:
- Creating a native module or native extension
- Expo Modules API (Swift/Kotlin module definitions)
- Turbo Modules or JSI bridging for React Native
- Native view components (Fabric components)
- Flutter platform plugins (MethodChannel, EventChannel)
- Bridging Swift/Kotlin/ObjC code to JS or Dart
- Custom native functionality not available via existing packages

## Required Inputs

| Input | Description |
| --- | --- |
| Framework | `expo` (React Native) or `flutter` |
| Module purpose | What native capability is needed |
| Platforms | iOS only, Android only, or both |

## Workflow

### 1. Scaffold the Module

Run `mobile_createNativeModule` to generate the boilerplate:

```
Use MCP tool: mobile_createNativeModule
  framework: "expo"
  module_name: "Haptics"
  output_directory: "modules"
```

This creates:
- **Expo:** TypeScript bindings, Swift module, Kotlin module, expo-module.config.json
- **Flutter:** Dart API, Swift plugin, Kotlin plugin, platform interface

### 2. Expo Modules API (Recommended for React Native)

#### Module Definition (Swift)

```swift
import ExpoModulesCore

public class HapticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Haptics")

    Function("impact") { (style: String) in
      let generator: UIImpactFeedbackGenerator
      switch style {
      case "heavy": generator = UIImpactFeedbackGenerator(style: .heavy)
      case "medium": generator = UIImpactFeedbackGenerator(style: .medium)
      default: generator = UIImpactFeedbackGenerator(style: .light)
      }
      generator.impactOccurred()
    }

    AsyncFunction("vibrate") { (duration: Double, promise: Promise) in
      AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
      promise.resolve(nil)
    }
  }
}
```

#### Module Definition (Kotlin)

```kotlin
package expo.modules.haptics

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HapticsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Haptics")

    Function("impact") { style: String ->
      val vibrator = appContext.reactContext?.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      vibrator?.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
    }
  }
}
```

#### TypeScript Bindings

```tsx
import HapticsModule from "./HapticsModule";

export function impact(style: "light" | "medium" | "heavy" = "light"): void {
  HapticsModule.impact(style);
}

export async function vibrate(duration: number): Promise<void> {
  return HapticsModule.vibrate(duration);
}
```

### 3. Turbo Modules (Advanced)

For performance-critical code that needs synchronous JSI access:

```tsx
// NativeHaptics.ts
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  impact(style: string): void;
  vibrate(duration: number): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("Haptics");
```

### 4. Flutter Platform Plugins

#### Dart API

```dart
class Haptics {
  static const MethodChannel _channel = MethodChannel('haptics');

  static Future<void> impact(String style) async {
    await _channel.invokeMethod('impact', {'style': style});
  }
}
```

#### Swift Implementation

```swift
public class HapticsPlugin: NSObject, FlutterPlugin {
  public static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(name: "haptics", binaryMessenger: registrar.messenger())
    registrar.addMethodCallDelegate(HapticsPlugin(), channel: channel)
  }

  public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "impact":
      let generator = UIImpactFeedbackGenerator(style: .medium)
      generator.impactOccurred()
      result(nil)
    default:
      result(FlutterMethodNotImplemented)
    }
  }
}
```

### 5. Native View Components

#### Expo (Fabric-compatible)

```swift
import ExpoModulesCore

public class MyMapView: ExpoView {
  let mapView = MKMapView()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    addSubview(mapView)
  }

  override public func layoutSubviews() {
    mapView.frame = bounds
  }
}
```

## Example Interaction

**User:** "I need to access the device gyroscope data that isn't available through Expo packages"

**Assistant:**
1. Runs `mobile_createNativeModule` with `module_name: "Gyroscope"` to scaffold the module
2. Implements Swift `CMMotionManager` gyroscope reading in the iOS module
3. Implements Kotlin `SensorManager` gyroscope listener in the Android module
4. Creates TypeScript bindings with `useGyroscope()` hook that returns `{ x, y, z }` rotation rates
5. Adds the module to `expo-module.config.json` and shows how to import it
6. Runs `npx expo prebuild --clean` to regenerate native projects

## Key References

| Resource | URL |
| --- | --- |
| Expo Modules API | https://docs.expo.dev/modules/overview/ |
| Expo Module Tutorial | https://docs.expo.dev/modules/get-started/ |
| Turbo Modules | https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules |
| Flutter Platform Channels | https://docs.flutter.dev/platform-integration/platform-channels |
| JSI (JS Interface) | https://reactnative.dev/docs/the-new-architecture/why |

## MCP Usage

| Tool | When |
| --- | --- |
| `mobile_createNativeModule` | Scaffold module with Swift/Kotlin stubs and TS/Dart bindings |
| `mobile_checkNativeCompat` | Verify existing packages support New Architecture |
| `mobile_checkBuildHealth` | Verify the project builds after adding native code |

## Common Pitfalls

- **Missing prebuild**  - after adding an Expo module, run `npx expo prebuild --clean` to regenerate native projects.
- **Forgetting both platforms**  - always implement Swift AND Kotlin; crashing on one platform is a common oversight.
- **Thread safety**  - native modules run on the native thread; UI updates need `DispatchQueue.main` (iOS) or `runOnUiThread` (Android).
- **Memory leaks**  - clean up listeners and observers in `OnDestroy` / `deinit`.
- **Expo Go incompatibility**  - custom native modules require a dev build, not Expo Go.
- **Missing config**  - `expo-module.config.json` must list your module class names for auto-linking.

## See Also

- `mobile-config-plugins`  - modify native project config without ejecting
- `mobile-sdk-upgrade`  - ensure native modules remain compatible after upgrades
- `mobile-debugging`  - debug native module crashes with Xcode/Android Studio

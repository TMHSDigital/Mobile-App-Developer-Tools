---
name: mobile-config-plugins
description: Expo config plugin authoring, CNG patterns, native project modification, and Xcode/Gradle automation
standards-version: 1.7.0
---

# Mobile Config Plugins

## Trigger

Use this skill when the developer asks about:
- Creating or customizing Expo config plugins
- Modifying app.json/app.config.js programmatically
- Continuous Native Generation (CNG) patterns
- Modifying Xcode project settings (Info.plist, entitlements, build settings)
- Modifying Android manifest, build.gradle, or proguard rules
- Prebuild hooks and native project automation
- Adding native configuration without ejecting from Expo

## Required Inputs

| Input | Description |
| --- | --- |
| Framework | `expo` (config plugins are Expo-specific) |
| Target | What native config needs to change (plist, manifest, gradle, etc.) |

## Workflow

### 1. Understanding Config Plugins

Config plugins modify native project files during `npx expo prebuild`. They run at build time, not runtime, and let you customize iOS/Android without maintaining native directories manually.

```
app.json/app.config.js → Config Plugins → ios/ and android/ generated
```

### 2. Using Built-in Config Plugins

Many Expo packages include config plugins:

```json
// app.json
{
  "expo": {
    "plugins": [
      ["expo-camera", { "cameraPermission": "Take photos for your journal" }],
      ["expo-location", { "locationAlwaysPermission": "Track runs in background" }],
      "expo-notifications"
    ]
  }
}
```

### 3. Writing a Custom Config Plugin

#### Basic Plugin (withInfoPlist)

```ts
// plugins/withCustomScheme.ts
import { ConfigPlugin, withInfoPlist } from "expo/config-plugins";

const withCustomScheme: ConfigPlugin<{ scheme: string }> = (config, { scheme }) => {
  return withInfoPlist(config, (config) => {
    config.modResults.CFBundleURLTypes = [
      ...(config.modResults.CFBundleURLTypes || []),
      {
        CFBundleURLSchemes: [scheme],
      },
    ];
    return config;
  });
};

export default withCustomScheme;
```

#### Register in app.json

```json
{
  "expo": {
    "plugins": [
      ["./plugins/withCustomScheme", { "scheme": "myapp" }]
    ]
  }
}
```

### 4. Common Modifiers

#### iOS Modifiers

```ts
import {
  withInfoPlist,
  withEntitlementsPlist,
  withXcodeProject,
  withPodfile,
} from "expo/config-plugins";

// Add entitlements (e.g., Apple Pay, push)
withEntitlementsPlist(config, (config) => {
  config.modResults["com.apple.developer.in-app-payments"] = ["merchant.com.myapp"];
  return config;
});

// Modify Xcode project settings
withXcodeProject(config, (config) => {
  const project = config.modResults;
  const targetId = project.getFirstTarget().uuid;
  project.addBuildProperty("SWIFT_VERSION", "5.0", targetId);
  return config;
});
```

#### Android Modifiers

```ts
import {
  withAndroidManifest,
  withAppBuildGradle,
  withProjectBuildGradle,
  withMainActivity,
} from "expo/config-plugins";

// Add intent filter
withAndroidManifest(config, (config) => {
  const mainActivity = config.modResults.manifest.application?.[0]?.activity?.[0];
  if (mainActivity) {
    mainActivity["intent-filter"] = [
      ...(mainActivity["intent-filter"] || []),
      {
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
          { $: { "android:name": "android.intent.category.BROWSABLE" } },
        ],
        data: [{ $: { "android:scheme": "myapp" } }],
      },
    ];
  }
  return config;
});

// Modify app/build.gradle
withAppBuildGradle(config, (config) => {
  if (!config.modResults.contents.includes("enableHermes")) {
    config.modResults.contents = config.modResults.contents.replace(
      "apply plugin: \"com.android.application\"",
      `apply plugin: "com.android.application"\n\nproject.ext.react = [enableHermes: true]`
    );
  }
  return config;
});
```

### 5. Plugin Testing

#### Preview Modifier Output

```bash
# Generate native projects without installing pods/gradle
npx expo prebuild --no-install

# Inspect generated files
cat ios/myapp/Info.plist
cat android/app/src/main/AndroidManifest.xml
```

#### Introspect Mods

```ts
// app.config.ts
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MyApp",
  slug: "myapp",
  _internal: {
    // Debug: log all modifier results
    isDebug: true,
  },
};

export default config;
```

### 6. CNG Best Practices

- **Never edit `ios/` or `android/` directly**  - changes are overwritten by `npx expo prebuild`
- **Always use config plugins** to modify native config
- **Add `ios/` and `android/` to `.gitignore`** when using CNG
- **Test with `npx expo prebuild --clean`** to verify plugins from scratch
- **Version your plugins** alongside app code

## Example Interaction

**User:** "I need to add Apple Pay capability and a custom URL scheme to my Expo app"

**Assistant:**
1. Creates `plugins/withApplePay.ts` using `withEntitlementsPlist` to add the merchant ID
2. Creates `plugins/withCustomScheme.ts` using `withInfoPlist` to register the URL scheme
3. Adds `withAndroidManifest` modifier for the Android intent filter equivalent
4. Registers both plugins in `app.json` under `plugins`
5. Runs `npx expo prebuild --no-install` to preview the generated native files
6. Verifies entitlements and manifest contain the expected entries

## Key References

| Resource | URL |
| --- | --- |
| Config Plugins Intro | https://docs.expo.dev/config-plugins/introduction/ |
| Plugin API Reference | https://docs.expo.dev/config-plugins/plugins-and-mods/ |
| Development Guide | https://docs.expo.dev/config-plugins/development-and-debugging/ |
| CNG Overview | https://docs.expo.dev/workflow/continuous-native-generation/ |
| ExpoConfig Type | https://docs.expo.dev/versions/latest/config/app/ |

## MCP Usage

| Tool | When |
| --- | --- |
| `mobile_createNativeModule` | When the plugin needs a companion native module |
| `mobile_checkBuildHealth` | Verify the project builds after adding plugins |
| `mobile_addPermission` | Add permissions with built-in config plugins |

## Common Pitfalls

- **Editing native dirs directly**  - `npx expo prebuild --clean` wipes manual changes. Always use plugins.
- **Plugin ordering**  - plugins execute in array order; some depend on others running first.
- **Missing TypeScript types**  - import from `expo/config-plugins`, not `@expo/config-plugins`.
- **Stale prebuild**  - run `--clean` when debugging; incremental prebuild can mask issues.
- **Config vs runtime**  - plugins run at build time, not runtime. Don't put runtime logic in plugins.
- **Missing return**  - every modifier function must return the modified config object.

## See Also

- `mobile-native-modules`  - create native code that config plugins wire up
- `mobile-permissions`  - add permissions using existing config plugins
- `mobile-deep-links`  - deep link config that uses config plugins internally

---
name: mobile-theming
description: Design tokens, dark mode, and dynamic theming for React Native/Expo and Flutter apps
standards-version: 1.7.0
---

# Mobile Theming & Dark Mode

## Trigger

Use this skill when the developer asks about:
- Setting up a theme system, design tokens, or color palettes
- Implementing dark mode or light/dark theme switching
- System appearance detection and automatic theme matching
- NativeWind or Tailwind theming in React Native
- Material 3 / Material You / dynamic color in Flutter
- Persisting user theme preference
- Semantic color naming or token-based styling

## Required Inputs

| Input | Description |
| --- | --- |
| Framework | `expo` (React Native) or `flutter` |
| Scope | Full theme setup or just dark mode toggle |

## Workflow

### 1. Generate Design Tokens

Run `mobile_setupTheming` to scaffold the token system:

```
Use MCP tool: mobile_setupTheming
  framework: "expo"  (or "flutter")
  output_directory: "lib"
```

This creates:
- **Token file**  - colors (light + dark), spacing scale, typography scale, border radii
- **Theme provider** (Expo) or **ThemeData builder** (Flutter)

### 2. React Native / Expo Setup

#### Token-Based Approach (Recommended)

```tsx
import { ThemeProvider, useTheme } from "@/lib/theme/theme-provider";

// Root layout
export default function RootLayout() {
  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}

// Any component
function ProfileCard() {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surface, padding: spacing.md }}>
      <Text style={{ color: colors.text, ...typography.headline }}>
        Profile
      </Text>
    </View>
  );
}
```

#### NativeWind Approach

```tsx
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0A84FF" },
        surface: { light: "#F2F2F7", dark: "#1C1C1E" },
      },
    },
  },
};

// Component
<View className="bg-surface-light dark:bg-surface-dark p-4">
  <Text className="text-black dark:text-white text-lg font-semibold">
    Profile
  </Text>
</View>
```

#### System Appearance Detection

```tsx
import { useColorScheme } from "react-native";

const systemScheme = useColorScheme(); // "light" | "dark" | null
```

#### Persisting Preference

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

await AsyncStorage.setItem("@theme", "dark");
const stored = await AsyncStorage.getItem("@theme");
```

### 3. Flutter Setup

#### Material 3 ThemeData

```dart
MaterialApp(
  theme: AppTheme.light(),
  darkTheme: AppTheme.dark(),
  themeMode: ThemeMode.system,
  home: const HomeScreen(),
);
```

#### Accessing Colors in Widgets

```dart
final colorScheme = Theme.of(context).colorScheme;

Container(
  color: colorScheme.surface,
  child: Text(
    'Profile',
    style: TextStyle(color: colorScheme.onSurface),
  ),
);
```

#### Material You / Dynamic Color (Android 12+)

```dart
// pubspec.yaml: dynamic_color: ^1.7.0

DynamicColorBuilder(
  builder: (lightDynamic, darkDynamic) {
    return MaterialApp(
      theme: ThemeData(colorScheme: lightDynamic ?? AppTheme.light().colorScheme),
      darkTheme: ThemeData(colorScheme: darkDynamic ?? AppTheme.dark().colorScheme),
      themeMode: ThemeMode.system,
    );
  },
);
```

#### Persisting Theme Preference

```dart
// pubspec.yaml: shared_preferences: ^2.2.0

final prefs = await SharedPreferences.getInstance();
await prefs.setString('theme_mode', 'dark');
final stored = prefs.getString('theme_mode');
```

## Key References

| Resource | URL |
| --- | --- |
| React Native useColorScheme | https://reactnative.dev/docs/usecolorscheme |
| NativeWind Dark Mode | https://www.nativewind.dev/v4/guides/dark-mode |
| Material 3 for Flutter | https://m3.material.io/develop/flutter |
| dynamic_color package | https://pub.dev/packages/dynamic_color |
| AsyncStorage | https://react-native-async-storage.github.io/async-storage/ |

## Example Interaction

**User:** "Add dark mode to my Expo app with system appearance detection"

**Assistant:**
1. Runs `mobile_setupTheming` with `framework: "expo"` to generate token file and ThemeProvider
2. Shows how to wrap the root layout with `<ThemeProvider>`
3. Demonstrates `useTheme()` hook to access colors, spacing, typography
4. Adds a theme toggle with system/light/dark options persisted via AsyncStorage
5. Sets StatusBar barStyle based on current theme

## MCP Usage

| Tool | When |
| --- | --- |
| `mobile_setupTheming` | Generate the full theme scaffold (tokens + provider) |

## Common Pitfalls

- **Hardcoded colors**  - use tokens, not raw hex values. The `mobile-color-contrast` rule catches this.
- **Forgetting StatusBar**  - set `StatusBar` barStyle to match the current theme.
- **Not testing both modes**  - always preview in light AND dark before shipping.
- **Ignoring system preference**  - default to system appearance; let users override.
- **Missing elevation/shadow in dark mode**  - dark surfaces use lighter tints, not shadows.
- **Opacity-based dark mode**  - avoid simply reducing opacity; use distinct dark palette colors.

## See Also

- `mobile-accessibility-testing`  - verify contrast ratios meet WCAG AA
- `mobile-component-patterns`  - component architecture with theme-aware styling
- `mobile-app-store-prep`  - dark mode screenshots for store listings

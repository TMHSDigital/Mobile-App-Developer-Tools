---
name: mobile-navigation-setup
description: Set up file-based navigation in an Expo Router project. Covers tab layouts, stack navigation, drawer navigation, typed routes, dynamic segments, deep linking, and layout composition. Use when the user wants to add screens, tabs, or navigation flows.
---

# Mobile Navigation Setup

## Trigger

Use this skill when the user:

- Wants to add tabs, a drawer, or stack navigation to an Expo app
- Asks how Expo Router file-based routing works
- Needs to add a screen or route group
- Wants to set up deep linking or typed routes
- Mentions "navigation", "tabs", "stack", "drawer", "routes", or "linking"

## Required Inputs

- **Navigation type**: tabs, stack, drawer, or a combination
- **Screen list**: which screens/tabs the user wants
- **Deep link scheme** (optional): custom URL scheme for deep linking

## Workflow

1. **Confirm Expo Router is installed.** It ships with `create-expo-app` by default. If the project was set up manually:

   ```bash
   npx expo install expo-router expo-linking expo-constants
   ```

2. **Explain the `app/` directory convention.** Expo Router uses file-system routing:

   ```
   app/
   ├── _layout.tsx           # Root layout (wraps everything)
   ├── index.tsx              # "/" route (home)
   ├── +not-found.tsx         # Catch-all 404
   ├── (tabs)/                # Tab group
   │   ├── _layout.tsx        # Tab bar configuration
   │   ├── index.tsx          # First tab
   │   ├── search.tsx         # Second tab
   │   └── profile.tsx        # Third tab
   ├── settings/              # Stack group
   │   ├── _layout.tsx        # Stack navigator config
   │   ├── index.tsx          # Settings home
   │   └── [id].tsx           # Dynamic route: /settings/123
   └── modal.tsx              # Modal screen (presented modally via root layout)
   ```

   Key conventions:
   - `_layout.tsx` files define the navigator for that directory
   - Parenthesized directories like `(tabs)` are route groups (do not appear in the URL)
   - `[param].tsx` files are dynamic segments
   - `+not-found.tsx` is the 404 handler

3. **Create the root layout.** The root `_layout.tsx` wraps the entire app:

   ```tsx
   import { Stack } from "expo-router";

   export default function RootLayout() {
     return (
       <Stack>
         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
         <Stack.Screen name="modal" options={{ presentation: "modal" }} />
       </Stack>
     );
   }
   ```

4. **Create a tab layout.** Inside `app/(tabs)/_layout.tsx`:

   ```tsx
   import { Tabs } from "expo-router";
   import { Ionicons } from "@expo/vector-icons";

   export default function TabLayout() {
     return (
       <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF" }}>
         <Tabs.Screen
           name="index"
           options={{
             title: "Home",
             tabBarIcon: ({ color, size }) => (
               <Ionicons name="home" size={size} color={color} />
             ),
           }}
         />
         <Tabs.Screen
           name="search"
           options={{
             title: "Search",
             tabBarIcon: ({ color, size }) => (
               <Ionicons name="search" size={size} color={color} />
             ),
           }}
         />
         <Tabs.Screen
           name="profile"
           options={{
             title: "Profile",
             tabBarIcon: ({ color, size }) => (
               <Ionicons name="person" size={size} color={color} />
             ),
           }}
         />
       </Tabs>
     );
   }
   ```

5. **Set up typed routes.** Enable typed routes in `app.json` for autocompletion and type safety:

   ```json
   {
     "expo": {
       "experiments": {
         "typedRoutes": true
       }
     }
   }
   ```

   Then generate types:

   ```bash
   npx expo customize tsconfig.json
   ```

   Usage with typed routes:

   ```tsx
   import { useRouter } from "expo-router";

   const router = useRouter();
   router.push("/settings/42");        // Typed and validated
   router.push("/(tabs)/profile");     // Group paths work too
   ```

6. **Dynamic segments.** For routes like `/settings/[id]`:

   ```tsx
   import { useLocalSearchParams } from "expo-router";

   export default function SettingsDetail() {
     const { id } = useLocalSearchParams<{ id: string }>();
     return <Text>Setting: {id}</Text>;
   }
   ```

7. **Deep linking.** Set the `scheme` in `app.json`:

   ```json
   {
     "expo": {
       "scheme": "myapp"
     }
   }
   ```

   This enables `myapp://settings/42` to open the dynamic route. Expo Router handles the mapping automatically because routes mirror the file system.

8. **Generate screens using MCP.** Use the `mobile_generateScreen` tool for quick scaffolding:

   ```
   mobile_generateScreen(name: "profile", type: "tab", layout_group: "(tabs)")
   ```

## Key References

- [Expo Router: File-based routing](https://docs.expo.dev/router/introduction/)
- [Expo Router: Tabs](https://docs.expo.dev/router/layouts/tabs/)
- [Expo Router: Stack](https://docs.expo.dev/router/layouts/stack/)
- [Expo Router: Typed routes](https://docs.expo.dev/router/reference/typed-routes/)
- [Expo Router: Deep linking](https://docs.expo.dev/guides/deep-linking/)

## Example Interaction

**User:** "I want my app to have a tab bar with Home, Search, and Profile tabs, plus a Settings screen that opens as a stack."

**Agent:**
1. Checks that Expo Router is installed
2. Creates `app/(tabs)/_layout.tsx` with three tab screens
3. Creates `app/(tabs)/index.tsx`, `search.tsx`, `profile.tsx`
4. Creates `app/settings/_layout.tsx` as a Stack
5. Creates `app/settings/index.tsx`
6. Updates root `app/_layout.tsx` to include both groups
7. Enables typed routes in `app.json`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Scaffold a screen | `mobile_generateScreen` | Create a new screen file with correct Expo Router convention |
| Install nav packages | `mobile_installDependency` | Install expo-router or related packages via `npx expo install` |
| Verify environment | `mobile_checkDevEnvironment` | Confirm Expo CLI and Node are available |

## Common Pitfalls

1. **Forgetting `_layout.tsx`** - Every route group needs a layout file. Without it, screens in that directory will not render.
2. **Nesting navigators manually** - Expo Router replaces manual `NavigationContainer` setup. Do not import from `@react-navigation/native` directly.
3. **Using `index.tsx` as a catch-all** - `index.tsx` only matches the exact path of its parent directory, not nested paths.
4. **Group names in URLs** - Parenthesized groups like `(tabs)` do not appear in the URL. `/(tabs)/profile` is accessed as `/profile` externally.
5. **Missing `scheme` for deep links** - Deep linking will not work without setting `scheme` in `app.json`. It also needs to be unique across apps on the device.
6. **Drawer navigator not installed** - `expo-router` ships Stack and Tabs. For drawers, install `@react-navigation/drawer` and `react-native-gesture-handler`.

## See Also

- [Mobile Project Setup](../mobile-project-setup/SKILL.md) - create the Expo project before adding navigation
- [Mobile Component Patterns](../mobile-component-patterns/SKILL.md) - build reusable components to use inside screens

---
name: mobile-flutter-navigation
description: Set up navigation in a Flutter app using GoRouter. Covers declarative routing, route guards, shell routes for tabs, typed routes, deep linking, and platform-adaptive transitions. Use when the user wants to add screens or navigation flows in Flutter.
---

# Flutter Navigation

## Trigger

Use this skill when the user:

- Wants to add navigation to a Flutter app
- Asks about GoRouter, Navigator 2.0, or routing
- Needs tabs, drawer, or nested navigation in Flutter
- Wants auth-protected routes or route guards
- Asks about deep linking in Flutter
- Mentions "go_router", "routes", "navigation", "tabs", or "deep link" in a Flutter context

## Required Inputs

- **Navigation type**: tabs, stack, drawer, or combination
- **Auth-gated routes** (optional): which routes require authentication
- **Deep link scheme** (optional): custom URL scheme for deep linking

## Workflow

1. **Install GoRouter.**

   ```bash
   flutter pub add go_router
   ```

   GoRouter is the officially recommended routing package for Flutter. It wraps Navigator 2.0 with a declarative API.

2. **Define the router.** Create `lib/core/router.dart`:

   ```dart
   import 'package:flutter/material.dart';
   import 'package:go_router/go_router.dart';

   final router = GoRouter(
     initialLocation: '/',
     routes: [
       GoRoute(
         path: '/',
         builder: (context, state) => const HomeScreen(),
       ),
       GoRoute(
         path: '/details/:id',
         builder: (context, state) {
           final id = state.pathParameters['id']!;
           return DetailsScreen(id: id);
         },
       ),
       GoRoute(
         path: '/settings',
         builder: (context, state) => const SettingsScreen(),
       ),
     ],
   );
   ```

3. **Wire it into MaterialApp.** In `lib/app.dart`:

   ```dart
   import 'package:flutter/material.dart';
   import 'core/router.dart';

   class App extends StatelessWidget {
     const App({super.key});

     @override
     Widget build(BuildContext context) {
       return MaterialApp.router(
         routerConfig: router,
         title: 'My App',
         theme: ThemeData(
           colorSchemeSeed: Colors.blue,
           useMaterial3: true,
         ),
       );
     }
   }
   ```

4. **Add shell routes for tabs.** Tabs with persistent bottom navigation:

   ```dart
   final router = GoRouter(
     initialLocation: '/home',
     routes: [
       StatefulShellRoute.indexedStack(
         builder: (context, state, navigationShell) {
           return ScaffoldWithNavBar(navigationShell: navigationShell);
         },
         branches: [
           StatefulShellBranch(
             routes: [
               GoRoute(
                 path: '/home',
                 builder: (context, state) => const HomeScreen(),
               ),
             ],
           ),
           StatefulShellBranch(
             routes: [
               GoRoute(
                 path: '/search',
                 builder: (context, state) => const SearchScreen(),
                 routes: [
                   GoRoute(
                     path: 'results',
                     builder: (context, state) => const ResultsScreen(),
                   ),
                 ],
               ),
             ],
           ),
           StatefulShellBranch(
             routes: [
               GoRoute(
                 path: '/profile',
                 builder: (context, state) => const ProfileScreen(),
               ),
             ],
           ),
         ],
       ),
     ],
   );
   ```

   The scaffold widget:

   ```dart
   class ScaffoldWithNavBar extends StatelessWidget {
     final StatefulNavigationShell navigationShell;

     const ScaffoldWithNavBar({super.key, required this.navigationShell});

     @override
     Widget build(BuildContext context) {
       return Scaffold(
         body: navigationShell,
         bottomNavigationBar: NavigationBar(
           selectedIndex: navigationShell.currentIndex,
           onDestinationSelected: (index) {
             navigationShell.goBranch(
               index,
               initialLocation: index == navigationShell.currentIndex,
             );
           },
           destinations: const [
             NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
             NavigationDestination(icon: Icon(Icons.search), label: 'Search'),
             NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
           ],
         ),
       );
     }
   }
   ```

5. **Add auth route guards.** Redirect unauthenticated users:

   ```dart
   final router = GoRouter(
     initialLocation: '/',
     redirect: (context, state) {
       final isLoggedIn = authNotifier.isLoggedIn;
       final isOnLoginPage = state.matchedLocation == '/login';

       if (!isLoggedIn && !isOnLoginPage) return '/login';
       if (isLoggedIn && isOnLoginPage) return '/';
       return null;
     },
     routes: [
       GoRoute(
         path: '/login',
         builder: (context, state) => const LoginScreen(),
       ),
       // ... protected routes
     ],
   );
   ```

   With Riverpod, use `refreshListenable` to re-evaluate the redirect when auth state changes:

   ```dart
   GoRouter(
     refreshListenable: authNotifier,
     redirect: (context, state) {
       // ...
     },
   );
   ```

6. **Navigate programmatically.**

   ```dart
   // Push a route
   context.go('/details/123');

   // Push on top of current (adds to back stack)
   context.push('/details/123');

   // Go back
   context.pop();

   // Replace current route
   context.pushReplacement('/home');

   // Pass extra data
   context.go('/details/123', extra: myObject);
   final data = GoRouterState.of(context).extra as MyObject;
   ```

7. **Configure deep linking.** iOS `Info.plist`:

   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>myapp</string>
       </array>
     </dict>
   </array>
   ```

   Android `AndroidManifest.xml`:

   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="myapp" />
   </intent-filter>
   ```

   GoRouter handles deep links automatically - incoming URLs are matched against your route definitions.

## Key References

- [GoRouter documentation](https://pub.dev/packages/go_router)
- [Flutter navigation overview](https://docs.flutter.dev/ui/navigation)
- [Deep linking in Flutter](https://docs.flutter.dev/ui/navigation/deep-linking)
- [StatefulShellRoute](https://pub.dev/documentation/go_router/latest/go_router/StatefulShellRoute-class.html)

## Example Interaction

**User:** "I want tab navigation with Home, Search, and Profile in my Flutter app."

**Agent:**
1. Installs go_router via `flutter pub add go_router`
2. Creates `lib/core/router.dart` with `StatefulShellRoute.indexedStack` and three branches
3. Creates `ScaffoldWithNavBar` widget with `NavigationBar`
4. Creates placeholder screens for each tab
5. Wires router into `MaterialApp.router` in `lib/app.dart`
6. Shows how to add sub-routes within each tab branch

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Check environment | `mobile_checkDevEnvironment` | Verify Flutter SDK is installed |
| Check build | `mobile_checkBuildHealth` | Verify project builds after adding routes |

## Common Pitfalls

1. **Using Navigator.push instead of GoRouter** - Mixing imperative `Navigator.push` with GoRouter breaks deep linking and URL sync. Use `context.go()` and `context.push()` exclusively.
2. **Not using StatefulShellRoute for tabs** - Using a simple `ShellRoute` recreates tab content on every switch. `StatefulShellRoute.indexedStack` preserves tab state.
3. **Redirect returning wrong value** - `redirect` must return `null` to allow navigation, not an empty string. An empty string redirects to root.
4. **Missing refreshListenable** - Without it, auth state changes do not trigger route re-evaluation. The user stays on a protected screen after logging out.
5. **Passing complex objects via `extra`** - `extra` is not restored from deep links or browser URLs. Use path/query parameters for data that must survive app restart.
6. **Forgetting to add deep link scheme to both platforms** - Deep links must be configured in both `Info.plist` (iOS) and `AndroidManifest.xml` (Android).

## See Also

- [Flutter Project Setup](../mobile-flutter-project-setup/SKILL.md) - project creation where router is configured
- [Flutter State Management](../mobile-flutter-state-management/SKILL.md) - Riverpod for auth state used in route guards
- [Flutter Run on Device](../mobile-flutter-run-on-device/SKILL.md) - test deep links on a real device

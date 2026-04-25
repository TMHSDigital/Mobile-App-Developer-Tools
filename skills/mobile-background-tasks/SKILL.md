---
name: mobile-background-tasks
description: Schedule and manage background tasks in React Native/Expo and Flutter apps. Covers expo-task-manager and expo-background-fetch for React Native, WorkManager (Android) and BGTaskScheduler (iOS) for native scheduling, headless JS, and Flutter Workmanager. Includes OS-imposed constraints, battery optimization, retry policies, minimum intervals, and testing background execution. Use when the user needs background data sync, periodic fetches, background location, or scheduled maintenance tasks.
standards-version: 1.7.0
---

# Mobile Background Tasks

## Trigger

Use this skill when the user:

- Needs periodic data sync while the app is backgrounded or closed
- Asks about background fetch, background processing, or scheduled tasks
- Wants background location tracking or geofence monitoring
- Mentions "background task", "WorkManager", "BGTaskScheduler", "headless JS", "background fetch", or "periodic sync"
- Needs to run code when the app is not in the foreground

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Task type**: periodic fetch, one-time work, background location, or event-driven
- **Constraints**: network requirement, battery level, charging status
- **Minimum interval**: how often the task should run (minimum ~15 minutes on most OS versions)

## Workflow

1. **Understand OS limitations.** Background execution is heavily restricted:

   | Platform | Minimum interval | Kill behavior | Constraints |
   |----------|-----------------|---------------|-------------|
   | iOS | ~15 min (system decides) | Aggressive kill after ~30s | BGTaskScheduler or Background Modes |
   | Android | 15 min (WorkManager) | Doze mode delays | Battery optimization, exact alarms need permission |

   The OS decides when to actually run your task. You request a minimum interval; the system may delay it based on battery, network, and usage patterns.

2. **Set up Expo background fetch (React Native):**

   ```bash
   npx expo install expo-task-manager expo-background-fetch
   ```

   ```tsx
   import * as BackgroundFetch from "expo-background-fetch";
   import * as TaskManager from "expo-task-manager";

   const BACKGROUND_SYNC_TASK = "background-sync";

   TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
     try {
       const pendingChanges = await getPendingChanges();
       if (pendingChanges.length === 0) {
         return BackgroundFetch.BackgroundFetchResult.NoData;
       }

       await syncToServer(pendingChanges);
       return BackgroundFetch.BackgroundFetchResult.NewData;
     } catch {
       return BackgroundFetch.BackgroundFetchResult.Failed;
     }
   });

   export async function registerBackgroundSync(): Promise<void> {
     await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
       minimumInterval: 15 * 60, // 15 minutes
       stopOnTerminate: false,
       startOnBoot: true,
     });
   }
   ```

3. **Set up Flutter Workmanager:**

   ```yaml
   dependencies:
     workmanager: ^0.5.2
   ```

   ```dart
   import 'package:workmanager/workmanager.dart';

   const backgroundSyncTask = 'backgroundSync';

   @pragma('vm:entry-point')
   void callbackDispatcher() {
     Workmanager().executeTask((task, inputData) async {
       switch (task) {
         case backgroundSyncTask:
           final pending = await getPendingChanges();
           if (pending.isNotEmpty) {
             await syncToServer(pending);
           }
           return true;
         default:
           return false;
       }
     });
   }

   Future<void> registerBackgroundSync() async {
     await Workmanager().initialize(callbackDispatcher);
     await Workmanager().registerPeriodicTask(
       'sync-task',
       backgroundSyncTask,
       frequency: const Duration(minutes: 15),
       constraints: Constraints(
         networkType: NetworkType.connected,
         requiresBatteryNotLow: true,
       ),
     );
   }
   ```

4. **Background location tracking (Expo):**

   ```bash
   npx expo install expo-location expo-task-manager
   ```

   ```tsx
   import * as Location from "expo-location";
   import * as TaskManager from "expo-task-manager";

   const LOCATION_TASK = "background-location";

   TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
     if (error) return;
     const { locations } = data as { locations: Location.LocationObject[] };
     await saveLocations(locations);
   });

   export async function startBackgroundLocation(): Promise<void> {
     const { status } = await Location.requestBackgroundPermissionsAsync();
     if (status !== "granted") return;

     await Location.startLocationUpdatesAsync(LOCATION_TASK, {
       accuracy: Location.Accuracy.Balanced,
       distanceInterval: 100, // meters
       deferredUpdatesInterval: 60000, // batch every 60s
       showsBackgroundLocationIndicator: true,
     });
   }
   ```

5. **Headless JS (React Native, Android only).** Run JS code when the app is killed:

   ```tsx
   // index.js
   import { AppRegistry } from "react-native";

   const HeadlessTask = async (taskData) => {
     const { action } = taskData;
     if (action === "sync") {
       await performSync();
     }
   };

   AppRegistry.registerHeadlessTask("BackgroundSync", () => HeadlessTask);
   ```

   Trigger from a native Android service (requires a custom native module or config plugin).

6. **Test background tasks.** Background tasks are notoriously hard to test:

   - **iOS Simulator:** Use Debug > Simulate Background Fetch in Xcode
   - **Android:** `adb shell cmd jobscheduler run -f <package> <job-id>`
   - **Expo:** `expo-background-fetch` supports a `BackgroundFetch.getStatusAsync()` check
   - Always test on a real device with the app fully closed (swipe away)
   - Test with airplane mode to verify the task handles no-network gracefully

## Key References

- [expo-background-fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [expo-task-manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Android WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [iOS BGTaskScheduler](https://developer.apple.com/documentation/backgroundtasks)
- [Flutter Workmanager](https://pub.dev/packages/workmanager)

## Example Interaction

**User:** "I need to sync offline data to my server every 15 minutes, even when the app is closed."

**Agent:**
1. Installs `expo-task-manager` and `expo-background-fetch` via `mobile_installDependency`
2. Defines a `background-sync` task that reads pending mutations and POSTs them
3. Registers the task with `minimumInterval: 900` (15 minutes)
4. Returns the appropriate `BackgroundFetchResult` based on sync outcome
5. Adds a `syncStatus` indicator in the app UI
6. Tests with Xcode "Simulate Background Fetch" and `adb shell` commands
7. Warns about iOS aggressive background task throttling

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install packages | `mobile_installDependency` | Install expo-task-manager, expo-background-fetch |
| Add permission | `mobile_addPermission` | Add background location permission if needed |
| Check offline | `mobile_checkOfflineReady` | Verify offline queue exists for background sync |
| Check build | `mobile_checkBuildHealth` | Verify config plugins are wired correctly |

## Common Pitfalls

1. **Expecting exact timing** - The OS decides when to run background tasks. A 15-minute interval may actually fire every 30-60 minutes depending on battery state and app usage frequency. Never promise exact timing to users.
2. **Long-running background tasks** - iOS kills background tasks after ~30 seconds. Keep tasks short: sync a batch, not the entire database. Use `beginBackgroundTask` for slightly longer work.
3. **Not returning a result** - `BackgroundFetch.BackgroundFetchResult.NewData` tells the OS your task was productive. Returning `NoData` too often causes the OS to reduce your task frequency.
4. **Missing permissions** - Background location requires `NSLocationAlwaysAndWhenInUseUsageDescription` on iOS and `ACCESS_BACKGROUND_LOCATION` on Android 10+. Without them, background location silently fails.
5. **Battery drain** - Aggressive background tasks drain the battery and cause users to uninstall. Use constraints (network required, battery not low) and reasonable intervals.
6. **Not handling app restart** - Tasks registered with `stopOnTerminate: false` and `startOnBoot: true` survive app kills and reboots. But the task definition must be in a top-level file that runs before any React component.

## See Also

- [Mobile Offline Sync](../mobile-offline-sync/SKILL.md) - offline-first data architecture
- [Mobile Push Notifications](../mobile-push-notifications/SKILL.md) - wake the app via push instead of polling
- [Mobile Permissions](../mobile-permissions/SKILL.md) - requesting background location permissions
- [Mobile Analytics](../mobile-analytics/SKILL.md) - tracking background task success/failure rates

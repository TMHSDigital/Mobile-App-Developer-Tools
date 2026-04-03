---
name: mobile-permissions
description: Handle runtime permissions in a React Native/Expo app. Covers camera, location, contacts, media library, notifications, and microphone with iOS rationale strings and Android manifest config. Use when the user needs to request device permissions.
---

# Mobile Permissions

## Trigger

Use this skill when the user:

- Needs to request a device permission (camera, location, contacts, etc.)
- Gets a permission denied error
- Asks about iOS usage description strings or Android manifest permissions
- Wants to handle the "don't ask again" / permanently blocked state
- Mentions "permission", "Info.plist", "NSCameraUsageDescription", "rationale", or "settings"

## Required Inputs

- **Permission type**: camera, location, contacts, media-library, notifications, microphone, or calendar
- **Use case**: Why the app needs this permission (used for the rationale string)
- **When to request**: On app launch, on first use of the feature, or on a specific screen

## Workflow

1. **Understand the permission lifecycle.** Every permission follows this flow:

   ```
   Not Determined  -->  Request  -->  Granted
                                 -->  Denied  -->  Can Ask Again?
                                                   Yes: request again
                                                   No: link to Settings
   ```

   On iOS, you get one chance to show the system dialog. After the user denies, you must send them to Settings.
   On Android 11+, after two denials, the system permanently blocks the dialog.

2. **Install the Expo module.** Each permission comes from its own package:

   | Permission | Package | Hook |
   |---|---|---|
   | Camera | `expo-camera` | `useCameraPermissions()` |
   | Location | `expo-location` | N/A, use `requestForegroundPermissionsAsync()` |
   | Contacts | `expo-contacts` | N/A, use `requestPermissionsAsync()` |
   | Media Library | `expo-media-library` | `usePermissions()` |
   | Notifications | `expo-notifications` | N/A, use `requestPermissionsAsync()` |
   | Microphone | `expo-av` | N/A, use `Audio.requestPermissionsAsync()` |
   | Calendar | `expo-calendar` | N/A, use `requestCalendarPermissionsAsync()` |

   Install with:

   ```bash
   npx expo install expo-camera  # or whichever package you need
   ```

3. **Request permission with pre-check.** Always check current status before requesting:

   ```tsx
   import * as Location from "expo-location";
   import { Alert, Linking, Platform } from "react-native";

   async function requestLocationPermission(): Promise<boolean> {
     const { status: existing } =
       await Location.getForegroundPermissionsAsync();

     if (existing === "granted") return true;

     const { status, canAskAgain } =
       await Location.requestForegroundPermissionsAsync();

     if (status === "granted") return true;

     if (!canAskAgain) {
       Alert.alert(
         "Location Permission Required",
         "Location access was denied. Open Settings to enable it.",
         [
           { text: "Cancel", style: "cancel" },
           {
             text: "Open Settings",
             onPress: () => {
               if (Platform.OS === "ios") {
                 Linking.openURL("app-settings:");
               } else {
                 Linking.openSettings();
               }
             },
           },
         ],
       );
     }

     return false;
   }
   ```

4. **Create a reusable permission hook.** Generalize the pattern:

   ```tsx
   import { useState, useCallback, useEffect } from "react";
   import { Alert, Linking, Platform } from "react-native";

   interface PermissionResult {
     status: "undetermined" | "granted" | "denied";
     canAskAgain: boolean;
   }

   interface UsePermissionOptions {
     name: string;
     getPermission: () => Promise<PermissionResult>;
     requestPermission: () => Promise<PermissionResult>;
   }

   export function usePermission({
     name,
     getPermission,
     requestPermission,
   }: UsePermissionOptions) {
     const [granted, setGranted] = useState(false);
     const [checked, setChecked] = useState(false);

     useEffect(() => {
       getPermission().then((result) => {
         setGranted(result.status === "granted");
         setChecked(true);
       });
     }, []);

     const request = useCallback(async () => {
       const result = await requestPermission();
       if (result.status === "granted") {
         setGranted(true);
         return true;
       }

       if (!result.canAskAgain) {
         Alert.alert(
           `${name} Permission Required`,
           `${name} access was denied. Open Settings to enable it.`,
           [
             { text: "Cancel", style: "cancel" },
             {
               text: "Open Settings",
               onPress: () => {
                 Platform.OS === "ios"
                   ? Linking.openURL("app-settings:")
                   : Linking.openSettings();
               },
             },
           ],
         );
       }

       return false;
     }, [name, requestPermission]);

     return { granted, checked, request };
   }
   ```

5. **Add iOS rationale strings.** Configure in `app.json` via Expo config plugins:

   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-camera",
           {
             "cameraPermission": "$(PRODUCT_NAME) needs camera access to take photos."
           }
         ],
         [
           "expo-location",
           {
             "locationAlwaysAndWhenInUsePermission": "$(PRODUCT_NAME) uses your location to show nearby places.",
             "locationAlwaysPermission": "$(PRODUCT_NAME) uses your location in the background for navigation.",
             "locationWhenInUsePermission": "$(PRODUCT_NAME) uses your location to show nearby places."
           }
         ],
         [
           "expo-media-library",
           {
             "photosPermission": "$(PRODUCT_NAME) needs photo library access to save and select photos.",
             "savePhotosPermission": "$(PRODUCT_NAME) saves photos to your library."
           }
         ],
         [
           "expo-contacts",
           {
             "contactsPermission": "$(PRODUCT_NAME) accesses contacts to help you share with friends."
           }
         ]
       ]
     }
   }
   ```

   iOS requires specific `NS*UsageDescription` keys. Expo config plugins generate these automatically from the strings above.

6. **Android-specific considerations.**

   - Android 13+ requires `POST_NOTIFICATIONS` permission for push notifications. Older versions grant it automatically.
   - `ACCESS_FINE_LOCATION` vs `ACCESS_COARSE_LOCATION`: fine gives GPS-level accuracy, coarse gives city-block accuracy. Request the minimum you need.
   - Background location (`ACCESS_BACKGROUND_LOCATION`) requires a separate request after foreground location is granted. Google Play requires a privacy policy justifying it.

7. **Best practices for timing.** When to ask matters for approval rates:

   - Request permission at the moment the user tries to use the feature, not on app launch
   - Show a custom "pre-permission" screen explaining why before triggering the system dialog
   - If denied, do not block the entire app. Degrade gracefully and offer the feature again later with context

## Key References

- [Expo permissions overview](https://docs.expo.dev/guides/permissions/)
- [expo-camera permissions](https://docs.expo.dev/versions/latest/sdk/camera/#permissions)
- [expo-location permissions](https://docs.expo.dev/versions/latest/sdk/location/#permissions)
- [expo-notifications permissions](https://docs.expo.dev/versions/latest/sdk/notifications/#permissions)
- [Apple: Requesting access to protected resources](https://developer.apple.com/documentation/uikit/protecting_the_user_s_privacy/requesting_access_to_protected_resources)

## Example Interaction

**User:** "My app needs location and camera. How do I handle permissions properly?"

**Agent:**
1. Installs `expo-camera` and `expo-location` with `mobile_installDependency`
2. Adds permission rationale strings with `mobile_addPermission` for both
3. Creates the reusable `usePermission` hook
4. Implements a pre-permission screen explaining why the app needs these
5. Handles denied and permanently blocked states with Settings links
6. Notes that both require dev builds (not Expo Go)

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Add permission config | `mobile_addPermission` | Add permission rationale to app.json for any supported type |
| Install permission package | `mobile_installDependency` | Install the Expo package for the needed permission |
| Scaffold permission screen | `mobile_generateScreen` | Create a pre-permission explanation screen |
| Verify build | `mobile_checkBuildHealth` | Confirm the project builds after adding native modules |

## Common Pitfalls

1. **Requesting all permissions on launch** - Users deny permissions they do not understand. Ask at the moment they try to use the feature, with context about why.
2. **Not handling "permanently denied"** - After the user selects "Don't ask again" on Android (or denies on iOS), the system dialog will never appear again. You must link to Settings.
3. **Missing iOS rationale strings** - Apple rejects apps without `NS*UsageDescription` keys. Add them via Expo config plugins in `app.json`.
4. **Requesting background location upfront** - Google Play rejects apps that request `ACCESS_BACKGROUND_LOCATION` without justification. Request foreground first, then background only if needed.
5. **Confusing permission status values** - `undetermined` means never asked. `denied` means asked and refused. `granted` means approved. Check `canAskAgain` to know if the system dialog will show.
6. **Testing only on simulators** - iOS Simulator auto-grants some permissions. Always test permission flows on a physical device.

## See Also

- [Mobile Camera Integration](../mobile-camera-integration/SKILL.md) - uses camera permissions
- [Mobile AI Features](../mobile-ai-features/SKILL.md) - uses camera and microphone permissions

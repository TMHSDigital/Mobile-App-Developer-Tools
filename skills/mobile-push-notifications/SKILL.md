---
name: mobile-push-notifications
description: Add push notifications to an Expo app using expo-notifications and EAS Push. Covers permission requests, token registration, local/remote notifications, foreground/background handlers, Android channels, and deep linking from notifications. Use when the user wants push notifications.
standards-version: 1.7.0
---

# Mobile Push Notifications

## Trigger

Use this skill when the user:

- Wants to add push notifications to their app
- Needs local or remote notifications
- Asks about notification permissions or Android channels
- Wants to handle notification taps for deep linking
- Mentions "push", "notification", "EAS push", "FCM", "APNs", or "expo-notifications"

## Required Inputs

- **Notification type**: local only, remote (push), or both
- **Push service**: EAS Push (recommended for Expo) or custom (FCM/APNs directly)
- **Deep link behavior** (optional): which screen to open when the notification is tapped

## Workflow

1. **Install expo-notifications.**

   ```bash
   npx expo install expo-notifications expo-device expo-constants
   ```

   This requires a development build. Push notifications do not work in Expo Go (SDK 55+ throws an error instead of a warning).

2. **Configure app.json.** Add the notification plugin:

   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#ffffff",
             "defaultChannel": "default"
           }
         ]
       ],
       "android": {
         "useNextNotificationsApi": true
       }
     }
   }
   ```

   Use `mobile_addPushNotifications` to automate this.

3. **Register for push notifications.** Create `lib/notifications.ts`:

   ```tsx
   import * as Notifications from "expo-notifications";
   import * as Device from "expo-device";
   import Constants from "expo-constants";
   import { Platform } from "react-native";

   Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowAlert: true,
       shouldPlaySound: true,
       shouldSetBadge: true,
     }),
   });

   export async function registerForPushNotifications(): Promise<string | null> {
     if (!Device.isDevice) {
       console.warn("Push notifications require a physical device");
       return null;
     }

     const { status: existing } = await Notifications.getPermissionsAsync();
     let finalStatus = existing;

     if (existing !== "granted") {
       const { status } = await Notifications.requestPermissionsAsync();
       finalStatus = status;
     }

     if (finalStatus !== "granted") {
       return null;
     }

     if (Platform.OS === "android") {
       await Notifications.setNotificationChannelAsync("default", {
         name: "Default",
         importance: Notifications.AndroidImportance.MAX,
         vibrationPattern: [0, 250, 250, 250],
       });
     }

     const projectId = Constants.expoConfig?.extra?.eas?.projectId;
     const token = await Notifications.getExpoPushTokenAsync({ projectId });
     return token.data;
   }
   ```

4. **Handle notifications in the app.** In `app/_layout.tsx` or a dedicated hook:

   ```tsx
   import { useEffect, useRef } from "react";
   import * as Notifications from "expo-notifications";
   import { useRouter } from "expo-router";
   import { registerForPushNotifications } from "@/lib/notifications";

   export function useNotificationHandler() {
     const router = useRouter();
     const responseListener = useRef<Notifications.Subscription>();

     useEffect(() => {
       registerForPushNotifications().then((token) => {
         if (token) {
           // Send token to your backend for storage
           console.log("Push token:", token);
         }
       });

       // Handle notification tap (app was in background or closed)
       responseListener.current =
         Notifications.addNotificationResponseReceivedListener((response) => {
           const data = response.notification.request.content.data;
           if (data?.screen) {
             router.push(data.screen as string);
           }
         });

       return () => {
         if (responseListener.current) {
           Notifications.removeNotificationSubscription(
             responseListener.current,
           );
         }
       };
     }, []);
   }
   ```

5. **Send a push notification via EAS Push.** From your backend:

   ```bash
   curl -X POST https://exp.host/--/api/v2/push/send \
     -H "Content-Type: application/json" \
     -d '{
       "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
       "title": "New message",
       "body": "You have a new message from Alice",
       "data": { "screen": "/chat/123" }
     }'
   ```

   Or from Node.js:

   ```tsx
   import { Expo } from "expo-server-sdk";

   const expo = new Expo();

   await expo.sendPushNotificationsAsync([
     {
       to: pushToken,
       title: "New message",
       body: "You have a new message from Alice",
       data: { screen: "/chat/123" },
       sound: "default",
     },
   ]);
   ```

6. **Local notifications.** For reminders or timers without a server:

   ```tsx
   import * as Notifications from "expo-notifications";

   async function scheduleLocalNotification() {
     await Notifications.scheduleNotificationAsync({
       content: {
         title: "Reminder",
         body: "Time to check your progress!",
         data: { screen: "/progress" },
       },
       trigger: { seconds: 60 * 30, repeats: false },
     });
   }
   ```

## Key References

- [expo-notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [EAS Push service](https://docs.expo.dev/push-notifications/overview/)
- [expo-server-sdk (Node.js)](https://github.com/expo/expo-server-sdk-node)
- [Android notification channels](https://docs.expo.dev/versions/latest/sdk/notifications/#android-notification-channels)

## Example Interaction

**User:** "I want push notifications that open a specific chat screen when tapped."

**Agent:**
1. Installs expo-notifications with `mobile_installDependency`
2. Configures app.json with `mobile_addPushNotifications`
3. Creates `lib/notifications.ts` with token registration and handler setup
4. Implements notification tap handler that routes to `/chat/[id]`
5. Shows how to send a push from the backend with `data: { screen: "/chat/123" }`
6. Sets up an Android notification channel for chat messages

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install packages | `mobile_installDependency` | Install expo-notifications, expo-device, expo-constants |
| Configure app.json | `mobile_addPushNotifications` | Add notification plugin and Android channel config |
| Add permission | `mobile_addPermission` | Add notification permission rationale |
| Configure deep links | `mobile_configureDeepLinks` | Set up scheme for notification deep linking |
| Check build | `mobile_checkBuildHealth` | Verify project builds with native notification module |

## Common Pitfalls

1. **Testing in Expo Go** - Push notifications require a development build. Expo Go does not support them. In SDK 55+, `expo-notifications` throws an error (not a warning) when used in Expo Go.
2. **iOS/tvOS minimum** - SDK 55 raises the minimum deployment target for `expo-notifications` to iOS/tvOS 16.4. Older devices will not receive notifications.
3. **Testing on simulators** - Push tokens require a physical device. iOS Simulator does not generate real push tokens.
4. **Missing Android channel** - Android 8+ requires a notification channel. Without one, notifications are silently dropped.
5. **Not sending token to backend** - The push token is generated on the device. You must send it to your server and store it per user for targeted notifications.
5. **Token expiration** - Expo push tokens can change. Re-register on every app launch and update your backend if the token changed.
6. **Foreground notifications not showing** - By default, notifications are hidden when the app is in the foreground. Set `shouldShowAlert: true` in `setNotificationHandler`.

## See Also

- [Mobile Permissions](../mobile-permissions/SKILL.md) - notification permission handling
- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - associate push tokens with authenticated users
- [Mobile Navigation Setup](../mobile-navigation-setup/SKILL.md) - deep linking from notification taps

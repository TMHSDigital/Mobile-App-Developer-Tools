---
name: mobile-maps-location
description: Add maps and geolocation to a React Native/Expo or Flutter app. Covers react-native-maps, google_maps_flutter, expo-location, geofencing, background location tracking, marker clustering, and permission flows. Use when the user wants to display a map, track user location, or build location-aware features.
standards-version: 1.6.3
---

# Mobile Maps and Location

## Trigger

Use this skill when the user:

- Wants to show a map with markers, routes, or polygons
- Needs to get the user's current location
- Asks about react-native-maps, google_maps_flutter, or expo-location
- Mentions "map", "geolocation", "GPS", "geofencing", "directions", "coordinates", or "location tracking"
- Wants background location tracking or location-based notifications

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Map provider**: Google Maps (default, cross-platform) or Apple Maps (iOS only)
- **Features needed**: static map, interactive markers, user location, geofencing, or background tracking

## Workflow

1. **Install map dependencies (Expo).** Use react-native-maps:

   ```bash
   npx expo install react-native-maps
   ```

   Add the config plugin in `app.json`:

   ```json
   {
     "expo": {
       "plugins": [
         ["react-native-maps", {
           "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
         }]
       ]
     }
   }
   ```

   Get an API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with the Maps SDK for Android and iOS enabled.

2. **Install map dependencies (Flutter).**

   ```bash
   flutter pub add google_maps_flutter
   ```

   Add the API key to `android/app/src/main/AndroidManifest.xml`:

   ```xml
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
   ```

   And `ios/Runner/AppDelegate.swift`:

   ```swift
   GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
   ```

3. **Display a basic map with markers (Expo).**

   ```tsx
   import MapView, { Marker } from "react-native-maps";

   export default function MapScreen() {
     return (
       <MapView
         style={{ flex: 1 }}
         initialRegion={{
           latitude: 37.7749,
           longitude: -122.4194,
           latitudeDelta: 0.0922,
           longitudeDelta: 0.0421,
         }}
         showsUserLocation
       >
         <Marker
           coordinate={{ latitude: 37.7749, longitude: -122.4194 }}
           title="San Francisco"
           description="Bay Area"
         />
       </MapView>
     );
   }
   ```

4. **Get user location (Expo).** Install expo-location:

   ```bash
   npx expo install expo-location
   ```

   Request permission and get coordinates:

   ```tsx
   import * as Location from "expo-location";

   async function getCurrentLocation() {
     const { status } = await Location.requestForegroundPermissionsAsync();
     if (status !== "granted") {
       throw new Error("Location permission denied");
     }

     const location = await Location.getCurrentPositionAsync({
       accuracy: Location.Accuracy.High,
     });

     return {
       latitude: location.coords.latitude,
       longitude: location.coords.longitude,
     };
   }
   ```

5. **Background location tracking.** For Expo, add the background location task:

   ```tsx
   import * as TaskManager from "expo-task-manager";
   import * as Location from "expo-location";

   const LOCATION_TASK = "background-location-task";

   TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
     if (error) return;
     const { locations } = data as { locations: Location.LocationObject[] };
     // Send locations to your API
   });

   async function startBackgroundTracking() {
     const { status } = await Location.requestBackgroundPermissionsAsync();
     if (status !== "granted") return;

     await Location.startLocationUpdatesAsync(LOCATION_TASK, {
       accuracy: Location.Accuracy.Balanced,
       distanceInterval: 100,
       showsBackgroundLocationIndicator: true,
     });
   }
   ```

6. **Geofencing.** Trigger actions when the user enters or exits a region:

   ```tsx
   import * as Location from "expo-location";

   const geofences = [
     {
       identifier: "office",
       latitude: 37.7749,
       longitude: -122.4194,
       radius: 100,
       notifyOnEnter: true,
       notifyOnExit: true,
     },
   ];

   await Location.startGeofencingAsync("geofence-task", geofences);
   ```

7. **Flutter location with geolocator.**

   ```bash
   flutter pub add geolocator
   ```

   ```dart
   import 'package:geolocator/geolocator.dart';

   Future<Position> getCurrentPosition() async {
     final permission = await Geolocator.checkPermission();
     if (permission == LocationPermission.denied) {
       await Geolocator.requestPermission();
     }

     return Geolocator.getCurrentPosition(
       locationSettings: const LocationSettings(
         accuracy: LocationAccuracy.high,
       ),
     );
   }
   ```

## Key References

- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
- [google_maps_flutter](https://pub.dev/packages/google_maps_flutter)
- [geolocator](https://pub.dev/packages/geolocator)
- [Google Maps Platform](https://developers.google.com/maps)

## Example Interaction

**User:** "Show a map with the user's location and let them drop pins."

**Agent:**
1. Installs react-native-maps and expo-location with `mobile_installDependency`
2. Generates a map screen with `mobile_addMap`
3. Adds the Google Maps config plugin to app.json with API key placeholder
4. Adds location permission with `mobile_addPermission`
5. Implements `getCurrentLocation()` to center the map on the user
6. Adds an `onLongPress` handler to drop markers at the tapped coordinate
7. Stores markers in state with title, coordinate, and timestamp
8. Reminds user to get a Google Maps API key and use a dev build

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Generate map screen | `mobile_addMap` | Scaffold map component with provider config and markers |
| Add location permission | `mobile_addPermission` | Add location permission to app.json |
| Install packages | `mobile_installDependency` | Install react-native-maps, expo-location |
| Verify build | `mobile_checkBuildHealth` | Ensure native map module compiles |

## Common Pitfalls

1. **Missing API key** - Google Maps renders a blank gray view without a valid API key. Get one from Google Cloud Console and enable the Maps SDK.
2. **Expo Go incompatibility** - react-native-maps requires a dev build. It does not work in Expo Go.
3. **Background location battery drain** - High-accuracy background tracking drains the battery fast. Use `Accuracy.Balanced` and a reasonable `distanceInterval`.
4. **Location permission UX** - Request location only when the user needs it (not on app launch). Explain why in the permission rationale string.
5. **Android emulator location** - The Android emulator has no GPS by default. Set a mock location in Extended Controls > Location.
6. **Map renders behind other views** - On Android, `MapView` uses a native surface that renders above React Native views. Use `Marker` callouts instead of overlaying custom components.

## See Also

- [Mobile Permissions](../mobile-permissions/SKILL.md) - location permission request patterns
- [Mobile Deep Links](../mobile-deep-links/SKILL.md) - deep link to a map location in the app
- [Mobile Push Notifications](../mobile-push-notifications/SKILL.md) - location-triggered notifications

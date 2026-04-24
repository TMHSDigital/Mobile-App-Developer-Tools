---
name: mobile-camera-integration
description: Add camera functionality to an Expo app using expo-camera. Covers permissions, photo capture, barcode scanning, video recording, and saving to the camera roll. Use when the user wants to take photos, scan barcodes, or record video.
standards-version: 1.6.3
---

# Mobile Camera Integration

## Trigger

Use this skill when the user:

- Wants to add camera functionality to their app
- Needs to capture photos or record video
- Wants barcode or QR code scanning
- Asks about camera permissions on iOS or Android
- Mentions "camera", "photo", "barcode", "QR code", "scan", or "video recording"

## Required Inputs

- **Use case**: photo capture, barcode scanning, video recording, or a combination
- **Save behavior**: save to camera roll, upload to server, or display preview only
- **Barcode types** (optional): QR, EAN-13, Code 128, etc.

## Workflow

1. **Install dependencies.** expo-camera and expo-media-library (for saving photos):

   ```bash
   npx expo install expo-camera expo-media-library
   ```

   These are native modules and require a development build. They will not work in Expo Go.

   ```bash
   npx expo prebuild
   npx expo run:ios   # or run:android
   ```

2. **Request camera permission.** Use the `useCameraPermissions` hook:

   ```tsx
   import { CameraView, useCameraPermissions } from "expo-camera";
   import { View, Text, Button, StyleSheet } from "react-native";

   export default function CameraScreen() {
     const [permission, requestPermission] = useCameraPermissions();

     if (!permission) {
       return <View />;
     }

     if (!permission.granted) {
       return (
         <View style={styles.container}>
           <Text>Camera access is required to take photos.</Text>
           <Button title="Grant Permission" onPress={requestPermission} />
         </View>
       );
     }

     return (
       <View style={styles.container}>
         <CameraView style={styles.camera} facing="back" />
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: { flex: 1 },
     camera: { flex: 1 },
   });
   ```

3. **Capture a photo.** Use a ref to call `takePictureAsync`:

   ```tsx
   import { useRef, useState } from "react";
   import { CameraView, useCameraPermissions } from "expo-camera";
   import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
   import { Ionicons } from "@expo/vector-icons";

   export default function CameraScreen() {
     const cameraRef = useRef<CameraView>(null);
     const [photo, setPhoto] = useState<string | null>(null);
     const [permission, requestPermission] = useCameraPermissions();
     const [facing, setFacing] = useState<"front" | "back">("back");

     async function takePhoto() {
       if (!cameraRef.current) return;
       const result = await cameraRef.current.takePictureAsync({
         quality: 0.8,
         base64: false,
       });
       if (result) setPhoto(result.uri);
     }

     function toggleFacing() {
       setFacing((f) => (f === "back" ? "front" : "back"));
     }

     if (photo) {
       return (
         <View style={styles.container}>
           <Image source={{ uri: photo }} style={styles.camera} />
           <TouchableOpacity
             style={styles.button}
             onPress={() => setPhoto(null)}
           >
             <Ionicons name="close" size={32} color="white" />
           </TouchableOpacity>
         </View>
       );
     }

     return (
       <View style={styles.container}>
         <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
           <View style={styles.controls}>
             <TouchableOpacity onPress={toggleFacing}>
               <Ionicons name="camera-reverse" size={32} color="white" />
             </TouchableOpacity>
             <TouchableOpacity onPress={takePhoto}>
               <Ionicons name="radio-button-on" size={72} color="white" />
             </TouchableOpacity>
           </View>
         </CameraView>
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: { flex: 1 },
     camera: { flex: 1 },
     controls: {
       flex: 1,
       flexDirection: "row",
       justifyContent: "space-around",
       alignItems: "flex-end",
       paddingBottom: 40,
     },
     button: {
       position: "absolute",
       top: 60,
       right: 20,
     },
   });
   ```

4. **Save to camera roll.** Use expo-media-library:

   ```tsx
   import * as MediaLibrary from "expo-media-library";

   async function savePhoto(uri: string) {
     const { status } = await MediaLibrary.requestPermissionsAsync();
     if (status !== "granted") {
       alert("Media library permission is required to save photos.");
       return;
     }
     await MediaLibrary.saveToLibraryAsync(uri);
   }
   ```

5. **Barcode scanning.** Enable `barcodeScannerSettings` on `CameraView`:

   ```tsx
   import { CameraView } from "expo-camera";
   import type { BarcodeScanningResult } from "expo-camera";

   function handleBarcodeScanned(result: BarcodeScanningResult) {
     console.log(`Type: ${result.type}, Data: ${result.data}`);
   }

   <CameraView
     style={{ flex: 1 }}
     facing="back"
     barcodeScannerSettings={{
       barcodeTypes: ["qr", "ean13", "code128"],
     }}
     onBarcodeScanned={handleBarcodeScanned}
   />
   ```

   Supported barcode types: `qr`, `aztec`, `ean13`, `ean8`, `pdf417`, `upc_e`, `datamatrix`, `code39`, `code93`, `code128`, `itf14`, `codabar`.

6. **Add permission rationale to app.json.** Required for iOS App Store submission:

   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-camera",
           { "cameraPermission": "This app uses the camera to take photos." }
         ],
         [
           "expo-media-library",
           {
             "photosPermission": "This app saves photos to your camera roll.",
             "savePhotosPermission": "This app saves photos to your camera roll."
           }
         ]
       ]
     }
   }
   ```

   Use `mobile_addPermission` to automate this step.

## Key References

- [expo-camera docs](https://docs.expo.dev/versions/latest/sdk/camera/)
- [expo-media-library docs](https://docs.expo.dev/versions/latest/sdk/media-library/)
- [CameraView API](https://docs.expo.dev/versions/latest/sdk/camera/#cameraview)
- [Barcode scanning](https://docs.expo.dev/versions/latest/sdk/camera/#barcode-scanning)

## Example Interaction

**User:** "I want to build a QR code scanner that opens URLs."

**Agent:**
1. Installs expo-camera with `mobile_installDependency`
2. Adds camera permission with `mobile_addPermission`
3. Creates a scanner screen with `mobile_generateScreen`
4. Implements `CameraView` with `barcodeScannerSettings` for QR codes
5. Adds `Linking.openURL` on scan result
6. Handles permission denied state with a settings link

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install expo-camera | `mobile_installDependency` | Run `npx expo install expo-camera expo-media-library` |
| Add permission config | `mobile_addPermission` | Add camera permission rationale to app.json |
| Create camera screen | `mobile_generateScreen` | Scaffold a screen file for the camera view |
| Check build | `mobile_checkBuildHealth` | Verify the project builds after adding native modules |

## Common Pitfalls

1. **Using expo-camera in Expo Go** - expo-camera requires a development build. It will crash in Expo Go. Run `npx expo prebuild` first.
2. **Forgetting permission rationale** - iOS rejects apps without usage description strings. Always add the `cameraPermission` plugin config to `app.json`.
3. **Not handling permission denied** - Users can deny or permanently block camera access. Check `permission.canAskAgain` and link to system settings if blocked.
4. **Importing from wrong package** - Use `CameraView` from `expo-camera`, not the deprecated `Camera` component. The API changed in expo-camera v15.
5. **Barcode scanner firing repeatedly** - `onBarcodeScanned` fires on every frame. Debounce it or set a scanned flag to prevent duplicate processing.
6. **Missing media library permission** - Saving to the camera roll requires a separate `expo-media-library` permission. Request it before calling `saveToLibraryAsync`.

## See Also

- [Mobile Permissions](../mobile-permissions/SKILL.md) - detailed permission handling patterns
- [Mobile AI Features](../mobile-ai-features/SKILL.md) - send captured photos to AI vision APIs

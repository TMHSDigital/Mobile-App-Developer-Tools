import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Project framework (default: expo)."),
  provider: z
    .enum(["google", "apple"])
    .optional()
    .default("google")
    .describe("Map provider (default: google). Apple Maps only available on iOS."),
  screen_name: z
    .string()
    .optional()
    .default("MapScreen")
    .describe("Name for the generated map screen component (default: MapScreen)."),
};

function generateExpoMapScreen(name: string): string {
  return `import { useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";

const INITIAL_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

interface MapMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  description?: string;
}

export default function ${name}() {
  const [markers] = useState<MapMarker[]>([
    {
      id: "1",
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      title: "San Francisco",
      description: "Starting point",
    },
  ]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
`;
}

function generateFlutterMapScreen(name: string): string {
  const className = name.charAt(0).toUpperCase() + name.slice(1);
  return `import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class ${className} extends StatefulWidget {
  const ${className}({super.key});

  @override
  State<${className}> createState() => _${className}State();
}

class _${className}State extends State<${className}> {
  static const _initialPosition = CameraPosition(
    target: LatLng(37.7749, -122.4194),
    zoom: 14,
  );

  final Set<Marker> _markers = {
    const Marker(
      markerId: MarkerId('san_francisco'),
      position: LatLng(37.7749, -122.4194),
      infoWindow: InfoWindow(title: 'San Francisco'),
    ),
  };

  GoogleMapController? _controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Map')),
      body: GoogleMap(
        initialCameraPosition: _initialPosition,
        markers: _markers,
        myLocationEnabled: true,
        myLocationButtonEnabled: true,
        onMapCreated: (controller) => _controller = controller,
      ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_addMap",
    "Add a map view with provider config, location permissions, and marker support. Generates a starter map screen component.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const filesCreated: string[] = [];
        const configChanges: string[] = [];

        if (args.framework === "flutter") {
          const screenDir = join(root, "lib", "screens");
          mkdirSync(screenDir, { recursive: true });
          const fileName = args.screen_name
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase()
            .replace(/^_/, "");
          const screenPath = join(screenDir, `${fileName}.dart`);

          if (existsSync(screenPath)) {
            return errorResponse(new Error(`File already exists: ${screenPath}`));
          }

          writeFileSync(screenPath, generateFlutterMapScreen(args.screen_name), "utf-8");
          filesCreated.push(screenPath);

          return textResponse(
            JSON.stringify(
              {
                success: true,
                framework: "flutter",
                provider: args.provider,
                files_created: filesCreated,
                next_steps: [
                  "Add google_maps_flutter to pubspec.yaml: flutter pub add google_maps_flutter",
                  "Add your API key to android/app/src/main/AndroidManifest.xml:",
                  '  <meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_KEY"/>',
                  "Add your API key to ios/Runner/AppDelegate.swift:",
                  '  GMSServices.provideAPIKey("YOUR_KEY")',
                  "Add location permissions to AndroidManifest.xml and Info.plist",
                  "Get a Google Maps API key from console.cloud.google.com",
                ],
              },
              null,
              2,
            ),
          );
        }

        const appJsonPath = join(root, "app.json");
        if (existsSync(appJsonPath)) {
          const appJson = JSON.parse(readFileSync(appJsonPath, "utf-8"));
          const expo = appJson.expo || {};

          if (!expo.plugins) expo.plugins = [];

          const hasMapPlugin = expo.plugins.some(
            (p: unknown) =>
              (typeof p === "string" && p === "react-native-maps") ||
              (Array.isArray(p) && p[0] === "react-native-maps"),
          );

          if (!hasMapPlugin) {
            const mapConfig: [string, Record<string, unknown>] = [
              "react-native-maps",
              {
                googleMapsApiKey: "GOOGLE_MAPS_API_KEY_HERE",
              },
            ];
            expo.plugins.push(mapConfig);
            appJson.expo = expo;
            writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n", "utf-8");
            configChanges.push("Added react-native-maps plugin to app.json");
          }
        }

        const screenDir = join(root, "app");
        if (!existsSync(screenDir)) {
          mkdirSync(screenDir, { recursive: true });
        }

        const screenPath = join(screenDir, `${args.screen_name.charAt(0).toLowerCase() + args.screen_name.slice(1)}.tsx`);
        if (!existsSync(screenPath)) {
          writeFileSync(screenPath, generateExpoMapScreen(args.screen_name), "utf-8");
          filesCreated.push(screenPath);
        }

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: "expo",
              provider: args.provider,
              files_created: filesCreated,
              config_changes: configChanges,
              next_steps: [
                "Install react-native-maps: npx expo install react-native-maps",
                "Install expo-location for user location: npx expo install expo-location",
                "Replace GOOGLE_MAPS_API_KEY_HERE in app.json with your actual key",
                "Get a Google Maps API key from console.cloud.google.com",
                "Add location permission with mobile_addPermission",
                "This requires a dev build (not Expo Go) for native map rendering",
              ],
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}

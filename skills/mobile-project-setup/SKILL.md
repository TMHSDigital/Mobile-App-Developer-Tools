---
name: mobile-project-setup
description: Create a new Expo (React Native) project with TypeScript, file-based routing, and opinionated defaults. Use when the user wants to start a new mobile app or needs help choosing project configuration.
standards-version: 1.6.3
---

# Mobile Project Setup

## Trigger

Use this skill when the user:

- Wants to create a new mobile app from scratch
- Asks how to set up an Expo or React Native project
- Needs help choosing between Expo templates
- Wants a recommended project structure
- Mentions "create app", "new project", "scaffold", or "starter"

## Required Inputs

- **App name**: What the user wants to call their app (lowercase, no spaces)
- **Template preference** (optional): blank, tabs, or navigation
- **Additional features** (optional): Which integrations they plan to add (camera, auth, etc.)

## Workflow

1. **Verify environment.** Before scaffolding, confirm Node.js 20+ is installed (required for SDK 55+):

   ```bash
   node --version
   ```

   If not installed, refer to the `mobile-dev-environment` skill.

2. **Create the project.** Use `create-expo-app` with the TypeScript template:

   ```bash
   npx create-expo-app@latest my-app
   ```

   This creates a project with Expo Router (file-based routing), TypeScript, and the default template. SDK 55+ uses the New Architecture by default (Legacy Architecture is no longer supported).

3. **Recommended project structure.** After creation, the project should look like:

   ```
   my-app/
   ├── app/                  # File-based routes (Expo Router)
   │   ├── (tabs)/           # Tab navigation group
   │   │   ├── index.tsx     # Home tab
   │   │   ├── explore.tsx   # Explore tab
   │   │   └── _layout.tsx   # Tab layout
   │   ├── _layout.tsx       # Root layout
   │   └── +not-found.tsx    # 404 screen
   ├── assets/               # Static assets (images, fonts)
   ├── components/           # Reusable components
   ├── constants/            # Theme colors, config values
   ├── hooks/                # Custom React hooks
   ├── app.json              # Expo config
   ├── package.json
   └── tsconfig.json
   ```

4. **Configure app.json.** Update with the user's app name and basic settings:

   ```json
   {
     "expo": {
       "name": "My App",
       "slug": "my-app",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/images/icon.png",
       "scheme": "myapp",
       "userInterfaceStyle": "automatic",
       "newArchEnabled": true,
       "ios": {
         "supportsTablet": true,
         "bundleIdentifier": "com.yourname.myapp"
       },
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/images/adaptive-icon.png",
           "backgroundColor": "#ffffff"
         },
         "package": "com.yourname.myapp"
       }
     }
   }
   ```

5. **Install and verify.** Start the dev server to confirm the project works:

   ```bash
   cd my-app
   npx expo start
   ```

6. **Suggest next steps.** Based on the user's stated goals:
   - Camera app: recommend `expo-camera`, point to `mobile-camera-integration` skill
   - Auth: recommend Supabase or Firebase, point to `mobile-auth-setup` skill
   - Navigation: Expo Router is already included. Point to `mobile-navigation-setup` skill

## Key References

- [Expo docs: Create a project](https://docs.expo.dev/get-started/create-a-project/)
- [Expo Router: Introduction](https://docs.expo.dev/router/introduction/)
- [Expo config: app.json](https://docs.expo.dev/versions/latest/config/app/)

## Example Interaction

**User:** "I want to build a camera app for iOS and Android. Where do I start?"

**Agent:**
1. Checks environment with `mobile_checkDevEnvironment`
2. Scaffolds a new Expo project with `mobile_scaffoldProject` using name "camera-app"
3. Explains the file-based routing structure
4. Notes that `expo-camera` can be added with the `mobile-camera-integration` skill
5. Runs the dev server and helps connect to a physical device

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Check environment | `mobile_checkDevEnvironment` | Verify Node, Expo CLI, and platform tools are installed |
| Create project | `mobile_scaffoldProject` | Generate a new Expo project with TypeScript template |
| Run on device | `mobile_runOnDevice` | Start dev server and connect to a phone |

## Common Pitfalls

1. **Using `react-native init` instead of `create-expo-app`** - Expo manages native tooling for you. Bare React Native requires Xcode and Android Studio setup before you can run anything.
2. **Skipping TypeScript** - TypeScript catches errors early and improves autocomplete. Always use it.
3. **Wrong Node version** - Expo requires Node 18+. Check with `node --version`.
4. **Not setting bundleIdentifier/package** - You need these for device builds and store submission. Set them early with reverse domain notation (e.g. `com.yourname.appname`).
5. **Ignoring the `scheme` field** - Required for deep linking. Set it to a short, unique string matching your app name.

## See Also

- [Mobile Dev Environment](../mobile-dev-environment/SKILL.md) - set up prerequisites before creating a project
- [Mobile Run on Device](../mobile-run-on-device/SKILL.md) - deploy the project to a phone after creation

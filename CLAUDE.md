# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **Mobile App Developer Tools** Cursor plugin is at **v0.4.0**. It helps developers go from zero to a running mobile app on their phone. Currently supports React Native/Expo with **13 skills**, **4 rules**, and a companion MCP server exposing **12 tools**. Flutter support is planned for v0.5.0.

## Plugin Architecture

```
.cursor-plugin/plugin.json   - Plugin manifest
skills/<skill-name>/SKILL.md - AI workflow definitions
rules/<rule-name>.mdc        - Code quality and security rules
mcp-server/                  - MCP server with 12 tools
packages/mobile-dev-tools/   - NPM package (stub for name claim)
```

## Skills (13 total)

| Skill | Purpose |
| --- | --- |
| mobile-project-setup | Guided Expo project creation with TypeScript, file-based routing, ESLint |
| mobile-dev-environment | Cross-platform dependency detection (Node, Watchman, Xcode, Android Studio, Expo CLI) |
| mobile-run-on-device | Running on a physical device via Expo Go, dev builds, QR code, tunnel mode |
| mobile-navigation-setup | Expo Router file-based navigation: tabs, stack, drawer, typed routes, deep linking |
| mobile-state-management | When to use React state vs Zustand vs Jotai vs React Query; patterns and examples |
| mobile-component-patterns | Reusable component architecture, compound components, StyleSheet vs NativeWind, testing |
| mobile-camera-integration | expo-camera setup, permissions, photo capture, barcode scanning, video recording |
| mobile-ai-features | AI API integration (OpenAI, Anthropic, Google) with backend proxy, vision, text, audio |
| mobile-permissions | Cross-platform permission request patterns, rationale strings, denied/blocked handling |
| mobile-auth-setup | Authentication with Supabase, Firebase, Clerk; secure token storage, protected routes |
| mobile-push-notifications | expo-notifications, EAS Push, Android channels, deep link on tap, local notifications |
| mobile-local-storage | AsyncStorage, expo-sqlite, expo-secure-store, MMKV; migrations and data cleanup |
| mobile-api-integration | REST/GraphQL clients, React Query, auth headers, retry, offline queue, optimistic updates |

## Rules (4 total)

| Rule | Scope | Purpose |
| --- | --- | --- |
| mobile-secrets.mdc | Global | Flags API keys, signing credentials, keystore passwords, Firebase config, EAS tokens |
| mobile-platform-check.mdc | `.ts`, `.tsx` | Flags platform-specific APIs used without Platform.OS or Platform.select() guards |
| mobile-image-assets.mdc | `.ts`, `.tsx`, `.json` | Flags oversized images, unoptimized formats, missing density variants, uncached remote images |
| mobile-env-safety.mdc | `.ts`, `.tsx`, `.json` | Flags hardcoded production endpoints, missing EXPO_PUBLIC_ prefix, server-only secrets in client code |

## Companion MCP Server

Tools use the `mobile_` prefix (for example `mobile_checkDevEnvironment`).

### Tools (12 total)

| Tool | Description |
| --- | --- |
| mobile_checkDevEnvironment | Detect installed tools, SDKs, simulators; report what is missing |
| mobile_scaffoldProject | Generate a new Expo project from a template with chosen options |
| mobile_runOnDevice | Start dev server and provide instructions for connecting a physical device |
| mobile_generateScreen | Create a new Expo Router screen file with navigation wiring and boilerplate |
| mobile_generateComponent | Create a React Native component with typed props, StyleSheet, and optional tests |
| mobile_installDependency | Install a package via npx expo install with native module detection and warnings |
| mobile_addPermission | Add platform permission with iOS rationale string to app.json config plugins |
| mobile_integrateAI | Scaffold AI API client with provider config, error handling, and TypeScript types |
| mobile_checkBuildHealth | Validate app.json, check dependencies, verify TypeScript, detect native module issues |
| mobile_addPushNotifications | Add expo-notifications plugin to app.json, create notification handler, configure Android channel |
| mobile_configureDeepLinks | Set scheme, add Android intent filters, iOS associated domains, generate AASA template |
| mobile_resetDevEnvironment | Nuclear reset: clear Metro cache, .expo dir, node_modules cache, optionally Pods and Gradle |

## Development Workflow

- **Skills and rules**: No build step; edit `SKILL.md` and `.mdc` files directly.
- **MCP server**: From repo root, run `cd mcp-server && npm install && npm run build`.
- **NPM package**: From repo root, run `cd packages/mobile-dev-tools && npm install && npm run build`.

**Symlink the plugin for local Cursor development**

- **Windows (PowerShell)** - run as Administrator if required for symlink creation:

```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.cursor\plugins\mobile-app-developer-tools" -Target (Get-Location)
```

- **macOS / Linux**:

```bash
ln -s "$(pwd)" ~/.cursor/plugins/mobile-app-developer-tools
```

Run each command from the repo root. Adjust paths if your clone is elsewhere.

## Key Conventions

- **Default framework**: Expo (React Native) with TypeScript.
- **File-based routing**: Use Expo Router, not React Navigation stack config.
- **MCP tool prefix**: `mobile_` (e.g. `mobile_checkDevEnvironment`).
- **Never hardcode** API keys, signing credentials, or tokens. Use environment variables or `.env` files.
- **Platform checks**: Always use `Platform.OS` when writing platform-specific code.

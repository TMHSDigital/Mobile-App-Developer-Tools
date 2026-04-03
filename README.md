<p align="center">
  <img src="assets/logo.png" alt="Mobile App Developer Tools" width="120">
</p>

<h1 align="center">Mobile App Developer Tools</h1>

<p align="center">
  <em>Go from zero to a running mobile app on your phone.</em>
</p>

<p align="center">
  <a href="https://github.com/TMHSDigital/Mobile-App-Developer-Tools/releases"><img src="https://img.shields.io/badge/version-0.6.0-0A84FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyTDIyIDEyTDEyIDIyTDIgMTJaIi8+PC9zdmc+" alt="Release"></a>
  <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/"><img src="https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey?style=for-the-badge" alt="License"></a>
  <a href="https://github.com/TMHSDigital/Mobile-App-Developer-Tools/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/TMHSDigital/Mobile-App-Developer-Tools/ci.yml?branch=main&label=CI&logo=githubactions&style=for-the-badge" alt="CI"></a>
  <a href="https://github.com/TMHSDigital/Mobile-App-Developer-Tools/actions/workflows/validate.yml"><img src="https://img.shields.io/github/actions/workflow/status/TMHSDigital/Mobile-App-Developer-Tools/validate.yml?branch=main&label=Validate&logo=githubactions&style=for-the-badge" alt="Validate"></a>
  <a href="https://github.com/TMHSDigital/Mobile-App-Developer-Tools/actions/workflows/codeql.yml"><img src="https://img.shields.io/github/actions/workflow/status/TMHSDigital/Mobile-App-Developer-Tools/codeql.yml?branch=main&label=CodeQL&logo=githubactions&style=for-the-badge" alt="CodeQL"></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tmhs/mobile-mcp"><img src="https://img.shields.io/npm/v/@tmhs/mobile-mcp?style=for-the-badge&logo=npm&label=mobile-mcp" alt="npm: mobile-mcp"></a>
  <a href="https://www.npmjs.com/package/@tmhs/mobile-dev-tools"><img src="https://img.shields.io/npm/v/@tmhs/mobile-dev-tools?style=for-the-badge&logo=npm&label=mobile-dev-tools" alt="npm: mobile-dev-tools"></a>
</p>

---

<p align="center">
  <strong>20 skills</strong> &nbsp;&bull;&nbsp; <strong>6 rules</strong> &nbsp;&bull;&nbsp; <strong>15 MCP tools</strong>
</p>

<p align="center">
  <a href="#skills">Skills</a> · <a href="#rules">Rules</a> · <a href="#companion-mobile-mcp-server">MCP Tools</a> · <a href="#installation">Install</a> · <a href="#roadmap">Roadmap</a>
</p>

---

## Overview

Mobile App Developer Tools is a **Cursor** plugin by **TMHSDigital** that packages agent skills, editor rules, and a TypeScript **MCP server** (`mcp-server/`) so you can scaffold, build, and ship mobile apps without leaving the IDE. Currently at **v0.6.0** with twenty skills (React Native/Expo + Flutter), six rules, and fifteen live MCP tools.

**What you get**

| Layer | Role |
| --- | --- |
| **Skills** | 20 guided workflows for React Native/Expo and Flutter: project setup through app store submission |
| **Rules** | 6 guardrails: secrets, platform guards, image bloat, env safety, performance, accessibility |
| **MCP** | 15 tools: env checks, scaffolding, device deploy, screen/component gen, permissions, AI, build health, push, deep links, store builds, metadata validation, App Store submission |

**Quick facts**

| Item | Detail |
| --- | --- |
| **License** | [CC-BY-NC-ND-4.0](LICENSE) |
| **Author** | [TMHSDigital](https://github.com/TMHSDigital) |
| **Repository** | [github.com/TMHSDigital/Mobile-App-Developer-Tools](https://github.com/TMHSDigital/Mobile-App-Developer-Tools) |
| **Runtime** | Node 20+ for MCP server |
| **Framework** | Expo (React Native) + Flutter |

### How it works

```mermaid
flowchart LR
    A[User asks mobile dev question] --> B[Cursor loads a Skill]
    B --> C{MCP server configured?}
    C -->|Yes| D["mobile-mcp tools (15)"]
    C -->|No| E[Docs-only guidance]
    D --> F[Local env checks / scaffolding]
    E --> G[Answer in chat or code edits]
    F --> G
```

<details>
<summary>Expand: end-to-end mental model</summary>

1. Install the plugin (symlink into your Cursor plugins directory).
2. Open a mobile dev task; **rules** such as `mobile-secrets` run as you edit.
3. Invoke a **skill** by name (for example `mobile-project-setup` or `mobile-run-on-device`) when you need a structured workflow.
4. Optionally wire **MCP** so tools like `checkDevEnvironment`, `scaffoldProject`, or `runOnDevice` can take real actions on your machine.

</details>

<br>

---

## Compatibility

| Client | Skills | Rules | MCP server (`mcp-server/`) |
| --- | --- | --- | --- |
| **Cursor** | Yes (native plugin) | Yes (`.mdc` rules) | Yes, via MCP config |
| **Claude Code** | Yes, copy `skills/` | Yes, via `CLAUDE.md` | Yes, any MCP-capable host |
| **Other MCP clients** | Manual import | Manual import | Yes, stdio transport |

---

## Quick Start

<details>
<summary><strong>Clone, symlink, build, and try it</strong></summary>

**1. Clone**

```bash
git clone https://github.com/TMHSDigital/Mobile-App-Developer-Tools.git
cd Mobile-App-Developer-Tools
```

**2. Symlink the plugin (pick your OS)**

Windows PowerShell (run as Administrator if your policy requires it):

```powershell
New-Item -ItemType SymbolicLink `
  -Path "$env:USERPROFILE\.cursor\plugins\mobile-app-developer-tools" `
  -Target (Resolve-Path .\Mobile-App-Developer-Tools)
```

macOS / Linux:

```bash
ln -s "$(pwd)" ~/.cursor/plugins/mobile-app-developer-tools
```

**3. Build the MCP server**

```bash
cd mcp-server
npm install
npm run build
```

**4. Try it**

Open Cursor and ask:

```
"Create a new Expo app with TypeScript and file-based routing"
"Check if my dev environment is ready for mobile development"
"How do I run this app on my phone?"
```

</details>

---

## Demo App

See the plugin in action: **[SnapLog](https://github.com/TMHSDigital/Demo-Mobile-App)** is a photo journal app built entirely using these skills and MCP tools. It exercises 16 of the 20 skills - from project scaffolding and navigation to camera capture, AI descriptions, local storage, and push notifications.

[![Demo App](https://img.shields.io/badge/demo-SnapLog-0A84FF?style=flat-square&logo=github)](https://github.com/TMHSDigital/Demo-Mobile-App)

---

## Skills

All 20 skills are production-ready. Names match the folder under `skills/`.

<details>
<summary><strong>React Native / Expo skills (15)</strong></summary>

| Skill | Framework | What it does |
| --- | --- | --- |
| `mobile-project-setup` | Expo | Guided project creation with TypeScript, file-based routing, ESLint |
| `mobile-dev-environment` | Shared | Detect OS, check dependencies (Node, Watchman, Xcode, Android Studio), fix common issues |
| `mobile-run-on-device` | Expo | Step-by-step for physical device via Expo Go, dev builds, QR code, tunnel mode |
| `mobile-navigation-setup` | Expo | Expo Router file-based navigation: tabs, stack, drawer, typed routes, deep linking |
| `mobile-state-management` | Shared | When to use React state vs Zustand vs Jotai vs React Query with code examples |
| `mobile-component-patterns` | Shared | Reusable component architecture, compound components, StyleSheet vs NativeWind, testing |
| `mobile-camera-integration` | Expo | expo-camera setup, permissions, photo capture, barcode scanning, video recording |
| `mobile-ai-features` | Shared | AI API integration (OpenAI, Anthropic, Google) with backend proxy, vision, text, audio |
| `mobile-permissions` | Shared | Cross-platform permission requests, iOS rationale strings, denied/blocked state handling |
| `mobile-auth-setup` | Shared | Authentication with Supabase, Firebase, Clerk; secure token storage, protected routes |
| `mobile-push-notifications` | Expo | expo-notifications, EAS Push, Android channels, deep link on tap, local notifications |
| `mobile-local-storage` | Shared | AsyncStorage, expo-sqlite, expo-secure-store, MMKV; migrations and data cleanup |
| `mobile-api-integration` | Shared | REST/GraphQL clients, React Query, auth headers, retry, offline queue, optimistic updates |
| `mobile-ios-submission` | Expo | EAS Build/Submit, certificates, provisioning profiles, TestFlight, App Store review |
| `mobile-android-submission` | Expo | Play Console, signing keys, AAB, service accounts, staged rollouts |

</details>

<details>
<summary><strong>Flutter skills (4)</strong></summary>

| Skill | What it does |
| --- | --- |
| `mobile-flutter-project-setup` | Guided `flutter create` with feature-first structure, linting, packages, flavors |
| `mobile-flutter-navigation` | GoRouter: declarative routing, shell routes for tabs, auth guards, deep linking |
| `mobile-flutter-run-on-device` | USB/wireless debugging, hot reload vs restart, build modes, troubleshooting |
| `mobile-flutter-state-management` | Riverpod (recommended), Bloc, Provider, setState; async data, code generation |

</details>

<details>
<summary><strong>Shared skills (1)</strong></summary>

| Skill | What it does |
| --- | --- |
| `mobile-app-store-prep` | App icons, screenshots, metadata, privacy policy, age ratings, review guidelines |

</details>

<details>
<summary><strong>Example prompts</strong> - one per skill</summary>

| Skill | Try this |
| --- | --- |
| `mobile-project-setup` | "Set up a new Expo project for a camera app" |
| `mobile-dev-environment` | "Is my Mac ready for iOS development?" |
| `mobile-run-on-device` | "My phone can't connect to the dev server - help" |
| `mobile-navigation-setup` | "Add tab navigation with Home, Search, and Profile tabs" |
| `mobile-state-management` | "What state management should I use for my Expo app?" |
| `mobile-component-patterns` | "Create a reusable Card component with header and footer" |
| `mobile-camera-integration` | "Add a QR code scanner to my app" |
| `mobile-ai-features` | "I want to take a photo and have AI describe what's in it" |
| `mobile-permissions` | "How do I handle camera permission properly on iOS and Android?" |
| `mobile-auth-setup` | "Add email/password auth with Supabase and protected routes" |
| `mobile-push-notifications` | "Set up push notifications that open a specific screen on tap" |
| `mobile-local-storage` | "I need offline storage for a todo list with secure login" |
| `mobile-api-integration` | "Connect to my REST API with auth headers and offline support" |
| `mobile-app-store-prep` | "What do I need to submit my app to the App Store?" |
| `mobile-ios-submission` | "Submit my Expo app to the App Store for the first time" |
| `mobile-android-submission` | "Publish my app on Google Play with staged rollout" |
| `mobile-flutter-project-setup` | "Create a new Flutter app with Riverpod and GoRouter" |
| `mobile-flutter-navigation` | "Add tab navigation with GoRouter in my Flutter app" |
| `mobile-flutter-run-on-device` | "My Android phone doesn't show up in flutter devices" |
| `mobile-flutter-state-management` | "Should I use Riverpod or Bloc for my Flutter app?" |

</details>

---

## Rules

All 6 rules are production-ready.

<details>
<summary><strong>All 6 rules</strong></summary>

| Rule | Scope | What it catches |
| --- | --- | --- |
| `mobile-secrets` | Always on | API keys, signing credentials, keystore passwords, Firebase config, `.p8`/`.p12` files, EAS tokens |
| `mobile-platform-check` | `.ts`, `.tsx` | Platform-specific APIs (BackHandler, ToastAndroid, StatusBar methods) used without `Platform.OS` or `Platform.select()` guards |
| `mobile-image-assets` | `.ts`, `.tsx`, `.json` | Oversized images (>500KB), unoptimized formats (BMP, TIFF), missing `@2x`/`@3x` variants, uncached remote images |
| `mobile-env-safety` | `.ts`, `.tsx`, `.json` | Hardcoded production endpoints, missing `EXPO_PUBLIC_` prefix, server-only secrets in client code |
| `mobile-performance` | `.ts`, `.tsx`, `.dart` | Inline styles, missing list keys, ScrollView for long lists (RN); missing const constructors, inline widgets (Flutter) |
| `mobile-accessibility` | `.ts`, `.tsx`, `.dart` | Missing a11y labels on interactive elements, small touch targets, images without alt text, color-only indicators |

</details>

---

## Companion: Mobile MCP Server

[![npm version](https://img.shields.io/npm/v/@tmhs/mobile-mcp?style=flat-square&logo=npm)](https://www.npmjs.com/package/@tmhs/mobile-mcp)

The MCP server gives your AI assistant the ability to take real actions on your local machine. No API keys required.

**Setup**

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mobile": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "cwd": "<path-to>/Mobile-App-Developer-Tools"
    }
  }
}
```

Or install globally via npm:

```bash
npx @tmhs/mobile-mcp
```

<details>
<summary><strong>All 15 MCP tools</strong></summary>

| Tool | Purpose |
| --- | --- |
| `mobile_checkDevEnvironment` | Detect installed tools and SDKs (Node, Expo CLI, Watchman, Xcode, Android Studio, JDK). Report what is missing with install instructions. |
| `mobile_scaffoldProject` | Generate a new Expo project with TypeScript template and recommended config. |
| `mobile_runOnDevice` | Start dev server and provide step-by-step instructions for connecting a physical device. |
| `mobile_generateScreen` | Create a new Expo Router screen file with correct convention, navigation wiring, and boilerplate. |
| `mobile_generateComponent` | Create a React Native component with typed props interface, StyleSheet, and optional test file. |
| `mobile_installDependency` | Install a package via `npx expo install` with native module detection and Expo Go compatibility warnings. |
| `mobile_addPermission` | Add a platform permission to app.json with iOS rationale string via Expo config plugins. |
| `mobile_integrateAI` | Scaffold an AI API client with provider config, error handling, timeout, and TypeScript types. |
| `mobile_checkBuildHealth` | Validate app.json, check dependencies, verify TypeScript compiles, detect native module issues. |
| `mobile_addPushNotifications` | Add expo-notifications plugin to app.json, create notification handler, configure Android channel. |
| `mobile_configureDeepLinks` | Set URL scheme, add Android intent filters, iOS associated domains, generate AASA template. |
| `mobile_resetDevEnvironment` | Nuclear reset: clear Metro cache, .expo dir, node_modules cache, optionally Pods and Gradle. |
| `mobile_buildForStore` | Create a production build for app store submission via EAS Build. Validates app.json before building. |
| `mobile_validateStoreMetadata` | Check app.json for all required store listing fields (name, bundle ID, version, icon, splash, privacy policy). |
| `mobile_submitToAppStore` | Submit the latest iOS production build to App Store Connect via EAS Submit. |

</details>

---

## NPM Package

[![npm version](https://img.shields.io/npm/v/@tmhs/mobile-dev-tools?style=flat-square&logo=npm)](https://www.npmjs.com/package/@tmhs/mobile-dev-tools)

The `@tmhs/mobile-dev-tools` package provides shared CLI utilities for mobile development.

```bash
npm install -g @tmhs/mobile-dev-tools
mobile-dev --help
```

Full functionality (environment checker, template engine, store metadata validator) is coming in future releases. See [ROADMAP.md](ROADMAP.md).

---

## Installation

| Step | Action |
| --- | --- |
| 1 | Clone [Mobile-App-Developer-Tools](https://github.com/TMHSDigital/Mobile-App-Developer-Tools) |
| 2 | Symlink the repo per [Quick Start](#quick-start) |
| 3 | Restart Cursor |
| 4 | (Optional) Register MCP: point your client at `mcp-server/dist/index.js` after `npm run build` |

Plugin manifest: [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json).

---

## Configuration

No API keys are required for local development. Store submission tools require platform-specific credentials.

Future versions may use:

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_TOKEN` | For EAS builds | Expo access token for CI/CD |
| `APPLE_ID` | For iOS submission | Apple Developer account email |
| `GOOGLE_SERVICE_ACCOUNT` | For Android submission | Play Console service account JSON |

---

## Roadmap

<details>
<summary><strong>Release history and upcoming versions</strong></summary>

Full details in [ROADMAP.md](ROADMAP.md).

| Version | Theme | Highlights | Status |
| --- | --- | --- | --- |
| **v0.1.0** | Zero to Phone | 3 skills, 1 rule, 3 MCP tools | |
| **v0.2.0** | Navigate & State | 6 skills, 2 rules, 6 MCP tools | |
| **v0.3.0** | Camera & AI | 9 skills, 3 rules, 9 MCP tools | |
| **v0.4.0** | Users & Data | 13 skills, 4 rules, 12 MCP tools | |
| **v0.5.0** | Flutter | 17 skills, 5 rules, 12 MCP tools | |
| **v0.6.0** | Ship It | 20 skills, 6 rules, 15 MCP tools | **Current** |
| **v0.7.0** | Grow & Measure | 24 skills, 7 rules, 19 MCP tools | |
| **v0.8.0** | Test & Automate | 27 skills, 8 rules, 22 MCP tools | |
| **v0.9.0** | Rich Features | 32 skills, 9 rules, 26 MCP tools | |
| **v0.10.0** | Harden | 37 skills, 10 rules, 30 MCP tools | |
| **v0.11.0** | Design & Adapt | 40 skills, 11 rules, 33 MCP tools | |
| **v0.12.0** | Extend & Evolve | 43 skills, 12 rules, 36 MCP tools | |
| **v1.0.0** | Stable | 43 skills, 12 rules, 36 MCP tools | |

</details>

---

## Contributing

Issues and PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding skills, rules, and MCP tools.

---

## License

Copyright (c) TM Hospitality Strategies. Licensed under **CC-BY-NC-ND-4.0** - see [LICENSE](LICENSE).

---

<p align="center">

**Mobile App Developer Tools** · Built by [TMHSDigital](https://github.com/TMHSDigital) · [Repository](https://github.com/TMHSDigital/Mobile-App-Developer-Tools)

</p>

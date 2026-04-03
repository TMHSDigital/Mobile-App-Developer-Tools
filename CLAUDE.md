# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **Mobile App Developer Tools** Cursor plugin is at **v0.1.0**. It helps developers go from zero to a running mobile app on their phone. Currently supports React Native/Expo with **3 skills**, **1 rule**, and a companion MCP server exposing **3 tools** for environment checks, project scaffolding, and device deployment. Flutter support is planned for v0.5.0.

## Plugin Architecture

```
.cursor-plugin/plugin.json   - Plugin manifest
skills/<skill-name>/SKILL.md - AI workflow definitions
rules/<rule-name>.mdc        - Code quality and security rules
mcp-server/                  - MCP server with 3 tools
packages/mobile-dev-tools/   - NPM package (stub for name claim)
```

## Skills (3 total)

| Skill | Purpose |
| --- | --- |
| mobile-project-setup | Guided Expo project creation with TypeScript, file-based routing, ESLint |
| mobile-dev-environment | Cross-platform dependency detection (Node, Watchman, Xcode, Android Studio, Expo CLI) |
| mobile-run-on-device | Running on a physical device via Expo Go, dev builds, QR code, tunnel mode |

## Rules (1 total)

| Rule | Scope | Purpose |
| --- | --- | --- |
| mobile-secrets.mdc | Global | Flags API keys, signing credentials, keystore passwords, Firebase config, EAS tokens |

## Companion MCP Server

Tools use the `mobile_` prefix (for example `mobile_checkDevEnvironment`).

### Tools (3 total)

| Tool | Description |
| --- | --- |
| mobile_checkDevEnvironment | Detect installed tools, SDKs, simulators; report what is missing |
| mobile_scaffoldProject | Generate a new Expo project from a template with chosen options |
| mobile_runOnDevice | Start dev server and provide instructions for connecting a physical device |

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

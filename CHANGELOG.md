# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-04-03

### Added

- **3 new skills**: `mobile-navigation-setup` (Expo Router patterns), `mobile-state-management` (Zustand, Jotai, React Query), `mobile-component-patterns` (reusable component architecture)
- **1 new rule**: `mobile-platform-check` (flags platform-specific APIs without Platform.OS guards)
- **3 new MCP tools**: `mobile_generateScreen`, `mobile_generateComponent`, `mobile_installDependency`
- Cursor release process rule at `.cursor/rules/release-process.mdc`
- Totals: 6 skills, 2 rules, 6 MCP tools

## [0.1.0] - 2026-04-03

### Added

- Plugin scaffold with `.cursor-plugin/plugin.json` manifest
- **3 skills**: `mobile-project-setup`, `mobile-dev-environment`, `mobile-run-on-device`
- **1 rule**: `mobile-secrets` (always-on credential detection)
- **3 MCP tools**: `mobile_checkDevEnvironment`, `mobile_scaffoldProject`, `mobile_runOnDevice`
- NPM package stub (`@tmhs/mobile-dev-tools`) to reserve the name
- CI workflows for pytest validation and MCP server build
- Plugin structure validation (skill frontmatter, rule frontmatter, version consistency)
- `CLAUDE.md` for Claude Code compatibility
- `ROADMAP.md` with full version plan through v1.0.0

# Contributing

Thanks for your interest in contributing to Mobile App Developer Tools.

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run the test suite (`pip install -r requirements-test.txt && pytest tests/ -v`)
5. Build the MCP server (`cd mcp-server && npm install && npm run build`)
6. Commit your changes and open a pull request

## Adding a Skill

1. Create a directory under `skills/` matching your skill name (e.g. `skills/mobile-my-skill/`)
2. Add a `SKILL.md` file with YAML frontmatter containing `name` (must match directory) and `description`
3. Include these sections in order: Trigger, Required Inputs, Workflow, Key References, Example Interaction, MCP Usage, Common Pitfalls, See Also
4. Run `pytest tests/test_skills.py -v` to verify frontmatter and structure

## Adding a Rule

1. Create a `.mdc` file under `rules/` (e.g. `rules/mobile-my-rule.mdc`)
2. Include YAML frontmatter with `description` and `alwaysApply` (boolean)
3. If `alwaysApply` is false, add `globs` to scope when the rule activates
4. Run `pytest tests/test_rules.py -v` to verify frontmatter

## Adding an MCP Tool

1. Create a tool file under `mcp-server/src/tools/` (e.g. `myTool.ts`)
2. Export a `register(server: McpServer): void` function
3. Use the `mobile_camelCase` naming convention (e.g. `mobile_myTool`)
4. Import and register the tool in `mcp-server/src/index.ts`
5. Build and test: `cd mcp-server && npm run build`

## Style Guide

See `.cursorrules` for writing conventions. Key points:

- No em dashes
- No filler words
- Active voice
- Code over prose
- Parallel structure in lists

## Reporting Issues

Open an issue on GitHub. Include steps to reproduce, expected behavior, and actual behavior.

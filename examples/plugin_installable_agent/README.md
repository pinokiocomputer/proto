# Plugin Installable Agent Example

This example shows how to write a Pinokio plugin launcher for an installable terminal agent.

It is intentionally a plugin example, not an app launcher example.

For the exact rules agents should follow when adapting this folder, see `SPEC.md`.

## What This Example Demonstrates

- plugin launcher metadata stored directly in `pinokio.js`
- top-level `install`, `uninstall`, `update`, and `run` action arrays
- running the plugin inside the caller's current working directory with `{{args.cwd}}`
- using a Windows-only shell override when the plugin expects bash

## How To Adapt It

1. Start with `pinokio.js`.
2. Replace the plugin-specific metadata and shell commands.
3. Preserve the overall plugin schema while adapting it to the new tool.

## Important Differences From App Launchers

- App launchers are usually tied to one app folder and manage that app in place.
- Plugin launchers are shared tools installed once and then reused across many folders.
- A plugin launcher should usually run against the user's current working folder with `{{args.cwd}}`, instead of running against the plugin folder itself.
- This is why plugin launchers are useful for common tools such as coding agents, linters, helpers, or generators that should work across many different apps.
- This example keeps its schema in `pinokio.js` instead of using the multi-file app-launcher pattern.

## Files In This Folder

- `pinokio.js`: the actual plugin launcher example
- `SPEC.md`: agent-facing rules and constraints for using this folder as a reference
- `README.md`: human-facing overview of what this example demonstrates
- `icon.png`: example icon used by the launcher

## Notes

- The current example uses `opencode` as the concrete plugin command.
- When adapting it to another plugin, preserve the schema and replace only the plugin-specific metadata and shell commands.

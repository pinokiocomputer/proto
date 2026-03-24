# Plugin Launcher Example Spec

This folder is the reference example for an installable Pinokio plugin launcher.

## Scope

Use this example when the task is to create, modify, review, debug, or document a Pinokio plugin launcher.

Do not use this folder as the reference for app launchers under `PINOKIO_HOME/api/<unique_name>`.

## Location Rules

- Plugin launchers live under `PINOKIO_HOME/plugin/<unique_name>`.
- If you are already inside the target plugin folder, build in place.
- If you are not already inside the target plugin folder, create a folder under `PINOKIO_HOME/plugin/<unique_name>`.
- If the unique folder name is not obvious, ask the user to confirm it before creating the folder.

## Structure Rules

- This example uses the plugin launcher pattern, not the app launcher pattern.
- Keep the plugin schema in the root `pinokio.js`.
- Do not add a separate `pinokio.json`.
- Do not create `install.js`, `start.js`, `reset.js`, or `update.js`.
- Keep `path: "plugin"` in `pinokio.js`.
- Keep `version: "6.0"` in `pinokio.js`.
- Plugin launchers are shared tools, so the `run` step should target the caller's folder with `{{args.cwd}}` when the plugin is meant to operate on the user's current project.

## Adaptation Checklist

- Replace the metadata fields in `pinokio.js`: `title`, `icon`, `description`, `link`.
- Replace the commands inside `install`, `uninstall`, `update`, and `run`.
- Keep the top-level action array names: `install`, `uninstall`, `update`, `run`.
- If the plugin should operate on the user's current project, keep `path: "{{args.cwd}}"` in the `run` step.
- If Windows requires bash, use Pinokio's bundled bash path in the Windows-only branch.
- Prefer adding comments in `pinokio.js` for plugin-specific behavior that is easy to get wrong.

## Reference Files

- `pinokio.js`: canonical plugin launcher example in this folder.
- `../../cli/installable/static/pinokio.js`: reference for the level of inline explanation that examples should provide.

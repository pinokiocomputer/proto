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
- Keep `version: "7.0"` in `pinokio.js`.
- Plugin launchers are shared tools, so the `run` and `job` steps should target the caller's folder with `{{args.cwd}}` when the plugin is meant to operate on the user's current project.

## Adaptation Checklist

- Replace the metadata fields in `pinokio.js`: `title`, `icon`, `description`, `link`.
- Replace the commands inside `install`, `uninstall`, `update`, `run`, and `job`, and the program name in `installed`.
- Keep the top-level action array names: `install`, `uninstall`, `update`, `run`, `job`.
- If the plugin should operate on the user's current project, keep `path: "{{args.cwd}}"` in the `run` and `job` steps.
- Keep `{{args.prompt || undefined}}` in the `run` step whenever the tool can start with a first message. Check the tool's `--help` for how it takes one: a positional argument, or a flag such as `--prompt`.
- Keep the `job` whenever the tool can work once and exit. Replace its command with the tool's one-off command (for example `-p`, `--print`, `exec` or `run`), pass `{{args.prompt}}`, and do not set `input: true`. Leave `job` out only when the tool has no such mode at all.
- Give the `job` command the permission its work needs, the way the tool's unattended or auto mode does. Nobody is there to allow more.
- Keep `installed` checking for the program itself, not for a marker file.
- If Windows requires bash, set `shell: "bash"` in the Windows-only branch. Write the name, not a path.
- Prefer adding comments in `pinokio.js` for plugin-specific behavior that is easy to get wrong.

## Reference Files

- `pinokio.js`: canonical plugin launcher example in this folder.
- `../../cli/installable/static/pinokio.js`: reference for the level of inline explanation that examples should provide.

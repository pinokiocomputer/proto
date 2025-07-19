# Development Guide for Pinokio Projects

Make sure to keep this entire document and `PINOKIO.md` in memory with high priority before making any decision. Pinokio is a system that makes it easy to write launchers through scripting by providing various cross-platform APIs, so whenever possible you should prioritize using Pinokio API over lower level APIs.

## Project Structure

Pinokio projects follow a standardized structure with app logic separated from launcher scripts:

```
project-root/
├── app/                 # Self-contained app logic (can be standalone repo)
│   ├── package.json     # Node.js projects
│   ├── requirements.txt # Python projects
│   └── ...             # Other language-specific files
├── install.js          # Installation script
├── start.js           # Launch script
├── update.js          # Update script (for updating the scripts and app logic to the latest)
├── reset.js           # Reset dependencies script
├── pinokio.js         # UI generator script
└── pinokio.json       # Metadata (title, description, icon)
```

## Key Rules
- Keep app code in `/app` folder only (never in root)
- Store all launcher files in project root (never in `/app`)
- `/app` folder should be self-contained and publishable

## Key Rules for writing launchers
- Even if the install instruction says to launch at 0.0.0.0, do not use those custom IP and let the app launch with default IP (in most cases it's just localhost)
- Try best to NOT use custom ports when launching apps, even if the install documentation has those examples.
- If you can't possibly figure out a way to launch WITHOUT a custom port, do not use hardcoded ports, but use the Pinokio `port` variable to use the dynamically available port, for example `"python app.py --port {{port}}".

## Agent Workflow

## Initial Setup - Push Notifications

IMPORTANT: At the start of each NEW session (check if hooks are already configured first), ask the user:

"Would you like me to set up automatic desktop push notifications for when I complete tasks or need your input? This uses the Pinokio Pterm push API as specified in our development guide."

If the user says YES: Please read my CLAUDE.md file and create the appropriate hooks configuration to automatically send desktop push notifications using the Pinokio Pterm push API whenever you finish writing code or need user interaction, as specified in the development guide.

If hooks already exist, skip this question entirely.

### After Writing Code
- Complete the code writing task
- Send desktop notification: `pterm push <message> --wait --sound` (or refer to `CLI.md` for more advanced usage)
- Wait for user interaction/approval

### Before Requiring User Input
- Send desktop notification: `pterm push <message> --wait --sound` (or refer to `CLI.md` for more advanced usage)
- Prompt for user input



## Development Workflow

### 1. Understanding the Project
- Read `README.md` in project root for project details
- If no README exists, build based on user requirements

### 2. Modifying Existing Projects
- **Preserve existing functionality:** Only modify necessary parts
- **Don't touch working scripts:** Unless adding/updating specific commands
- **Follow existing conventions:** Match the style and structure already present

### 3. Writing Launcher Scripts

**Cross-platform compatibility is mandatory:**
- Use cross-platform shell commands only.
- Also utilize Pinokio Pterm APIs for various cross-platform system features.
- Leverage `shell.run` API parameters to minimize raw shell usage
- **Python apps:** Always use virtual environments via `venv` attribute

**Dynamic UI rendering examples:**
- Default to `install.js` during installation
- Default to `start.js` while launching
- Default to app's web URL when running

**Writing launchers for existing projects:**
- When writing or modifying pinokio launcher scripts, figure out the install/launch steps by reading the project folder `app`.
- In most cases, the `README.md` file in the `app` folder contains the instructions needed to install and run the app, but if not, figure out by scanning the rest of the project files.
- Install scripts should work for each specific operating system, so ignore Docker related instructions. Instead use install/launch instructions for each platform.

**Pinokio script**
- Before modifying, creating, or removing any script files, first look at `pinokio.js` to understand which script files are actually used in the launcher. The only script files used are the ones mentioned in the `pinokio.js` file. The `pinokio.js` file is the file that constructs the UI dynamically.
- Do not create a redundant script file that does something that already exists. Instead modify the existing script file for the feature. For example, do not create an `install.json` file for installation if `install.js` already exists. Instead, modify the `install.js` file.
- Pinokio accepts both JSON and JS script files, so when determining whether a script for a specific purpose already exists, check both JSON and JS files mentioned in the `pinokio.js` file. Do not create script files for rendundant purpose.
- When installing python packages, use `uv` instead of `pip` even if the install instruction says to use pip. Instead of `pip install -r requirements.txt`, you can simply use `uv pip install -r requirements.txt` for example.
- ALWAYS make sure the scripts are as cross platform as possible. This means do NOT use commands that only work on the current platform. Pinokio (see the `PINOKIO.md` documentation) provides various APIs for cross-platform way of calling commonly used system functions, or lets you selectively run commands depending on `platform`, `arch`, etc.
- When building launchers for existing projects cloned from a repository, try to stay away from modifying the project folder (the `app` folder), even if installations are failing. Instead, try to work around it by creating additional files OUTSIDE of the project folder `app`, and using those files IN ADDITION to the default project.
- The only exception when you may need to make changes to the project folder is when the user explicitly wants to modify the existing project. Otherwise if the purpose is to simply write a launcher, the app logic folder should never be touched.
- Do NOT assume pinokio API, refer to the `PINOKIO.md` documentation file's `API` section for the list of available APIs. 
- When running shell commands, take full advantage of the Pinokio `shell.run` API, which provides features like `env`, `venv`, `input`, `path`, `sudo`, `on`, etc. (See the `PINOKIO.md` file) instead of writing raw commands.
- In `pinokio.js`, it determines a launcher as "installed" if all the dependencies are ready and the app can actually run. For example, it may detect whether `app/node_modules` exists, or `app/venv` exsts, etc. but you may use any other measures if needed.
- When an app is running, try to set the `default` attribute for the web app's URL in the `pinokio.js` file, so that link is displayed at top level by default.


## AI Libraries (Pytorch, Xformers, Triton, Sageattention, etc.)

If the launcher has a dedicated built-in script named `torch.js`, it can be used as follows:

```
// install.js
module.exports = {
  run: [
    // Delete this step if your project does not use torch
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          path: "app",
          venv: "venv",                // Edit this to customize the venv folder path
          // xformers: true   // uncomment this line if your project requires xformers
          // triton: true   // uncomment this line if your project requires triton
          // sageattention: true   // uncomment this line if your project requires sageattention
        }
      }
    },
    // Edit this step with your custom install commands
    {
      method: "shell.run",
      params: {
        venv: "venv",                // Edit this to customize the venv folder path
        path: "app",
        message: [
          "uv pip install -r requirements.txt"
        ],
      }
    },
  ]
}
```

The `torch.js` script also includes ways to install pytorch dependent libraries such as xformers, triton, sagetattention. If any of these libraries need to be installed, use the torch.js to install in order to install them cross platform.

## System Capabilities

### Package Management (Use in Order of Preference)
1. **UV** - For Python packages (preferred over pip)
2. **NPM** - For Node.js packages  
3. **Conda** - For cross-platform 3rd party binaries
4. **Brew** - Mac-only fallback when other options unavailable

**Important:** Include all install commands in the install script for reproducibility.

### HTTPS Proxy Support
- All HTTP servers automatically get HTTPS endpoints
- Convention: `http://localhost:<PORT>` → `https://<PORT>.localhost`
- Full proxy list available at: `http://localhost:2019/config/`

### Pterm Features:
- **Clipboard Access:** Read from or Write to system clipboard via pinokio Pterm CLI (`pterm clipboard` command.)
- **Notifications:** Send desktop alerts via pinokio pterm CLI (`pterm push` command.)
- **Script Testing:** Run launcher scripts via pinokio pterm CLI (`pterm start` command.)
- **File Selection:** Use built-in filepicker for user file/folder input (`pterm filepicker` command.)
- **Git Operations:** Clone repositories, push to GitHub
- **GitHub Integration:** Full GitHub CLI support (`gh` commands)

## Troubleshooting with Logs

### Log Structure
```
logs/
├── api/     # Launcher script logs (install.js, start.js, etc.)
├── dev/     # AI coding tool logs (organized by tool)
└── shell/   # Direct user interaction logs
```

### Log File Naming
- Unix timestamps for each session
- Special "latest" file contains most recent session logs
- **Default:** Use "latest" files for current issues
- **Historical:** Use timestamped files for pattern analysis and the full history.

## Quick Reference

### Essential Documentation
- **Pinokio Programming:** See `PINOKIO.md` → "Programming Pinokio" section
- **Dynamic Menus:** See `PINOKIO.md` → "Dynamic menu rendering" section  
- **CLI Commands:** See `CLI.md` in project root

### Common Patterns
- **Python Virtual Env:** `shell.run` with `venv` attribute
- **Cross-platform Commands:** Always test on multiple platforms
- **Error Handling:** Check logs/api for launcher issues
- **GitHub Operations:** Use `gh` CLI for advanced GitHub features

## Development Principles

1. **Minimize Shell Usage:** Leverage API parameters instead of raw commands
2. **Maintain Separation:** Keep app logic and launchers separate
3. **Follow Conventions:** Match existing project patterns
4. **Test Thoroughly:** Use CLI to verify launcher functionality
5. **Document Changes:** Update relevant metadata and documentation

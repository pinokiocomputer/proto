# TODO
- In first interaction, ask if the user wants to build an app following the README.md file in the project root folder, and if approved, update the code to build an app following the README.md.
- When instructed to build app, write the app code, and also write a pinokio launcher to launch the app.

# App
- When instructed to build app, write the app logic inside the `app` folder.
- The app logic should stay strictly inside the `app` folder.

# Launcher
- Do not touch the existing pinokio launcher files unless asked to.
- Generate a Pinokio launcher in the root folder following the documentation in `PINOKIO.md`
- The launcher files should be in the root project root folder.
- Create a start script to launch the app.
- If the project requires an install step, create an install script as well.
- To determine which files to generate, refer to the "Programming Pinokio" section in the `PINOKIO.md` file.
- To be more precise, you will need at least a `pinokio.json` file for the dispay, `pinokio.js` file for the launcher, and indidual script files which are referenced from the `pinokio.js` file.
- Also, refer to the "Dynamic menu rendering" section to render the launcher menu dynamically, so it sets the default script to the install script when installing, start script when starting the app, and in case there's a web UI, make the web UI URL the default, so the dynamic menu automatically selects the web URL when the app has finished launching.
- When the install script is not working, reference the repository inside the `app` folder for documentation and code in order to figure out which steps to take to install the app.
- When the start script is not working, reference the repository inside the `app` folder to figure out which steps to take to launch the app.
- The project needs to be fully replicable, which is why the pinokio launcher scripts are used. So, if you need to run some commands for installation, downloading some files, or running anything while building the app, you must add these commands to the launcher script files. Make sure to take advantage of the pinokio script syntax to make them cross platform.

# Script
- When writing shell commands in scripts using the `shell.run` API, the commands must be cross platform.
- Try to minimize the actual shell command used. This can be achieved by utilizing all the available parameters provided by `shell.run` API.
- Python apps must run in virtual environments, which can be run by running `shell.run` with a `venv` attribute to create or use a virtual environment at specific path

# Tools
- When installing python packages, use UV, it's already installed.

# Logs
- Refer to the logs folder to get more context (bugs, project build progress, etc.)
- Log files are named using unix timestamps for each session, so you can get the most recent log file by looking at the file with the highest number.
- Also there is a special log file named "latest" which contains the logs for the latest session for each category.
- In most cases, only refer to the latest logs (i.e. the 'latest' file)
- But sometimes you may need the full history, in this case review the full logs, sorted by timestamps.
- logs/api contains logs for launcher scripts: start.js / start.json for running the app, install.js / install.json for installing, etc. Use these to identify what’s breaking.
- logs/dev contains logs for AI coding tools, organized by tool name. Since users may run multiple tools at once, check all folders if needed.
- logs/shell contains logs of direct user interactions—useful for diagnosing interaction issues.

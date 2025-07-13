## Project structure for apps

A project is typically made up of the app logic and a set of launcher scripts that make it easy to launch and manage the apps.

- `/app`: the app logic folder. Do not put app code in the root folder but put inside the `app` folder so the `app` folder in a self contained manner so the `app` folder can even be published as a standalone git repository.
  - in case of node.js projects, should be a typical node.js project structure, with a `package.json` file.
  - in case of python projects, includes python code and dependency files such as `requirements.txt`.
  - can also be any other type of programming language
- `install.js`: pinokio script for installing requirements needed to run the app inside the `app` folder
- `start.js`: pinokio script for launching the actual app.
- `update.js`: pinokio script for updating the pinokio launcher files as well as the app logic.
- `reset.js`: pinokio script for resetting the installed dependencies.
- `pinokio.js`: pinokio launcher file that generates a UI that links to the scripts
- `pinokio.json`: a pinokio metadata JSON file for storing the pinokio launcher related information such as title, description, and icon.

All launcher related files should be stored in the project root folder and NOT inside the app logic folder (`app`).

# When and What to change

- If the project folder already contains a set of pinokio script and launcher files, try to use the existing files and only modify the relevant parts in those files.
- If the existing script files already look functional, do not touch unless there's a need for adding or updating the commands.

# How to write a launcher

- Generally it's trivial to infer how to write the launcher scripts by just looking at what the existing script files look like and following the existing convention.
- If it is not possible to infer easily, refer to the "Programming Pinokio" section of the `PINOKIO.md` file which contains the documentation for Pinokio.
- In many cases, the UI needs to dynamically change depending on the app status. Refer to the "Dynamic menu rendering" section of the `PINOKIO.md` file to render the launcher menu dynamically. Some examples for dynamic rendering:
  - Set the default menu item to `install.js` during install
  - Set the default menu item to `start` while launching an app
  - Once the app has fully launched and is running, make the app's web URL the default menu item.
- When writing shell commands in scripts using the `shell.run` API, the commands must be cross platform.
- Try to minimize the actual shell command used. This can be achieved by utilizing all the available parameters provided by `shell.run` API.
- Python apps must run in virtual environments, which can be run by running `shell.run` with a `venv` attribute to create or use a virtual environment at specific path

# Logs

Logs can be used to troubleshoot issues or gather information for interacting with or building out the app.

- Refer to the logs folder to get more context (bugs, project build progress, etc.)
- Log files are named using unix timestamps for each session, so you can get the most recent log file by looking at the file with the highest number.
- Also there is a special log file named "latest" which contains the logs for the latest session for each category.
- In most cases, only refer to the latest logs (i.e. the 'latest' file)
- But sometimes you may need the full history, in this case review the full logs, sorted by timestamps.
- logs/api contains logs for launcher scripts: start.js / start.json for running the app, install.js / install.json for installing, etc. Use these to identify what’s breaking.
- logs/dev contains logs for AI coding tools, organized by tool name. Since users may run multiple tools at once, check all folders if needed.
- logs/shell contains logs of direct user interactions—useful for diagnosing interaction issues.

# Available System Capabilities

Assume the following capabilities, since if you're seeing this document, it means Pinokio is installed on the user's machine.

- **Package managers:** The following package managers are already installed:
  - **UV:** UV is already installed through pinokio, so When installing python packages, use UV instead of pip.
  - **Conda:** Conda is already installed.
    - When installing python packages, do NOT use Conda. Use UV.
    - Use Conda for 3rd party packages that cannot be installed through pip or uv.
    - Try to use conda as much as possible when you need to install 3rd party packages, since conda is often cross platform. However.
  - **Brew:** Brew is already installed on macs, so if you cannot find a conda package, try the brew package manager to install 3rd party modules on mac.
- **Automatic HTTPS:** Pinokio automatically starts an HTTPS proxy for all running HTTP server ports, so when you need to use HTTPS for any given app (for example for OAuth, etc.), assume the HTTPS endpoints are automatically available for every running web app. Here is the convention:
  - For every `http://localhost:<PORT>` that's running, Pinokio automatically creates an HTTPS endpoint at `https://<PORT>.localhost`
- **Pinokio CLI:** You can access a lot of powerful system features through Pinokio CLI. For advanced usage, refer to the `CLI.md` file in the project root folder. Here are some example features available through CLI:
  - **Desktop notification:** Send push notifications when the user needs to be alerted about certain events. you can send notification with `pinokio push <message>`
  - **Run pinokio scripts:** To test that the launcher scripts are running fine, you can test by running `pinokio start <script_path>`. After the test is over, simply quitting the terminal session will stop the script. Or you may call `pinokio stop <script_path>`
  - **Let the user submit files and folders through Filepicker:** Whenever you need a way for the user to interactively provide a list of file paths or folder paths, use the built-in filepicker from Pinokio.
    - When you need the user to submit custom files or folders, run `pinokio filepicker --type=file` or `pinokio filepicker --type==folder` to ask the user to submit the files. The CLI program will print the selected files or folders line by line and halt.
    - When you need to allow multiple path selection, pass `--multiple`, for example `pinokio filepicker --type=file --multiple`.
- **Git:** git is installed, so it's possible to run all git operations.
- **Github:** The system is connected to github, so it's possible to clone from or push to github, even private repos.

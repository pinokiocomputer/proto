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

Always assume the following capabilities are available on the system:

- **When you need to install 3rd party binaries or packages:** The following package managers are already installed on the system:
  - **Use UV for python packages:** UV is available, so when installing python packages, use UV instead of pip.
  - **Use NPM for node.js packages:** NPM is available, so when installing node.js packages, use npm.
  - **Use Conda for 3rd party binaries:** Use Conda for 3rd party packages that cannot be installed through pip, uv, or npm. Try to use conda as much as possible when you need to install 3rd party packages, since conda is often cross platform.
  - **Use brew on macs if no other option is avilable:** In case you can't find any other way to install and you're on a Mac, use `brew`.
  - **Include the install instructions in the install script:** To make sure the installation can be replicated on every machine, don't just install but include the install commands into the pinokio install script (You can try replicating by running `pinokio start install.js` for example).
- **Access HTTPS endpoints for ALL locally running servers:** Pinokio automatically starts an HTTPS proxy for all running HTTP server ports, so when you need to use HTTPS for any given app (for example for OAuth, etc.), assume the HTTPS endpoints are automatically available for every running web app.
  - The convention for the HTTPS endpoint is: for every `http://localhost:<PORT>` that's running, you can access its HTTPS endpoint at `https://<PORT>.localhost`
  - Additionally, the full available list of HTTPS proxies can be found at http://localhost:2019/config/ which is powered by Caddy.
- **Powerful system features through CLI:** While developing, you can access a lot of powerful system features through Pinokio CLI. For advanced usage, refer to the `CLI.md` file in the project root folder. Here are some example features available through CLI:
  - **When you need to alert the user on anything:** Send desktop push notifications when the user needs to be alerted about certain events by running a pinokio CLI command. Refer to the `push` section in the `CLI.md` file in the project root folder.
  - **When you need to automate things by running pinokio scripts:** To test that the launcher scripts are running fine, you can do this by running a pinokio CLI command. Refer to the `start` section in the `CLI.md` file in the project root folder.
  - **When you need to let the user submit files or folders:** Whenever you need a way for the user to interactively submit files or folders instead of directly uploading, let them submit the file paths. You can do this with the built-in filepicker pinokio CLI command. Refer to the `filepicker` section in the `CLI.md` file in the project root folder.
- **When you need to clone some git repository:** git is already installed, so include a `shell.run` API call that runs `git clone <repo url>` commands in the install script and run it to pull in the repository. 
- **When you need to publish to Github:** The system is connected to github, so it's possible to publish to github using the native git command.
- **When you need to interact various non-git-native Github features:** It is possible to interact with Github using the built-in official Github CLI program (Examples: `gh repo fork`, `gh issue create`, etc.). The entire documentation is available at https://cli.github.com/manual/

module.exports = {
  version: "7.0",

  // Plugin launchers keep their metadata in the root `pinokio.js`.
  // Do not split this example into a separate `pinokio.json`.
  // Replace these values when adapting the example to another plugin.
  title: "Opencode",
  icon: "icon.png",
  description: "The AI coding agent built for the terminal.",
  link: "https://opencode.ai/",

  // Keep plugin launchers under PINOKIO_HOME/plugin/<unique_name>.
  // Do not convert this example into an app launcher under /api.
  path: "plugin",

  // Plugin launchers use top-level action arrays instead of install.js/start.js.
  // Replace the command, but keep the overall `install` structure.
  install: [{
    method: "shell.run",
    params: {
      message: "npm install -g opencode-ai@latest"
    }
  }],

  // Uninstall the external dependency first, then remove the plugin folder.
  uninstall: [{
    method: "shell.run",
    params: {
      message: "npm uninstall -g opencode-ai"
    }
  }, {
    method: "fs.rm",
    params: {
      path: "."
    }
  }],

  // Update both the launcher checkout and the installed dependency.
  update: [{
    method: "shell.run",
    params: {
      message: "git pull",
    }
  }, {
    method: "shell.run",
    params: {
      message: "npm install -g opencode-ai@latest"
    }
  }],

  // Run the plugin in the caller's current working directory so the terminal
  // agent operates on the user's project instead of the plugin folder itself.
  run: [{
    when: "{{platform === 'win32'}}",
    method: "shell.run",
    params: {
      // Use Pinokio's bundled bash on Windows when the plugin expects a bash shell.
      shell: "bash",
      message: "opencode",
      path: "{{args.cwd}}",
      // Keep stdin attached for interactive terminal agents.
      input: true
    }
  }, {
    when: "{{platform !== 'win32'}}",
    id: "run",
    method: "shell.run",
    params: {
      message: "opencode",
      path: "{{args.cwd}}",
      input: true
    }
  }]
}

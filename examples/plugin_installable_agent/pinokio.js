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

  // Tells Pinokio whether the tool is there. Check for the program itself,
  // not for a marker file. Pinokio asks before `run` and `job`, and shows
  // "not installed" instead of starting a tool that is missing.
  async installed(kernel) {
    return Boolean(kernel.which("opencode"))
  },

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
      // Write the name `bash`, not a path.
      shell: "bash",
      // Pass the user's request to the tool as its first message. Written this
      // way, Pinokio escapes it and leaves it out when there is no request.
      // Find how the tool takes a first message in its `--help`: here it is
      // the `--prompt` flag. A positional one goes inside `_`:
      // `_: ["<tool>", "{{args.prompt || undefined}}"]`.
      message: {
        _: ["opencode"],
        prompt: "{{args.prompt || undefined}}"
      },
      path: "{{args.cwd}}",
      // Keep stdin attached for interactive terminal agents.
      input: true
    }
  }, {
    when: "{{platform !== 'win32'}}",
    id: "run",
    method: "shell.run",
    params: {
      message: {
        _: ["opencode"],
        prompt: "{{args.prompt || undefined}}"
      },
      path: "{{args.cwd}}",
      input: true
    }
  }],

  // The same tool working once and exiting: it takes the request, does the
  // work, prints its answer and ends. Pinokio uses `job` to run the tool in the
  // background, with no terminal on screen and nobody to answer it.
  // - Use the tool's one-off command (here `opencode run`), not its interactive one.
  // - Do not set `input: true`.
  // - A job always has a request, so `{{args.prompt}}` needs no `|| undefined`.
  // - Give the tool the permission its work needs in the command itself
  //   (here `--auto`), because nobody is there to allow more.
  // Leave `job` out only when the tool has no one-off mode at all.
  job: [{
    when: "{{platform === 'win32'}}",
    method: "shell.run",
    params: {
      shell: "bash",
      message: {
        _: ["opencode", "run", "{{args.prompt}}"],
        auto: true
      },
      path: "{{args.cwd}}"
    }
  }, {
    when: "{{platform !== 'win32'}}",
    method: "shell.run",
    params: {
      message: {
        _: ["opencode", "run", "{{args.prompt}}"],
        auto: true
      },
      path: "{{args.cwd}}"
    }
  }]
}

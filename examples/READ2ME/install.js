module.exports = {
  run: [
    // Edit this step to customize the git repository to use
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/WismutHansen/READ2ME app",
        ]
      }
    },
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          venv: "env",                // Edit this to customize the venv folder path
          // xformers: true   // uncomment this line if your project requires xformers
        }
      }
    },
    // Edit this step with your custom install commands
    {
      method: "shell.run",
      params: {
        venv: "env",                // Edit this to customize the venv folder path
        path: "app",                // Edit this to customize the path to start the shell from
        message: [
          "pip install uv",
          "uv pip install PyYAML",
          "uv pip install lxml[html_clean]",
          "uv pip install -r requirements.txt",
          "uv pip install -r requirements_stts2.txt",
          "uv pip install -r requirements_F5.txt",
          "python -m TTS.setup_piper",
          "playwright install"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",                // Edit this to customize the venv folder path
        path: "app/frontend",                // Edit this to customize the path to start the shell from
        message: [
          "npm install"
        ]
      }
    },
    {
      method: "fs.link",
      params: {
        venv: "app/env"
      }
    }
  ]
}

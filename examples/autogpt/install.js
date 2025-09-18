module.exports = {
  run: [
    // Edit this step to customize the git repository to use
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/Significant-Gravitas/AutoGPT app",
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "git reset --hard 9ae6389c6cd4c8ae0b1f36f3e8e21d09cb963135"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        message: [
          "conda install -y conda-forge::poetry"
        ]
      }
    },
    // Edit this step with your custom install commands
    {
      method: "shell.run",
      params: {
        venv: "env",                // Edit this to customize the venv folder path
        path: "app/rnd/autogpt_server",                // Edit this to customize the path to start the shell from
        message: [
          "poetry config virtualenvs.in-project true",
          "poetry install",
          "poetry run prisma generate",
          "poetry run prisma migrate dev --name init",
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app/rnd/autogpt_builder",                // Edit this to customize the path to start the shell from
        message: [
          "npm install"
        ]
      }
    },
  ]
}

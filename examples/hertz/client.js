module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        id: "client",
        venv: "env",                // Edit this to customize the venv folder path
        env: { },                   // Edit this to customize environment variables (see documentation)
        path: "app",                // Edit this to customize the path to start the shell from
        message: [
          "python inference_client.py",    // Edit with your custom commands
        ],
        on: [{
          // The regular expression pattern to monitor.
          // When this pattern occurs in the shell terminal, the shell will return,
          // and the script will go onto the next step.
          "event": "/Enter the index/",   

          // "done": true will move to the next step while keeping the shell alive.
          // "kill": true will move to the next step after killing the shell.
          "done": true
        }]
      }
    },
    {
      method: "shell.run",
      params: {
        id: "client",
        message: "\n"
      }
    }
  ]
}

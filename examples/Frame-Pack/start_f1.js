module.exports = async (kernel) => {
  const port = await kernel.port()
  
  console.log("Starting F1 version directly")
  const scriptToRun = "demo_gradio_f1.py"
  
  return {
    daemon: true,
    run: [
      {
        method: "shell.run",
        params: {
          venv: "env",                // Edit this to customize the venv folder path
          env: { },                   // Edit this to customize environment variables (see documentation)
          path: "app",                // Edit this to customize the path to start the shell from
          message: [
            `python ${scriptToRun} --server 127.0.0.1 --port ${port}`,    // Edit with your custom commands
          ],
          on: [{
            "event": "/http:\/\/\\S+/",    // Regular expression for the expected event
            "done": true
          }]
        }
      },
      {
        method: "local.set",
        params: {
          url: "{{input.event[0]}}"
        }
      }
    ]
  };
}; 
module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        id: "shell",
        venv: "env",                // Edit this to customize the venv folder path
        env: {
          PYTORCH_ENABLE_MPS_FALLBACK: "1"
        },                   // Edit this to customize environment variables (see documentation)
        path: "app",                // Edit this to customize the path to start the shell from
        message: [
          "git checkout {{args.branch}}",
          "{{args.branch === 'main' ? 'python src/play.py --pretrained' : null}}",    // Edit with your custom commands
          "{{args.branch === 'csgo' ? 'python src/play.py' : null}}",    // Edit with your custom commands
        ],
        on: [{
          // The regular expression pattern to monitor.
          // When this pattern occurs in the shell terminal, the shell will return,
          // and the script will go onto the next step.
          //"event": "/http:\/\/\\S+/",   
          "event": "/(press enter|enter a number)/i",   

          // "done": true will move to the next step while keeping the shell alive.
          // "kill": true will move to the next step after killing the shell.
          "done": true
        }]
      }
    },
    {
      when: "{{args.branch === 'main'}}",
      method: "input",
      params: {
        type: "notify",
        title: "Select",
        form: [{
          "key": "game",
          "title": "Select a number"
        }]
      }
    },
    {
      when: "{{args.branch === 'main'}}",
      method: "shell.enter",
      params: {
        id: "shell",
        message: "{{input.game}}" 
      }
    },
    {
      method: "shell.enter",
      params: {
        id: "shell",
        message: "\n\n" 
      }
    },
  ]
}

module.exports = {
  run: [
    // Edit this step to customize the git repository to use
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://huggingface.co/spaces/cocktailpeanut/fish-speech-1 app",
        ]
      }
    },
    // Delete this step if your project does not use torch
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          venv: "env",                // Edit this to customize the venv folder path
          path: "app",                // Edit this to customize the path to start the shell from
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
          "pip install -r requirements.txt"
          //"pip install -e .",
          //"pip install cachetools livekit livekit-agents"
        ]
      }
    },
//    {
//      method: "shell.run",
//      params: {
//        path: "app/tools",                // Edit this to customize the path to start the shell from
//        message: [
//          "huggingface-cli download fishaudio/fish-speech-1.4 --local-dir checkpoints/fish-speech-1.4"
//        ]
//      }
//    },
    {
      method: "fs.link",
      params: {
        venv: "app/env"
      }
    }
  ]
}

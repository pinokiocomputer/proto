module.exports = {
  run: [
    // Edit this step to customize the git repository to use
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/ZeyueT/AudioX app",
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
      triton: true,              // <-- fixed: added comma
      // sageattention: true   // uncomment this line if your project requires sageattention
      flashattention: true       // Uncomment to enable FlashAttention
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
          "uv pip install hf_xet",
          "uv pip install -e .",
          "uv pip install pydantic==2.10.6"
        ]
      }
    },
    // New: Download model files
    {
      method: "fs.download",
      params: {
        url: "https://huggingface.co/HKUSTAudio/AudioX/resolve/main/model.ckpt",
        dir: "app/model"
      }
    },
    {
      method: "fs.download",
      params: {
        url: "https://huggingface.co/HKUSTAudio/AudioX/resolve/main/config.json",
        dir: "app/model"
      }
    }
  ]
}

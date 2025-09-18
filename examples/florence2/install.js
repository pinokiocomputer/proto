module.exports = {
  run: [
    // Edit this step to customize the git repository to use
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://huggingface.co/spaces/cocktailpeanut/Florence-2 app",
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
        env: {
          "FLASH_ATTENTION_SKIP_CUDA_BUILD": "TRUE"
        },
        message: [
          "pip install gradio==4.44.1 devicetorch",
          "pip install git+https://github.com/peanutcocktail/transformers.git",
          //"pip install {{gpu == 'nvidia' ? 'transformers' : 'git+https://github.com/peanutcocktail/transformers.git'}}",
          "pip install -r requirements.txt",
          //"{{gpu === 'nvidia' ? 'pip install flash-attn --no-build-isolation' : ''}}"
        ]
      }
    },
    //  Uncomment this step to add automatic venv deduplication (Experimental)
    //{
    //  method: "fs.link",
    //  params: {
    //    venv: "app/env"
    //  }
    //},
    {
      method: "notify",
      params: {
        html: "Click the 'start' tab to get started!"
      }
    }
  ]
}

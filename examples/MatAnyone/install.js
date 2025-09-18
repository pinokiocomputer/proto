module.exports = {
  run: [
/*     {
     when: "{{gpu !== 'nvidia'}}",
     method: "notify",
     params: {
       html: "This app requires an NVIDIA GPU."
     }, 
      next: null
    }, */
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/cocktailpeanut/MatAnyone app",
        ]
      }
    },
    {
      method: "fs.copy",
      params: {
        src: "app.py",
        dest: "app/hugging_face/app.py"
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
          "uv pip install -r hugging_face/requirements.txt" 
        ]
      }
    }
  ]
}

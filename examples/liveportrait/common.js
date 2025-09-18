module.exports = {
  run: [
    // Edit this step to customize the git repository to use
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/KwaiVGI/LivePortrait app",
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
          "pip install gradio devicetorch",
          "pip install -r {{platform==='darwin' ? 'requirements_macOS.txt' : 'requirements.txt'}}",
          "pip install \"pydantic>=2.0,<2.11.0\""
        ]
      }
    },
    {
      when: "{{gpu === 'nvidia'}}",
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: "pip install onnxruntime==1.19.2"
      }
    },
    {
      when: "{{gpu === 'nvidia'}}",
      method: "shell.run",
      params: {
        message: "python setup.py build install",
        path: "app/src/utils/dependencies/XPose/models/UniPose/ops",
        venv: "{{path.resolve(cwd, 'app/env')}}"
      }
    },
    {
      when: "{{platform !== 'linux'}}",
      method: "fs.link",
      params: {
        venv: "app/env"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: "app/pretrained_weights" 
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "git lfs install",
          "git clone --depth=1 https://huggingface.co/KwaiVGI/LivePortrait pretrained_weights"
        ]
      }
    },
  ]
}

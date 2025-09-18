module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/IAHispano/Applio applio",
        ]
      }
    },
    {
      method: "fs.download",
      params: {
        uri: "https://huggingface.co/IAHispano/Applio/resolve/main/env.zip",
        dir: "applio"
      }
    },
    {
      method: "shell.run",
      params: {
        path: "applio",
        message: [
          "unzip env.zip",
          "rm env.zip"
        ],
      }
    },
    {
      method: "shell.run",
      params: {
        path: "applio",
        message: [
          "conda create --no-shortcuts -y -k --prefix env python=3.9",
        ],
      }
    },
    {
      method: "shell.run",
      params: {
        conda: {
          path: "env",
          python: "python=3.9"
        },
        path: "applio",
        message: [
          "pip install --upgrade setuptools",
          "pip install -r requirements.txt",
          "pip uninstall torch torchvision torchaudio -y",
          "pip install torch==2.1.1 torchvision==0.16.1 torchaudio==2.1.1 --index-url https://download.pytorch.org/whl/cu121",
        ],
      }
    },
    {
      method: "notify",
      params: {
        html: "Click the 'start' tab to get started!"
      }
    }
  ]
}
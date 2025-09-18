module.exports = {
  run: [
    // Edit this step to customize the git repository to use
    {
      method: "shell.run",
      params: {
        message: [
          "git lfs install",
          "git clone https://huggingface.co/spaces/cocktailpeanut/DiffRhythm app",
          //"git clone https://github.com/mp3pintyo/DiffRhythm app",
          //"git clone https://github.com/peanutcocktail/DiffRhythm app",
          "pnpm install",
        ]
      }
    },
//    {
//      when: "{{platform === 'darwin'}}",
//      method: "shell.run",
//      params: {
//        message: [
//          "conda install -y -c conda-forge cmake=4.0.0"
//        ]
//      }
//    },
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
        path: "app",
        message: [
          "uv pip install -r requirements.txt",
        ]
      }
    },
    // Edit this step with your custom install commands
    {
      when: "{{gpu === 'nvidia'}}",
      method: "shell.run",
      params: {
        venv: "env",                // Edit this to customize the venv folder path
        path: "app",
        message: [
          "uv pip install onnxruntime-gpu",
        ]
      }
    },
    {
      when: "{{gpu !== 'nvidia'}}",
      method: "shell.run",
      params: {
        venv: "env",                // Edit this to customize the venv folder path
        path: "app",
        message: [
          "uv pip install onnxruntime"
        ]
      }
    },
    // Delete this step if your project does not use torch
//    {
//      method: "fs.link",
//      params: {
//        venv: "app/env"
//      }
//    },
    // espeak-ng installer script lifted from AllTalk Launcher from 6Morpheus6
    // https://github.com/pinokiofactory/AllTalk-TTS/blob/main/install.js
    {
      when: "{{which('brew')}}",
      method: "shell.run",
      params: {
        message: "brew install espeak-ng",
        env: {
          HOMEBREW_NO_AUTO_UPDATE: 1
        }
      },
      next: 'end'
    },
    {
      when: "{{which('apt')}}",
      method: "shell.run",
      params: {
        sudo: true,
        message: "apt install libaio-dev espeak-ng"
      },
      next: 'end'
    },
    {
      when: "{{which('yum')}}",
      method: "shell.run",
      params: {
        sudo: true,
        message: "yum install libaio-devel espeak-ng"
      },
      next: 'end'
    },
    {
      when: "{{which('winget')}}",
      method: "shell.run",
      params: {
        sudo: true,
        message: "winget install --id=eSpeak-NG.eSpeak-NG -e --silent --accept-source-agreements --accept-package-agreements"
      }
    },
    {
      id: 'end',
      method: 'input',
      params: {
        title: "Restart Pinokio!!",
        description: "Install Complete. Please restart Pinokio and try running the app"
      }
    },
  ]
}

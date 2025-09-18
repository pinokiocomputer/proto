module.exports = {
  run: [
//    {
//      method: "shell.run",
//      params: {
//        message: [
//          "conda install -y -c conda-forge ninja",
////          "conda install -y -c anaconda vs2019_win-64"
//        ]
//      }
//    },
    // Edit this step to customize the git repository to use
    {
      when: "{{platform === 'win32'}}",
      method: "shell.run",
      params: {
        message: [
          "echo %PATH%"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/deepbeepmeep/Hunyuan3D-2GP app",
          //"git clone https://github.com/Tencent/Hunyuan3D-2 app"
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
          "uv pip install -r requirements.txt"
        ]
      }
    },
    // Edit this step with your custom install commands
    {
      method: "shell.run",
      params: {
        venv: "../../../env",                // Edit this to customize the venv folder path
        env: {
          DISTUTILS_USE_SDK: 1
        },
        path: "app/hy3dgen/texgen/custom_rasterizer",                // Edit this to customize the path to start the shell from
        message: [
          "python setup.py install"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "../../../env",                // Edit this to customize the venv folder path
        env: {
          DISTUTILS_USE_SDK: 1
        },
        path: "app/hy3dgen/texgen/differentiable_renderer",                // Edit this to customize the path to start the shell from
        message: [
          "python setup.py install"
        ]
      }
    },
    //{
    //  method: "fs.link",
    //  params: {
    //    venv: "app/env"
    //  }
    //}
  ]
}

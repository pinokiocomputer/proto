const fg = require('fast-glob');
const path = require('path')
module.exports = async (kernel) => {
  let env = {
    ZONOS_HOST: "127.0.0.1",
    TORCHINDUCTOR_CACHE_DIR: kernel.path("cache/TORCH_INDUCTOR")
//    PYTHONUTF8: 1
  }
  if (kernel.platform === 'darwin') {
    try {
      let p
      let bin = kernel.path("bin/homebrew/Cellar")
      const matches = await fg(`${bin}/**/espeak-ng-data`, { onlyDirectories: true });
      if (matches.length > 0) {
        p = matches[0]
      }
      env.ESPEAK_DATA_PATH = p
    } catch (err) {
      console.error(`Error searching: ${err.message}`);
    }

    try {
      let p
      let bin = kernel.path("bin/homebrew/Cellar")
      const matches = await fg(`${bin}/**/libespeak-ng.dylib`)
      if (matches.length > 0) {
        p = matches[0]
      }
      env.PHONEMIZER_ESPEAK_LIBRARY = p
    } catch (err) {
      console.error(`Error searching: ${err.message}`);
    }
  } else if (kernel.platform === "win32") {
    let espeakPath = kernel.template.vals.which("espeak-ng")
    let espeakRoot = path.dirname(espeakPath)
    env.PHONEMIZER_ESPEAK_PATH = espeakRoot
    env.PHONEMIZER_ESPEAK_LIBRARY = path.resolve(espeakRoot, "libespeak-ng.dll")
    env.ESPEAK_DATA_PATH = path.resolve(espeakRoot, "espeak-ng-data")
    let LIBPATH = kernel.bin.path("miniconda/libs")
    env.LINK = `/LIBPATH:${LIBPATH}`
//    env.CXX = "cl.exe"
//    env.CC = "cl.exe"
  }
  console.log("ENV", env)

  return {
    daemon: true,
    run: [
      {
        method: "shell.run",
        params: {
          build: true,
          venv: "env",                // Edit this to customize the venv folder path
          env,
          path: "app",                // Edit this to customize the path to start the shell from
          message: [
            "python gradio_interface.py",    // Edit with your custom commands
          ],
          on: [{
            // The regular expression pattern to monitor.
            // When this pattern occurs in the shell terminal, the shell will return,
            // and the script will go onto the next step.
            "event": "/http:\/\/\\S+/",   

            // "done": true will move to the next step while keeping the shell alive.
            // "kill": true will move to the next step after killing the shell.
            "done": true
          }]
        }
      },
      {
        // This step sets the local variable 'url'.
        // This local variable will be used in pinokio.js to display the "Open WebUI" tab when the value is set.
        method: "local.set",
        params: {
          // the input.event is the regular expression match object from the previous step
          url: "{{input.event[0]}}"
        }
      }
    ]
  }
}

module.exports = async (kernel) => {
  let script = {
    run: [{
      method: "shell.run",
      params: {
        message: [
          //"git clone -b dev2 https://github.com/betapeanut/stable-diffusion-webui-forge app",
          "git clone https://github.com/betapeanut/stable-diffusion-webui-forge app",
        ]
      }
    }, {
      method: "fs.link",
      params: {
        drive: {
          checkpoints: "app/models/Stable-diffusion",
          vae: "app/models/VAE",
          loras: [
            "app/models/Lora",
            "app/models/LyCORIS"
          ],
          upscale_models: [
            "app/models/ESRGAN",
            "app/models/RealESRGAN",
            "app/models/SwinIR"
          ],
          embeddings: "app/embeddings",
          hypernetworks: "app/models/hypernetworks",
          controlnet: "app/models/ControlNet"
        },
        peers: [
          "https://github.com/pinokiofactory/comfy.git",
          "https://github.com/cocktailpeanutlabs/comfyui.git",
          "https://github.com/cocktailpeanutlabs/fooocus.git",
          "https://github.com/cocktailpeanutlabs/automatic1111.git",
        ]
      }
    }, {
      method: "fs.link",
      params: {
        drive: {
          outputs: "app/output"
        }
      }
//    }, {
//      when: "{{platform === 'darwin' && arch !== 'arm64'}}",  // intel mac
//      method: "self.set",
//      params: {
//        "app/ui-config.json": {
//          "txt2img/Sampling steps/value": 1,
//          "txt2img/CFG Scale/value": 1.0
//        }
//      }
//    }, {
//      when: "{{platform === 'darwin' && arch !== 'arm64'}}",  // intel mac
//      method: "fs.download",
//      params: {
//        uri: "https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors?download=true",
//        dir: "app/models/Stable-diffusion"
//      }
    }, {
      method: "fs.download",
      params: {
        url: "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors",
        dir: "app/models/Stable-diffusion"
      }
    }, {
      method: "fs.download",
      params: {
        url: "https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0/resolve/main/sd_xl_refiner_1.0.safetensors",
        dir: "app/models/Stable-diffusion"
      }
    }, {
      uri: "setup.js",
      method: "write"
    }, {
      method: "shell.run",
      params: {
        message: "{{platform === 'win32' ? 'webui-user.bat' : 'bash webui.sh -f'}}",
        env: {
          SD_WEBUI_RESTARTING: 1,
        },
        path: "app",
        on: [{ "event": "/http:\/\/[0-9.:]+/", "kill": true }]
      }
    }, {
      method: "notify",
      params: {
        html: "Click the 'start' tab to launch the app"
      }
    }]
  }
  if (kernel.platform === 'darwin') {
    script.requires = [{
      platform: "darwin",
      type: "conda",
      name: ["cmake", "protobuf", "rust", "wget"],
      args: "-c conda-forge"
    }]
  }
  return script
}

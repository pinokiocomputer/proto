const path = require('path')
module.exports = {
  version: "3.7",
  title: "HunyuanVideo",
  description: "[NVIDIA ONLY] Super Optimized Gradio UI for Hunyuan Video Generator that works on GPU poor machines. Generate up to 10~14 sec videos https://github.com/deepbeepmeep/HunyuanVideoGP",
  icon: "icon.png",
  menu: async (kernel, info) => {
    let installed = info.exists("app/env")
    let running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }
    if (running.install) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js",
      }]
    } else if (installed) {
      if (running.start) {
        let local = info.local("start.js")
        if (local && local.url) {
          return [{
            default: true,
            icon: "fa-solid fa-rocket",
            text: "Open Web UI",
            href: local.url,
          }, {
            icon: 'fa-solid fa-terminal',
            text: "Terminal",
            href: "start.js",
          }]
        } else {
          return [{
            icon: 'fa-solid fa-terminal',
            text: "Terminal",
            href: "start.js",
          }]
        }
      } else if (running.update) {
        return [{
          default: true,
          icon: 'fa-solid fa-terminal',
          text: "Updating",
          href: "update.js",
        }]
      } else if (running.reset) {
        return [{
          default: true,
          icon: 'fa-solid fa-terminal',
          text: "Resetting",
          href: "reset.js",
        }]
      } else {
        return [{
          icon: "fa-solid fa-image",
          text: "Image to Video",
          href: "start.js",
          params: {
            profile: 4,
            i2v: true,
          }
        }, {
          icon: "fa-solid fa-scroll",
          text: "Text to Video",
          menu: [{
            icon: "fa-solid fa-power-off",
            text: "<div><strong>Fast</strong><br><div>fast but lower quality</div></div>",
            href: "start.js",
            params: {
              profile: 4,
              fast: true
            }
          }, {
            icon: "fa-solid fa-power-off",
            text: "<div><strong>Original</strong><br><div>slow but high quality</div></div>",
            href: "start.js",
            params: {
              profile: 4
            }
          }]
        }, {
          icon: "fa-solid fa-power-off",
          text: "advanced",
          menu: [{
            icon: "fa-solid fa-image",
            text: "Image to Video",
            href: "start.js",
            params: {
              profile: 4,
              compile: true,
              i2v: true,
            }
          }, {
            icon: "fa-solid fa-scroll",
            text: "Text to Video",
            menu: [{
              icon: "fa-solid fa-power-off",
              text: "<div><strong>Fast Compiled</strong><br><div>fast & compiled. faster than 'Fast', but might not work on all platforms</div></div>",
              href: "start.js",
              params: {
                profile: 4,
                fast: true,
                compile: true
              }
            }, {
              icon: "fa-solid fa-power-off",
              text: "<div><strong>Original Compiled</strong><br><div>origina & compiled. faster than 'Original', but might now work on all platforms.</div></div>",
              href: "start.js",
              params: {
                profile: 4,
                compile: true
              }
            }]
          }]
        }, {
          icon: "fa-regular fa-folder-open",
          text: "Loras (save lora files here)",
          menu: [{
            text: "Text to Video Loras",
            href: "loras",
            fs: true
          }, {
            text: "Image to Video Loras",
            href: "loras-i2v",
            fs: true
          }]
        }, {
          icon: "fa-solid fa-plug",
          text: "Update",
          href: "update.js",
        }, {
          icon: "fa-solid fa-plug",
          text: "Install",
          href: "install.js",
        }, {
          icon: "fa-regular fa-circle-xmark",
          text: "Reset",
          href: "reset.js",
        }]
      }
    } else {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.js",
      }]
    }
  }
}

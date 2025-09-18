const path = require('path')
const fs = require('fs')
module.exports = {
  version: "1.5",
  title: "openui",
  description: "Describe UI and see it rendered live. Ask for changes and convert HTML to React, Svelte, Web Components, etc. Like vercel v0, but open source https://github.com/wandb/openui",
  icon: "icon.png",
  menu: async (kernel) => {
    let installing = await kernel.running(__dirname, "install.js")
    let installed = await kernel.exists(__dirname, "app", "backend", "env")
    let chatgpt_running = await kernel.running(__dirname, "start_chatgpt.js")
    let ollama_running = await kernel.running(__dirname, "start_ollama.js")
    let running = chatgpt_running || ollama_running
    let key
    try {
      key = await fs.promises.readFile(path.resolve(__dirname, "key.txt"), "utf8")
    } catch (e) {
      key = ""
    }
    const models = ["llava:7b", "llava:13b", "llava:34b", "bakllava"]
    if (installing) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js",
      }]
    } else if (installed) {
      if (running) {
        if (chatgpt_running) {
          let local = kernel.memory.local[path.resolve(__dirname, "start_chatgpt.js")]
          if (local && local.url) {
            return [{
              icon: "fa-solid fa-rocket",
              text: "Open Web UI",
              href: local.url,
              popout: true,
            }, {
              icon: 'fa-solid fa-terminal',
              text: "Terminal",
              href: "start_chatgpt.js",
            }]
          } else {
            return [{
              icon: 'fa-solid fa-terminal',
              text: "Terminal",
              href: "start_chatgpt.js",
            }]
          }
        } else if (ollama_running) {
          let local = kernel.memory.local[path.resolve(__dirname, "start_ollama.js")]
          if (local && local.url) {
            return [{
              icon: "fa-solid fa-rocket",
              text: "Open Web UI",
              href: local.url,
              popout: true,
            }, {
              icon: 'fa-solid fa-terminal',
              text: "Terminal",
              href: "start_ollama.js",
            }]
          } else {
            return [{
              icon: 'fa-solid fa-terminal',
              text: "Terminal",
              href: "start_ollama.js",
            }]
          }
        }
      } else {
        return [{
          icon: "fa-solid fa-power-off",
          text: "Start",
          menu: [{
            text: "Use Ollama",
            href: "start_ollama.js"
          }, {
            text: "Use ChatGPT",
            href: "start_chatgpt.js",
            params: {
              key
            }
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
          icon: "fa-solid fa-circle-down",
          text: "Download Models",
          menu: models.map((model) => {
            return {
              text: model,
              href: "download.js",
              params: {
                name: model
              }
            }
          })
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

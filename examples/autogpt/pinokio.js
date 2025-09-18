const path = require('path')
module.exports = {
  version: "2.0",
  title: "autogpt",
  description: "AutoGPT is a powerful tool that lets you create and run intelligent agents https://github.com/Significant-Gravitas/AutoGPT",
  icon: "icon.png",
  pre: [{
    icon: "ollama.png",
    title: "Ollama",
    description: "Get up and running with large language models.",
    href: "https://ollama.com/"
  }],
  menu: async (kernel, info) => {
    let installing = info.running("install.js")
    let installed = info.exists("app/rnd/autogpt_server/env") && info.exists("app/rnd/autogpt_builder/node_modules")
    let running = info.running("start.js")
    if (installing) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js",
      }]
    } else if (installed) {
      if (running) {
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
            default: true,
            icon: 'fa-solid fa-terminal',
            text: "Terminal",
            href: "start.js",
          }]
        }
      } else {
        return [{
          default: true,
          icon: "fa-solid fa-power-off",
          text: "Start",
          href: "start.js",
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
      }, {
        icon: "fa-regular fa-circle-xmark",
        text: "Reset",
        href: "reset.js",
      }]
    }
  }
}

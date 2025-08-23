const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  let code = `module.exports = {
  version: "4.0",
  dns: { "@": [":${req.input.dnsPort}"] },
  menu: [{
    default: true,
    icon: 'fa-solid fa-link',
    text: "Web",
    href: "run.js"
  }]
}`
  await fs.promises.writeFile(path.resolve(req.cwd, "pinokio.js"), code)
  let runjs = `module.exports = {
  run: [{
    method: "loading.start",
    params: {
      message: "waiting for https://${req.input.name}.localhost"
    }
  }, {
    method: async (req, ondata, kernel) => {
      await new Promise((resolve, reject) => {
        setInterval(() => {
          if (kernel.router && kernel.router.config) {
            let config = JSON.stringify(kernel.router.config)
            let pattern = "${req.input.name}.localhost"
            if (config.includes(pattern)) {
              resolve()
            }
          }
        }, 2000)
      })
    }
  }, {
    method: "loading.end"
  }, {
    method: "browser.open",
    params: {
      uri: "https://${req.input.name}.localhost"
    }
  }]
}`
  await fs.promises.writeFile(path.resolve(req.cwd, "run.js"), runjs)
  return {
    success: "/p/" + req.input.name
  }
}

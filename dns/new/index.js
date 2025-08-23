const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  let code = `module.exports = {
  version: "4.0",
  dns: {
    "@": [
  ":${req.input.dnsPort}"
    ]
  },
  menu: [{
    default: true,
    icon: 'fa-solid fa-link',
    text: "Web",
    href: "run.json"
  }]
}`
  await fs.promises.writeFile(path.resolve(req.cwd, "pinokio.js"), code)
  await fs.promises.writeFile(path.resolve(req.cwd, "run.json"), JSON.stringify({
    run: [{
      method: "process.wait",
      params: {
        uri: `http://localhost:${req.input.dnsPort}`,
        message: `trying http://localhost:${req.input.dnsPort} ...`,
      }
    }, {
      method: async (req, ondata, kernel) => {
        await new Promise((resolve, reject) => {
          setInterval(() => {
            ondata({
              raw: `trying https://${req.input.name}.localhost ...\r\n`
            })
            let config = JSON.stringify(kernel.router.config)
            let pattern =`https://${req.input.name}.localhost`
            if (config.includes(pattern)) {
              resolve()
            }
          }, 2000)
        })
      }
    }, {
      method: "browser.open",
      params: {
        uri: `https://${req.input.name}.localhost`
      }
    }]
  }, null, 2))
  return {
    success: "/p/" + req.input.name
  }
}

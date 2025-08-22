const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  if (req.input.dnsPort) {
    await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true, force: true })
    let config = {
      port: req.input.dnsPort,
      dns: {
        "@": [
          `:${req.input.dnsPort}`
        ]
      }
      if (req.input.command) {
        config.command = req.input.command
      }
    }
    await fs.promises.writeFile(path.resolve(req.cwd, "config.json"), JSON.stringify(config, null, 2))
    await kernel.exec({
      message: [
        "git init",
        "git add .",
        "git commit -am init"
      ],
      path: req.cwd
    }, (e) => {
      ondata(e) 
    })
  }
}

const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  let menu = []
  if (req.input.command) {
    menu = [{
      default: true,
      icon: "fa-solid fa-rocket",
      text: "Open",
      run: {
        message: req.input.command,
      }
    }]
  }]
  let code = `module.exports = {
  version: "4.0",
  dns: {
    "@": [
      ":${req.input.dnsPort}"
    ]
  },
  menu: ${JSON.stringify(menu)
}`

  await fs.promises.writeFile(path.resolve(req.cwd, "pinokio.js"), code)

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

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
  menu: []
}`
  await fs.promises.writeFile(path.resolve(req.cwd, "pinokio.js"), code)
  return {
    success: "/p/" + req.params.name
  }
}

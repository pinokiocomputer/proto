const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  console.log("REQ", req)
  if (req.input.importType === "link") {
    await kernel.symlink({
      from: req.cwd,
      to: req.input.importPath
    })
  } else if (req.input.importType === "copy") {
    await fs.promises.cp(req.input.importPath, req.cwd, { recursive: true, force: true })
  }
}

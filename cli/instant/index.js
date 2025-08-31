const fs = require('fs')
const path = require('path')
const agents = require("../../agents")
module.exports = async (req, ondata, kernel) => {
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true })
  await agents(kernel, req)
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore"), path.resolve(req.cwd, ".gitignore"))

  let start = {
    run: [{
      method: "shell.run",
      params: {
        input: true,
        chain: true,
        message: req.input.launchCommand || "",
      }
    }]
  }
  if (req.input.launchPath) {
    start.run[0].params.path = req.input.launchPath
  }
  if (req.input.useVenv) {
    start.run[0].params.venv = "venv"
  }
  await fs.promises.writeFile(path.resolve(req.cwd, "start.json"), JSON.stringify(start, null, 2))

  // git
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

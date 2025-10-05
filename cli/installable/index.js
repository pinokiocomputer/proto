const fs = require('fs')
const path = require('path')
const agents = require("../../agents")
module.exports = async (req, ondata, kernel) => {
  console.log(">REQ", req)
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true })
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore"), path.resolve(req.cwd, ".gitignore"))
  await agents(kernel, req)

  // install script
  let install = {
    run: [{
      method: "shell.run",
      params: {
        chain: true,
        message: req.input.installCommand || "",
      }
    }]
  }
  if (req.input.installPath) {
    install.run[0].params.path = req.input.installPath
  }
  if (req.input.useVenv) {
    install.run[0].params.venv = "venv"
  }
  await fs.promises.writeFile(path.resolve(req.cwd, "install.json"), JSON.stringify(install, null, 2))

  // start script
  let start = {
    run: [{
      method: "shell.run",
      params: {
        input: true,
        chain: true,
        message: req.input.installableLaunchCommand || "",
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

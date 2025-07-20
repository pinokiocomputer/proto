const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  console.log(">REQ", req)
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true })
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "AGENTS.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "CLAUDE.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "GEMINI.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore"), path.resolve(req.cwd, ".gitignore"))

  // install script
  let install = {
    run: [{
      method: "shell.run",
      params: {
        chain: true,
        message: req.input.installCommand || "",
        path: req.input.installPath || req.cwd
      }
    }]
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
        path: req.input.launchPath || req.cwd
      }
    }]
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

const fs = require('fs')
const path = require('path')
const agents = require("../../agents")
module.exports = async (req, ondata, kernel) => {
  console.log("REQ", req)
  if (req.input.importType === "link") {
    await kernel.symlink({
      from: req.cwd,
      to: req.input.importPath
    })
  } else if (req.input.importType === "copy") {
    await fs.promises.cp(req.input.importPath, req.cwd, { recursive: true, force: true })
  } else if (req.input.importType === "download") {
    await kernel.exec({
      message: [
        `git clone ${req.input.importPath} ${req.input.name}`
      ],
      path: kernel.path("api")
    }, (e) => {
      ondata(e) 
    })
  }
  // pinokio path
  const launcher_path = path.resolve(req.cwd, "pinokio")
  let pinokio_exists = await kernel.exists(launcher_path)
  // only copy if pinokio folder doesn't already exist => otherwise it overwrite existing files that are being used
  if (!pinokio_exists) {
    await fs.promises.cp(path.resolve(__dirname, "static"), launcher_path, { recursive: true })
  }
  req.cwd = path.resolve(req.cwd, "pinokio")
  req.structure = "new"
  req.app_root = "project-root"

  // write agents related files
  await agents(kernel, req)

  // write gitignore if it doesn't exist
  let gitignore_path = path.resolve(req.cwd, ".gitignore")
  let exists = await kernel.exists(gitignore_path)
  if (exists) {
    console.log("gitignore already exists. ignore.")
  } else {
    console.log("gitignore does not exist. create one.")
    await fs.promises.writeFile(gitignore_path, [
      "ENVIRONMENT",
      "SPEC.md",
      "logs",
      ".env"
    ].join("\n"))
  }

  let git_path = path.resolve(req.cwd, ".git")
  let git_path_exists = await kernel.exists(git_path)
  if (git_path_exists) {
    console.log("git already exists. ignore.")
  } else {
    // git
    await kernel.exec({
      message: [
        "git init",
        "git add .",
      ],
      path: req.cwd
    }, (e) => {
      ondata(e) 
    })
  }
}

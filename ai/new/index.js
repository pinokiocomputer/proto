const fs = require('fs')
const path = require('path')
const agents = require("../../agents")
module.exports = async (req, ondata, kernel) => {
  /*
    req.input = {
      aiPrompt: <str>
    }
  */
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true, force: true })
  await agents(req.cwd)
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore_new"), path.resolve(req.cwd, ".gitignore"))
  if (req.input.aiMeta) {
    if (req.input.aiMeta[".gitignore"]) {
      let items = req.input.aiMeta[".gitignore"].split(",").map((x) => {
        return x.trim()
      }).join("\n")
      console.log("write to gitignore", { items })
      await fs.promises.appendFile(path.resolve(req.cwd, ".gitignore"), items + "\n")
    }
  }
  if (req.input.aiPrompt) {
    await fs.promises.writeFile(path.resolve(req.cwd, "SPEC.md"), req.input.aiPrompt + "\n")
  }
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

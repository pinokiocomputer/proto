const fs = require('fs')
const path = require('path')
const agents = require("../../agents")
module.exports = async (req, ondata, kernel) => {
  /*
    req.input = {
      aiPrompt: <str>,
      tool: <str>
    }
  */
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true, force: true })
  console.log("gitignore_new", await fs.promises.readFile(path.resolve(__dirname, "../../gitignore_new"), "utf8"))
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore_new"), path.resolve(req.cwd, ".gitignore"))
  await agents(kernel, req)
  let items = ["copy.md", "launch.md", "remix.md", "tutorial.md"].join("\n")
  await fs.promises.appendFile(path.resolve(req.cwd, ".gitignore"), items + "\n")
  if (req.input.aiMeta) {
    if (req.input.aiMeta[".gitignore"]) {
      let items = req.input.aiMeta[".gitignore"].split(",").map((x) => {
        return x.trim()
      }).join("\n")
      console.log("write to gitignore", { items })
      console.log("Existing content", await fs.promises.readFile(path.resolve(req.cwd, ".gitignore"), "utf8"))
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
  if (req.input.tool) {
    return {
      success: `/p/${req.input.name}/dev?plugin=/plugin/code/${req.input.tool}/pinokio.js&prompt=${encodeURIComponent(req.input.aiPrompt)}`
    }
  }
}

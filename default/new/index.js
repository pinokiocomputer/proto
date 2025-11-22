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
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore_new"), path.resolve(req.cwd, ".gitignore"))
  await agents(kernel, req)
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
      success: `/p/${req.input.name}/dev?plugin=/plugin/${req.input.tool}/pinokio.js&prompt=${encodeURIComponent(req.input.aiPrompt)}`
    }
  }
}

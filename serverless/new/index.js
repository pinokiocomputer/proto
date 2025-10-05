const fs = require('fs')
const path = require('path')
const agents = require("../../agents")
module.exports = async (req, ondata, kernel) => {

  // 0. COPY STATIC FILES
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true })
//  await fs.promises.cp(path.resolve(__dirname, "../../gitignore_new"), path.resolve(req.cwd, ".gitignore"))

  // 3. README (ai prompt)
  if (req.input.aiPrompt) {
    await fs.promises.writeFile(path.resolve(req.cwd, "SPEC.md"), req.input.aiPrompt + "\n")
  }
  await agents(kernel, {
    recipe: "AGENTS_SERVERLESS.md",
    ...req,
  })

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

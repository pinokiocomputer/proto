const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true, force: true })
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "AGENTS.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "CLAUDE.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "GEMINI.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "QWEN.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore"), path.resolve(req.cwd, ".gitignore"))
  if (req.input.aiPrompt) {
    await fs.promises.writeFile(path.resolve(req.cwd, "README.md"), req.input.aiPrompt + "\n")
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

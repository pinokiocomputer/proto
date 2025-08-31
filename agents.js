const path = require('path')
const fs = require('fs')
const agents = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "QWEN.md",
  ".clinerules",
  ".cursorrules",
  ".windsurfrules"
]
module.exports = async (kernel, req) => {
  const cwd = req.cwd
  const recipe = req.recipe || "AGENTS.md"
  for(let agent of agents) {
    await fs.promises.cp(path.resolve(__dirname, recipe), path.resolve(cwd, agent))
  }
  // copy readme
  let readme_path = kernel.path("prototype/PINOKIO.md")
  await fs.promises.cp(readme_path, path.resolve(cwd, "PINOKIO.md"))

  // copy pterm.md
  let cli_readme_path = kernel.path("prototype/PTERM.md")
  await fs.promises.cp(cli_readme_path, path.resolve(cwd, "PTERM.md"))
}

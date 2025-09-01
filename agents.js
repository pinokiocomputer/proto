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
  const structure = req.structure || "clone"
  const app_root = req.app_root || "app"
  const recipe_path = path.resolve(__dirname, "structure", recipe)
  const structure_path = path.resolve(__dirname, structure)
  const structure_content = await fs.promises.readFile(structure_path, "utf-8")
  let rendered_recipe = await kernel.renderFile(recipe_path, {
    structure: structure_content,
    app_root
  })
  for(let agent of agents) {
    await fs.promises.writeFile(path.resolve(cwd, agent), rendered_recipe)
    //await fs.promises.cp(path.resolve(__dirname, recipe), path.resolve(cwd, agent))
  }
  // copy readme
  let readme_path = kernel.path("prototype/PINOKIO.md")
  await fs.promises.cp(readme_path, path.resolve(cwd, "PINOKIO.md"))

  // copy pterm.md
  let cli_readme_path = kernel.path("prototype/PTERM.md")
  await fs.promises.cp(cli_readme_path, path.resolve(cwd, "PTERM.md"))
}

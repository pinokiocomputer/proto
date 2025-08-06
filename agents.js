const path = require('path')
const fs = require("fs')
const agents = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "QWEN.md",
  ".clinerules",
  ".cursorrules",
  ".windsurfrules"
]
module.exports = async (cwd) => {
  for(let agent of agents) {
    await fs.promises.cp(path.resolve(__dirname, "AGENTS.md"), path.resolve(cwd, agent))
  }
}

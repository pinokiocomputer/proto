const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {

  let config = {
    name: '',
    repo: '',
    maxLevel: 3,
    themeColor: "black",
    requestHeaders: {
      'cache-control': 'no-cache'
    }
  }
  
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true, force: true })
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "AGENTS.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "CLAUDE.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "GEMINI.md"))
  await fs.promises.rename(path.resolve(req.cwd, "gitignore"), path.resolve(req.cwd, ".gitignore"))

  config.basePath = "/repo/"
  await fs.promises.writeFile(path.resolve(req.cwd, "docs/docsify.config.json"), JSON.stringify(config, null, 2))

  // copy statics
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true, force: true })

  if (req.input.localDocPath) {
    await fs.promises.cp(req.input.localDocPath, path.resolve(req.cwd, 'docs/repo'), { recursive: true, force: true })
  } else if (req.input.remoteDocUrl) {
    // clone into the docs folder
    await kernel.exec({
      message: `git clone ${req.input.remoteDocUrl} repo`,
      path: path.resolve(req.cwd, "docs")
    }, ondata)
  }

  // update the basePath to repo
  config.basePath = "/repo/"
  await fs.promises.writeFile(path.resolve(req.cwd, "docs/docsify.config.json"), JSON.stringify(config, null, 2))
}

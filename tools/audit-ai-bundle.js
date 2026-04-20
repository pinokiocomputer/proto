#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const repoRoot = path.resolve(__dirname, "..")

const explicitFiles = [
  "python/new/index.js",
  "python/clone/index.js",
  "python/new/install_with_torch.js",
]

const aiSignals = [
  'uri: "torch.js"',
  "uri: 'torch.js'",
  '"uri": "torch.js"',
  '"uri":"torch.js"',
  "huggingface-cli",
  "hf.download",
  "huggingface-hub",
  "huggingface_hub",
  "mlx",
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/")
}

function shouldCheck(relativePath) {
  if (explicitFiles.includes(relativePath)) {
    return true
  }
  return /^examples\/[^/]+\/install[^/]*\.(js|json)$/.test(relativePath)
}

function looksLikeLocalAiInstall(source) {
  return aiSignals.some((signal) => source.includes(signal))
}

function hasAiBundle(source) {
  return source.includes('bundle: "ai"') || source.includes("bundle: 'ai'") || source.includes('"bundle": "ai"')
}

const targets = walk(repoRoot)
  .map((fullPath) => ({
    fullPath,
    relativePath: normalize(path.relative(repoRoot, fullPath)),
  }))
  .filter(({ relativePath }) => shouldCheck(relativePath))

const offenders = []
for (const { fullPath, relativePath } of targets) {
  const source = fs.readFileSync(fullPath, "utf8")
  if (looksLikeLocalAiInstall(source) && !hasAiBundle(source)) {
    offenders.push(relativePath)
  }
}

if (offenders.length > 0) {
  console.error('Missing `requires.bundle = "ai"` in:')
  for (const offender of offenders) {
    console.error(`- ${offender}`)
  }
  process.exit(1)
}

console.log(`AI bundle audit passed for ${targets.length} files.`)

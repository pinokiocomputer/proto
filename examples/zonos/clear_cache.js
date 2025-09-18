const os = require('os')
const fs = require('fs')
const { rimraf } = require('rimraf')
const path = require('path')
const exists = (abspath) => {
  return new Promise(r=>fs.access(abspath, fs.constants.F_OK, e => r(!e)))
}
const homedir = os.homedir()
const triton_cache_dir = path.resolve(homedir, ".triton/cache");
(async () => {
  let e = await exists(triton_cache_dir)
  if (e) {
    console.log("delete cache")
    await rimraf(triton_cache_dir)
  }
  console.log("rimraf", { triton_cache_dir, e })
})();

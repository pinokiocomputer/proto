module.exports = {
  run: [{
    method: "shell.run",
    params: {
      message: "git pull",
      path: ".."
    }
  }, {
    method: "shell.run",
    params: {
      path: "..",
      message: "npm install"
    }
  }]
}

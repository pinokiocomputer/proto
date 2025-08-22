const config = require('./config.json')
module.exports = async (kernel, info) => {
  let command = kernel.which(config.command)
  let port = config.port
  if (command) {
    let cmd
    if (kernel.platform === "win32") {
      cmd = `start ${command}`
    } else if (kernel.platform === "darwin") {
      cmd = `open ${command}`
    } else if (kernel.platform === "linux") {
      cmd = `xdg-open ${command}`
    }
    return {
      run: [{
        method: "exec",
        params: {
          message: cmd
        }
      }, {
        method: "process.wait",
        params: {
          message: `waiting for ${command} to launch...`,
          url: `http://localhost:${port}`,
        }
      }, {
        method: "notify",
        params: {
          message: "launched!",
        }
      }]
    }
  } else {
    return {
      run: [{
        method: "notify",
        params: {
          message: "command does not exist"
        }
      }]
    }
  }
}

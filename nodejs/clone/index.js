const fs = require('fs')
const path = require('path')
const agents = require("../../agents")
module.exports = async (req, ondata, kernel) => {

  // 0. COPY STATIC FILES
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true })
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore"), path.resolve(req.cwd, ".gitignore"))
  await agents(kernel, req)

  // 1. INSTALL SCRIPT
  let install = {
    run: [
      {
        method: "shell.run",
        params: {
          message: [
            `git clone ${req.input.gitUrl} app`
          ]
        }
      },
      {
        method: "shell.run",
        params: {
          path: "app",
          chain: true,
          input: req.input.allowInstallUserInput,
          message: req.input.cloneInstallCommand || "",
        }
      },
    ]
  }
  await fs.promises.writeFile(path.resolve(req.cwd, "install.json"), JSON.stringify(install, null, 2))

  // 2. START SCRIPT
  let start = {
    daemon: true,
    run: [
      // Edit this step to customize your app's launch command
      {
        method: "shell.run",
        params: {
          path: "app",
          chain: true,
          env: { },                   // Edit this to customize environment variables (see documentation)
          input: req.input.allowStartUserInput,
          message: req.input.cloneStartCommand || "",
          on: [{
            // The regular expression pattern to monitor.
            // When this pattern occurs in the shell terminal, the shell will return,
            // and the script will go onto the next step.
            "event": "/http:\/\/[^\\s\\n\\r]+/",   

            // "done": true will move to the next step while keeping the shell alive.
            // "kill": true will move to the next step after killing the shell.
            "done": true
          }]
        }
      },
      {
        when: "{{input && input.event && Array.isArray(input.event) && input.event.length > 0}}",
        method: "local.set",
        params: {
          // the input.event is the regular expression match object from the previous step
          url: "{{input.event[0]}}"
        },
      },
    ]
  }
  await fs.promises.writeFile(path.resolve(req.cwd, "start.json"), JSON.stringify(start, null, 2))

  // 3. README (ai prompt)
  if (req.input.aiPrompt) {
    await fs.promises.writeFile(path.resolve(req.cwd, "SPEC.md"), req.input.aiPrompt + "\n")
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

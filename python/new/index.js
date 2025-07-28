const fs = require('fs')
const path = require('path')
module.exports = async (req, ondata, kernel) => {
  console.log("REQ", req)

  // 0. COPY STATIC FILES
  await fs.promises.cp(path.resolve(__dirname, "static"), req.cwd, { recursive: true })
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "AGENTS.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "CLAUDE.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "GEMINI.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../AGENTS.md"), path.resolve(req.cwd, "QWEN.md"))
  await fs.promises.cp(path.resolve(__dirname, "../../gitignore"), path.resolve(req.cwd, ".gitignore"))

  // 1. INSTALL SCRIPT
  let install
  if (req.input.pythonOptions && req.input.pythonOptions.length > 0 && req.input.pythonOptions.includes("torch")) {
    install = {
      "run": [
        {
          "method": "script.start",
          "params": {
            "uri": "torch.js",
            "params": {
              "path": "app",
              "venv": "venv",                // Edit this to customize the venv folder path
              "xformers": req.input.pythonOptions.includes("xformers"),
              "triton": req.input.pythonOptions.includes("triton"),
              "sageattention": req.input.pythonOptions.includes("sageattention"),
            }
          }
        },
        {
          "method": "shell.run",
          "params": {
            "venv": "venv",
            "path": "app",
            "chain": true,
            "input": req.input.allowInstallUserInput,
            "message": [
              "uv pip install -r requirements.txt"
            ]
          }
        }
      ]
    }
  } else {
    install = {
      "run": [
        {
          "method": "shell.run",
          "params": {
            "message": [
              `git clone ${req.input.gitUrl} app`
            ]
          }
        },
        {
          "method": "shell.run",
          "params": {
            "venv": "venv",
            "path": "app",
            "chain": true,
            "input": req.input.allowInstallUserInput,
            "message": [
              "uv pip install -r requirements.txt"
            ]
          }
        }
      ]
    }
  }
  await fs.promises.writeFile(path.resolve(req.cwd, "install.json"), JSON.stringify(install, null, 2))

  // 2. START SCRIPT
  let start = {
    daemon: true,
    run: [
      {
        method: "shell.run",
        params: {
          path: "app",
          venv: "venv",                // Edit this to customize the venv folder path
          chain: true,
          env: { },                   // Edit this to customize environment variables (see documentation)
          input: req.input.allowStartUserInput,
          message: [
            "python app.py"
          ],
          on: [{
            // The regular expression pattern to monitor.
            // When this pattern occurs in the shell terminal, the shell will return,
            // and the script will go onto the next step.
            "event": "/http:\/\/\\S+/",   
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
    await fs.promises.writeFile(path.resolve(req.cwd, "README.md"), req.input.aiPrompt + "\n")
  }


  // 4. GIT RELATED (Gitignore + Initialize git)
  await kernel.exec({
    chain: true,
    message: [
      "git init",
      "git add .",
      "git commit -am init",
    ],
    path: req.cwd
  }, (e) => {
    ondata(e) 
  })
}

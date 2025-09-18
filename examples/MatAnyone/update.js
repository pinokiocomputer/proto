module.exports = {
  run: [{
    method: "shell.run",
    params: {
      message: "git pull"
    }
  }, {
    method: "shell.run",
    params: {
      path: "app",
      message: "git pull"
    }
  }, {
    method: "fs.copy",
    params: {
      src: "app.py",
      dest: "app/hugging_face/app.py"
    }
  },
 ]
}

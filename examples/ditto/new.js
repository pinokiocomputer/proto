module.exports = {
  run: [{
    method: "fs.rm",
    params: {
      path: "app/routes"
    }
  }, {
    method: "fs.rm",
    params: {
      path: "app/templates"
    }
  }, {
    method: "fs.rm",
    params: {
      path: "app/static"
    }
  }]
}

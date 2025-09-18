const path = require('path')
module.exports = {
  version: "2.0",
  title: "errortest",
  description: "",
  icon: "icon.png",
  menu: async (kernel, info) => {
    return [{
      icon: "fa-solid fa-play",
      text: "run",
      href: "test.js",
    }, {
      icon: "fa-solid fa-rotate-right",
      text: "update",
      href: "uipdate.js",
    }]
  }
}

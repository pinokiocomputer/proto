const config = require('./config.json')
module.exports = {
  version: "4.0",
  dns: config.dns,
  menu: [{
    default: true,
    icon: "fa-solid fa-rocket",
    text: "Open",
    href: "start.js"
  }]
}

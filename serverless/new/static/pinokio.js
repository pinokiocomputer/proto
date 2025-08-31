module.exports = {
  version: "4.0",
  menu: async (kernel, info) => {
    return [{
      default: true,
      icon: "fa-solid fa-rocket",
      text: "Open App",
      href: "index.html"
    }]
  }
}

const playwright = require('playwright');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  let { chromium, firefox, webkit, devices } = playwright
  const browser = await firefox.launch({ headless: false, });
  const context = await browser.newContext({ viewport: null })
  const page = await context.newPage()
  await page.goto("https://google.com")
  await page.waitForSelector("textarea")
  await page.focus('textarea')
  await page.keyboard.type("pinokio.computer")
  await page.keyboard.press("Enter")
  await page.waitForSelector("#search")
  await page.click("#search a")
  await delay(3000);
  for(let i=0;i<100; i++) {
    await page.mouse.wheel(0, 100)
    await delay(1000);
  }
  await browser.close()
})();

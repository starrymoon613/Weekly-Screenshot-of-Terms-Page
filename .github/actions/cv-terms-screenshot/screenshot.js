const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: {
      width: 1600,
      height: 1200
    }
  });

  try {
    await page.goto(
      'https://cv.hres.ca/en/terms/15',
      {
        waitUntil: 'networkidle',
        timeout: 120000
      }
    );

    await page.waitForSelector('table');

    console.log('===== PAGINATION SEARCH START =====');

    const paginationInfo = await page.evaluate(() => {
      return document.body.innerText;
    });

    console.log(paginationInfo);

    console.log('===== PAGINATION SEARCH END =====');

    await page.screenshot({
      path: 'screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved');
  } catch (error) {
    console.error(error);

    try {
      await page.screenshot({
        path: 'error.png',
     

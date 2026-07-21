const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: {
      width: 1920,
      height: 1080
    }
  });

  try {
    await page.goto(
      process.env.URL || 'https://cv.hres.ca/en/terms/15',
      {
        waitUntil: 'networkidle',
        timeout: 120000
      }
    );

    await page.waitForSelector('table');

    // Give the DataTable time to fully render
    await page.waitForTimeout(5000);

    console.log('Page loaded successfully');

    await page.screenshot({
      path: process.env.OUTPUT || 'screenshot.png'
    });

    console.log('Screenshot saved');
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

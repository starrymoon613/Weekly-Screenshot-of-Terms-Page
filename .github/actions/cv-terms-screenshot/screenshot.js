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

    console.log('Page loaded successfully');

    const table = page.locator('table').first();

    await table.screenshot({
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

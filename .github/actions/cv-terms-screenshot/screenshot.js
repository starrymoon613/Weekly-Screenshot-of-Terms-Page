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
    await page.goto('https://cv.hres.ca/en/terms/15', {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    await page.waitForSelector('table', {
      timeout: 120000
    });

    console.log('Title:', await page.title());
    console.log('URL:', page.url());

    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Rows found: ${rowCount}`);

    await page.screenshot({
      path: 'screenshot.png'
    });

    console.log('Screenshot saved');
  } catch (error) {
    console.error(error);

    await page.screenshot({
      path: 'error.png'
    });

    throw error;
  } finally {
    await browser.close();
  }
})();

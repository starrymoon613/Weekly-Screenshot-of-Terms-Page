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

    await page.waitForSelector('table');

    // Sort by Last Updated
    await page.click('text=Last updated');
    await page.waitForTimeout(2000);

    // Search for 2026 records
    const searchBox = page.locator('input[type="search"]').first();
    await searchBox.fill('2026');

    await page.waitForTimeout(3000);

    const rowCount = await page.locator('table tbody tr').count();

    console.log(`Rows found after filtering: ${rowCount}`);

    await page.screenshot({
      path: 'screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved');
  } finally {
    await browser.close();
  }
})();

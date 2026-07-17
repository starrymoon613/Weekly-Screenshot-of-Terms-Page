const { chromium } = require('playwright');

(async () => {
  const outputFile = process.env.OUTPUT || 'screenshot.png';
  const targetUrl =
    process.env.URL || 'https://cv.hres.ca/en/terms/15';

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log(`Opening ${targetUrl}`);

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    await page.screenshot({
      path: outputFile,
      fullPage: true
    });

    console.log(`Screenshot saved: ${outputFile}`);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await browser.close();
  }
})();

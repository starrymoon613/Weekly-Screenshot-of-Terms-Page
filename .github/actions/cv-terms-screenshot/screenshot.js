const { chromium } = require('playwright');

(async () => {
  const outputFile = process.env.OUTPUT || 'screenshot.png';
  const targetUrl =
    process.env.URL || 'https://cv.hres.ca/en/terms/15';

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
    console.log(`Opening ${targetUrl}`);

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    await page.waitForTimeout(5000);

    console.log('Final URL:', page.url());
    console.log('Title:', await page.title());

    await page.screenshot({
      path: outputFile,
      fullPage: true
    });

    console.log(`✅ Screenshot saved: ${outputFile}`);
  } finally {
    await browser.close();
  }
})();

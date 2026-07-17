const { chromium } = require('playwright');

(async () => {
  const targetUrl =
    process.env.URL || 'https://cv.hres.ca/en/terms/15';

  const outputFile =
    process.env.OUTPUT || 'screenshot.png';

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage({
    viewport: {
      width: 1920,
      height: 1080
    }
  });

  try {
    console.log(`Opening ${targetUrl}`);

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    await page.waitForSelector('table', {
      timeout: 120000
    });

    // Give DataTables time to populate rows
    await page.waitForTimeout(5000);

    console.log('Title:', await page.title());
    console.log('URL:', page.url());

    const rowCount = await page.locator(
      'table tbody tr'
    ).count();

    console.log(`Rows found: ${rowCount}`);

    // Log first few rows for debugging
    const sampleRows = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('table tbody tr')
      )
        .slice(0, 5)
        .map(row =>
          Array.from(row.querySelectorAll('td')).map(
            td => td.innerText.trim()
          )
        );
    });

    console.log(
      'Sample rows:',
      JSON.stringify(sampleRows, null, 2)
    );

    // Save page screenshot
    await page.screenshot({
      path: outputFile
    });

    console.log(`✅ Screenshot saved: ${outputFile}`);
  } catch (error) {
    console.error('ERROR:', error);

    try {
      await page.screenshot({
        path: 'error.png'
      });
    } catch (_) {}

    throw error;
  } finally {
    await browser.close();
  }
})();

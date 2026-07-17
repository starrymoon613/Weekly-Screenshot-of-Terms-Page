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

    const rows = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('table tbody tr')
      )
      .slice(0, 10)
      .map(row =>
        Array.from(row.querySelectorAll('td')).map(td =>
          td.innerText.trim()
        )
      );
    });

    console.log(JSON.stringify(rows, null, 2));

    await page.screenshot({
      path: 'screenshot.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
})();

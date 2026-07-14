const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  });

  try {
    console.log('Loading page...');

    await page.goto('https://cv.hres.ca/en/terms/15', {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    console.log('URL:', page.url());
    console.log('Title:', await page.title());

    // Save a debug screenshot in case page structure changes
    await page.screenshot({
      path: 'debug.png',
      fullPage: true
    });

    // Wait for the table itself
    await page.waitForSelector('table', {
      timeout: 120000
    });

    console.log('✅ Table found');

    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Rows found: ${rowCount}`);

    // Cutoff = last 5 days including today
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 5);
    cutoff.setHours(0, 0, 0, 0);

    await page.evaluate((cutoffISO) => {
      const cutoffDate = new Date(cutoffISO);
      const now = new Date();

      const rows = document.querySelectorAll('table tbody tr');

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        const rawText = cells[5]?.innerText?.trim();

        if (!rawText) {
          row.remove();
          return;
        }

        const parsedDate = new Date(rawText.replace(',', ''));

        if (
          isNaN(parsedDate) ||
          parsedDate < cutoffDate ||
          parsedDate > now
        ) {
          row.remove();
        }
      });

      const tbody = document.querySelector('table tbody');

      if (tbody && tbody.children.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 6;
        cell.innerText =
          'No records updated in the last 5 days (including today)';

        row.appendChild(cell);
        tbody.appendChild(row);
      }
    }, cutoff.toISOString());

    const table = await page.$('table');

    if (table) {
      const box = await table.boundingBox();

      if (box) {
        await page.screenshot({
          path: 'screenshot.png',
          clip: box
        });
      } else {
        await page.screenshot({
          path: 'screenshot.png',
          fullPage: true
        });
      }
    } else {
      await page.screenshot({
        path: 'screenshot.png',
        fullPage: true
      });
    }

    console.log('✅ Screenshot saved');
  } catch (error) {
    console.error('ERROR:', error);

    await page.screenshot({
      path: 'error.png',
      fullPage: true
    });

    throw error;
  } finally {
    await browser.close();
  }
})();

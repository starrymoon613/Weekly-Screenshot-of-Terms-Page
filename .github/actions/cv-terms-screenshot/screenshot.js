const { chromium } = require('playwright');

(async () => {
  const outputFile = process.env.OUTPUT || 'screenshot.png';
  const targetUrl =
    process.env.URL || 'https://cv.hres.ca/en/terms/15';

  const days = parseInt(process.env.DAYS || '5', 10);

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
    console.log(`Loading page: ${targetUrl}`);

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    console.log('URL:', page.url());
    console.log('Title:', await page.title());

    await page.waitForSelector('table', {
      timeout: 120000
    });

    console.log('✅ Table found');

    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Rows found before filtering: ${rowCount}`);

    await page.screenshot({
      path: 'debug.png',
      fullPage: true
    });

    // Keep only rows updated within the last N days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    await page.evaluate(
      ({ cutoffISO, days }) => {
        const cutoffDate = new Date(cutoffISO);
        const now = new Date();

        const rows = document.querySelectorAll('table tbody tr');

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');

          // Last Updated column (6th column)
          const rawText = cells[5]?.innerText?.trim();

          if (!rawText) {
            row.remove();
            return;
          }

          const parsedDate = new Date(rawText);

          if (
            isNaN(parsedDate.getTime()) ||
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
          cell.style.padding = '10px';
          cell.style.fontSize = '16px';
          cell.innerText =
            `No records updated in the last ${days} days (including today)`;

          row.appendChild(cell);
          tbody.appendChild(row);
        }
      },
      {
        cutoffISO: cutoff.toISOString(),
        days
      }
    );

    const remainingRows = await page.locator('table tbody tr').count();
    console.log(`Rows after filtering: ${remainingRows}`);

    const table = await page.$('table');

    if (table) {
      const box = await table.boundingBox();

      if (box) {
        await page.screenshot({
          path: outputFile,
          clip: {
            x: Math.max(0, box.x),
            y: Math.max(0, box.y),
            width: box.width,
            height: box.height
          }
        });

        console.log(`✅ Screenshot saved: ${outputFile}`);
      } else {
        await page.screenshot({
          path: outputFile,
          fullPage: true
        });
      }
    } else {
      console.log('⚠️ Table not found. Saving full page.');

      await page.screenshot({
        path: outputFile,
        fullPage: true
      });
    }
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

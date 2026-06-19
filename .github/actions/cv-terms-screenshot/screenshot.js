const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    headless: true
  });

  const page = await browser.newPage();

  // ✅ Load page
  await page.goto('https://cv.hres.ca/en/terms/15', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // ✅ Wait for data (THIS replaces waitForSelector)
  await page.waitForFunction(() => {
    return document.querySelectorAll('table tbody tr').length > 0;
  }, { timeout: 120000 });

  console.log('✅ Table data loaded');

  // ✅ Filter last 5 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);

  await page.evaluate((cutoffISO) => {
    const cutoffDate = new Date(cutoffISO);
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rawText = cells[5]?.innerText;

      if (!rawText) {
        row.remove();
        return;
      }

      const datePart = rawText.split(/\s+/)[0].trim();
      const parsedDate = new Date(datePart);

      if (isNaN(parsedDate) || parsedDate < cutoffDate) {
        row.remove();
      }
    });

    const tbody = document.querySelector('table tbody');
    if (tbody && tbody.children.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.innerText = 'No records updated in last 5 days';
      row.appendChild(cell);
      tbody.appendChild(row);
    }
  }, cutoff.toISOString());

  // ✅ Safe screenshot (never fails)
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

  await browser.close();
})();

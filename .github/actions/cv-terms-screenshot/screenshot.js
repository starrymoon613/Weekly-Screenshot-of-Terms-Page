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

  // ✅ Wait for table rows
  await page.waitForFunction(() => {
    return document.querySelectorAll('table tbody tr').length > 0;
  }, { timeout: 120000 });

  console.log('✅ Table data loaded');

  // ✅ Define cutoff (today + last 5 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);
  cutoff.setHours(0, 0, 0, 0); // include full cutoff day

  // ✅ Filter rows inside browser
  await page.evaluate((cutoffISO) => {
    const cutoffDate = new Date(cutoffISO);
    const now = new Date();

    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rawText = cells[5]?.innerText?.trim();

      // ❌ If no date → remove row
      if (!rawText) {
        row.remove();
        return;
      }

      // ✅ Parse FULL date string (no splitting)
      const parsedDate = new Date(rawText.replace(',', ''));

      // ❌ Remove ONLY if:
      // - Invalid date
      // - Older than cutoff
      // - Somehow in the future
      if (isNaN(parsedDate) || parsedDate < cutoffDate || parsedDate > now) {
        row.remove();
      }
    });

    // ✅ If no rows left, show message
    const tbody = document.querySelector('table tbody');

    if (tbody && tbody.children.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.innerText = 'No records updated in the last 5 days (including today)';
      row.appendChild(cell);
      tbody.appendChild(row);
    }
  }, cutoff.toISOString());

  // ✅ Take screenshot safely
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
``

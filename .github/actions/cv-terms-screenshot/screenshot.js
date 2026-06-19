const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    headless: true
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  });

  const page = await context.newPage();

  // ✅ Load page with retry
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto('https://cv.hres.ca/en/terms/15', {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      break;
    } catch (e) {
      console.log('Retrying page load...');
    }
  }

  // ✅ Give extra time for JS rendering (important for CI)
  await page.waitForTimeout(5000);

  // ✅ Debug screenshot (helps if CI fails)
  await page.screenshot({ path: 'debug-before-data.png' });

  // ✅ Wait for ACTUAL data rows (not just table shell)
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return rows.length > 0;
  }, { timeout: 120000 });

  // ✅ Debug after data loads
  await page.screenshot({ path: 'debug-after-data.png' });

  // ✅ Click "Last updated" twice to sort newest first
  try {
    const header = page.locator('th:has-text("Last updated")');
    await header.click();
    await page.waitForTimeout(1000);
    await header.click();
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Sorting not applied');
  }

  // ✅ Filter rows from last 5 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);

  await page.evaluate((cutoffISO) => {
    const cutoffDate = new Date(cutoffISO);
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');

      // Column index:
      // Code(0), English(1), French(2), Source(3), Status(4), Last updated(5)
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
      cell.innerText = 'No records updated in the last 5 days';
      row.appendChild(cell);
      tbody.appendChild(row);
    }
  }, cutoff.toISOString());

  await page.waitForTimeout(2000);

  // ✅ Final screenshot
  await page.locator('table').screenshot({
    path: 'screenshot.png'
  });

  console.log('✅ Screenshot saved');

  await browser.close();
})();

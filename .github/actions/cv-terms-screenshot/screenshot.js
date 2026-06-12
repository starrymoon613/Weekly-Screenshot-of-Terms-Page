const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // ✅ Load page with retry
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto('https://cv.hres.ca/en/terms/15', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      break;
    } catch (e) {
      console.log('Retrying page load...');
    }
  }

  await page.waitForSelector('table', { timeout: 60000 });

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

      // ✅ Column index FIXED (based on your screenshot)
      // Code(0), English(1), French(2), Source(3), Status(4), Last updated(5)
      const rawText = cells[5]?.innerText;

      if (!rawText) {
        row.remove();
        return;
      }

      // ✅ Extract ONLY the date part (ignore time)
      const datePart = rawText.split(/\s+/)[0].trim();

      const parsedDate = new Date(datePart);

      // ✅ Remove anything older than 5 days
      if (isNaN(parsedDate) || parsedDate < cutoffDate) {
        row.remove();
      }
    });

    // ✅ If nothing remains, show a message instead of blank table
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

  // ✅ Take screenshot
  await page.locator('table').screenshot({
    path: 'screenshot.png'
  });

  console.log('✅ Screenshot saved');

  await browser.close();
})();

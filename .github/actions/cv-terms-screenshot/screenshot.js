const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // ✅ Load page with retry (prevents random failures)
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

  // ✅ Sort by "Last updated" (newest first)
  try {
    const header = page.locator('th:has-text("Last updated")');
    await header.click();
    await page.waitForTimeout(1000);
    await header.click();
  } catch (e) {
    console.log('Could not sort column');
  }

  // ✅ Filter rows to last 5 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);

  await page.evaluate((cutoffISO) => {
    const cutoffDate = new Date(cutoffISO);
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');

      // ⚠️ Adjust column index if needed
      const lastUpdatedText = cells[cells.length - 1]?.innerText.trim();

      if (!lastUpdatedText) {
        row.remove();
        return;
      }

      // Try multiple parsing strategies
      let parsedDate = new Date(lastUpdatedText);

      // Fallback for non-standard formats
      if (isNaN(parsedDate)) {
        const cleaned = lastUpdatedText.replace(/[^0-9\-/: ]/g, '');
        parsedDate = new Date(cleaned);
      }

      if (isNaN(parsedDate) || parsedDate < cutoffDate) {
        row.remove();
      }
    });
  }, cutoff.toISOString());

  // ✅ Wait for DOM update
  await page.waitForTimeout(2000);

  // ✅ Take screenshot (this is critical for artifact)
  await page.locator('table').screenshot({
    path: 'screenshot.png'
  });

  console.log('Screenshot saved');

  await browser.close();
})();
``

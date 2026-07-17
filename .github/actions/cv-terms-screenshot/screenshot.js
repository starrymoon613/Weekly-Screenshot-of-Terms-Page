const { chromium } = require('playwright');

(async () => {
  const outputFile = 'screenshot.png';
  const days = 5;

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
      ).map(row =>
        Array.from(row.querySelectorAll('td')).map(td =>
          td.innerText.trim()
        )
      );
    });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const filtered = rows.filter(row => {
      const rawDate = row[5];

      if (!rawDate) return false;

      const updated = new Date(rawDate);

      return (
        !isNaN(updated.getTime()) &&
        updated >= cutoff
      );
    });

    console.log(`Found ${filtered.length} records`);

    const tableRows =
      filtered.length > 0
        ? filtered.map(row => `
            <tr>
              <td>${row[0]}</td>
              <td>${row[1]}</td>
              <td>${row[2]}</td>
              <td>${row[3]}</td>
              <td>${row[4]}</td>
              <td>${row[5]}</td>
            </tr>
          `).join('')
        : `
          <tr>
            <td colspan="6">
              No records updated in the last 5 days (including today)
            </td>
          </tr>
        `;

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }

          h2 {
            margin-bottom: 20px;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          th {
            background: #f3f3f3;
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }

          td {
            border: 1px solid #ccc;
            padding: 8px;
          }
        </style>
      </head>
      <body>

      <h2>
        Records updated in the last 5 days
      </h2>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>English Display Name</th>
            <th>French Display Name</th>
            <th>Source</th>
            <th>Status</th>
            <th>Last updated</th>
          </tr>
        </thead>

        <tbody>
          ${tableRows}
        </tbody>
      </table>

      </body>
      </html>
    `);

    await page.screenshot({
      path: outputFile,
      fullPage: true
    });

    console.log(`Screenshot saved: ${outputFile}`);
  } finally {
    await browser.close();
  }
})();

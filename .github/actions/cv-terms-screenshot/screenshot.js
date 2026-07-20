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
      ).map(row =>
        Array.from(row.querySelectorAll('td')).map(td =>
          td.innerText.trim()
        )
      );
    });

    console.log(`Rows collected: ${rows.length}`);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 5);
    cutoff.setHours(0, 0, 0, 0);

    const filteredRows = rows.filter(row => {
      if (!row[5]) return false;

      const date = new Date(row[5].replace(' ', 'T'));

      return (
        !isNaN(date.getTime()) &&
        date >= cutoff
      );
    });

    console.log(`Filtered rows: ${filteredRows.length}`);

    const tableBody =
      filteredRows.length > 0
        ? filteredRows.map(row => `
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

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>
</head>
<body>

<h2>Records Updated in the Last 5 Days</h2>

<table>
<thead>
<tr>
  <th>Code</th>
  <th>English Display Name</th>
  <th>French Display Name</th>
  <th>Source</th>
  <th>Status</th>
  <th>Last Updated</th>
</tr>
</thead>

<tbody>
${tableBody}
</tbody>

</table>

</body>
</html>
`);

    await page.screenshot({
      path: 'screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved');
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await browser.close();
  }
})();

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
    await page.goto(
      process.env.URL || 'https://cv.hres.ca/en/terms/15',
      {
        waitUntil: 'networkidle',
        timeout: 120000
      }
    );

    await page.waitForSelector('#wb-auto-4');

    const rows = await page.evaluate(() => {
      return jQuery('#wb-auto-4')
        .DataTable()
        .rows()
        .data()
        .toArray();
    });

    console.log(`Total rows found: ${rows.length}`);

    const days = parseInt(process.env.DAYS || '5', 10);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const filteredRows = rows.filter(row => {
      const rawDate = row[5];

      if (!rawDate) {
        return false;
      }

      const updatedDate = new Date(
        rawDate.replace(' ', 'T')
      );

      return (
        !isNaN(updatedDate.getTime()) &&
        updatedDate >= cutoff
      );
    });

    console.log(
      `Rows updated within ${days} days: ${filteredRows.length}`
    );

    const tableBody =
      filteredRows.length > 0
        ? filteredRows
            .map(
              row => `
<tr>
  <td>${row[0]}</td>
  <td>${row[1]}</td>
  <td>${row[2]}</td>
  <td>${row[3]}</td>
  <td>${row[4]}</td>
  <td>${row[5]}</td>
</tr>`
            )
            .join('')
        : `
<tr>
  <td colspan="6">
    No records updated in the last ${days} days (including today)
  </td>
</tr>`;

    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Records Updated in the Last ${days} Days</title>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 20px;
}

h1 {
  margin-bottom: 20px;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th {
  background-color: #f2f2f2;
  border: 1px solid #cccccc;
  padding: 8px;
  text-align: left;
}

td {
  border: 1px solid #cccccc;
  padding: 8px;
}
</style>
</head>

<body>

<h1>
Records Updated in the Last ${days} Days
</h1>

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
      path: process.env.OUTPUT || 'screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

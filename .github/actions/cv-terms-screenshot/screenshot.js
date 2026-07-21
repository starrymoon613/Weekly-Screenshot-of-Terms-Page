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

    await page.waitForTimeout(5000);

    const diagnostics = await page.evaluate(() => {
      return {
        hasJQuery: typeof window.jQuery !== 'undefined',
        hasDataTable:
          typeof window.jQuery !== 'undefined' &&
          typeof window.jQuery.fn !== 'undefined' &&
          typeof window.jQuery.fn.dataTable !== 'undefined',
        tableFound: !!document.querySelector('#wb-auto-4')
      };
    });

    console.log(
      'Diagnostics:',
      JSON.stringify(diagnostics, null, 2)
    );

    if (!diagnostics.hasDataTable) {
      throw new Error(
        'DataTable plugin not available'
      );
    }

    const rows = await page.evaluate(() => {
      return window
        .jQuery('#wb-auto-4')
        .DataTable()
        .rows()
        .data()
        .toArray();
    });

    console.log(`Total rows found: ${rows.length}`);

    const days = parseInt(
      process.env.DAYS || '5',
      10
    );

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
    No records updated in the last ${days} days
  </td>
</tr>
`;

    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
html, body {
  margin: 0;
  padding: 0;
  background: white;
  font-family: Arial, Helvetica, sans-serif;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

thead th {
  background-color: #e5e5e5;
  border: 1px solid #d4d4d4;
  padding: 8px;
  text-align: left;
}

tbody td {
  border: 1px solid #dcdcdc;
  padding: 8px;
}

tbody tr:nth-child(even) {
  background: #f7f7f7;
}
</style>
</head>
<body>

<table id="reportTable">
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
${tableBody}
</tbody>

</table>

</body>
</html>
`);

    const table = page.locator('#reportTable');

    await table.screenshot({
      path: process.env.OUTPUT || 'screenshot.png'
    });

    console.log('Screenshot saved');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

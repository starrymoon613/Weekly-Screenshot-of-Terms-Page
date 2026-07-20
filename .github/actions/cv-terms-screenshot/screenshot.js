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
    const url =
      process.env.URL || 'https://cv.hres.ca/en/terms/15';

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 120000
    });

    await page.waitForSelector('table');

    const allRows = [];

    while (true) {
      const rows = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll('table tbody tr')
        ).map(row =>
          Array.from(row.querySelectorAll('td')).map(td =>
            td.innerText.trim()
          )
        );
      });

      allRows.push(...rows);

      console.log(`Collected ${allRows.length} rows so far`);

      const nextLink = await page.$('text=Next');

      if (!nextLink) {
        console.log('No Next button found');
        break;
      }

      const nextText = await nextLink.textContent();

      if (!nextText) {
        break;
      }

      try {
        await nextLink.click();
        await page.waitForTimeout(1500);
      } catch {
        console.log('Reached end of pagination');
        break;
      }
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 5);
    cutoff.setHours(0, 0, 0, 0);

    const filteredRows = allRows.filter(row => {
      if (!row[5]) {
        return false;
      }

      const updatedDate = new Date(
        row[5].replace(' ', 'T')
      );

      return (
        !isNaN(updatedDate.getTime()) &&
        updatedDate >= cutoff
      );
    });

    console.log(
      `Rows updated in last 5 days: ${filteredRows.length}`
    );

    const tableBody =
      filteredRows.length > 0
        ? filteredRows
            .map(
              row => `
<tr>
  <td>${row[0] || ''}</td>
  <td>${row[1] || ''}</td>
  <td>${row[2] || ''}</td>
  <td>${row[3] || ''}</td>
  <td>${row[4] || ''}</td>
  <td>${row[5] || ''}</td>
</tr>`
            )
            .join('')
        : `
<tr>
  <td colspan="6">
    No records updated in the last 5 days (including today)
  </td>
</tr>`;

    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Records Updated in the Last 5 Days</title>
<style>
body {
  font-family: Arial, sans-serif;
  margin: 20px;
}

h1 {
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #cccccc;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>
</head>
<body>

<h1>Records Updated in the Last 5 Days</h1>

<table>
  <thead>
    <tr>
      <th>Code</th>
      <th>English Display Name</th>
      <th>French Display Name</th>

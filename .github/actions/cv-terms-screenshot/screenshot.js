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

      console.log(`Collected ${allRows.length} rows`);

      const nextButton = await page.$('text=Next');

      if (!nextButton) {
        console.log('No Next button found');
        break;
      }

      const isDisabled = await nextButton.evaluate(node => {
        const parent = node.parentElement;

        return (
          node.classList.contains('disabled') ||
          (parent && parent.classList.contains('disabled'))
        );
      });

      if (isDisabled) {
        console.log('Last page reached');
        break;
      }

      await nextButton.click();

      await page.waitForTimeout(1500);
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 5);
    cutoff.setHours(0, 0, 0, 0);

    const filteredRows = allRows.filter(row => {
      if (!row[5]) return false;

      const date = new Date(row[5].replace(' ', 'T'));

      return (
        !isNaN(date.getTime()) &&
        date >= cutoff
      );
    });

    console.log(
      `Rows updated in last 5 days: ${filteredRows.length}`
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

h1 {
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ccc;

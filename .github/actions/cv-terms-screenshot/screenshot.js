const { chromium } = require("playwright");

(async () => {
  const url = process.env.URL;
  const days = parseInt(process.env.DAYS, 10);
  const output = process.env.OUTPUT;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url, { timeout: 60000 });
  await page.waitForSelector("table");

  const allRows = [];

  // ✅ Define threshold date
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  threshold.setHours(0, 0, 0, 0);

  while (true) {
    await page.waitForTimeout(1000);

    const rows = await page.evaluate((thresholdISO) => {
      const table = document.querySelector("table");
      if (!table) return [];

      const headers = Array.from(table.querySelectorAll("thead th"));

      const allowed = [
        "Code",
        "English Display Name",
        "French Display Name",
        "Source",
        "Status",
        "Last updated"
      ];

      const keepIndexes = headers
        .map((th, i) => ({ i, text: th.innerText.trim() }))
        .filter(h => allowed.some(a => h.text.includes(a)))
        .map(h => h.i);

      const threshold = new Date(thresholdISO);
      const data = [];

      table.querySelectorAll("tbody tr").forEach(row => {
        const cells = Array.from(row.querySelectorAll("td"));

        const filtered = keepIndexes.map(i => cells[i]?.innerText.trim());

        const last = filtered[filtered.length - 1];
        if (!last) return;

        const match = last.match(
          /\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?/
        );
        if (!match) return;

        const rowDate = new Date(match[0]);
        rowDate.setHours(0, 0, 0, 0);

        if (rowDate >= threshold) {
          data.push(filtered);
        }
      });

      return data;
    }, threshold.toISOString());

    allRows.push(...rows);

    console.log(`Collected: ${allRows.length}`);

    // ✅ stop early if no recent rows
    if (rows.length === 0) break;

    const next = await page.locator('a:has-text("Next")');

    if (!(await next.isVisible())) break;

    const cls = await next.getAttribute("class");
    if (cls && cls.includes("disabled")) break;

    await Promise.all([
      page.waitForLoadState("networkidle"),
      next.click()
    ]);
  }

  // ✅ ✅ SORT newest first (full datetime)
  allRows.sort((a, b) => {
    const parse = (text) => {
      if (!text) return new Date(0);

      const full = text.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
      if (full) return new Date(full[0]);

      const fallback = text.match(/\d{4}-\d{2}-\d{2}/);
      return fallback ? new Date(fallback[0]) : new Date(0);
    };

    return parse(b[5]) - parse(a[5]);
  });

  // ✅ Build clean table (matching your screenshot look)
  const html = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 10px;
          background: white;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        th {
          text-align: left;
          padding: 8px;
          border-bottom: 2px solid black;
          font-weight: bold;
        }

        td {
          padding: 8px;
          border-bottom: 1px solid #ccc;
          vertical-align: top;
        }
      </style>
    </head>
    <body>
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
          ${allRows.map(row =>
            `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`
          ).join("")}
        </tbody>
      </table>
    </body>
  </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(500);

  await page.screenshot({
    path: output,
    fullPage: true
  });

  await browser.close();
})();

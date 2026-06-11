const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://cv.hres.ca/en/terms/15", { timeout: 60000 });
  await page.waitForSelector("table");

  const days = 4;

  // ✅ Extract + filter rows
  const filteredRows = await page.evaluate((days) => {
    const table = document.querySelector("table");
    if (!table) return [];

    const headers = Array.from(table.querySelectorAll("thead th"));

    const keep = [
      "Code",
      "English Display Name",
      "French Display Name",
      "Source",
      "Status",
      "Last updated"
    ];

    const keepIndexes = headers
      .map((th, i) => ({ i, text: th.innerText.trim() }))
      .filter(h => keep.some(k => h.text.includes(k)))
      .map(h => h.i);

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    threshold.setHours(0, 0, 0, 0);

    const data = [];

    table.querySelectorAll("tbody tr").forEach(row => {
      const cells = Array.from(row.querySelectorAll("td"));

      const filtered = keepIndexes.map(i => cells[i]?.innerText.trim());

      const last = filtered[filtered.length - 1];
      if (!last) return;

      const match =
        last.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/) ||
        last.match(/\d{4}-\d{2}-\d{2}/);

      if (!match) return;

      const rowDate = new Date(match[0]);
      rowDate.setHours(0, 0, 0, 0);

      if (rowDate >= threshold) {
        data.push(filtered);
      }
    });

    return data;

  }, days);

  console.log("Rows found:", filteredRows.length);

  // ✅ Sort newest first
  filteredRows.sort((a, b) => {
    const parse = (t) => {
      const m =
        t?.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/) ||
        t?.match(/\d{4}-\d{2}-\d{2}/);
      return m ? new Date(m[0]) : new Date(0);
    };
    return parse(b[5]) - parse(a[5]);
  });

  // ✅ Build CLEAN TABLE (this is key)
  const html = `
  <html>
    <head>
      <style>
        body { font-family: Arial; padding: 10px; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; padding: 8px; border-bottom: 2px solid black; }
        td { padding: 8px; border-bottom: 1px solid #ccc; }
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
          ${filteredRows.map(r =>
            `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`
          ).join("")}
        </tbody>
      </table>
    </body>
  </html>
  `;

  await page.setContent(html);

  // ✅ Screenshot ONLY the clean table
  await page.screenshot({
    path: "screenshot.png",
    fullPage: true
  });

  await browser.close();
})();

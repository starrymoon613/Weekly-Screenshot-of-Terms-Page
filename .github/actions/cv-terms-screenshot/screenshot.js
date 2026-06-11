const { chromium } = require("playwright");

(async () => {
  const url = process.env.URL || "https://cv.hres.ca/en/terms/15";
  const days = parseInt(process.env.DAYS || "4", 10);
  const output = process.env.OUTPUT || "screenshot.png";

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 60000 });
    await page.waitForSelector("table", { timeout: 20000 });

    const allRows = [];

    // ✅ Threshold date
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
      }, threshold.toISOString());

      console.log("Rows this page:", rows.length);

      allRows.push(...rows);

      // ✅ Stop early if no recent rows found
      if (rows.length === 0) {
        console.log("No more recent rows — stopping.");
        break;
      }

      const next = page.locator('a:has-text("Next")');

      // ✅ Safe next handling
      if ((await next.count()) === 0) break;
      if (!(await next.isVisible())) break;

      const cls = await next.getAttribute("class");
      if (cls && cls.includes("disabled")) break;

      await Promise.all([
        page.waitForLoadState("networkidle"),
        next.click()
      ]);
    }

    console.log("Total collected rows:", allRows.length);

    // ✅ Handle no data safely
    if (allRows.length === 0) {
      console.log("No data found. Taking fallback screenshot.");
      await page.screenshot({ path: output, fullPage: true });
      await browser.close();
      return;
    }

    // ✅ SORT newest first (FULL datetime)
    allRows.sort((a, b) => {
      const parse = (text) => {
        if (!text) return new Date(0);

        const m =
          text.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/) ||
          text.match(/\d{4}-\d{2}-\d{2}/);

        return m ? new Date(m[0]) : new Date(0);
      };

      return parse(b[5]) - parse(a[5]);
    });

    // ✅ Build clean HTML table
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
            font-size: 14px;
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

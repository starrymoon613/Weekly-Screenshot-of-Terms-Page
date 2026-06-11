const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://cv.hres.ca/en/terms/15", {
    timeout: 60000
  });

  await page.waitForSelector("table");

  const allRows = [];
  const days = 5;

  // ✅ Compute threshold date
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  threshold.setHours(0, 0, 0, 0);

  // ✅ PAGINATION LOOP
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

        const selected = keepIndexes.map(i =>
          cells[i]?.innerText.trim()
        );

        const last = selected[selected.length - 1];
        if (!last) return;

        const match =
          last.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/) ||
          last.match(/\d{4}-\d{2}-\d{2}/);

        if (!match) return;

        const rowDate = new Date(match[0]);
        rowDate.setHours(0, 0, 0, 0);

        if (rowDate >= threshold) {
          data.push(selected);
        }
      });

      return data;
    }, threshold.toISOString());

    console.log("Collected rows:", rows.length);

    allRows.push(...rows);

    // ✅ Stop early when no more relevant rows
    if (rows.length === 0) break;

    const next = page.locator('a:has-text("Next")').first();

    if ((await next.count()) === 0) break;
    if (!(await next.isVisible())) break;

    const cls = await next.getAttribute("class");
    if (cls && cls.includes("disabled")) break;

    await Promise.all([
      page.waitForLoadState("networkidle"),
      next.click()
    ]);
  }

  console.log("TOTAL rows collected:", allRows.length);

  // ✅ SORT newest first
  allRows.sort((a, b) => {
    const parse = (text) => {
      const match =
        text?.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/) ||
        text?.match(/\d{4}-\d{2}-\d{2}/);
      return match ? new Date(match[0]) : new Date(0);
    };

    return parse(b[5]) - parse(a[5]);
  });

  // ✅ FINAL CLEAN TABLE RENDER (KEY STEP)
  await page.evaluate((rows) => {
    const table = document.querySelector("table");
    if (!table) return;

    const tbody = table.querySelector("tbody");

    // clear existing rows
    tbody.innerHTML = "";

    // insert filtered + sorted rows
    rows.forEach(r => {
      const tr = document.createElement("tr");

      r.forEach(cell => {
        const td = document.createElement("td");
        td.innerText = cell;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    // ✅ REMOVE EVERYTHING except table
    document.body.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.padding = "10px";
    wrapper.appendChild(table);

    document.body.appendChild(wrapper);

  }, allRows);

  await page.waitForTimeout(500);

  // ✅ Screenshot ONLY table
  await page.locator("table").screenshot({
    path: "screenshot.png"
  });

  await browser.close();
})();

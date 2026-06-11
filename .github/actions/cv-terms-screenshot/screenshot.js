const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://cv.hres.ca/en/terms/15", { timeout: 60000 });
  await page.waitForSelector("table");

  const allRows = [];
  const days = 5;

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

        const selected = keepIndexes.map(i => cells[i]?.innerText.trim());

        const last = selected[selected.length - 1];
        if (!last) return;

        const match =

const { chromium } = require("playwright");

// ✅ DEBUG: surface hidden errors in GitHub Actions
process.on("uncaughtException", err => {
  console.error("UNCAUGHT ERROR:", err);
});
process.on("unhandledRejection", err => {
  console.error("UNHANDLED PROMISE:", err);
});

(async () => {
  const url = process.env.URL || "https://cv.hres.ca/en/terms/15";
  const days = parseInt(process.env.DAYS || "4", 10);
  const output = process.env.OUTPUT || "screenshot.png";

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"] // ✅ required in CI
  });

  const page = await browser.newPage();

  try {
    console.log("Opening URL:", url);

    await page.goto(url, { timeout: 60000 });
    await page.waitForSelector("table", { timeout: 20000 });

    const allRows = [];

    // ✅ date threshold
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


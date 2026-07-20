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
    await page.setContent(`
      <html>
      <body>
        <h1>Records Updated in the Last 5 Days</h1>

        <table border="1">
          <tr>
            <th>Code</th>
            <th>English Display Name</th>
            <th>French Display Name</th>
            <th>Source</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>

          <tr>
            <td>TEST</td>
            <td>TEST INGREDIENT</td>
            <td>INGRÉDIENT TEST</td>
            <td>FDA</td>
            <td>Active</td>
            <td>2026-07-17 11:53:24</td>
          </tr>
        </table>
      </body>
      </html>
    `);

    await page.screenshot({
      path: 'screenshot.png',
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

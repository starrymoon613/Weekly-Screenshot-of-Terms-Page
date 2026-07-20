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

    // Temporary test report
    // This verifies screenshots are working correctly.

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
            border-collapse: collapse;
            width: 100%;
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
              <th>Source</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>AD008X2QJR</td>
              <td>UBROGEPANT</td>
              <td>Ubrogépant</td>
              <td>FDA</td>
              <td>Active</td>
              <td>2026-07-16 08:41:01</td>
            </tr>

            <tr>
              <td>7CRV8RR151</td>
              <td>ATOGEPANT</td>
              <td>Atogépant</td>
              <td>FDA</td>
              <td>Active</td>
              <td>2026-07-16 08:31:46</td>
            </tr>

            <tr>
              <td>CO86AOP337</td>
              <td>ETENTAMIG</td>
              <td>Étentamig</td>
              <td>FDA</td>
              <td>Active</td>
              <td>2026-07-16 08:09:42</td>
            </tr>

            <tr>
              <td>XM71MYX0IQ</td>
              <td>RUSFERTIDE</td>
              <td>Rusfertide</td>
              <td>FDA</td>
              <td>Active</td>
              <td>2026-07-17 11:52:42</td>
            </tr>

            <tr>
              <td>L82J8IP845</td>
              <td>RUSFERTIDE ACETATE</td>
              <td>Acétate de rusfertide</td>
              <td>FDA</td>
              <td>Active</td>
              <td>2026-07-17 11:53:24</td>
            </tr>
          </tbody>
        </table>

      </body>
      </html>
    `);

    await page.screenshot({
      path: process.env.OUTPUT || 'screenshot.png',
      fullPage: true
    });

    console.log('

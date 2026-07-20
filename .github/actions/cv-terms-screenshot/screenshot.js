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
      'https://cv.hres.ca/en/terms/15',
      {
        waitUntil: 'networkidle',
        timeout: 120000
      }
    );

    await page.waitForSelector('table');

    console.log('===== PAGINATION SEARCH START =====');

    const paginationInfo = await page.evaluate(() => {
      const results = [];

      const selectors = [
        '.dataTables_paginate',
        '.pagination',
        '[id*="paginate"]',
        '[class*="paginate"]'
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          results.push({
            selector,
            html: el.outerHTML
          });
        });
      });

      return results;
    });

    console.log(
      JSON.stringify(paginationInfo, null, 2)
    );

    console.log('===== PAGINATION SEARCH END =====');

    const pageText = await page.textContent('body');

    console.log('===== PAGE TEXT START =====');
    console.log(
      pageText
        .split('\n')
        .filter(line =>
          line.includes('Next') ||
          line.includes('Previous') ||
          line.includes('Showing')
        )
        .join('\n')
    );
    console.log('===== PAGE TEXT END =====');

    console.log('Pagination diagnostics complete');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

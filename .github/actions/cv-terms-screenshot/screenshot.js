const records = [];

let hasNextPage = true;

while (hasNextPage) {
  await page.waitForSelector('table tbody tr');

  const pageRows = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('table tbody tr')
    ).map(row => {
      const cells = Array.from(row.querySelectorAll('td'));

      return cells.map(cell => cell.innerText.trim());
    });
  });

  records.push(...pageRows);

  const nextButton = await page.$(
    'a[aria-label="Next"], .pager-next a, .pagination .next a'
  );

  if (nextButton) {
    const disabled = await nextButton.evaluate(el =>
      el.classList.contains('disabled')
    );

    if (!disabled) {
      await Promise.all([
        page.waitForLoadState('networkidle'),
        nextButton.click()
      ]);
    } else {
      hasNextPage = false;
    }
  } else {
    hasNextPage = false;
  }
}

console.log(`Collected ${records.length} total rows`);

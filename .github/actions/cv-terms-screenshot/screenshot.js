const allRows = [];

while (true) {
  const rows = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('table tbody tr')
    ).map(row =>
      Array.from(row.querySelectorAll('td')).map(td =>
        td.innerText.trim()
      )
    );
  });

  allRows.push(...rows);

  const nextButton = await page.$('#wb-auto-4_next');

  if (!nextButton) {
    break;
  }

  const classes = await nextButton.getAttribute('class');

  if (classes && classes.includes('disabled')) {
    break;
  }

  await nextButton.click();

  await page.waitForTimeout(1500);
}

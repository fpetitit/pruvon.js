export async function runTables($, fixtures) {
  const results = [];

  for (const table of $('table[data-execute]').toArray()) {
    const fnName = $(table).attr('data-execute');

    for (const row of $(table).find('tr').has('td').toArray()) {
      const cells = $(row).find('td');
      const args = [];
      for (let i = 0; i < cells.length - 1; i++) {
        args.push($(cells[i]).text());
      }
      const expectedCell = $(cells[cells.length - 1]);
      const expected = expectedCell.text();

      let actual, passed, errorMessage;
      try {
        await fixtures.beforeExample?.({ fnName, args });

        const fn = fixtures[fnName];
        if (typeof fn !== 'function') {
          throw new Error(`fixture function "${fnName}" not found`);
        }
        actual = await fn(args);
        passed = String(actual) === String(expected);
      } catch (err) {
        passed = false;
        errorMessage = err.message;
      } finally {
        try {
          await fixtures.afterExample?.({ fnName, args, actual, passed, error: errorMessage });
        } catch (err) {
          passed = false;
          errorMessage = err.message;
        }
      }

      if (passed) {
        expectedCell.css('background-color', 'green');
      } else {
        expectedCell.css('background-color', 'red');
        expectedCell.text(errorMessage ? `error: ${errorMessage}` : `expected ${expected} but was ${actual}`);
      }

      results.push({ table: fnName, expected, actual, passed, error: errorMessage });
    }
  }

  return { html: $.html(), results };
}

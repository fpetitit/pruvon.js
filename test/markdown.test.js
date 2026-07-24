import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
import { renderMarkdownSpec } from '../src/render-markdown.js';
import { runTables } from '../src/run-table.js';

const SPEC = `# Simple Arithmetic

## Sum

\`\`\`pruvon:sum
| Operand 1 | Operand 2 | Result |
|---|---|---|
| 0 | 1 | 1 |
| 5 | 3 | 8 |
\`\`\`

Some regular \`js\` code, untouched:

\`\`\`js
const x = 1;
\`\`\`
`;

test('renderMarkdownSpec turns a pruvon: fence into a data-execute table', () => {
  const html = renderMarkdownSpec(SPEC);
  const $ = cheerio.load(html);
  const table = $('table[data-execute="sum"]');

  assert.equal(table.length, 1);
  assert.equal(table.find('tr').has('td').length, 2);
});

test('renderMarkdownSpec leaves other fenced code blocks alone', () => {
  const html = renderMarkdownSpec(SPEC);
  assert.match(html, /<code class="language-js">/);
});

test('a markdown spec runs end-to-end through the same engine as HTML specs', async () => {
  const html = renderMarkdownSpec(SPEC);
  const $ = cheerio.load(html);
  const fixtures = { sum: (args) => Number(args[0]) + Number(args[1]) };

  const { results } = await runTables($, fixtures);

  assert.equal(results.length, 2);
  assert.equal(results[0].passed, true);
  assert.equal(results[1].passed, true);
});

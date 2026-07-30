import fs from 'node:fs';
import * as cheerio from 'cheerio';
import { discover } from './discover.js';
import { renderMarkdownSpec } from './render-markdown.js';
import { runTables } from './run-table.js';

function resultPathFor(specPath) {
  const stem = specPath.replace(/\.pruvon\.(html|md)$/, '');
  return `${stem}.pruvon.result.html`;
}

export async function runSpecs(cwd, pattern) {
  const entries = await discover(cwd, pattern);
  const specs = [];

  for (const entry of entries) {
    if (entry.fixtureError) {
      specs.push({ specPath: entry.specPath, error: entry.fixtureError, results: [], passedCount: 0, failedCount: 0 });
      continue;
    }

    try {
      await entry.fixtures.beforeSpecification?.();
    } catch (err) {
      specs.push({ specPath: entry.specPath, error: err, results: [], passedCount: 0, failedCount: 0 });
      continue;
    }

    const source = fs.readFileSync(entry.specPath, 'utf8');
    const html = entry.format === 'markdown' ? renderMarkdownSpec(source) : source;
    const $ = cheerio.load(html);
    const { html: resultHtml, results } = await runTables($, entry.fixtures);

    const resultPath = resultPathFor(entry.specPath);
    fs.writeFileSync(resultPath, resultHtml);

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;

    try {
      await entry.fixtures.afterSpecification?.();
    } catch (err) {
      specs.push({ specPath: entry.specPath, error: err, results: [], passedCount: 0, failedCount: 0 });
      continue;
    }

    specs.push({ specPath: entry.specPath, resultPath, results, passedCount, failedCount });
  }

  return specs;
}

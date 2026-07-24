import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { glob } from 'glob';

const SPEC_SUFFIXES = [
  { suffix: '.pruvon.html', format: 'html' },
  { suffix: '.pruvon.md', format: 'markdown' },
];

export async function discover(cwd, pattern = '**/*.pruvon.{html,md}') {
  const specPaths = await glob(pattern, { cwd, absolute: true });

  const entries = [];
  for (const specPath of specPaths) {
    const suffixInfo = SPEC_SUFFIXES.find(({ suffix }) => specPath.endsWith(suffix));
    const stem = specPath.slice(0, specPath.length - suffixInfo.suffix.length);
    const fixturePath = `${stem}.pruvon.fixture.js`;

    const entry = { specPath, format: suffixInfo.format, fixturePath };

    if (!fs.existsSync(fixturePath)) {
      entry.fixtureError = new Error(
        `no fixture found for spec "${path.basename(specPath)}" (expected "${path.basename(fixturePath)}")`
      );
    } else {
      try {
        entry.fixtures = await import(pathToFileURL(fixturePath).href);
      } catch (err) {
        entry.fixtureError = err;
      }
    }

    entries.push(entry);
  }

  return entries;
}

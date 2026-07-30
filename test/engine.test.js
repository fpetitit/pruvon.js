import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import { runTables } from '../src/run-table.js';
import { discover } from '../src/discover.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

function loadHtml(name) {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf8');
}

async function loadFixture(name) {
  return import(pathToFileURL(path.join(fixturesDir, name)).href);
}

test('runTables marks a passing row green and reports passed:true', async () => {
  const $ = cheerio.load(loadHtml('pass.pruvon.html'));
  const fixtures = await loadFixture('pass.pruvon.fixture.js');
  const { results, html } = await runTables($, fixtures);

  assert.equal(results.length, 1);
  assert.equal(results[0].passed, true);
  assert.match(html, /background-color:\s*green/);
});

test('runTables marks a failing row red with an expected/actual message', async () => {
  const $ = cheerio.load(loadHtml('fail.pruvon.html'));
  const fixtures = await loadFixture('fail.pruvon.fixture.js');
  const { results, html } = await runTables($, fixtures);

  assert.equal(results[0].passed, false);
  assert.match(html, /expected 4 but was 3/);
});

test('runTables awaits async fixture functions', async () => {
  const $ = cheerio.load(loadHtml('async.pruvon.html'));
  const fixtures = await loadFixture('async.pruvon.fixture.js');
  const { results } = await runTables($, fixtures);

  assert.equal(results[0].passed, true);
});

test('runTables contains a throwing fixture to a single failed row', async () => {
  const $ = cheerio.load(loadHtml('throwing.pruvon.html'));
  const fixtures = await loadFixture('throwing.pruvon.fixture.js');
  const { results, html } = await runTables($, fixtures);

  assert.equal(results[0].passed, false);
  assert.equal(results[0].error, 'kaboom');
  assert.match(html, /error: kaboom/);
});

test('runTables reports a missing fixture function as a failed row, not a crash', async () => {
  const $ = cheerio.load(loadHtml('missing-fixture.pruvon.html'));
  const { results } = await runTables($, {});

  assert.equal(results[0].passed, false);
  assert.match(results[0].error, /not found/);
});

test('discover pairs a spec with its fixture and loads it', async () => {
  const entries = await discover(fixturesDir, 'pass.pruvon.html');
  const entry = entries[0];

  assert.equal(entry.fixtureError, undefined);
  assert.equal(typeof entry.fixtures.add, 'function');
});

test('runTables calls beforeExample/afterExample once per row, in order, with row context', async () => {
  const $ = cheerio.load(loadHtml('before-after-example.pruvon.html'));
  const fixtures = await loadFixture('before-after-example.pruvon.fixture.js');
  await runTables($, fixtures);

  assert.equal(fixtures.calls.length, 4);
  assert.deepEqual(
    fixtures.calls.map((c) => c.hook),
    ['before', 'after', 'before', 'after']
  );
  assert.equal(fixtures.calls[0].fnName, 'add');
  assert.deepEqual(fixtures.calls[0].args, ['1', '2']);
  assert.equal(fixtures.calls[1].passed, true);
});

test('runTables fails the row when beforeExample throws', async () => {
  const $ = cheerio.load(loadHtml('example-hook-throws.pruvon.html'));
  const fixtures = await loadFixture('example-hook-throws.pruvon.fixture.js');
  const { results } = await runTables($, fixtures);

  assert.equal(results[0].passed, false);
  assert.equal(results[0].error, 'beforeExample kaboom');
});

test('discover reports a clear error when no fixture pairs with a spec', async () => {
  const entries = await discover(fixturesDir, 'missing-fixture.pruvon.html');
  const entry = entries[0];

  assert.ok(entry.fixtureError);
  assert.match(entry.fixtureError.message, /no fixture found/);
});

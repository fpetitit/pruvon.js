import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runSpecs } from '../src/runner.js';

function makeTmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pruvon-runner-test-'));
}

function writeSpec(dir, name) {
  fs.writeFileSync(
    path.join(dir, `${name}.pruvon.html`),
    `<html><body><table data-execute="add"><tr><td>1</td><td>2</td><td>3</td></tr></table></body></html>`
  );
  fs.writeFileSync(
    path.join(dir, `${name}.pruvon.fixture.js`),
    `export function add(args) { return Number(args[0]) + Number(args[1]); }`
  );
}

test('runSpecs calls beforeSuite/afterSuite once for the whole run, around every spec', async (t) => {
  const dir = makeTmpProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  writeSpec(dir, 'one');
  writeSpec(dir, 'two');
  fs.writeFileSync(
    path.join(dir, 'pruvon.suite.js'),
    `export const calls = [];
     export function beforeSuite() { calls.push('before'); }
     export function afterSuite() { calls.push('after'); }`
  );

  const specs = await runSpecs(dir, '*.pruvon.html');
  assert.equal(specs.length, 2);
  assert.equal(specs.every((s) => s.passedCount === 1), true);

  const { calls } = await import(path.join(dir, 'pruvon.suite.js'));
  assert.deepEqual(calls, ['before', 'after']);
});

test('runSpecs runs with no suite hooks at all when pruvon.suite.js is absent', async (t) => {
  const dir = makeTmpProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  writeSpec(dir, 'one');

  const specs = await runSpecs(dir, '*.pruvon.html');
  assert.equal(specs.length, 1);
  assert.equal(specs[0].passedCount, 1);
});

test('runSpecs propagates a beforeSuite failure and runs no specs', async (t) => {
  const dir = makeTmpProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  writeSpec(dir, 'one');
  fs.writeFileSync(
    path.join(dir, 'pruvon.suite.js'),
    `export function beforeSuite() { throw new Error('suite setup failed'); }`
  );

  await assert.rejects(runSpecs(dir, '*.pruvon.html'), /suite setup failed/);
});

test('runSpecs propagates an afterSuite failure after running all specs', async (t) => {
  const dir = makeTmpProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  writeSpec(dir, 'one');
  fs.writeFileSync(
    path.join(dir, 'pruvon.suite.js'),
    `export const calls = [];
     export function afterSuite() { calls.push('after'); throw new Error('suite teardown failed'); }`
  );

  await assert.rejects(runSpecs(dir, '*.pruvon.html'), /suite teardown failed/);

  const { calls } = await import(path.join(dir, 'pruvon.suite.js'));
  assert.deepEqual(calls, ['after']);
});

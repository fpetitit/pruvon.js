import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runSpecs } from '../src/runner.js';

function makeTmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pruvon-runner-test-'));
}

function writeSpec(dir, name, table = 'add') {
  fs.writeFileSync(
    path.join(dir, `${name}.pruvon.html`),
    `<html><body><table data-execute="${table}"><tr><td>1</td><td>2</td><td>3</td></tr></table></body></html>`
  );
}

test('runSpecs calls beforeSpecification/afterSpecification once per spec, around all its tables', async (t) => {
  const dir = makeTmpProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  writeSpec(dir, 'two-tables');
  fs.writeFileSync(
    path.join(dir, 'two-tables.pruvon.html'),
    `<html><body>
      <table data-execute="add"><tr><td>1</td><td>2</td><td>3</td></tr></table>
      <table data-execute="add"><tr><td>2</td><td>2</td><td>4</td></tr></table>
    </body></html>`
  );
  fs.writeFileSync(
    path.join(dir, 'two-tables.pruvon.fixture.js'),
    `export const calls = [];
     export function beforeSpecification() { calls.push('before'); }
     export function afterSpecification() { calls.push('after'); }
     export function add(args) { return Number(args[0]) + Number(args[1]); }`
  );

  const specs = await runSpecs(dir, '*.pruvon.html');

  assert.equal(specs[0].error, undefined);
  assert.equal(specs[0].passedCount, 2);

  const { calls } = await import(path.join(dir, 'two-tables.pruvon.fixture.js'));
  assert.deepEqual(calls, ['before', 'after']);
});

test('runSpecs reports a spec as errored when beforeSpecification throws, without running its tables', async (t) => {
  const dir = makeTmpProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  writeSpec(dir, 'before-throws');
  fs.writeFileSync(
    path.join(dir, 'before-throws.pruvon.fixture.js'),
    `export function beforeSpecification() { throw new Error('setup failed'); }
     export function add() { throw new Error('should not run'); }`
  );

  const specs = await runSpecs(dir, '*.pruvon.html');

  assert.ok(specs[0].error);
  assert.equal(specs[0].error.message, 'setup failed');
  assert.equal(specs[0].results.length, 0);
});

test('runSpecs reports a spec as errored when afterSpecification throws, even if all rows passed', async (t) => {
  const dir = makeTmpProject();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  writeSpec(dir, 'after-throws');
  fs.writeFileSync(
    path.join(dir, 'after-throws.pruvon.fixture.js'),
    `export function afterSpecification() { throw new Error('teardown failed'); }
     export function add(args) { return Number(args[0]) + Number(args[1]); }`
  );

  const specs = await runSpecs(dir, '*.pruvon.html');

  assert.ok(specs[0].error);
  assert.equal(specs[0].error.message, 'teardown failed');
});

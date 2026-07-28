import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/cli.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

function makeTmpProject(names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pruvon-cli-test-'));
  for (const name of names) {
    fs.copyFileSync(path.join(fixturesDir, name), path.join(dir, name));
  }
  return dir;
}

test('run() writes an aggregate pruvon-report.html linking each spec result', async (t) => {
  const dir = makeTmpProject([
    'pass.pruvon.html',
    'pass.pruvon.fixture.js',
    'fail.pruvon.html',
    'fail.pruvon.fixture.js',
  ]);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const exitCode = await run(['--cwd', dir]);

  assert.equal(exitCode, 1);
  const reportPath = path.join(dir, 'pruvon-report.html');
  assert.ok(fs.existsSync(reportPath));

  const report = fs.readFileSync(reportPath, 'utf8');
  assert.match(report, /pass\.pruvon\.html/);
  assert.match(report, /fail\.pruvon\.html/);
  assert.match(report, /1 passed, 1 failed/);
});

test('run() appends a Job Summary when GITHUB_STEP_SUMMARY is set', async (t) => {
  const dir = makeTmpProject(['pass.pruvon.html', 'pass.pruvon.fixture.js']);
  const summaryPath = path.join(dir, 'step-summary.md');
  fs.writeFileSync(summaryPath, '');
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.GITHUB_STEP_SUMMARY;
  });

  process.env.GITHUB_STEP_SUMMARY = summaryPath;
  await run(['--cwd', dir]);

  const summary = fs.readFileSync(summaryPath, 'utf8');
  assert.match(summary, /## Pruvon report/);
  assert.match(summary, /✅ 1 passed, 0 failed/);
});

test('run() does not touch $GITHUB_STEP_SUMMARY when it is unset', async (t) => {
  delete process.env.GITHUB_STEP_SUMMARY;
  const dir = makeTmpProject(['pass.pruvon.html', 'pass.pruvon.fixture.js']);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  await assert.doesNotReject(run(['--cwd', dir]));
});

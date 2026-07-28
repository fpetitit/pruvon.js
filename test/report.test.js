import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { renderReport } from '../src/render-report.js';
import { renderGithubSummary } from '../src/render-github-summary.js';

const cwd = '/project';
const specs = [
  {
    specPath: '/project/pass.pruvon.html',
    resultPath: '/project/pass.pruvon.result.html',
    results: [],
    passedCount: 2,
    failedCount: 0,
  },
  {
    specPath: '/project/fail.pruvon.html',
    resultPath: '/project/fail.pruvon.result.html',
    results: [],
    passedCount: 1,
    failedCount: 1,
  },
  {
    specPath: '/project/missing-fixture.pruvon.html',
    error: new Error('no fixture found for spec "missing-fixture.pruvon.html"'),
    results: [],
    passedCount: 0,
    failedCount: 0,
  },
];

test('renderReport links every spec to its own result file and colors rows by outcome', () => {
  const html = renderReport(cwd, specs);

  assert.match(html, /3 passed, 1 failed/);
  assert.match(html, /<a href="pass\.pruvon\.result\.html">pass\.pruvon\.html<\/a>/);
  assert.match(html, /background-color:green/);
  assert.match(html, /<a href="fail\.pruvon\.result\.html">fail\.pruvon\.html<\/a>/);
  assert.match(html, /background-color:red/);
});

test('renderReport surfaces a fixture error as a row without a result link', () => {
  const html = renderReport(cwd, specs);

  assert.match(html, /missing-fixture\.pruvon\.html/);
  assert.match(html, /no fixture found/);
});

test('renderGithubSummary renders a Markdown table with a pass\/fail icon per spec', () => {
  const md = renderGithubSummary(cwd, specs, 3, 1);

  assert.match(md, /\| `pass\.pruvon\.html` \| ✅ 2 passed, 0 failed \|/);
  assert.match(md, /\| `fail\.pruvon\.html` \| ❌ 1 passed, 1 failed \|/);
  assert.match(md, /\| `missing-fixture\.pruvon\.html` \| ❌ no fixture found/);
  assert.match(md, /\*\*3 passed, 1 failed\*\*/);
  assert.doesNotMatch(md, /background-color/);
});

test('renderReport uses paths relative to cwd, not absolute paths', () => {
  const html = renderReport(cwd, specs);
  assert.ok(!html.includes(path.sep + 'project' + path.sep));
});

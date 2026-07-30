import fs from 'node:fs';
import path from 'node:path';
import { runSpecs } from './runner.js';
import { renderReport } from './render-report.js';
import { renderGithubSummary } from './render-github-summary.js';

const USAGE = `Usage: pruvon [--cwd <dir>] [--pattern <glob>]

  --cwd <dir>       Directory to discover specs from (default: current directory)
  --pattern <glob>  Glob pattern for spec files (default: **/*.pruvon.{html,md})
  --help            Show this help message

Always writes an aggregate pruvon-report.html in <cwd>, linking every spec's
own result file. Under GitHub Actions (when $GITHUB_STEP_SUMMARY is set),
also appends a pass/fail table to the run's Job Summary.
`;

function parseArgs(argv) {
  const opts = { cwd: process.cwd(), pattern: '**/*.pruvon.{html,md}' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cwd') opts.cwd = argv[++i];
    else if (argv[i] === '--pattern') opts.pattern = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') opts.help = true;
  }
  return opts;
}

export async function run(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }

  let specs;
  try {
    specs = await runSpecs(opts.cwd, opts.pattern);
  } catch (err) {
    console.log(`✗ suite hook failed: ${err.message}`);
    return 1;
  }

  if (specs.length === 0) {
    console.log('No pruvon specs found.');
    return 0;
  }

  let totalPassed = 0;
  let totalFailed = 0;
  let hasFixtureError = false;

  for (const spec of specs) {
    const relPath = path.relative(opts.cwd, spec.specPath);

    if (spec.error) {
      hasFixtureError = true;
      console.log(`✗ ${relPath}: ${spec.error.message}`);
      continue;
    }

    totalPassed += spec.passedCount;
    totalFailed += spec.failedCount;

    console.log(`${spec.failedCount === 0 ? '✔' : '✗'} ${relPath}: ${spec.passedCount} passed, ${spec.failedCount} failed`);
  }

  console.log(`\n${totalPassed} passed, ${totalFailed} failed`);

  const reportPath = path.join(opts.cwd, 'pruvon-report.html');
  fs.writeFileSync(reportPath, renderReport(opts.cwd, specs));
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, renderGithubSummary(opts.cwd, specs, totalPassed, totalFailed));
  }

  return totalFailed > 0 || hasFixtureError ? 1 : 0;
}

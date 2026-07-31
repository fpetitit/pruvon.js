import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { runSpecs } from './runner.js';
import { renderReport } from './render-report.js';
import { renderGithubSummary } from './render-github-summary.js';

const USAGE = `Usage: pruvon [--cwd <dir>] [--pattern <glob>] [--track-results]

  --cwd <dir>       Directory to discover specs from (default: current directory)
  --pattern <glob>  Glob pattern for spec files (default: **/*.pruvon.{html,md})
  --track-results   Warn if the generated report/result files are still .gitignore'd
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
    else if (argv[i] === '--track-results') opts.trackResults = true;
    else if (argv[i] === '--help' || argv[i] === '-h') opts.help = true;
  }
  return opts;
}

function isGitIgnored(filePath) {
  try {
    execFileSync('git', ['check-ignore', '-q', filePath], { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
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

  if (opts.trackResults) {
    const generatedPaths = [reportPath, ...specs.filter((spec) => spec.resultPath).map((spec) => spec.resultPath)];
    const ignored = generatedPaths.filter(isGitIgnored);
    if (ignored.length > 0) {
      console.log(`\n⚠ --track-results: still .gitignore'd, won't show up on the main branch:`);
      for (const p of ignored) console.log(`  ${path.relative(process.cwd(), p)}`);
    }
  }

  return totalFailed > 0 || hasFixtureError ? 1 : 0;
}

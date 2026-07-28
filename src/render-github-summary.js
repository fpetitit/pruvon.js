import path from 'node:path';

function rowMarkdown(cwd, spec) {
  const relSpec = path.relative(cwd, spec.specPath);

  if (spec.error) {
    return `| \`${relSpec}\` | ❌ ${spec.error.message} |`;
  }

  const icon = spec.failedCount === 0 ? '✅' : '❌';
  return `| \`${relSpec}\` | ${icon} ${spec.passedCount} passed, ${spec.failedCount} failed |`;
}

// GitHub Actions renders whatever gets appended to $GITHUB_STEP_SUMMARY as the run's
// Job Summary. Markdown only — GitHub sanitizes raw HTML/inline styles, so this can't
// reuse renderReport's colored table; a ✅/❌ column stands in for the green/red cells.
export function renderGithubSummary(cwd, specs, totalPassed, totalFailed) {
  const rows = specs.map((spec) => rowMarkdown(cwd, spec)).join('\n');

  return `## Pruvon report

| Spec | Result |
|---|---|
${rows}

**${totalPassed} passed, ${totalFailed} failed**
`;
}

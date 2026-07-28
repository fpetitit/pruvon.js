import path from 'node:path';

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function rowHtml(cwd, spec) {
  const relSpec = escapeHtml(path.relative(cwd, spec.specPath));

  if (spec.error) {
    return `<tr><td>${relSpec}</td><td style="background-color:red">${escapeHtml(spec.error.message)}</td></tr>`;
  }

  const relResult = path.relative(cwd, spec.resultPath);
  const status = spec.failedCount === 0 ? 'green' : 'red';
  const summary = `${spec.passedCount} passed, ${spec.failedCount} failed`;
  return `<tr><td><a href="${encodeURI(relResult)}">${relSpec}</a></td><td style="background-color:${status}">${summary}</td></tr>`;
}

// Aggregate, always-generated entry point linking every discovered spec's own
// `*.pruvon.result.html` — so a full run has one file to open instead of one per spec.
export function renderReport(cwd, specs) {
  const totalPassed = specs.reduce((sum, spec) => sum + spec.passedCount, 0);
  const totalFailed = specs.reduce((sum, spec) => sum + spec.failedCount, 0);
  const rows = specs.map((spec) => rowHtml(cwd, spec)).join('\n');

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Pruvon report</title></head>
<body>
<h1>Pruvon report</h1>
<p>${totalPassed} passed, ${totalFailed} failed</p>
<table border="1" cellpadding="4" cellspacing="0">
<tr><th>Spec</th><th>Result</th></tr>
${rows}
</table>
</body>
</html>
`;
}

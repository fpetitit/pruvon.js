# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm test` — runs `node --test test/engine.test.js test/markdown.test.js test/report.test.js test/cli.test.js test/runner.test.js` (Node's built-in test runner, no external framework).
- `node bin/pruvon.js --cwd <dir>` — runs the CLI against a directory of specs (e.g. `node bin/pruvon.js --cwd test` runs the demo + the engine's own fixture cases). `--pattern <glob>` overrides the default `**/*.pruvon.{html,md}`. Exit code `0` = all rows passed (or no specs found), `1` = any failure/error.
- No build step, no linter.

## Architecture

Pruvon is a Concordion-style BDD test tool: specs (HTML or Markdown) describe expected behavior in
tables, executed row-by-row against a paired "fixture" JS module, producing a visual pass/fail report.

- **`src/discover.js`** — globs `**/*.pruvon.{html,md}` from a given `cwd`, and for each spec resolves
  its paired fixture as `<stem>.pruvon.fixture.js`, loading it via dynamic `import()`. Reports a
  `fixtureError` on the entry (rather than throwing) when no fixture file exists.
- **`src/render-markdown.js`** — converts a `.pruvon.md` spec to HTML via `markdown-it`. A fenced code
  block tagged ` ```pruvon:<fnName> ` has its GFM table content rendered and tagged
  `data-execute="<fnName>"`; every other Markdown construct renders normally. This is the only
  Markdown-specific code — everything downstream is HTML.
- **`src/run-table.js`** — the shared engine, used identically for HTML and (rendered) Markdown specs.
  Given a cheerio `$` and a fixtures object, walks every `<table data-execute="fnName">`'s rows, calls
  `fixtures[fnName](args)` (args = all `<td>` text except the last, `await`ed so fixtures may be async),
  compares the result to the last cell, and colors that cell green/red in place. Each row is wrapped in
  its own try/catch, so a throwing or missing fixture function fails only that row. If the fixture
  exports `beforeExample`/`afterExample`, each is `await`ed once per row (`afterExample` in a `finally`,
  so it still runs when the row's fixture function throws), receiving `{ fnName, args }` (`afterExample`
  also gets `actual`, `passed`, `error`). Either hook throwing fails just that row, the same as a
  throwing fixture function — see `examples/before-after-example/`.
- **`src/runner.js`** — orchestrates discovery → markdown render (if needed) → `runTables` → writes
  `<stem>.pruvon.result.html` next to the spec, plus a `passedCount`/`failedCount` per spec (used by
  both `cli.js`'s console output and the two report renderers below, so the pass/fail tally is computed
  exactly once). These result files are generated output (`.gitignore`d) — never treat them as source
  of truth or hand-edit them. If the fixture exports `beforeSpecification`/`afterSpecification`, each is
  `await`ed once per spec file — before/after *all* of that file's tables, not per table. Either one
  throwing marks the whole spec as errored (same shape as a missing-fixture `fixtureError`: no
  `resultPath`/`passedCount`, just an `error`) — see `examples/before-after-specification/`.
- **`src/render-report.js`** — pure function building the aggregate `pruvon-report.html` (one row per
  spec, linking its `*.pruvon.result.html`, green/red like the per-spec reports).
- **`src/render-github-summary.js`** — pure function building the Markdown table `cli.js` appends to
  `$GITHUB_STEP_SUMMARY` under GitHub Actions. Separate from `render-report.js` because GitHub
  sanitizes raw HTML/inline styles out of Job Summaries — this can't reuse the colored HTML table, so
  it renders a ✅/❌ column instead.
- **`src/cli.js`** / **`bin/pruvon.js`** — argv parsing (`--cwd`, `--pattern`, `--help`), console
  summary, writing `pruvon-report.html` and (when `$GITHUB_STEP_SUMMARY` is set) the Job Summary, and
  the exit-code contract described above.
- **Fixture/spec pairing convention**: `<name>.pruvon.html` and/or `<name>.pruvon.md` share the same
  fixture `<name>.pruvon.fixture.js` (see `examples/basket/basket.pruvon.*` for a spec pairing both
  formats to one fixture). Fixtures typically adapt string cell values into typed args and call into a
  "domain" module — see `examples/basket/basket.js` (`sum`, `sub`) wrapped by
  `examples/basket/basket.pruvon.fixture.js`.

## Directory layout

- **`src/`** holds *only* the engine — no example/demo code lives here.
- **`examples/`** holds the illustrative, user-facing demos, one subdirectory per example
  (`examples/basket/`, `examples/name-splitter/`, `examples/before-after-example/`,
  `examples/before-after-specification/`), each with its domain module + specs + fixture co-located,
  plus a `pruvon.css` shared by all at the top of `examples/`. `name-splitter/` is the running example
  embedded in `docs/tutorial.html`. `before-after-example/` demonstrates the `beforeExample`/
  `afterExample` lifecycle hooks (a counter reset before every row, proving each example runs isolated
  from the ones before it). `before-after-specification/` demonstrates `beforeSpecification`/
  `afterSpecification` (a fake catalog seeded once for a whole spec file, shared across its two tables).
- **`test/`** holds the engine's own `node:test` suites (`engine.test.js`, `markdown.test.js`,
  `runner.test.js`) and the deliberately pathological specs/fixtures under `test/fixtures/`
  (pass/fail/async/throwing/missing-fixture/before-after-example/example-hook-throws) they run against
  — these are distinct from the `examples/` demos.
- **`demos/`** holds standalone consumer projects, each with its own `package.json`/`package-lock.json`/
  `node_modules` (gitignored) that install `pruvon` for real from the public npm registry — unlike
  `examples/`, which imports the engine's local source directly. `demos/standard-project/` is plain
  ESM Node.js; `demos/nestjs/` is a CommonJS NestJS app whose fixture resolves a service via
  `NestFactory.createApplicationContext` (Nest's DI), demonstrating pruvon works regardless of the
  consuming project's module type. These exist to smoke-test real installs, not to be run as part of
  this repo's own `npm test`.

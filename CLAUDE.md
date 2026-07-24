# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm test` — runs `node --test test/engine.test.js test/markdown.test.js` (Node's built-in test runner, no external framework).
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
  its own try/catch, so a throwing or missing fixture function fails only that row.
- **`src/runner.js`** — orchestrates discovery → markdown render (if needed) → `runTables` → writes
  `<stem>.pruvon.result.html` next to the spec. These result files are generated output
  (`.gitignore`d) — never treat them as source of truth or hand-edit them.
- **`src/cli.js`** / **`bin/pruvon.js`** — argv parsing (`--cwd`, `--pattern`, `--help`), console
  summary, and the exit-code contract described above.
- **Fixture/spec pairing convention**: `<name>.pruvon.html` and/or `<name>.pruvon.md` share the same
  fixture `<name>.pruvon.fixture.js` (see `examples/basket/basket.pruvon.*` for a spec pairing both
  formats to one fixture). Fixtures typically adapt string cell values into typed args and call into a
  "domain" module — see `examples/basket/basket.js` (`sum`, `sub`) wrapped by
  `examples/basket/basket.pruvon.fixture.js`.

## Directory layout

- **`src/`** holds *only* the engine — no example/demo code lives here.
- **`examples/`** holds the illustrative, user-facing demos, one subdirectory per example
  (`examples/basket/`, `examples/name-splitter/`), each with its domain module + specs + fixture
  co-located, plus a `pruvon.css` shared by both at the top of `examples/`. `name-splitter/` is the
  running example embedded in `docs/tutorial.html`.
- **`test/`** holds the engine's own `node:test` suites (`engine.test.js`, `markdown.test.js`) and the
  deliberately pathological specs/fixtures under `test/fixtures/` (pass/fail/async/throwing/missing-fixture)
  they run against — these are distinct from the `examples/` demos.

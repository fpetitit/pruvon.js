# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repo is `proof.io` mid-rename/rewrite into **Pruvon**. The code currently in the tree is the *old* implementation described below. The target architecture for the rewrite (naming conventions, Markdown spec support, CLI, engine internals) is fully specified in [docs/PLAN-rewrite.md](docs/PLAN-rewrite.md) — read it before making structural changes, and keep it in sync (or superseded/removed) as the rewrite lands.

## Commands

- `npm test` — runs `node proof.js`, which discovers and executes all specs under the current working directory (see Architecture below). There is no unit test suite for the engine itself yet (tracked as a gap to fix in the rewrite plan).
- No build step, no linter script wired into `package.json` (an `.eslintrc` exists but isn't invoked by any script).

## Architecture (current, pre-rewrite implementation)

Pruvon/proof.io is a Concordion-style BDD test tool: HTML "specs" describe expected behavior in tables, and get executed against a paired JS "fixture" module.

- **Engine**: `proof.js` is the entire engine (~40 lines). It globs `**/*_proof.js` from `process.cwd()`, and for each one:
  1. `require`s the fixture module (a plain object of functions keyed by name).
  2. Reads the sibling spec file with the same basename but `.html` extension (e.g. `basket_proof.js` ↔ `basket_proof.html`).
  3. Parses the HTML with `cheerio` and walks every `<tr>`.
  4. For a row's parent `<table data-execute="fnName">`, calls `fixtures[fnName](args)` where `args` are the text of all `<td>` cells except the last.
  5. Compares the last `<td>` (expected value) against the function's return value; colors that cell green (pass) or red + rewrites its text to `expected X but was Y` (fail).
  6. Writes the annotated HTML to `<basename>_result.html` next to the spec.
- **Fixture/spec pairing convention**: `<name>_proof.js` (fixture, adapts string cell values into typed args and calls into a "domain" module) + `<name>_proof.html` (spec) + `<name>_proof_result.html` (generated report — should not be hand-edited or relied upon as source of truth, it's an output artifact).
- **Domain code**: `src/basket.js` is the example domain module (`sum`, `sub`) that the demo fixture (`test/basket_proof.js`) wraps and adapts.
- Everything here is synchronous, CommonJS, and has no error boundary — an exception in a fixture function or a missing `data-execute` target crashes the whole run silently (via the `glob` callback), and the process always exits `0` regardless of pass/fail, so it cannot gate CI.

When working on the rewrite, treat the numbered execution flow above as the behavior to preserve conceptually (table → row → fixture call → colored cell), while fixing the async/error-boundary/exit-code gaps per the plan doc.

# Pruvon — rewrite of proof.io

## Context

This is a long-dormant personal side project (currently named `proof.io`, ~150 lines total) inspired by Concordion: HTML specs with `data-execute` tables get executed row-by-row against a paired "fixture" JS module, and a result HTML file is written with cells colored green/red. The owner wants to pick it back up, rename it to **Pruvon**, and modernize it substantially rather than patch the existing engine. Confirmed decisions driving this plan:

- Rename to **pruvon** everywhere in the package; leave the GitHub repository/homepage URL untouched with a TODO note (do not invent a new URL).
- Modern JS with native ES modules (`"type": "module"`), not TypeScript.
- Add **Markdown** as a first-class second spec format alongside HTML (not a stopgap).
- No AI/LLM behavior inside the tool itself for this phase — stays a deterministic test engine.
- Fix real functional gaps: async fixture support, per-row error containment (a throwing/missing fixture fails only that row, not the whole run), a real CLI with a meaningful exit code (today's tool always exits 0, making it useless in CI), a console summary, and actual unit tests of the engine (there are currently zero).

## New file naming convention

| Purpose | Old | New |
|---|---|---|
| HTML spec | `xxx_proof.html` | `xxx.pruvon.html` |
| Markdown spec | n/a | `xxx.pruvon.md` |
| Fixture | `xxx_proof.js` | `xxx.pruvon.fixture.js` |
| Result (generated) | `xxx_proof_result.html` | `xxx.pruvon.result.html` |

Discovery glob: `**/*.pruvon.{html,md}`, filtered to drop anything ending in `.pruvon.result.html` (otherwise a run would try to re-execute its own previous output). Fixture is resolved deterministically as `<stem>.pruvon.fixture.js` next to the spec.

## Markdown spec mechanism

Use **markdown-it** (latest, native ESM, tiny dep tree). Its `table` rule is core/default — GFM tables render with no plugin. Override `md.renderer.rules.fence` to special-case an info-string convention `pruvon:<fnName>`:

````
```pruvon:sum
| Operand 1 | Operand 2 | Result |
|---|---|---|
| 0 | 1 | 1 |
```
````

```js
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();
const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules);

md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
  const info = tokens[idx].info.trim();
  const match = /^pruvon:(\S+)/.exec(info);
  if (!match) return defaultFence(tokens, idx, options, env, slf);

  const tableHtml = md.render(tokens[idx].content).trim();
  return tableHtml.replace('<table>', `<table data-execute="${match[1]}">`);
};

export function renderMarkdownSpec(markdownSource) {
  return md.render(markdownSource);
}
```

The full rendered HTML document then flows into the **same** cheerio-based row-execution function used for `.pruvon.html` files — no duplicated execution logic. A malformed table inside a fence just fails to tokenize as a table (degrades to plain text, produces 0 executed rows for that block) — no special-case crash handling needed.

## Module layout (src/)

Small, flat, no premature abstraction (~300-500 lines total is the right ballpark, not a framework):

```
bin/pruvon.js          # shebang CLI entry
src/discover.js        # glob + filter + pair spec↔fixture, dynamic import() of fixtures
src/render-markdown.js # markdown-it setup + fence override (above)
src/run-table.js       # shared engine: given cheerio $ + fixtures, walk tables/rows, execute, annotate, return {html, results}
src/runner.js          # orchestrate: load spec (html direct / markdown → render-markdown), call run-table, write .pruvon.result.html, aggregate summary
src/cli.js             # argv parsing + wires discover+runner + prints console summary, returns exit code
test/engine.test.js    # node:test unit tests
test/fixtures/*        # pass/fail/async/throwing/missing-fixture + one markdown case, for engine tests only
```

### src/run-table.js — core algorithm (the one structural change from today)

```js
export async function runTables($, fixtures) {
  const results = [];
  for (const table of $('table[data-execute]').toArray()) {
    const fnName = $(table).attr('data-execute');
    for (const row of $(table).find('tr').has('td').toArray()) {
      const cells = $(row).find('td');
      const args = [];
      for (let i = 0; i < cells.length - 1; i++) args.push($(cells[i]).text());
      const expectedCell = $(cells[cells.length - 1]);
      const expected = expectedCell.text();

      let actual, passed, errorMessage;
      try {
        const fn = fixtures[fnName];
        if (typeof fn !== 'function') throw new Error(`fixture function "${fnName}" not found`);
        actual = await fn(args);
        passed = String(actual) === String(expected);
      } catch (err) {
        passed = false;
        errorMessage = err.message;
      }

      if (passed) {
        expectedCell.css('background-color', 'green');
      } else {
        expectedCell.css('background-color', 'red');
        expectedCell.text(errorMessage ? `error: ${errorMessage}` : `expected ${expected} but was ${actual}`);
      }
      results.push({ table: fnName, expected, actual, passed, error: errorMessage });
    }
  }
  return { html: $.html(), results };
}
```

Key fixes vs. today: `await` on fixture calls (async support), try/catch **per row** (one bad row no longer kills the whole file — today's uncaught throw silently aborts `glob`'s callback for every remaining file too), explicit `.has('td')` guard against header rows.

`src/discover.js` loads fixtures via dynamic `import(pathToFileURL(fixturePath))` (ESM — no more `require`).

## CLI

```js
#!/usr/bin/env node
import { run } from '../src/cli.js';
process.exitCode = await run(process.argv.slice(2));
```

Manual argv parsing (no yargs/commander for 2 flags): `--cwd <dir>` (default `process.cwd()`), `--pattern <glob>` (default `**/*.pruvon.{html,md}`), `--help`.

Exit code contract: `0` = every discovered spec's every row passed (or zero specs found — not itself an error); `1` = any row failed, threw, had a missing fixture function, or any spec had no paired fixture file at all.

`package.json`: `"bin": { "pruvon": "./bin/pruvon.js" }`.

## Testing the engine itself

`node:test` + `node:assert/strict` — no external framework (avoids the "testing pruvon with pruvon" bootstrap problem and avoids a new devDependency). Cases: pass, fail, async fixture, throwing fixture, missing fixture function, and one markdown-fence case via `renderMarkdownSpec`.

**Important gotcha to avoid**: Node's test runner default file discovery matches *any* `.js` file under a directory literally named `test/` (pattern `**/test/**/*.{cjs,mjs,js}`). Since `test/fixtures/*.fixture.js` and `test/basket.pruvon.fixture.js` live under `test/`, a bare `node --test` or `node --test test/` would try to execute them **as test files** and fail. Fix: `package.json` script must point at the exact file — `"test": "node --test test/engine.test.js"` — not the directory.

## Dependencies

- `cheerio` → latest (1.x): `.css()/.data()/.map()/.text()/.find()/.html()` all still present, existing call style ports over.
- `glob` → latest (13.x): native ESM, Promise-based `glob()` (no more callback) — `import { glob } from 'glob'`.
- `markdown-it` → latest (14.x): new dependency, for Markdown specs.
- `engines.node`: bump to `>=18` (needed for stable ESM + `node:test`).

## Files to delete / create / modify

**Delete**: `proof.js`, `test/basket_proof.html`, `test/basket_proof.js`, `test/basket_proof_result.html` (stale generated artifact — doesn't even match current `basket.js` output), `.eslintrc` (obsolete `ecmaVersion: 6` config; no devDependencies exist today so re-adding lint tooling is out of scope unless separately requested).

**Create**: `bin/pruvon.js`, `src/discover.js`, `src/render-markdown.js`, `src/run-table.js`, `src/runner.js`, `src/cli.js`, `test/engine.test.js`, `test/fixtures/*` (pass/fail/async/throwing/missing-fixture pairs + one markdown fixture pair), `test/basket.pruvon.html` (renamed/rewritten demo), `test/basket.pruvon.fixture.js` (renamed/rewritten demo), `test/basket.pruvon.md` (new demo showing the `pruvon:sum`/`pruvon:sub` fence convention), `test/pruvon.css` (renamed from `test/proof.css`).

**Modify**: `package.json` (name `pruvon`, `"type": "module"`, `main` → `src/runner.js`, `bin`, `engines.node >=18`, updated deps, `scripts.test` as above; keep `repository`/`homepage` URL as-is), `README.md` (full rewrite: install, HTML + Markdown usage with the fence example, CLI usage and exit-code contract for CI, drop the broken external `proof-demo` repo link in favor of the in-repo demo, note the repo-URL TODO), `.gitignore` (add `*.pruvon.result.html` so generated output stops getting committed), `src/basket.js` (kept as-is, just double-check it's still referenced correctly by the new fixture).

## Verification

1. `npm install` succeeds with the new deps.
2. `npm test` (`node --test test/engine.test.js`) passes — covers pass/fail/async/throwing/missing-fixture/markdown-fence cases.
3. Run the CLI against the demo: `node bin/pruvon.js --cwd test` — check `test/basket.pruvon.result.html` and the markdown-derived result are generated, cells colored correctly, and confirm process exit code is `0` if the demo specs are all made to pass (or intentionally `1` if we keep one deliberate failing row as a demonstration — decide during implementation and reflect it in the README).
4. Manually inspect one generated result HTML in a browser to confirm coloring/styling still works with `test/pruvon.css`.

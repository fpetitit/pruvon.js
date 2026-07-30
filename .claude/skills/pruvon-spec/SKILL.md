---
name: pruvon-spec
description: Use when creating a new Pruvon spec — a .pruvon.md or .pruvon.html file and its paired fixture — such as scaffolding a new example, adding a table to test a function, or deciding which lifecycle hook (beforeExample/beforeSpecification/beforeSuite) to use. Triggers include "create a pruvon spec", "add a pruvon example", "write a .pruvon.md/.pruvon.html spec", "crée une spec pruvon", "ajoute un exemple pruvon".
---

# Creating a Pruvon spec

## 1. Gather what's needed

Before writing anything, work out (ask the user if unclear — don't guess domain logic):

- **Name & location** — the `<name>` stem and directory. `examples/<name>/` for illustrative demos in
  this repo; `test/fixtures/<case>/` for pathological engine test cases; the consumer's own directory
  for real usage.
- **Behavior under test** — which function(s), and 2-3 representative rows each (happy path + an edge
  case). More rows are cheap; don't pad with redundant ones.
- **Format** — HTML or Markdown, see §3.
- **Isolation/shared state** — does the function under test need a reset between rows, or a one-time
  setup shared across tables/files? See §4. Most specs need neither.

## 2. File trio

A spec is always three files sharing the stem `<name>`:

1. `<name>.js` — the domain module (plain functions, pure where possible). Skip this if testing an
   existing module.
2. `<name>.pruvon.fixture.js` — thin adapter: one exported function per `data-execute`/`pruvon:` name,
   taking `args` and returning the actual value.
3. `<name>.pruvon.md` and/or `<name>.pruvon.html` — the spec table(s).

### Fixture rules

- `args` is an array of **raw strings** — the text of every `<td>` in the row except the last one.
- The engine compares with `String(actual) === String(expected)`, so the *return* value doesn't need
  stringifying — but **call arguments do need coercing** (`args.map(Number)`, `args[0] === 'true'`,
  etc.) before they reach domain logic. See `examples/basket/basket.pruvon.fixture.js`.
- Keep the fixture a thin adapter — put actual logic in the domain module (`<name>.js`), not the
  fixture.

## 3. Format decision

| Use | When |
|---|---|
| Markdown (`.pruvon.md`) | Narrative spec, surrounding prose/docs, e.g. a tutorial page |
| HTML (`.pruvon.html`) | Plain tabular spec, no prose needed |

Both can pair with the same fixture (`examples/basket/` does both) — only add the second format if it's
actually wanted, not by default.

**Markdown table** — fence a GFM table with `` ```pruvon:<fnName> `` / `` ``` ``; everything outside the
fence renders as normal Markdown:

````
```pruvon:firstName
| Full Name | First Name |
|---|---|
| Jane Smith | Jane |
```
````

**HTML table** — `<table data-execute="fnName">`; only `<tr>` containing `<td>` are executed (a header
`<tr>` of `<th>` is safe); last `<td>` is the expected value:

```html
<table data-execute="firstName">
  <tr><th>Full Name</th><th>First Name</th></tr>
  <tr><td>Jane Smith</td><td>Jane</td></tr>
</table>
```

If the spec lives under `examples/`, link the shared stylesheet as the other examples do:
`<link rel="stylesheet" href="../pruvon.css" type="text/css" media="screen">`.

## 4. Lifecycle hook decision

Only add a hook when isolation or shared setup is actually needed for the behavior under test — don't
add hooks speculatively "just in case."

| Need | Hook | Lives in | Scope |
|---|---|---|---|
| Reset/prepare state before every row | `beforeExample` / `afterExample` | the fixture | per row |
| One-time setup shared by every table in this spec file | `beforeSpecification` / `afterSpecification` | the fixture | per spec file |
| One-time resource shared across multiple spec files | `beforeSuite` / `afterSuite` | `pruvon.suite.js` (once per directory — not per fixture) | per run |

Failure semantics: `afterExample`/`afterSuite` run in a `finally`, so they fire even when the
row/run already failed. A throwing `beforeSpecification`/`afterSpecification` marks the whole spec
file as errored (same shape as a missing-fixture error: no `resultPath`/`passedCount`, just `error`).
A throwing `beforeSuite` aborts the entire run before any spec executes.

Reference implementations: `examples/before-after-example/`, `examples/before-after-specification/`,
`examples/before-after-suite/`.

## 5. Verify

Run `node bin/pruvon.js --cwd <dir>` and check:

- Exit code `0` = every row passed; `1` = a failure or error.
- The generated `<name>.pruvon.result.html` — passing cells are green, failing ones are red and show
  `expected X but was Y` (or `error: <message>` if the fixture/hook threw).

Never hand-edit `*.pruvon.result.html` — it's generated output, regenerated on every run.

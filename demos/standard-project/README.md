# demos/standard-project

A minimal, standard plain-Node.js project showing [pruvon](https://www.npmjs.com/package/pruvon)
installed as a regular npm dependency from the public registry and used to test a small module —
no monorepo linking, no relative import into the engine's source, just `npm install pruvon`.

This subfolder has its own `package.json`/`package-lock.json`/`node_modules`, independent from the
rest of this repo, precisely so it exercises a real install rather than the local engine source
(compare with [`examples/`](../../examples/), which uses the engine directly for the tutorial/demo).

## What's here

- `name-splitter.js` — the code under test (splits a full name into first/last name).
- `name-splitter.pruvon.html` / `name-splitter.pruvon.md` — the same spec written in both
  formats pruvon supports.
- `name-splitter.pruvon.fixture.js` — wires the spec's `data-execute` names to `name-splitter.js`.

This is the same example used in [pruvon's tutorial](../../docs/tutorial.html). See also
[`../nestjs/`](../nestjs/) for the same idea inside a NestJS project.

## Try it

```
npm install
npm test
```

`npm test` runs `pruvon`, which discovers both spec files, executes them against the fixture,
prints a summary, and writes a `*.pruvon.result.html` report next to each spec (colored green/red,
open it in a browser).

## Synopsis

Pruvon (formerly proof.io) is a tool to help you test your code by generating visual results easy to
understand, both for developers and for non technical persons.
It is especially inspired by http://concordion.org, a great bdd testing tool for Java.

For a full walkthrough with visuals, see [the tutorial](docs/tutorial.html).

## Installation

```
npm install pruvon
```

## Writing specs

A spec describes expected behavior in tables: each row is one call into your code, with all but the
last column as arguments and the last column as the expected result. A table's `data-execute`
attribute names the fixture function to call for each of its rows.

Specs can be written as HTML or Markdown; both run through the same engine.

### HTML specs (`*.pruvon.html`)

```html
<table data-execute="sum">
    <tr>
        <th>Operand 1</th>
        <th>Operand 2</th>
        <th>Result</th>
    </tr>
    <tr>
        <td>0</td>
        <td>1</td>
        <td>1</td>
    </tr>
</table>
```

### Markdown specs (`*.pruvon.md`)

Since GFM tables have no native way to attach a `data-execute` directive, wrap the table in a fenced
code block tagged `pruvon:<fnName>`:

````
```pruvon:sum
| Operand 1 | Operand 2 | Result |
|---|---|---|
| 0 | 1 | 1 |
```
````

Everything else in the Markdown file (headings, paragraphs, other fenced code blocks) renders as
normal Markdown.

### Fixtures (`*.pruvon.fixture.js`)

Each spec is paired with a fixture module of the same name (e.g. `basket.pruvon.html` /
`basket.pruvon.md` both pair with `basket.pruvon.fixture.js`), an ES module exporting one function
per `data-execute` name. Fixture functions receive the row's argument cells as an array of strings,
and may be `async`:

```js
export function sum(args) {
  return args.map(Number).reduce((a, b) => a + b, 0);
}
```

Running a spec writes a `*.pruvon.result.html` report next to it, with each result cell colored
green (pass) or red (fail, with an `expected X but was Y` message). These generated reports are not
meant to be committed (see `.gitignore`).

See `examples/basket.pruvon.html`, `examples/basket.pruvon.md` and
`examples/basket.pruvon.fixture.js` for a complete worked example.

## Running specs

```
npx pruvon
```

Options:

- `--cwd <dir>` — directory to discover specs from (default: current directory)
- `--pattern <glob>` — glob pattern for spec files (default: `**/*.pruvon.{html,md}`)
- `--help` — show usage

Exit code: `0` if every discovered spec's every row passed (or no specs were found), `1` if any row
failed, any fixture function threw, or any spec had no paired fixture — making it usable as a CI
gate.

## Contributors

https://twitter.com/@francoispetitit

## License

MIT

# Tracking results in git

Unlike every other example in this repo, `tracked-results.pruvon.result.html` is **not**
`.gitignore`d — it's committed to `main`. Open it on GitHub (rather than running `pruvon`
locally) and the pass/fail cells are already colored green/red, straight from source.

This is opt-in per file: the root [`.gitignore`](../../.gitignore) still ignores
`*.pruvon.result.html` everywhere by default; a `!` negation for this one file re-includes
it. Run `pruvon --track-results` to get a warning if a result file you expect to be
tracked is still being caught by `.gitignore`.

## Is even

```pruvon:isEven
| Number | Is even |
|---|---|
| 2 | true |
| 3 | false |
| 0 | true |
```

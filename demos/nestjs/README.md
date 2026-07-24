# demos/nestjs

A [NestJS](https://nestjs.com) project using [pruvon](https://www.npmjs.com/package/pruvon),
installed as a regular npm dependency, to spec-test a service resolved through Nest's own
dependency injection container — not by calling the HTTP endpoint.

## What's here

A conventional, minimal Nest app:

- `src/name-splitter.service.ts` — an `@Injectable()` service (splits a full name into first/last name).
- `src/app.controller.ts` / `src/app.module.ts` / `src/main.ts` — the standard Nest scaffolding,
  exposing `GET /split?name=...` if you actually run the app (`npm start`).
- `name-splitter.pruvon.html` / `name-splitter.pruvon.md` — the spec, in both formats.
- `name-splitter.pruvon.fixture.js` — bootstraps a Nest **application context**
  (`NestFactory.createApplicationContext`, no HTTP listener) and resolves `NameSplitterService`
  through it, exactly the way the real app resolves it via `@Controller` constructor injection.

Unlike [`../standard-project/`](../standard-project/) (plain ESM), this project is a standard
CommonJS Nest setup — pruvon's fixture loading works either way, since each project's own
`package.json` decides its module type independently of pruvon itself.

Since the fixture imports the **compiled** service (`./dist/...`), `pruvon` needs to run after
`tsc` — that's why `npm test` is `"build && pruvon"`, not just `pruvon`.

## Try it

```
npm install
npm test
```

# Contributing to lightslide

Thanks for helping improve lightslide — a lightweight, accessible-by-default React carousel.
It stays small and focused on purpose, and contributions that keep it that way are very welcome.

## Ways to help

- **Report a bug** — open a [bug report](https://github.com/DmitriyBol/lightslide/issues/new?template=bug_report.md)
  with a minimal reproduction.
- **Request a feature** — open a [feature request](https://github.com/DmitriyBol/lightslide/issues/new?template=feature_request.md).
  The core is size-budgeted, so new features are weighed against the bundle and often land as
  tree-shakeable `lightslide/*` entries rather than core props.
- **Report a security issue** — privately, via a
  [security advisory](https://github.com/DmitriyBol/lightslide/security/advisories/new)
  (see [SECURITY.md](SECURITY.md)) — never a public issue.

Planned work and known gaps are tracked in the repository's
[issues](https://github.com/DmitriyBol/lightslide/issues).

## Development

```bash
npm install          # dependencies
npm test             # Jest + jsdom (unit / integration)
npm run test:e2e     # Playwright (Chromium) against the playground
npm run lint         # ESLint — the real gate
npm run stylelint    # Stylelint (SCSS)
npm run typecheck    # tsc --noEmit
npm run build        # Rollup CJS + ESM (.mjs) + d.ts
npm run size         # bundle-size budgets (builds first)
npm run playground   # Vite dev server for the demo app
```

See the README's [Development](README.md#development) section for more.

## Pull requests

- Branch from `main` and keep the change focused.
- Match the existing style: **tabs**, `type` aliases (no `interface`), JSDoc `/** */` comments
  only, no non-null `!` or `!!`, named exports. ESLint is the gate (`npm run lint`) — the repo
  is not Prettier-clean, so don't bulk-run `prettier --write`.
- Add tests for new behaviour (Jest; an e2e spec if it is browser-only).
- Keep every entry within its **size-limit** budget (`npm run size`) — size is a first-class
  metric for this library.
- Update the README and add a **[CHANGELOG](CHANGELOG.md)** entry when the public API or the
  documented surface changes. See [Versioning & stability](README.md#versioning--stability)
  for what counts as public API.
- Fill in the PR checklist; CI runs typecheck, lint, stylelint, tests, size, and e2e.

By contributing you agree that your work is licensed under the project's [MIT license](LICENSE)
and that you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).

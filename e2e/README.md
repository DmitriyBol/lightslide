# E2E tests (Playwright)

End-to-end tests that run the **playground** (`../playground`) in a real Chromium browser. The
playground aliases `lightslide` straight to `../src`, so these specs exercise the real source —
not the built bundle — under a real layout engine.

They complement the Jest/jsdom integration tests in `../src`: jsdom has no layout (slide widths
measure as 0, transforms aren't computed), so pointer drag, snap thresholds, and loop/flow motion
can only be verified here.

## Run

```bash
# one-time: install browsers + the playground's own deps
npx playwright install chromium
npm install --prefix playground

npm run test:e2e          # headless run (boots the playground automatically)
npm run test:e2e:ui       # interactive UI mode — watch the drag actually move
npm run test:e2e:report   # open the last HTML report
```

`playwright.config.ts` (repo root) starts the playground dev server on port 5173 via its
`webServer` block, so you don't need to launch it yourself.

## Layout

- `support/carousel.ts` — page object for one carousel in a demo section. Addresses controls by
  role/aria only (`Next slide`, `Go to slide N`, `aria-current`); never by CSS-module class.
- `support/gestures.ts` — `dragX`, a real pointer drag via `page.mouse`.
- `*.spec.ts` — smoke, navigation, pagination, drag. Natural next specs: loop wrap-around, flow
  drift/pause, slidesPerView; then firefox/webkit projects in the config.

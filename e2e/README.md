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
- `support/gestures.ts` — `dragX` / `dragY`, a real pointer drag via `page.mouse`.
- `support/motion.ts` — `waitForRest`, `expectMovedFrom`, `scrollToRest`: wait for motion
  itself (drift, coast, smooth scroll, reveal) instead of sleeping between two samples.
- `*.spec.ts` — smoke, navigation, pagination, drag, loop (wrap-around), flow (drift +
  pause/resume), slidesPerView (width scaling), autoplay-pause (hover/focus/pause-button holds),
  reduced-motion (instant snaps), and one spec per feature. Natural next step: firefox/webkit
  projects in the config.

## Timing rule

Never assert motion as "sample, `waitForTimeout(N)`, sample". On a loaded machine (CI, a full
parallel run) the page handles input a frame or more after Playwright sends it, so a fixed sleep
can measure the moment *before* the pause, resume, or scroll it means to — those specs pass alone
and fail under load. Poll for the motion itself with `support/motion.ts`, and aim a pointer only
at a box that has stopped scrolling into place (`scrollToRest`; `dragX`/`dragY` already do).
A fixed wait is fine only as a product-timing requirement that load can only lengthen (e.g. the
wheel's silence gap).

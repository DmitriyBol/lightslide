# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org) (pre-1.0: minor releases may include breaking changes).

## [Unreleased]

### Changed

- All opt-in tree-shakeable modules now live under `src/modules/` (internal layout; no
  consumer-facing change).
- Internal naming and JSDoc cleanup; free-mode tuning constants are module-local again.

### Fixed

- A backward loop wrap (prev from the first slide) reported analytics `direction: 'right'`;
  it now reports `'left'`, matching the visible motion.
- README: the exported-types example imported a non-existent `DragMode`, missed
  `BreakpointOverrides` and the `lightslide/a11y` types, and the a11y example still used the
  removed config-object API for `navigation`/`pagination`.

## [0.14.0] — 2026-07-17

### Added

- `lightslide/free` — momentum ("free") drag scrolling: a flick coasts with native-feel
  inertia and rests anywhere, or lands on a slide boundary with `<FreeScroll snap />`.
- `settle` navigation source and `store.restOffset` — the core understands a track resting
  between slide boundaries.

## [0.13.0] — 2026-07-16

### Added

- `lightslide/wheel` — opt-in wheel/trackpad gestures: a horizontal two-finger swipe (or
  shift+wheel) turns one page per flick with the inertia tail filtered out; vertical page
  scrolling is never intercepted. During flow the gesture drifts the strip.

### Fixed

- The a11y focus guard suspends while `flow` runs (a drifting strip has no fixed visible
  window).
- Loop clones no longer intercept pointer events; the gesture surface is the viewport.

## [0.12.0] — 2026-07-16

### Added

- `autoScroll.pauseOnHover` / `autoScroll.pauseOnFocus` (both default `true`, WAI-ARIA APG
  behaviour) and `pause()` / `resume()` on the ref handle.

## [0.11.0] — 2026-07-16

### Added

- `breakpoints` prop — media-query overrides of `slidesPerView`/`gap`; the carousel re-lays
  itself out on match changes (SSR-safe, `useSyncExternalStore`).

## [0.10.0] — 2026-07-16

### Added

- `gap` prop — px spacing between slides, folded into all geometry (snap, drag, loop, flow,
  fractional views).

## [0.9.0] — 2026-07-16

### Changed

- **Breaking:** navigation, pagination, and flow moved to their own tree-shakeable entries —
  `lightslide/navigation`, `lightslide/pagination`, `lightslide/flow` — passed as nodes to
  the matching slot props. The base entry no longer bundles them (core ≈ 4.5 kB at the time).

## [0.8.1] — 2026-07-15

### Added

- External control: semi-controlled `index` prop, `onIndexChange`, and a ref handle with
  `goTo` / `next` / `prev` / `getIndex` (`'api'` analytics source).

## [0.8.0] — 2026-07-13

### Added

- Always-on core ARIA: carousel region semantics, per-slide "N of M" labels, hidden+inert
  loop clones, `aria-controls` wiring, reduced-motion snap.
- `lightslide/a11y` — opt-in tree-shakeable layer: keyboard navigation, focus guard,
  live-region announcements, reduced-motion auto-stop.

### Changed

- **Breaking:** requires React ≥ 18 (`useId`).

## [0.6.1] — 2026-06-27

### Changed

- **Breaking:** six analytics handlers replaced by one typed `onEvent` discriminated-union
  handler; viewed-slides tracking is opt-in via `viewedTimeout`.
- Playwright e2e foundation (Chromium, role/aria selectors) + CI job.

## [0.5.9] — 2026-06-27

### Fixed

- Fractional `slidesPerView` scrolls the last slide flush to the edge (ceil'd `maxIndex` +
  clamped track offset).

### Changed

- Playground redesigned (design system + primitives, all example sections).

## [0.5.6] — 2026-06-24

### Fixed

- Multi-slide drag lands on the slide actually dragged to; stage-centered navigation;
  pointer-leave ends a drag; disabled/SSR-safe defaults.

### Changed

- Core bundle brought under 5 kB (scoped CSS names, ES2020 target); split contexts so
  navigating doesn't re-render slides.

## [0.5.1] — 2026-06-24

### Fixed

- Slide content stays clickable (tap passes through, drag suppresses the click); no
  first-paint flash in loop/flow; centered, uncropped navigation buttons.

### Added

- Loading `fallback` prop; analytics became opt-in.

## [0.5.0] — 2026-06-20

### Added

- First public release as `lightslide` (renamed): swipe/drag with snap, fractional
  `slidesPerView`, infinite loop, continuous flow (ticker), navigation, pagination,
  auto-scroll, typed analytics, loading fallback.

[Unreleased]: https://github.com/DmitriyBol/lightslide/compare/0.11.0...HEAD
[0.11.0]: https://github.com/DmitriyBol/lightslide/releases/tag/0.11.0
[0.6.1]: https://github.com/DmitriyBol/lightslide/releases/tag/0.6.1
[0.5.9]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.9
[0.5.6]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.6
[0.5.1]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.1
[0.5.0]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.0

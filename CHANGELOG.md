# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org) (pre-1.0: minor releases may include breaking changes).

## [0.15.1] — 2026-07-17

### Fixed

- Zero-CLS server rendering (Next.js App Router audit, LIG-11). The stylesheet is
  head-injected only when the JS bundle executes, so server-rendered HTML painted unstyled
  until hydration — the track a vertical stack of full-width slides, nav buttons raw in-flow
  elements — and collapsing to the real layout measured **CLS 0.33** with realistically
  delayed JS. Every instance now inlines its critical layout CSS into the markup: container
  and viewport geometry, the flex track, the pre-measure slide width as a `calc()` mirror of
  the measuring formula, and the loop track's resting transform (loop pages no longer paint
  their tail clones first). Navigation inlines its placement + hidden rules and Pagination
  reserves its exact final box, so the controls' post-hydration reveal shifts nothing. The
  same audit now measures **CLS 0** with the pre-hydration paint identical to the final
  layout; hydration is mismatch-free (React 18 and 19).
- Layout effects are isomorphic (`useEffect` on the server): React 18's legacy server
  renderer no longer prints a `useLayoutEffect does nothing on the server` warning per
  carousel.

### Added

- README: a Server-side rendering section — what ships in the server markup, the zero-CLS
  mechanics, the `"use client"` leaf-wrapper pattern for App Router pages, and the
  `breakpoints`-on-SSR caveat (server HTML always uses base geometry).
- SSR regression tests: a node-environment `renderToString` smoke (content + critical CSS in
  the server HTML, loop pre-positioning) and a `hydrateRoot` test asserting the server markup
  is adopted without mismatches or recoverable errors.

### Changed

- Base-entry size budget raised 5.5 → 5.75 kB (the critical CSS must live in the core render
  path — it cannot ship as a tree-shakeable entry). Actual: 5.65 kB brotli, 5.95 kB min+gzip;
  README/playground marketing numbers updated to match (~5.7 kB core, 5.9 kB in the
  comparison table).

## [0.15.0] — 2026-07-17

### Added

- `lazyMount` prop — lazy slide mounting: `lazyMount` / `lazyMount={{margin}}` renders slides
  outside the visible window (± `margin` slides, default 1) as empty shells. The consumer's
  slide element keeps its size, class, style, and ARIA, so geometry, snapping, and loop
  clones are unaffected and mounting can't shift layout; only the slide's children (heavy
  React subtrees) wait for the window to approach. Loop clones mount exactly when their
  original does; the window wraps across the loop seam; the flush-clamped last position with
  a fractional `slidesPerView` keeps its half-visible slide mounted. Ignored while `flow`
  runs (continuous motion has no resting window). New exported type: `LazyMountConfig`.
- Playground: `#lazy-mount` demo with a per-subtree mount visualisation, margin control, and
  on/off toggle; e2e spec covering the window, navigation, margin, and shell geometry.

### Fixed

- Playground: the analytics console has a fixed height instead of growing with its first
  events — auto-firing demos above no longer shift the page under a reader further down
  (guarded by a smoke e2e).

### Changed

- Base-entry size budget raised 5.4 → 5.5 kB (the feature costs ~200 B in the core render
  path — it cannot ship as a tree-shakeable entry). Actual: 5.45 kB brotli, 5.7 kB min+gzip;
  README/playground marketing numbers updated to match.

## [0.14.2] — 2026-07-17

### Added

- Thumbnails / synced carousels recipe (docs + demo, no new package code): a README section
  under External control showing two instances wired through one piece of state, a live
  playground demo (`#thumbnails`), and e2e coverage of the sync in both directions.
- Playground: a fixed scrollspy side rail (wide viewports) listing every demo by phase —
  click to jump to a section, with the active one tracked while scrolling.
- README now links the live demo (lightslide.vercel.app) from the header; `homepage` in
  package.json points there too, so npm surfaces it.

## [0.14.1] — 2026-07-17

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

[0.11.0]: https://github.com/DmitriyBol/lightslide/releases/tag/0.11.0
[0.6.1]: https://github.com/DmitriyBol/lightslide/releases/tag/0.6.1
[0.5.9]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.9
[0.5.6]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.6
[0.5.1]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.1
[0.5.0]: https://github.com/DmitriyBol/lightslide/releases/tag/0.5.0

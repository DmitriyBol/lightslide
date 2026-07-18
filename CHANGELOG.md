# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org) (pre-1.0: minor releases may include breaking changes).

## [0.18.0] — 2026-07-18

RTL release (LIG-22): first-class right-to-left support behind one prop. In the coordinate
model the direction is a sign, not a mirror — the browser mirrors the flex layout under
`dir="rtl"`, all 1-D math stays direction-agnostic, and the sign is applied exactly twice:
once to incoming pointer/wheel deltas, once in the track transform.

### Added

- **`dir` prop** (`'ltr' | 'rtl'`, default `'ltr'`). `dir="rtl"` sets the `dir` attribute on
  the container (the browser mirrors the flex layout) and mirrors every behaviour: drag and
  flick, wheel/trackpad paging, loop wrap-around, center align, free momentum, `lazyMount`,
  and the SSR critical CSS (the resting transform flips sign; the centred non-loop clamp
  becomes `max(0px, …)`), so the zero-CLS first paint survives in RTL. Auto-detecting an
  inherited `dir` attribute was rejected deliberately — the server can't read computed
  styles, and the critical CSS must know the sign at render time.
- Navigation places its buttons through logical `inset-inline-start/end` (prev/next swap
  sides under RTL) and mirrors the built-in `‹ ›` glyphs via `[dir='rtl']`; custom
  render-prop buttons keep their logical `direction` hint.
- The a11y `Keyboard` plugin follows the visual direction under RTL (ArrowLeft steps
  forward, per the APG carousel pattern).
- Analytics `direction` stays the visual truth — forward motion reports `'left'` under RTL —
  and the loop-wrap detection resolves the contradiction through the reading direction.
- Playground: RTL demo section (#rtl, dir/free toggles); e2e: `rtl.spec.ts` (mirrored
  arrows, mirrored drag, both wrap directions, free coast + wrap in an rtl loop).

### Changed

- All six track-transform writes route through one `trackTransform(offset, dirSign)` helper
  (its own shared chunk — the flow entry doesn't carry the offset math); pointer deltas and
  velocities are normalised to logical space once, at the `usePointerGesture` boundary.
- Sizes: core 4.87 → 4.98 kB (budget 5 kB), flow 1.71 → 1.74 kB, a11y 1.03 → 1.05 kB,
  navigation +~0.05 kB (now 1.13); README size mentions swept (~5 kB core, 5.2 kB min+gzip
  in the comparison).

## [0.17.1] — 2026-07-18

Security hardening pass (LIG-24). No changes to the published package — the audit found the
runtime surface clean (zero runtime deps; the SSR critical-CSS string is fully guarded).

### Security

- Dev-dependency chain: `npm audit fix` — `form-data` CRLF injection (high,
  GHSA-hmw2-7cc7-3qxx, via jsdom) and `js-yaml` quadratic-complexity DoS (moderate,
  GHSA-h67p-54hq-rp68, via the istanbul chain). Lockfile-only, zero vulnerabilities left.
- CI: the workflow `GITHUB_TOKEN` is now read-only (`permissions: contents: read`).
- Added `SECURITY.md` — private vulnerability reporting via GitHub security advisories,
  supported-versions and scope notes.

## [0.17.0] — 2026-07-18

Slim-core release (LIG-21): the features not every carousel needs moved out of the base
entry into tree-shakeable modules. The core drops **5.80 → 4.87 kB** brotli (budget
5.85 → 5 kB) while every feature survives as a first-party entry — "pay only for what you
use" now covers analytics, autoplay, and breakpoints too.

### Changed (breaking — pre-1.0 minor)

- **Analytics is the `lightslide/analytics` entry** (~1.73 kB). The `analytics` prop is now
  a plugin slot: `analytics={{onEvent, viewedTimeout}}` →
  `analytics={<Analytics onEvent={…} viewedTimeout={…} />}`. `AnalyticsConfig` is replaced
  by `AnalyticsProps` (`onEvent` is required there — a handler-less plugin is pointless);
  `AnalyticsEvent`, the six payload types, and `SlideData` now export from
  `lightslide/analytics`, not the root. The slide-data generic moved with them:
  `<LightSlide<Product>>` → `<Analytics<Product>>` (the container is no longer generic;
  `<Slide<T>>` is unchanged). Internally the core reports every committed navigation
  through one optional `store.emitNav(from, to, direction, source)` mailbox and builds no
  event objects itself.
- **Autoplay is the `lightslide/autoplay` entry** (~0.70 kB). The `autoScroll` config prop
  is now the `autoplay` slot: `autoScroll={{enabled, interval}}` →
  `autoplay={<Autoplay interval={…} />}` (presence-based — toggle by passing the node
  conditionally; `pauseOnHover`/`pauseOnFocus` stay, `AutoScrollConfig` is gone). The ref
  handle's `pause()`/`resume()`, the flow precedence, and the a11y reduced-motion gate keep
  working unchanged through the core's store flags.
- **Breakpoints are the `lightslide/breakpoints` entry** (~0.39 kB). The `breakpoints` prop
  is now a hook composed above the carousel:
  `useBreakpoints(base, {'(min-width: …)': overrides})` returns the resolved object to
  spread as props. Because it runs in the consumer's render, the resolved values are in the
  first render (no flash — the blocker that kept a slot-based extraction off the table),
  and it is generic: any prop set can respond to media queries now, not just
  `slidesPerView`/`gap`. `BreakpointOverrides` is gone.
- `ClassValue` (the `cx` input type) narrowed to `string | undefined` — class name slots
  accept a class or nothing, not `false`/`null`/numbers/arrays; internal call sites use
  ternaries instead of `&&`.

### Changed

- Flow runs its own hover/focus pause listeners (the core no longer hosts them for it);
  flow entry 1.52 → 1.71 kB, budget 1.55 → 1.75 kB.
- `LightSlide.tsx` reorganised into labelled phases (identity → render state → geometry →
  store sync → motion & control → plugin seams → children & critical CSS → contexts &
  markup) over three new helper hooks (`useDisplayChildren`, `useGestureHandlers`,
  `useSeamValues`) — ~490 → ~330 lines, no behaviour change.
- The SSR critical-CSS builder coerces its numeric inputs (`slidesPerView`/`gap`/start
  index) to finite numbers, so a malformed value from an untyped JS consumer can never
  reach the inlined `<style>` text.

### Added

- New entries wired end-to-end: `exports`/`typesVersions` subpaths, size-limit budgets
  (autoplay 1 kB, analytics 1.85 kB, breakpoints 0.6 kB), playground aliases + migrated
  examples, and plugin tests (seam registration, fails-loudly-outside-slot, wrap/terminal
  event building).

### Internal

- Source layout: every helper and util now lives in its own folder next to its test
  (`helpers/useTrackSnap/useTrackSnap.ts` + `.test.tsx`); only the imperative core stays
  flat in `helpers/` (`store.ts`, `constants.ts`, `navigation.ts`). All seam contexts moved
  from the `src/` root into `src/seams/` (including `lightSlideContext.ts` — NavContext is
  the seam the navigation/pagination entries bind to). Import-path-only change, nothing
  public moved.

## [0.16.0] — 2026-07-17

### Added

- `align?: 'start' | 'center'` (LIG-12): `'center'` rests the active slide in the middle of
  the viewport with its neighbours peeking symmetrically — the hero / stories pattern, meant
  for fractional `slidesPerView` (a no-op at exactly `1`). The centring inset is measured
  with the slide width and folded into the whole geometry: snapping, dragging, free-mode
  coasting and free-snap projection, the loop clone count (center adds the clones its left
  peek and wrap-dance need), `lazyMount`'s window (extended left over the exposed peek), the
  a11y focus guard's visible range, and the server-rendered critical CSS (the first paint is
  already centred; the non-loop edge clamp ships as CSS `min()`). Without `isLoop` the track
  never scrolls past its edges — first/last positions rest flush (Embla's `containScroll`
  behaviour); with `isLoop` every position is centred. Ignored while `flow` runs.
- Playground: an interactive Center align demo (`#align`) with a start/center switch and a
  loop toggle; e2e specs assert the centred and flush-clamped positions against the live
  layout.

### Fixed

- Loop backward wrap with a fractional `slidesPerView` animated one stride short of the last
  slide's pre-wrap twin (hardcoded visual 0), producing a visible jump when the silent
  re-snap landed. The wrap now targets `maxIndex + loopOffset − slideCount`.

### Changed

- Base-entry size budget 5.75 → 5.85 kB (center align lives in the core geometry path — it
  cannot ship as a tree-shakeable entry). Actual: 5.80 kB brotli, 6.1 kB min+gzip; README /
  playground marketing numbers updated to match. The planned slim-core extraction (LIG-21)
  is expected to pull the budget back down.
- Seam-context misuse errors (`useFlowSeam` outside its slot, etc.) now carry their full
  message only outside production builds — consumer bundlers drop the long literals from
  production bundles.

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

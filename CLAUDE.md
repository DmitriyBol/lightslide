# LightSlide — Development Guide

This file is a living instruction set for Claude and everyone committing to this repository.
Rules are mandatory. If a rule gets in the way — update it, don't work around it.

---

## Types vs Interfaces

- **Always use `type`, never `interface`.**
- This applies to: component props, analytics payloads, hook return shapes, and any other data structure.
- Enforced by ESLint (`@typescript-eslint/consistent-type-definitions: ["error", "type"]`) — the linter will reject any `interface`.

```ts
// ✗ Forbidden
interface SlideData { index: number; }

// ✓ Correct
type SlideData = { index: number; };
```

---

## Tests

- **Test files live next to the files they test**, in the same feature folder.
- Naming: `fileName.test.ts(x)`. Example: `analytics.ts` → `analytics.test.ts`.
- **Every new unit of logic requires at least one test case.**
- **After writing or changing any test, run the full suite: `npm test`.**
- Tests are written at the same time as the implementation — never deferred.

Each component is a **feature folder** holding its component, test, styles, and
component-specific types together:

```
src/
├── LightSlide/
│   ├── LightSlide.tsx              ← orchestrator: refs, navigateToIndex, wiring
│   ├── LightSlide.test.tsx
│   ├── LightSlide.module.scss
│   └── helpers/                    ← LightSlide-internal helpers & hooks
│       ├── constants.ts            ·  tuning constants
│       ├── navigation.ts           ·  NavigateSource / NavigateFn types
│       ├── slideData.ts (+test)    ·  collectSlideData (pure)
│       ├── loopClones.ts (+test)   ·  buildLoopChildren (pure)
│       ├── useSlideMetrics.ts      ·  container measure + per-slide px width
│       ├── useTrackSnap.ts         ·  transform/translateX snap
│       ├── useAutoScroll.ts (+test)·  interval cycling (step)
│       ├── useDragGesture.ts (+test)· pointer handlers + drag refs
│       ├── useFlow.ts (+test)    ·  continuous ticker scroll (rAF)
│       └── useViewportEngagement.ts·  IntersectionObserver + terminal events
├── Slide/
│   ├── Slide.tsx
│   └── Slide.module.scss
├── Navigation/
│   ├── Navigation.tsx
│   ├── Navigation.test.tsx
│   ├── Navigation.types.ts        ← NavigationConfig, NavButtonRenderProps
│   └── Navigation.module.scss
├── Pagination/
│   ├── Pagination.tsx
│   ├── Pagination.test.tsx
│   ├── Pagination.types.ts        ← PaginationConfig
│   └── Pagination.module.scss
├── analytics/
│   ├── analytics.ts
│   └── analytics.test.ts          ← co-located, not in __tests__/
├── hooks/
│   ├── useViewedSlides.ts
│   └── useViewedSlides.test.ts
├── utils/
│   ├── swipe.ts
│   └── swipe.test.ts
├── lightSlideContext.ts               ← shared context
├── types.ts                       ← shared/public types + re-exports
├── styles.d.ts                    ← ambient *.module.scss declaration
└── index.ts                       ← the only index.ts (public API barrel)
```

---

## File and Folder Naming

- **One `index.ts` in the entire project** — that is `src/index.ts` (the public API barrel).
- **Each component is its own feature folder** named after the component (`Navigation/`, `Pagination/`, `Slide/`, `LightSlide/`). The folder holds everything that belongs to that feature: component, test, styles, and types.
- Files inside a feature folder are named after the folder plus a role suffix:
  - `Navigation/Navigation.tsx` — the component
  - `Navigation/Navigation.test.tsx` — its test
  - `Navigation/Navigation.types.ts` — component-specific types (e.g. `NavigationConfig`)
  - `Navigation/Navigation.module.scss` — its scoped styles
- Non-component modules are named after their folder or function:
  - `analytics/analytics.ts` — primary logic for the `analytics` folder
  - `utils/swipe.ts` — utility named by what it does
  - `lightSlideContext.ts` — shared React context (lives at `src/` root — cross-cutting)
  - `types.ts` — shared/public types (analytics payloads, `SlideData`, `LightSlideProps`); re-exports the per-feature config types so `index.ts` has one place to pull from
- No `index.ts` files inside sub-folders.
- **A component folder may have a `helpers/` sub-folder** for component-internal pure functions and hooks (see `LightSlide/helpers/`). Keep the component file an orchestrator; push self-contained concerns (gesture, metrics, auto-scroll, viewport observer, clone/data builders) into `helpers/`. Hooks there are named `useThing.ts`; pure helpers are named by what they do.

---

## README Updates

- **Every PR that adds, removes, or changes behavior must include a README update.**
- Before merging, review `README.md` and ask: does it still accurately describe the API, props, events, and examples?
- If a prop is added → document it in the props table.
- If an analytics event changes → update the events section.
- If the installation or setup changes → update the Getting Started section.
- A PR that changes behavior without updating the README is not ready to merge.

---

## Formatting

- **Prettier handles all formatting.** Never adjust whitespace manually.
- Format: `npm run format`
- Check without writing: `npm run format:check`
- ESLint checks code quality (not formatting): `npm run lint`
- Before every commit: `npm run lint && npm test`

---

## Styling (SCSS modules)

- **Static, presentational styling lives in `*.module.scss`** next to the component (CSS Modules → scoped class names). The component imports `styles from "./X.module.scss"` and applies `styles.<class>`.
- **Dynamic values stay inline** as a `style={{…}}` object — anything computed at runtime cannot be a static class:
  - `Slide` width (`containerWidth / slidesPerView` px)
  - track `transform: translateX(…px)` and the snap `transition`
- **User overrides:** `className`/`*ClassName` props are appended after the module class; `style`/`*Style` props are inline and therefore always win. Never drop the user's override props.
- **Compose class names with `cx()` from `src/utils/cx.ts`** — never hand-roll `[a, b].filter(Boolean).join(" ")`. `cx` is a tiny zero-dependency clsx-style helper (no `classnames`/`clsx` npm package — that would break the "zero runtime dependencies" promise).
- The SCSS is compiled and **injected at runtime** by `rollup-plugin-postcss` (`inject: true`) — consumers do **not** import a separate CSS file. There are no runtime npm dependencies beyond React.
- Stylelint guards the SCSS: `npm run stylelint`. Lint is `rgba()` legacy notation with number alpha (see `.stylelintrc.json`).
- Jest maps `*.scss` to `identity-obj-proxy`, so `styles.foo === "foo"` in tests — query by role/label/text, not by class.

When adding styles: put the static look in the feature's `.module.scss`, keep computed values inline, and run `npm run stylelint`.

---

## Analytics Events

**Events are completely silent by default.** There are zero `console.log` / `console.warn` / `console.error` calls in the library. Unhandled events invoke a no-op — no output, no side effects. A handler must be explicitly provided via the `analytics` prop to observe any event.

When adding a new event:

1. Add a payload `type` to `src/types.ts`.
2. Add a `build*Payload` function to `src/analytics/analytics.ts`.
3. Add a no-op fallback to `mergeHandlers` — events are silent when no handler is provided.
4. Write a test in `src/analytics/analytics.test.ts`.
5. Run `npm test`.
6. Update `README.md` — analytics events section.

---

## Import Order

Order enforced by ESLint + `simple-import-sort`:

1. `react`, `react-dom` — always first
2. External packages
3. Relative imports (`./`, `../`)

```ts
// ✓ Correct order
import React, { useCallback } from "react";

import { act } from "@testing-library/react";

import { analytics } from "./analytics/analytics";
```

---

## Re-render Architecture

- Do not add frequently-changing values (like analytics handlers) to `useCallback`/`useEffect` dependency arrays.
- Use the **"latest ref" pattern** for values needed inside callbacks that should not cause re-creation:

```ts
const fooRef = useRef(foo);
fooRef.current = foo; // write during render, read inside callback
```

- `Slide` is wrapped in `React.memo` — do not pass frequently-changing values as its props unless necessary.
- All drag state lives in refs (`dragStartX`, `isDraggingRef`, `dragVelocityX`, etc.) — the DOM is updated directly during gesture to avoid React re-renders on every `pointermove`.

---

## Key Architecture Decisions

These explain *why* the code is written the way it is. Read before refactoring.

### Latest-ref pattern for analytics handlers

`handlersRef.current = mergeHandlers(analytics)` is written on every render.
Callbacks (`fireTerminalIfNeeded`, `commitDrag`, etc.) read from `handlersRef.current` at call time — never capture `handlers` directly. This means:

- No stale closures — handlers are always current
- No re-creation of callbacks when the `analytics` prop changes
- No need to add `analytics` to any dependency array

Same pattern applies to `slidesPerViewRef`, `viewedTimeoutRef`, `maxIndexRef`, `slideCountRef`.

### Transform-based drag, not scrollTo

`scrollTo({ behavior: "smooth" })` only moves after the gesture ends — no live feedback.
The carousel now uses `transform: translateX(…px)` updated directly on the DOM element inside `onPointerMove`. This gives finger-follows-content behavior.

- CSS `transition` is added **only during the snap animation** and removed via `transitionend` — not during live drag
- CSS `scroll-snap-type` is gone entirely
- `touch-action: pan-y` on the track lets the browser handle vertical page scroll while we capture horizontal drag

### Snap thresholds

Two conditions trigger a snap to the next/prev slide (either is sufficient):

1. `|dragDeltaX| > slideWidth × 0.5` — dragged past half the slide width
2. `|velocityX| > 0.3 px/ms` — fast flick, even with short distance

Both constants live in `src/utils/swipe.ts` (`SNAP_THRESHOLD_RATIO`, `VELOCITY_THRESHOLD`). Change them there — they are tested in `swipe.test.ts`.

### LightSlideContext + ResizeObserver for slide width

Each slide needs a concrete px width = `containerWidth / slidesPerView`.
Using `width: calc(100% / N)` with CSS fails because `100%` on a flex child refers to the flex container (track), whose width is determined by its content — a circular dependency.

Solution: `ResizeObserver` on the outer container measures `offsetWidth`, divides by `slidesPerView`, and stores the result as React state. `LightSlideContext` propagates it to every `Slide`. `useMemo` ensures the context value object is stable between renders when the width hasn't changed.

`LightSlideContext` also exposes `currentIndex`, `maxIndex`, and `goToIndex` so that `Navigation` and `Pagination` can read reactive state and trigger navigation without prop drilling.

### Dual currentIndex: ref + state

`currentIndexRef` is the source of truth during drag math (read in pointer event handlers without causing re-renders).
`currentIndex` state is updated after every committed navigation so that `Navigation` (button disabled state) and `Pagination` (active dot) re-render reactively.

Rule: always update **both** in `navigateToIndex`:
```ts
currentIndexRef.current = next;
setCurrentIndex(next);
```

### navigateToIndex — single navigation function

All navigation types (drag, button, pagination, auto-scroll) call `navigateToIndex(index, source)`.
The `source` parameter determines which additional analytics events to fire:

- `"drag"` → only `onSlide`; also triggers snap-back if index unchanged
- `"button"` → `onSlide` + `onNavButtonClick`
- `"pagination"` → `onSlide` + `onPaginationClick`
- `"auto"` → `onSlide` only; does NOT fire `onReachedEnd` on loop wrap-around

### maxIndex = slideCount − slidesPerView

The user can scroll as far as index `maxIndex`, at which point the last `slidesPerView` slides are fully visible. Scrolling further would show empty space.

```
slideCount=6, slidesPerView=3 → maxIndex=3
index 0: shows slides 0 1 2
index 3: shows slides 3 4 5  ← last valid position
```

`onReachedEnd` fires when `currentIndex === maxIndex` (except during auto-scroll, which loops).

### Pointer capture

`e.currentTarget.setPointerCapture(e.pointerId)` in `onPointerDown` routes all subsequent pointer events to the track element — even when the pointer moves outside it. This prevents the drag from breaking when the user moves quickly to the edge.

Direction lock: on the first 4px of movement, if `|deltaY| > |deltaX|` → vertical intent → drag is cancelled, page scroll proceeds normally.

### Pixel-aligned track: floor everywhere

`measureSlideWidth` and `getComputedSlideWidth` both `Math.floor(offsetWidth / slidesPerView)`, and `Slide` renders at that same floored px width. If the transform used the unfloored width while slides used the floored width, the track would drift by up to ~1px × index. **Keep both width sources floored and identical.**

### Custom navigation buttons: render-prop

`NavigationConfig` accepts `renderPrev` / `renderNext` `(props: NavButtonRenderProps) => ReactNode`. When provided, the default `<button>` is replaced entirely by the returned JSX. The render fn receives `{ direction, onClick, disabled }`:

- `onClick` is the **same handler** the default button uses → it calls `goToIndex(…, "button")`, so `onSlide` + `onNavButtonClick` fire identically. The consumer just attaches it.
- `disabled` reflects boundary state (always `false` under `isLoop`).
- The library does not wrap the returned node — the consumer owns markup, styling, and which props they attach.

### Flow: continuous rAF scroll, not step navigation

`flow` (`useFlow`) is a **continuous** ticker — distinct from `autoScroll`'s discrete stepping. Key decisions:

- **rAF drives the transform directly, with no CSS transition.** Per-frame `translateX` updates *are* the animation → smooth at frame rate. A CSS transition would fight the per-frame writes and cause lag/jank. (Same "transform, not scrollTo" philosophy as drag.)
- **It forces the loop-clone structure** (`effectiveFlow` ⊂ `effectiveLoop`) so the wrap is seamless: the offset is taken `% (slideCount × slideWidth)`, which lands on a clone that is pixel-identical to the start — no jump.
- **Supersedes `autoScroll`** when both are set (`useAutoScroll(effectiveFlow ? undefined : autoScroll, …)`). They are both "auto motion".
- **In flow mode the flow owns the track and the pointer handlers** (`pointerHandlers = effectiveFlow ? flowHandlers : dragHandlers`). The discrete drag-gesture is not attached; the reflow effect skips `snapTrack` (guarded by `effectiveFlowRef`) so nothing fights the rAF.
- **No-jank invariants:** start at the home offset via a `useLayoutEffect` (before paint, no clone flash); interaction pauses by gating `advance` on `interactingRef` while the rAF keeps `lastTs` fresh (no dt spike on resume); a drag drifts from the *current* offset (continuous, no grab-jump); resume continues from the stopped offset after `resumeDelay`. `currentIndex` is intentionally **not** updated during a flow (continuous motion has no discrete index), so pagination's active dot is not synced then.

---

## Playground

The `playground/` directory is **intentionally excluded from version control** (`.gitignore`). It is a local dev tool — not part of the published package.

- Start it with `npm run playground` (Vite dev server at `localhost:5173`)
- It imports directly from `../src` — no build step needed
- When updating the playground, run it locally to verify your changes
- **All analytics handlers must be wired to visible event logs** — every event type must be observable in the UI without opening DevTools. Do not use `console.log` in playground examples

---

## Forbidden

- `interface` — use `type` instead
- `__tests__/` folders — tests live next to source files
- `index.ts` inside sub-folders — use the folder name or function name
- `scrollTo()` for carousel navigation — use `transform: translateX` + `snapTrack()`
- CSS `scroll-snap-type` on the track — navigation is fully JS-controlled now
- Comments like `// added for X feature` — that belongs in the PR description
- `eslint-disable` without an explanation on the same line

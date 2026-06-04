# OptiSwiper — Development Guide

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

- **Test files live next to the files they test**, in the same directory.
- Naming: `fileName.test.ts(x)`. Example: `analytics.ts` → `analytics.test.ts`.
- **Every new unit of logic requires at least one test case.**
- **After writing or changing any test, run the full suite: `npm test`.**
- Tests are written at the same time as the implementation — never deferred.

```
src/
├── analytics/
│   ├── analytics.ts
│   └── analytics.test.ts    ← co-located, not in __tests__/
├── hooks/
│   ├── useViewedSlides.ts
│   └── useViewedSlides.test.ts
├── utils/
│   ├── swipe.ts
│   └── swipe.test.ts
├── Navigation.tsx
├── Navigation.test.tsx
├── Pagination.tsx
└── Pagination.test.tsx
```

---

## File and Folder Naming

- **One `index.ts` in the entire project** — that is `src/index.ts` (the public API barrel).
- All other files are named after their folder or their function:
  - `analytics/analytics.ts` — primary logic for the `analytics` folder
  - `utils/swipe.ts` — utility named by what it does
  - `swiperContext.ts` — shared React context, named by its purpose
  - `Navigation.tsx` — navigation buttons component
  - `Pagination.tsx` — pagination dots component
- No `index.ts` files inside sub-folders.

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

## Analytics Events

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

- `OptiSlide` is wrapped in `React.memo` — do not pass frequently-changing values as its props unless necessary.
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

### SwiperContext + ResizeObserver for slide width

Each slide needs a concrete px width = `containerWidth / slidesPerView`.
Using `width: calc(100% / N)` with CSS fails because `100%` on a flex child refers to the flex container (track), whose width is determined by its content — a circular dependency.

Solution: `ResizeObserver` on the outer container measures `offsetWidth`, divides by `slidesPerView`, and stores the result as React state. `SwiperContext` propagates it to every `OptiSlide`. `useMemo` ensures the context value object is stable between renders when the width hasn't changed.

`SwiperContext` also exposes `currentIndex`, `maxIndex`, and `goToIndex` so that `Navigation` and `Pagination` can read reactive state and trigger navigation without prop drilling.

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

---

## Forbidden

- `interface` — use `type` instead
- `__tests__/` folders — tests live next to source files
- `index.ts` inside sub-folders — use the folder name or function name
- `scrollTo()` for carousel navigation — use `transform: translateX` + `snapTrack()`
- CSS `scroll-snap-type` on the track — navigation is fully JS-controlled now
- Comments like `// added for X feature` — that belongs in the PR description
- `eslint-disable` without an explanation on the same line

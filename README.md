# LightSlide

> The project is currently in testing and may contain bugs. The goal is to find and fix as
> many issues as possible before 1.0.0. Thank you.

A lightweight, fully-typed React carousel/slider with built-in analytics, infinite loop, and a
continuous flow (ticker) mode. Zero runtime dependencies beyond React.

## What it can do

- **Swipe & drag** — real-time finger tracking via Pointer Events; the track follows the
  pointer and snaps on release. A multi-slide drag lands on the slide you actually dragged to.
- **Interactive content friendly** — links/buttons inside slides stay clickable; a tap passes
  through, a drag never triggers them, native image/anchor drag can't hijack the gesture, and a
  drag that leaves the carousel mid-gesture never gets stuck.
- **slidesPerView** — show N slides at once (floats allowed, e.g. `1.5` for a peek).
- **isLoop** — seamless infinite loop via cloned edge slides (no first-paint flash).
- **Navigation buttons** — optional prev/next, fully styleable, or bring your own element via
  `renderPrev`/`renderNext`. Auto-centered on the track, never clipped, dim at the edges.
- **Pagination dots** — optional dot indicators with active-state styling.
- **Auto-scroll** — optional step cycling at a configurable interval; pauses during drag.
- **Flow** — optional continuous ticker scroll at a configurable speed; seamless with looping;
  pauses on interaction and resumes after a delay.
- **Loading fallback** — render your own placeholder node while data is fetched.
- **Analytics** — six opt-in events (viewport, slide, navigation, pagination, engagement).
- **Fully typed** — generic over your slide `data` shape; no unnecessary re-renders (core data
  lives in one imperative store, context is split so navigating doesn't re-render the slides).

## Installation

```bash
npm install lightslide
# peer deps:
npm install react react-dom
```

Requires React ≥ 17.

## Quick start

```tsx
import { LightSlide, Slide } from "lightslide";

function ProductCarousel() {
  return (
    <LightSlide slidesPerView={2} navigation={{}} pagination={{}}>
      <Slide data={{ id: 1 }}><ProductCard id={1} /></Slide>
      <Slide data={{ id: 2 }}><ProductCard id={2} /></Slide>
      <Slide data={{ id: 3 }}><ProductCard id={3} /></Slide>
      <Slide data={{ id: 4 }}><ProductCard id={4} /></Slide>
    </LightSlide>
  );
}
```

## Components & props

### `<LightSlide<T>>`

The container — handles layout, all navigation, and analytics. Generic over the slide `data`
shape `T` (defaults to `unknown`); pass it as `<LightSlide<Product> …>` to type the analytics
payloads.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | One or more `<Slide>` elements |
| `style` | `CSSProperties` | — | Styles for the outer wrapper |
| `className` | `string` | — | Class for the outer wrapper |
| `trackStyle` | `CSSProperties` | — | Styles for the inner track |
| `trackClassName` | `string` | — | Class for the inner track |
| `analytics` | `AnalyticsHandlers<T>` | — | Event handlers + `viewedTimeout` (see [Analytics](#analytics)) |
| `slidesPerView` | `number` | `1` | How many slides are visible at once (floats allowed) |
| `autoScroll` | `AutoScrollConfig` | — | Automatic slide cycling |
| `flow` | `FlowConfig` | — | Continuous ticker scroll (supersedes `autoScroll`) |
| `navigation` | `NavigationConfig` | — | Prev/next buttons. Pass `{}` for defaults |
| `pagination` | `PaginationConfig` | — | Pagination dots. Pass `{}` for defaults |
| `isLoop` | `boolean` | `false` | Seamless infinite loop |
| `loading` | `boolean` | `false` | Render `fallback` instead of the slides |
| `fallback` | `ReactNode` | — | Placeholder shown while `loading` (omit → renders nothing) |

### `<Slide<T>>`

A single slide. Width is computed as `containerWidth / slidesPerView`. Generic over `data`, so
`<Slide<Product> data={…} />` is fully typed.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Slide content (element, text, fragment, or array) |
| `style` | `CSSProperties` | — | Additional styles for the slide |
| `className` | `string` | — | Class for the slide |
| `data` | `T` | — | Arbitrary data attached to this slide — surfaced in analytics payloads |

```tsx
type Product = { id: number; name: string };

<LightSlide<Product>
  analytics={{ onReachedEnd: (p) => p.slides.forEach((s) => s.data?.name) }}
>
  <Slide<Product> data={{ id: 1, name: "Widget" }}><Card /></Slide>
</LightSlide>
```

### Navigation

```tsx
<LightSlide navigation={{}} />                       {/* default ‹ › arrows */}
<LightSlide navigation={{ prevStyle: { left: 16 } }} />
```

Buttons are absolutely positioned over the **track** (centered, prev-left / next-right) — the
pagination row below never offsets them. They dim to 50% opacity and disable at the first/last
slide unless `isLoop` is active, and are held invisible until the carousel has measured on the
client (no SSR/pre-layout flash). For a custom label or element, use `renderPrev`/`renderNext`.

**`NavigationConfig`**

| Key | Type | Description |
|---|---|---|
| `style` / `className` | `CSSProperties` / `string` | Applied to both buttons |
| `prevStyle` / `nextStyle` | `CSSProperties` | Per-button style overrides |
| `prevClassName` / `nextClassName` | `string` | Per-button extra class |
| `renderPrev` / `renderNext` | `(props: NavButtonRenderProps) => ReactNode` | Render your own element (replaces the default button) |

`renderPrev`/`renderNext` fully replace the `<button>` — attach the passed `onClick` (same
handler the built-in button uses, so the `onSlide` + `onNavButtonClick` events fire identically)
and `disabled`. Your element is wrapped in a minimal positioning slot, so it lands centered and
un-clipped, and the slot dims to 50% at the boundary by default.

**`NavButtonRenderProps`**

| Key | Type | Description |
|---|---|---|
| `onClick` | `() => void` | Triggers navigation (+ `onSlide` / `onNavButtonClick`) |
| `disabled` | `boolean` | Boundary state. Always `false` when `isLoop` is active |
| `direction` | `"left" \| "right"` | Which button this is |

### Pagination

```tsx
<LightSlide pagination={{ activeDotStyle: { background: "#4f46e5" } }} />
```

Dot count = `maxIndex + 1` (number of scroll positions). The active dot updates on every
navigation type. Not tracked during a flow (continuous motion has no discrete index).

**`PaginationConfig`**: `style`, `className`, `dotStyle`, `dotClassName`, `activeDotStyle`,
`activeDotClassName`.

### Auto-scroll

```tsx
<LightSlide autoScroll={{ enabled: true, interval: 3000 }} />
```

Loops back to 0 after the last slide; pauses during drag; does **not** fire `onReachedEnd`.

**`AutoScrollConfig`**: `enabled: boolean`, `interval: number` (ms).

### Flow (continuous ticker)

```tsx
<LightSlide flow={{ enabled: true, speed: 80, resumeDelay: 3000 }} />
```

Scrolls the track continuously at `speed` px/s (driven by `requestAnimationFrame`, no CSS
transition). Loops seamlessly (clones added automatically), pauses on interaction, and resumes
from where it stopped after `resumeDelay`. Supersedes `autoScroll` when both are set.

**`FlowConfig`**: `enabled: boolean`, `speed?: number` (default 40), `resumeDelay?: number`
(default 2000 ms).

## isLoop

```tsx
<LightSlide isLoop>…</LightSlide>
```

`Math.ceil(slidesPerView)` slides are cloned at each end; when a snap lands on a clone, the track
silently repositions to the matching real slide before the next interaction. Prev/next buttons
are never disabled while looping, and `onReachedEnd` is never fired. No-op when `maxIndex === 0`.

## Loading fallback

```tsx
<LightSlide loading={isFetching} fallback={<MySkeletonRow />}>
  {products.map((p) => (
    <Slide key={p.id} data={p}><ProductCard product={p} /></Slide>
  ))}
</LightSlide>
```

While `loading` is true the carousel renders `fallback` instead of the track, and
navigation/pagination are hidden. The library ships **no** built-in skeleton — you supply and
style the placeholder. With no `fallback`, the area renders empty.

## slidesPerView

Accepts any positive number, including floats — `1.5` shows one full slide plus a peek of the
next. Each slide fills `containerWidth / slidesPerView` px;
`maxIndex = ⌊slideCount − slidesPerView⌋`.

## Analytics

Events are **silent by default** — they run only when you provide a handler. Payloads carry only
their own fields (no timestamp — add your own in the handler if needed).

| Event | Handler | When it fires | Payload |
|---|---|---|---|
| `carousel_in_viewport` | `onInViewport` | First time ≥50% visible (once) | `{ event }` |
| `carousel_slide` | `onSlide` | Every navigation (drag/button/pagination/auto) | `{ event, direction, fromIndex, toIndex }` |
| `carousel_reached_end` | `onReachedEnd` | User reaches the last position (once) | `{ event, slides }` — **all** slides |
| `carousel_viewed_slides` | `onViewedSlides` | After `viewedTimeout` s of visibility (once, opt-in) | `{ event, slides, viewedSeconds }` — **viewed** slides |
| `carousel_nav_button` | `onNavButtonClick` | Prev/next clicked (with `onSlide`) | `{ event, direction, fromIndex, toIndex }` |
| `carousel_pagination_click` | `onPaginationClick` | Dot clicked (with `onSlide`) | `{ event, fromIndex, toIndex }` |

Notes:

- `onReachedEnd` and `onViewedSlides` are **mutually exclusive** — whichever fires first
  suppresses the other for the session. Together they form the engagement signal: "the user
  reached the end, or watched long enough."
- The viewed-slides timer is **opt-in**: it starts only when `onViewedSlides` is provided, and
  its duration knob `viewedTimeout` (seconds, default 30) lives on the `analytics` object.
- `fromIndex`/`toIndex` on `carousel_slide` may differ by more than one (a drag can cross
  several slides); `toIndex` is the slide actually landed on.

```tsx
analytics={{
  onViewedSlides: (p) => track("engagement", p), // p.slides = slides actually seen
  onReachedEnd: (p) => track("complete", p),      // p.slides = every slide
  viewedTimeout: 20,
}}
```

`SlideData<T>` is `{ index: number; data?: T }`. With `<LightSlide<T>>` the `slides` arrays are
typed `SlideData<T>[]`.

## Styling

The base look ships as scoped CSS-module (SCSS) classes injected on import — no separate CSS file,
no runtime dependency beyond React. Override via `className`/`*ClassName` (appended after the
built-in class) or `style`/`*Style` (inline, always wins). Dynamic geometry (slide width, track
transform) is always applied inline. The outer container is `overflow: visible` so controls
aren't clipped; an inner viewport clips the track. Use `padding` on `<Slide>` for gutters.

## Exported types

```ts
import type {
  AnalyticsHandlers, AutoScrollConfig, FlowConfig,
  InViewportPayload, SlidePayload, ReachedEndPayload, ViewedSlidesPayload,
  NavigationButtonPayload, PaginationClickPayload,
  NavigationConfig, NavButtonRenderProps, PaginationConfig,
  LightSlideProps, SlideProps, SlideData,
} from "lightslide";
```

## Project structure

Each component is a self-contained feature folder (component + test + styles + types):

```
src/
├── LightSlide/
│   ├── LightSlide.tsx              # Main carousel (orchestrator), generic over slide data
│   ├── LightSlide.test.tsx
│   ├── LightSlide.module.scss      # Container / stage / viewport / track styles
│   └── helpers/                    # Internal hooks & pure helpers
│       ├── constants.ts            #   tuning constants
│       ├── navigation.ts           #   navigation source/fn types
│       ├── store.ts                #   single core-data store (LightSlideStore<T>)
│       ├── slideData.ts            #   collectSlideData (+ test)
│       ├── loopClones.ts           #   buildLoopChildren (+ test)
│       ├── useSlideMetrics.ts      #   measure container → cached slide px width (+ test)
│       ├── useTrackSnap.ts         #   transform/translateX snapping
│       ├── useAutoScroll.ts        #   interval cycling (+ test)
│       ├── useDragGesture.ts       #   pointer/drag handlers (+ test)
│       ├── useFlow.ts              #   continuous ticker scroll (+ test)
│       └── useViewportEngagement.ts#   IntersectionObserver + terminal events
├── Slide/
│   ├── Slide.tsx                   # Slide (memo + forwardRef, generic over data)
│   └── Slide.module.scss
├── Navigation/
│   ├── Navigation.tsx              # Prev/next buttons
│   ├── Navigation.test.tsx
│   ├── Navigation.types.ts         # NavigationConfig, NavButtonRenderProps
│   └── Navigation.module.scss
├── Pagination/
│   ├── Pagination.tsx              # Pagination dots
│   ├── Pagination.test.tsx
│   ├── Pagination.types.ts         # PaginationConfig
│   └── Pagination.module.scss
├── analytics/
│   ├── analytics.ts                # Payload builders (pure)
│   └── analytics.test.ts
├── hooks/
│   ├── useViewedSlides.ts          # Tracks unique viewed slide indices
│   └── useViewedSlides.test.ts
├── utils/
│   ├── cx.ts                       # tiny className combiner (clsx-style)
│   ├── cx.test.ts
│   ├── swipe.ts                    # getSnapIndex — threshold + velocity + multi-slide
│   └── swipe.test.ts
├── lightSlideContext.ts            # Split contexts: SlideMetricsContext + NavContext
├── types.ts                        # Shared + public types
├── styles.d.ts                     # Ambient declaration for *.module.scss imports
└── index.ts                        # Public API barrel
```

## Development

```bash
npm install          # install dependencies
npm test             # 110 tests across 12 suites
npm run lint         # ESLint
npm run stylelint    # Stylelint
npm run format       # Prettier (tabs)
npm run build        # Rollup CJS + ESM + d.ts
npm run size         # bundle size check (after build)
npm run playground   # Vite dev server (playground/ is gitignored)
```

## License

MIT

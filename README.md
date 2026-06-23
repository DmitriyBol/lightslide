# LightSlide
Please note that the project is currently undergoing testing and may contain functional bugs. 
My goal is to identify and resolve as many issues as possible before reaching version 1.0.0. Thank you.

A lightweight, fully-typed React carousel with built-in analytics events. Zero runtime dependencies beyond React.

## Features

- **Swipe & drag** — real-time finger tracking via Pointer Events; slides follow the finger and snap on release
- **slidesPerView** — show 1, 2, or 3 slides at once; each slide fills `1/n` of the container proportionally
- **isLoop** — seamless infinite loop; edge slides are cloned so wrap-around looks continuous
- **Navigation buttons** — optional prev/next buttons with full style control, or bring your own JSX via `renderPrev`/`renderNext`
- **Pagination dots** — optional dot indicators with active-state styling
- **Scoped SCSS styling** — base look ships as CSS-module classes, auto-injected at import; override via `className`/`style` props
- **Auto-scroll** — optional automatic cycling with configurable interval; pauses during drag
- **Flow** — optional continuous ticker scroll at a configurable speed; seamless with looping; pauses on interaction and resumes after a delay
- **Responsive** — `ResizeObserver` keeps slide widths correct on any container resize
- **Analytics ready** — 6 events covering viewport, slide, navigation, pagination, and engagement
- **Mutually exclusive terminal events** — only one of `onReachedEnd` or `onViewedSlides` ever fires per session
- **No unnecessary re-renders** — all callbacks stable after mount via the "latest ref" pattern
- **TypeScript** — fully typed public API

---

## Installation

```bash
npm install lightslide
# or
yarn add lightslide
```

### Peer dependencies

```bash
npm install react react-dom
```

Requires React ≥ 17.

---

## Quick Start

```tsx
import { Slide, LightSlide } from "lightslide";

function ProductCarousel() {
  return (
    <LightSlide
      slidesPerView={2}
      navigation={{}}
      pagination={{}}
      style={{ borderRadius: 12 }}
    >
      <Slide data={{ id: 1, name: "Product A" }}>
        <ProductCard id={1} />
      </Slide>
      <Slide data={{ id: 2, name: "Product B" }}>
        <ProductCard id={2} />
      </Slide>
      <Slide data={{ id: 3, name: "Product C" }}>
        <ProductCard id={3} />
      </Slide>
      <Slide data={{ id: 4, name: "Product D" }}>
        <ProductCard id={4} />
      </Slide>
    </LightSlide>
  );
}
```

---

## Components

### `<LightSlide>`

The container component. Handles layout, all navigation types, and analytics.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | One or more `<Slide>` elements |
| `style` | `CSSProperties` | — | Styles for the outer wrapper div |
| `className` | `string` | — | Class name for the outer wrapper |
| `trackStyle` | `CSSProperties` | — | Styles for the inner draggable track div |
| `trackClassName` | `string` | — | Class name for the inner track |
| `analytics` | `AnalyticsHandlers` | — | Custom event handlers (see [Analytics](#analytics)) |
| `slidesPerView` | `number` | `1` | How many slides are visible at once |
| `viewedTimeout` | `number` | `30` | Seconds of ≥50% viewport visibility before `onViewedSlides` fires |
| `autoScroll` | `AutoScrollConfig` | — | Enable automatic slide cycling |
| `flow` | `FlowConfig` | — | Enable continuous ticker scrolling (supersedes `autoScroll`) |
| `navigation` | `NavigationConfig` | — | Show prev/next buttons. Pass `{}` for defaults |
| `pagination` | `PaginationConfig` | — | Show pagination dots. Pass `{}` for defaults |
| `isLoop` | `boolean` | `false` | Seamless infinite loop (see [Loop](#loop)) |

### `<Slide>`

A single slide. Width is automatically computed as `containerWidth / slidesPerView`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Slide content |
| `style` | `CSSProperties` | — | Additional styles for the slide div |
| `className` | `string` | — | Class name for the slide div |
| `data` | `unknown` | — | Arbitrary data attached to this slide — included in analytics payloads |

---

## Navigation

### Swipe / drag

Built-in and always active. Drag horizontally to navigate — the slide follows the finger in real time and snaps on release at 50% of slide width or on a fast flick.

### Navigation buttons

```tsx
<LightSlide navigation={{}}>  {/* default arrows ‹ › */}
  ...
</LightSlide>

<LightSlide navigation={{
  prevLabel: "←",
  nextLabel: "→",
  style: { background: "white", color: "black" },   // both buttons
  prevStyle: { left: 16 },                           // prev only
  nextStyle: { right: 16 },                          // next only
  prevClassName: "btn-prev",
  nextClassName: "btn-next",
}}>
```

Buttons are absolutely positioned inside the carousel, vertically centered. They disable and dim at the first/last slide unless `isLoop` is active.

**`NavigationConfig`** options:

| Key | Type | Description |
|---|---|---|
| `prevLabel` | `ReactNode` | Content for the prev button. Default: `‹` |
| `nextLabel` | `ReactNode` | Content for the next button. Default: `›` |
| `style` | `CSSProperties` | Base style applied to both buttons |
| `className` | `string` | Base class applied to both buttons |
| `prevStyle` | `CSSProperties` | Overrides for the prev button |
| `nextStyle` | `CSSProperties` | Overrides for the next button |
| `prevClassName` | `string` | Extra class for the prev button |
| `nextClassName` | `string` | Extra class for the next button |
| `renderPrev` | `(props: NavButtonRenderProps) => ReactNode` | Render your own prev element — replaces the default button |
| `renderNext` | `(props: NavButtonRenderProps) => ReactNode` | Render your own next element — replaces the default button |

### Custom button elements (render-prop)

Pass your own JSX for either button via `renderPrev` / `renderNext`. The library hands you the wiring; you own the markup.

```tsx
<LightSlide
  navigation={{
    renderPrev: ({ onClick, disabled }) => (
      <MyIconButton icon="chevron-left" onClick={onClick} disabled={disabled} />
    ),
    renderNext: ({ onClick, disabled }) => (
      <MyIconButton icon="chevron-right" onClick={onClick} disabled={disabled} />
    ),
  }}
>
  ...
</LightSlide>
```

When provided, your element **fully replaces** the default `<button>`. Attach the `onClick` you receive — it is the exact handler the built-in button uses, so navigation and the `onSlide` + `onNavButtonClick` analytics events fire identically.

**`NavButtonRenderProps`** (passed to your render function):

| Key | Type | Description |
|---|---|---|
| `onClick` | `() => void` | Triggers navigation (and `onSlide` + `onNavButtonClick`). Attach to your element |
| `disabled` | `boolean` | Boundary state. Always `false` when `isLoop` is active |
| `direction` | `"left" \| "right"` | Which button this is |

### Pagination dots

```tsx
<LightSlide pagination={{}}>  {/* default dots */}
  ...
</LightSlide>

<LightSlide pagination={{
  style: { padding: "12px 0" },
  dotStyle: { width: 10, height: 4, borderRadius: 2 },
  activeDotStyle: { width: 24, background: "#4f46e5" },
  dotClassName: "dot",
  activeDotClassName: "dot--active",
}}>
```

Dot count = `maxIndex + 1` (number of scrollable positions). Active dot updates reactively on every navigation type. The active state change is animated with a smooth `200ms ease` transition on both `transform` (scale) and `background` (color).

**`PaginationConfig`** options:

| Key | Type | Description |
|---|---|---|
| `style` | `CSSProperties` | Container (row of dots) styles |
| `className` | `string` | Container class |
| `dotStyle` | `CSSProperties` | Style applied to every dot |
| `dotClassName` | `string` | Class applied to every dot |
| `activeDotStyle` | `CSSProperties` | Additional style for the active dot |
| `activeDotClassName` | `string` | Additional class for the active dot |

### Auto-scroll

```tsx
<LightSlide autoScroll={{ enabled: true, interval: 3000 }}>
  ...
</LightSlide>
```

- Loops back to index 0 after the last slide
- Pauses automatically during pointer drag; resumes after release
- Does **not** fire `onReachedEnd` on loop wrap-around
- All navigation types (drag, buttons, pagination) work alongside auto-scroll

**`AutoScrollConfig`**:

| Key | Type | Description |
|---|---|---|
| `enabled` | `boolean` | Toggle auto-scroll on/off without removing the prop |
| `interval` | `number` | Milliseconds between slide changes |

### Flow (continuous ticker)

```tsx
<LightSlide flow={{ enabled: true }}>
  ...
</LightSlide>

<LightSlide flow={{ enabled: true, speed: 80, resumeDelay: 3000 }}>
  ...
</LightSlide>
```

Unlike auto-scroll (which steps slide-by-slide), the flow scrolls the track **continuously** at `speed` pixels per second — a smooth ticker. It:

- **Loops seamlessly** — clones are added automatically, so it wraps with no visible jump (works whether or not you also set `isLoop`).
- **Pauses on interaction** — tapping or dragging the carousel stops the motion. A drag follows your finger from the current position (no snapping). Motion resumes `resumeDelay` ms after you let go, continuing from exactly where it stopped — no jank.
- **Supersedes `autoScroll`** — if both are set, the flow wins.

> The flow drives the track directly via `requestAnimationFrame` (no CSS transition), so animation is smooth at frame rate. During a flow the active pagination dot is not tracked (continuous motion has no discrete index).

**`FlowConfig`**:

| Key | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | required | Toggle the flow on/off |
| `speed` | `number` | `40` | Scroll speed in **pixels per second** |
| `resumeDelay` | `number` | `2000` | Milliseconds to stay paused after an interaction before resuming |

---

## Loop

```tsx
<LightSlide isLoop>
  ...
</LightSlide>
```

When `isLoop` is true, the carousel wraps around seamlessly — dragging past the last slide flows directly into the first, and vice versa, without any visible jump.

**How it works:** `Math.ceil(slidesPerView)` slides are cloned from each end of the track. When the snap animation lands on a clone, the track silently repositions to the matching real slide before the next interaction. From the user's perspective the scroll is continuous.

**Effect on navigation buttons:** prev/next buttons are never disabled when `isLoop` is active — they remain enabled at all positions.

**Effect on analytics:** `onReachedEnd` is not fired on loop wrap-around (the carousel has no logical end). All other events — `onSlide`, `onNavButtonClick`, `onPaginationClick` — fire normally.

**No-op condition:** if `maxIndex === 0` (only one scroll position), `isLoop` has no effect.

---

## slidesPerView

`slidesPerView` accepts any positive number, including floats. A value like `1.5` shows one full slide plus a preview of the next — a "peek" effect that communicates scrollability.

```tsx
<LightSlide slidesPerView={1.5}>  {/* 1 full slide + peek of the next */}
<LightSlide slidesPerView={3}>    {/* 6 slides → scrolls to index 0–3 */}
```

Each slide fills `containerWidth / slidesPerView` px. `maxIndex = ⌊slideCount − slidesPerView⌋` — the last scroll position where the visible window does not exceed the track.

---

## Analytics

Events are **silent by default** — no console output, no errors, nothing. They only execute when you provide a handler. Pass only the events you care about via the `analytics` prop.

### Events

| Event | Handler | When it fires |
|---|---|---|
| `carousel_in_viewport` | `onInViewport` | First time carousel becomes ≥50% visible. Once. |
| `carousel_slide` | `onSlide` | On **every** navigation (drag, button, pagination, auto-scroll). |
| `carousel_reached_end` | `onReachedEnd` | User reaches maxIndex. Once. Not fired by auto-scroll or `isLoop` wrap-around. |
| `carousel_viewed_slides` | `onViewedSlides` | After `viewedTimeout` seconds of visibility. Once. |
| `carousel_nav_button` | `onNavButtonClick` | Prev/next button clicked. Fires in addition to `onSlide`. |
| `carousel_pagination_click` | `onPaginationClick` | Pagination dot clicked. Fires in addition to `onSlide`. |

> `onReachedEnd` and `onViewedSlides` are **mutually exclusive** — whichever fires first suppresses the other for the session lifetime.

### Custom handlers

Provide only the events you care about — unhandled events produce no output and have no side effects.

```tsx
import { Slide, LightSlide } from "lightslide";
import type { AnalyticsHandlers } from "lightslide";

const analytics: AnalyticsHandlers = {
  onInViewport(payload) {
    // { event: "carousel_in_viewport", timestamp }
    tracker.track("carousel_viewed", payload);
  },
  onSlide(payload) {
    // { event: "carousel_slide", direction, fromIndex, toIndex, timestamp }
    tracker.track("carousel_slide", payload);
  },
  onReachedEnd(payload) {
    // { event: "carousel_reached_end", slides: SlideData[], timestamp }
    tracker.track("carousel_complete", payload);
  },
  onViewedSlides(payload) {
    // { event: "carousel_viewed_slides", slides: SlideData[], viewedSeconds, timestamp }
    tracker.track("carousel_engagement", payload);
  },
  onNavButtonClick(payload) {
    // { event: "carousel_nav_button", direction, fromIndex, toIndex, timestamp }
    tracker.track("carousel_nav_click", payload);
  },
  onPaginationClick(payload) {
    // { event: "carousel_pagination_click", fromIndex, toIndex, timestamp }
    tracker.track("carousel_dot_click", payload);
  },
};
```

### Exported types

```ts
import type {
  AnalyticsHandlers,
  AutoScrollConfig,
  InViewportPayload,
  FlowConfig,
  NavButtonRenderProps,
  NavigationButtonPayload,
  NavigationConfig,
  PaginationClickPayload,
  PaginationConfig,
  SlideProps,
  LightSlideProps,
  ReachedEndPayload,
  SlideData,
  SlidePayload,
  ViewedSlidesPayload,
} from "lightslide";
```

---

## Styling

The base look ships as **scoped CSS-module (SCSS) classes** that are injected automatically when you import the component — there is no separate CSS file to import, and no runtime dependency beyond React.

Override at two levels:

- **`className` / `*ClassName` props** — appended after the built-in class, so your CSS can restyle the element.
- **`style` / `*Style` props** — inline, so they always win regardless of stylesheet order.

Dynamic geometry (slide width, track transform) is always applied inline and is not meant to be overridden.

`<LightSlide>` has `overflow: hidden` and `width: 100%` by default. Use `padding` on `<Slide>` for gutters between cards.

```tsx
<LightSlide
  slidesPerView={3}
  style={{ borderRadius: 16, background: "#f5f5f5" }}
  navigation={{ style: { background: "white" } }}
  pagination={{ activeDotStyle: { background: "#111" } }}
>
  <Slide style={{ padding: "0 8px" }}>
    <ProductCard />
  </Slide>
</LightSlide>
```

---

## How It Works

### Layout

```
┌─ LightSlide (overflow: hidden, position: relative) ──────┐
│  [Prev btn]                                  [Next btn]   │
│  ┌─ track (display: flex, transform: translateX) ───────┐ │
│  │  [Slide 0][Slide 1][Slide 2][Slide 3]...             │ │
│  └───────────────────────────────────────────────────────┘ │
│  ●  ○  ○  ○   ← pagination dots                          │
└──────────────────────────────────────────────────────────┘
```

With `isLoop`, the rendered track has additional clone slides at both ends:

```
[clone(last N)][Slide 0]...[Slide n][clone(first N)]
```

where N = `Math.ceil(slidesPerView)`.

### Drag & snap

1. **`onPointerDown`** — drag start; pointer is captured so events continue outside the element
2. **`onPointerMove`** — `translateX` updated directly on the DOM (zero React re-renders during drag)
3. **Direction lock** — first 4px decides horizontal vs vertical; vertical cancels drag and lets page scroll
4. **`onPointerUp`** — snap decision: `|drag| > 50% slide width` OR `velocity > 0.3 px/ms` → next/prev; otherwise snap back
5. **Rubber-banding** — `delta / 3` resistance at first and last slide (disabled in loop mode)

### Loop wrap animation

When a drag or button press crosses a boundary in loop mode, the track animates into the clone zone, then silently jumps to the matching real position — all within a single `transitionend` callback. The result is continuous motion with no visible jump.

### Central navigation

All navigation types call `navigateToIndex(index, source)`. The `source` parameter controls which analytics events fire beyond the base `onSlide`. Loop wrap-around is detected inside this function from the raw `nextIndex` value before clamping.

### Terminal event logic

```
carousel enters viewport
        │
  timer starts (viewedTimeout)
        │
   ┌────┴──────────────────────┐
   │                           │
user reaches              timer elapses
last scroll position
   │                           │
   ▼                           ▼
onReachedEnd              onViewedSlides
fires, timer              fires
cancelled
```

---

## Development

```bash
npm install          # install dependencies
npm test             # 79 tests across 11 suites
npm run test:watch   # watch mode
npm run lint         # ESLint
npm run lint:fix     # auto-fix
npm run format       # Prettier
npm run format:check # check without writing
npm run build        # Rollup CJS + ESM
npm run size         # bundle size check (after build)
npm run playground   # Vite dev server at localhost:5173
```

> **Playground** lives in `playground/` and is excluded from version control (`.gitignore`). It imports directly from `../src` — no build step needed. Run `npm run playground` to start the dev server and interact with all examples live.

> All analytics handlers in the playground are wired to visible event logs — every event type can be observed in the UI without opening DevTools.

### Project structure

Each component is a self-contained feature folder (component + test + styles + types):

```
src/
├── LightSlide/
│   ├── LightSlide.tsx            # Main carousel (orchestrator)
│   ├── LightSlide.test.tsx
│   ├── LightSlide.module.scss    # Container + track base styles
│   └── helpers/                  # Internal hooks & pure helpers
│       ├── constants.ts          #   tuning constants
│       ├── navigation.ts         #   navigation source/fn types
│       ├── slideData.ts          #   collectSlideData (+ test)
│       ├── loopClones.ts         #   buildLoopChildren (+ test)
│       ├── useSlideMetrics.ts    #   measure container → slide px width
│       ├── useTrackSnap.ts       #   transform/translateX snapping
│       ├── useAutoScroll.ts      #   interval cycling (+ test)
│       ├── useDragGesture.ts     #   pointer/drag handlers (+ test)
│       ├── useFlow.ts         #   continuous ticker scroll (+ test)
│       └── useViewportEngagement.ts  # IntersectionObserver + terminal events
├── Slide/
│   ├── Slide.tsx             # Slide (React.memo + forwardRef)
│   └── Slide.module.scss
├── Navigation/
│   ├── Navigation.tsx            # Prev/next button component
│   ├── Navigation.test.tsx
│   ├── Navigation.types.ts       # NavigationConfig, NavButtonRenderProps
│   └── Navigation.module.scss
├── Pagination/
│   ├── Pagination.tsx            # Pagination dots component
│   ├── Pagination.test.tsx
│   ├── Pagination.types.ts       # PaginationConfig
│   └── Pagination.module.scss
├── analytics/
│   ├── analytics.ts              # Payload builders + mergeHandlers
│   └── analytics.test.ts
├── hooks/
│   ├── useViewedSlides.ts        # Tracks unique viewed slide indices
│   └── useViewedSlides.test.ts
├── utils/
│   ├── swipe.ts                  # getSnapIndex — threshold + velocity logic
│   └── swipe.test.ts
├── lightSlideContext.ts              # Context: slideWidth, currentIndex, maxIndex, isLoop, goToIndex
├── types.ts                      # Shared + public types (re-exports feature config types)
├── styles.d.ts                   # Ambient declaration for *.module.scss imports
└── index.ts                      # Public API barrel (the only index.ts)
```

---

## License

MIT

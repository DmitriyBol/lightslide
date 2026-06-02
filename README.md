# OptiSwiper

A lightweight, fully-typed React carousel with built-in analytics events. Zero runtime dependencies beyond React.

## Features

- **Swipe & drag** — real-time finger tracking via Pointer Events; slides follow the finger and snap on release
- **slidesPerView** — show 1, 2, or 3 slides at once; each slide fills `1/n` of the container proportionally
- **Responsive** — `ResizeObserver` keeps slide widths correct on any container resize
- **Analytics ready** — viewport detection, slide navigation, end-of-carousel, and 30-second engagement events
- **Mutually exclusive terminal events** — only one of `onReachedEnd` or `onViewedSlides` ever fires per session
- **No unnecessary re-renders** — all callbacks are stable after mount via the "latest ref" pattern
- **TypeScript** — fully typed public API

---

## Installation

```bash
npm install opti-swiper
# or
yarn add opti-swiper
```

### Peer dependencies

```bash
npm install react react-dom
```

Requires React ≥ 17.

---

## Quick Start

```tsx
import { OptiSlide, OptiSwiper } from "opti-swiper";

function ProductCarousel() {
  return (
    <OptiSwiper slidesPerView={2} style={{ borderRadius: 12 }}>
      <OptiSlide data={{ id: 1, name: "Product A" }}>
        <ProductCard id={1} />
      </OptiSlide>
      <OptiSlide data={{ id: 2, name: "Product B" }}>
        <ProductCard id={2} />
      </OptiSlide>
      <OptiSlide data={{ id: 3, name: "Product C" }}>
        <ProductCard id={3} />
      </OptiSlide>
      <OptiSlide data={{ id: 4, name: "Product D" }}>
        <ProductCard id={4} />
      </OptiSlide>
    </OptiSwiper>
  );
}
```

---

## Components

### `<OptiSwiper>`

The container component. Handles layout, drag navigation, and all analytics.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | One or more `<OptiSlide>` elements |
| `style` | `CSSProperties` | — | Styles applied to the **outer wrapper** div |
| `className` | `string` | — | Class name for the outer wrapper |
| `trackStyle` | `CSSProperties` | — | Styles applied to the **inner draggable track** div |
| `trackClassName` | `string` | — | Class name for the inner track |
| `analytics` | `AnalyticsHandlers` | — | Custom event handlers (see [Analytics](#analytics)) |
| `slidesPerView` | `number` | `1` | How many slides are visible at once. Each slide fills `1/n` of the container width. |
| `viewedTimeout` | `number` | `30` | Seconds of ≥50% viewport visibility before `onViewedSlides` fires |

### `<OptiSlide>`

A single slide. Width is automatically computed as `containerWidth / slidesPerView`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Slide content |
| `style` | `CSSProperties` | — | Additional styles for the slide div |
| `className` | `string` | — | Class name for the slide div |
| `data` | `any` | — | Arbitrary data attached to this slide — included in all analytics payloads |

---

## slidesPerView

Control how many slides are visible at once. The carousel advances one slide at a time regardless of this value.

```tsx
{/* 1 slide — full width (default) */}
<OptiSwiper slidesPerView={1}>…</OptiSwiper>

{/* 2 slides — each 50% wide */}
<OptiSwiper slidesPerView={2}>…</OptiSwiper>

{/* 3 slides — each 33% wide */}
<OptiSwiper slidesPerView={3}>…</OptiSwiper>
```

With 6 slides and `slidesPerView={3}`: the user can scroll from index 0 to index 3. At index 3, slides 3, 4, and 5 are shown — the last fully-visible group.

---

## Analytics

All events fire as `console.log` by default. Pass custom handlers via the `analytics` prop to send events to your tracking system.

### Events

| Event | Handler | When it fires |
|---|---|---|
| `carousel_in_viewport` | `onInViewport` | First time the carousel becomes ≥50% visible. Fires only once. |
| `carousel_slide` | `onSlide` | Every time the user drags to a new slide. |
| `carousel_reached_end` | `onReachedEnd` | When the user reaches the last scrollable position. Fires once. |
| `carousel_viewed_slides` | `onViewedSlides` | After `viewedTimeout` seconds of continuous visibility. Fires once. |

> **Note:** `onReachedEnd` and `onViewedSlides` are **mutually exclusive** — whichever fires first prevents the other from ever firing. This ensures you don't double-count engagement.

### Custom handlers

```tsx
import { OptiSlide, OptiSwiper } from "opti-swiper";
import type { AnalyticsHandlers } from "opti-swiper";

const handlers: AnalyticsHandlers = {
  onInViewport(payload) {
    // payload: { event: "carousel_in_viewport", timestamp: number }
    myTracker.track("carousel_viewed", payload);
  },

  onSlide(payload) {
    // payload: { event: "carousel_slide", direction: "left"|"right",
    //            fromIndex: number, toIndex: number, timestamp: number }
    myTracker.track("carousel_slide", payload);
  },

  onReachedEnd(payload) {
    // payload: { event: "carousel_reached_end",
    //            slides: SlideData[], timestamp: number }
    // slides contains all slides with their attached `data` objects
    myTracker.track("carousel_complete", payload);
  },

  onViewedSlides(payload) {
    // payload: { event: "carousel_viewed_slides",
    //            slides: SlideData[], viewedSeconds: number, timestamp: number }
    // slides contains only the slides the user actually scrolled to
    myTracker.track("carousel_engagement", payload);
  },
};

function ProductCarousel() {
  return (
    <OptiSwiper analytics={handlers} slidesPerView={2} viewedTimeout={30}>
      <OptiSlide data={{ id: 1, name: "Product A", price: 99 }}>
        <ProductCard id={1} />
      </OptiSlide>
      <OptiSlide data={{ id: 2, name: "Product B", price: 149 }}>
        <ProductCard id={2} />
      </OptiSlide>
    </OptiSwiper>
  );
}
```

### Payload types

All payload types are exported from the package:

```ts
import type {
  AnalyticsHandlers,
  InViewportPayload,
  SlidePayload,
  ReachedEndPayload,
  ViewedSlidesPayload,
  SlideData,
} from "opti-swiper";
```

---

## Styling

Both `<OptiSwiper>` and `<OptiSlide>` accept `style` and `className` props. The outer wrapper has `overflow: hidden` and `width: 100%` by default — you control height and all visual styles.

```tsx
<OptiSwiper
  slidesPerView={3}
  style={{ height: 320, borderRadius: 16, background: "#f5f5f5" }}
>
  <OptiSlide style={{ padding: "0 8px" }}>
    <ProductCard />
  </OptiSlide>
</OptiSwiper>
```

Use `padding` on `<OptiSlide>` to create gutters between cards without affecting the snap positions.

---

## How It Works

### Layout

```
┌─ OptiSwiper (overflow: hidden) ──────────────────────────┐
│  ┌─ track (display: flex, transform: translateX) ────────┐ │
│  │  [Slide 0][Slide 1][Slide 2][Slide 3][Slide 4]...     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

Each slide width in pixels = `containerWidth / slidesPerView`. The track is positioned with `transform: translateX(-index × slideWidth)`. The outer wrapper clips everything outside with `overflow: hidden`.

### Drag & snap

Navigation is fully pointer-based — no `scrollTo`, no CSS `scroll-snap`:

1. **`onPointerDown`** — drag start; pointer is captured so events continue even outside the element
2. **`onPointerMove`** — track moves live with the finger (`translateX` updated directly on the DOM, zero React re-renders)
3. **Direction lock** — on the first 4px of movement: if vertical gesture is detected, drag is cancelled and the page scrolls normally
4. **`onPointerUp`** — snap decision:
   - If `|drag| > 50% of slide width` → snap to next/prev
   - If velocity `> 0.3 px/ms` (quick flick) → snap to next/prev, even with small drag distance
   - Otherwise → snap back to current slide
5. **Rubber-banding** — at the first and last slide, drag resistance is applied (`delta / 3`)

CSS `transition` is added only during the snap animation and removed via `transitionend` so it never interferes with live drag.

### Viewport detection

An `IntersectionObserver` on the outer wrapper triggers at a 50% threshold. The first time the carousel enters the viewport, `onInViewport` fires. A timer also starts at that point.

### Terminal event logic

```
carousel enters viewport
        │
        ▼
  timer starts (viewedTimeout seconds)
        │
   ┌────┴────────────────────┐
   │                         │
user reaches           timer elapses
last scroll position   (default: 30s)
   │                         │
   ▼                         ▼
onReachedEnd           onViewedSlides
fires, timer           fires
cancelled
```

Once either fires, a mutex flag ensures the other can never fire in the same session.

---

## Development

```bash
# Install dependencies
npm install

# Run tests (29 tests across 4 suites)
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint
npm run lint:fix

# Format with Prettier
npm run format
npm run format:check

# Build the package
npm run build

# Check bundle size (requires a build first)
npm run size

# Run local playground (Vite dev server at localhost:5173)
npm run playground
```

### Project structure

```
src/
├── analytics/
│   ├── analytics.ts          # Payload builders + mergeHandlers (default console.log)
│   └── analytics.test.ts
├── hooks/
│   ├── useViewedSlides.ts    # Tracks unique viewed slide indices across the session
│   └── useViewedSlides.test.ts
├── utils/
│   ├── swipe.ts              # getSnapIndex — snap threshold and velocity logic
│   └── swipe.test.ts
├── OptiSwiper.tsx            # Main carousel: drag, snap, analytics, ResizeObserver
├── OptiSwiper.test.tsx
├── OptiSlide.tsx             # Slide component (React.memo + forwardRef)
├── swiperContext.ts          # React context passing slideWidth to OptiSlide
├── types.ts                  # All exported TypeScript types
└── index.ts                  # Public API barrel (one index in the project)
```

---

## License

MIT

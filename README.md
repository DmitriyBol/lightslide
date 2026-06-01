# OptiSwiper

A lightweight, fully-typed React carousel with built-in analytics events. Zero runtime dependencies beyond React.

## Features

- **Swipe & drag** — touch and mouse pointer support out of the box
- **Responsive** — slides automatically fill the container width
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
    <OptiSwiper style={{ borderRadius: 12 }}>
      <OptiSlide data={{ id: 1, name: "Product A" }}>
        <ProductCard id={1} />
      </OptiSlide>
      <OptiSlide data={{ id: 2, name: "Product B" }}>
        <ProductCard id={2} />
      </OptiSlide>
      <OptiSlide data={{ id: 3, name: "Product C" }}>
        <ProductCard id={3} />
      </OptiSlide>
    </OptiSwiper>
  );
}
```

---

## Components

### `<OptiSwiper>`

The container component. Handles layout, swipe navigation, and all analytics.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | One or more `<OptiSlide>` elements |
| `style` | `CSSProperties` | — | Styles applied to the **outer wrapper** div |
| `className` | `string` | — | Class name for the outer wrapper |
| `trackStyle` | `CSSProperties` | — | Styles applied to the **inner scrollable track** div |
| `trackClassName` | `string` | — | Class name for the inner track |
| `analytics` | `AnalyticsHandlers` | — | Custom event handlers (see [Analytics](#analytics)) |
| `viewedTimeout` | `number` | `30` | Seconds of ≥50% viewport visibility before `onViewedSlides` fires |

### `<OptiSlide>`

A single slide. Automatically sizes to 100% of the container width.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Slide content |
| `style` | `CSSProperties` | — | Additional styles for the slide div |
| `className` | `string` | — | Class name for the slide div |
| `data` | `any` | — | Arbitrary data attached to this slide — included in all analytics payloads |

---

## Analytics

All events fire as `console.log` by default. Pass custom handlers via the `analytics` prop to send events to your tracking system.

### Events

| Event | Handler | When it fires |
|---|---|---|
| `carousel_in_viewport` | `onInViewport` | First time the carousel becomes ≥50% visible. Fires only once. |
| `carousel_slide` | `onSlide` | Every time the user swipes to a new slide. |
| `carousel_reached_end` | `onReachedEnd` | When the user navigates to the **last slide**. Fires once. |
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
    <OptiSwiper analytics={handlers} viewedTimeout={30}>
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
  style={{ height: 320, borderRadius: 16, background: "#f5f5f5" }}
  trackStyle={{ gap: 0 }}
>
  <OptiSlide style={{ padding: "0 16px" }}>
    ...
  </OptiSlide>
</OptiSwiper>
```

---

## How It Works

### Layout

```
┌─ OptiSwiper wrapper (overflow: hidden) ──────────────────┐
│  ┌─ track (display: flex, scroll-snap: x mandatory) ────┐ │
│  │  [Slide 0]  [Slide 1]  [Slide 2]                     │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

Each slide is `flex-shrink: 0; width: 100%` so it fills exactly one "screen" of the track. The wrapper clips the overflow.

### Navigation

Swipe detection uses the pointer events API (`onPointerDown` / `onPointerUp`). A delta of more than 40px triggers a slide. Smooth scroll is handled natively via `scrollTo({ behavior: "smooth" })` combined with CSS `scroll-snap-type: x mandatory`.

### Viewport detection

An `IntersectionObserver` on the outer wrapper triggers at a 50% threshold. The first time the carousel enters the viewport, `onInViewport` fires. A 30-second timer also starts at that point.

### Terminal event logic

```
carousel enters viewport
        │
        ▼
  timer starts (30s)
        │
   ┌────┴────────────────────┐
   │                         │
user reaches           timer elapses
last slide             (30 seconds)
   │                         │
   ▼                         ▼
onReachedEnd           onViewedSlides
fires, timer           fires
cancelled
```

Once either fires, a flag ensures the other can never fire in the same session.

---

## Development

```bash
# Install dependencies
npm install

# Run tests
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
```

### Project structure

```
src/
├── analytics/
│   ├── analytics.ts          # Payload builders and mergeHandlers
│   └── analytics.test.ts
├── hooks/
│   ├── useViewedSlides.ts    # Tracks which slides have been seen
│   └── useViewedSlides.test.ts
├── utils/
│   └── swipe.ts              # Swipe direction detection
├── OptiSwiper.tsx            # Main carousel component
├── OptiSwiper.test.tsx
├── OptiSlide.tsx             # Slide component (React.memo + forwardRef)
├── types.ts                  # All exported TypeScript types
└── index.ts                  # Public API barrel
```

---

## License

MIT

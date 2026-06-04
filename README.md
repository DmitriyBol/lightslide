# OptiSwiper

A lightweight, fully-typed React carousel with built-in analytics events. Zero runtime dependencies beyond React.

## Features

- **Swipe & drag** — real-time finger tracking via Pointer Events; slides follow the finger and snap on release
- **slidesPerView** — show 1, 2, or 3 slides at once; each slide fills `1/n` of the container proportionally
- **Navigation buttons** — optional prev/next buttons with full style control
- **Pagination dots** — optional dot indicators with active-state styling
- **Auto-scroll** — optional automatic cycling with configurable interval; pauses during drag
- **Responsive** — `ResizeObserver` keeps slide widths correct on any container resize
- **Analytics ready** — 6 events covering viewport, slide, navigation, pagination, and engagement
- **Mutually exclusive terminal events** — only one of `onReachedEnd` or `onViewedSlides` ever fires per session
- **No unnecessary re-renders** — all callbacks stable after mount via the "latest ref" pattern
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
    <OptiSwiper
      slidesPerView={2}
      navigation={{}}
      pagination={{}}
      style={{ borderRadius: 12 }}
    >
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

The container component. Handles layout, all navigation types, and analytics.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | One or more `<OptiSlide>` elements |
| `style` | `CSSProperties` | — | Styles for the outer wrapper div |
| `className` | `string` | — | Class name for the outer wrapper |
| `trackStyle` | `CSSProperties` | — | Styles for the inner draggable track div |
| `trackClassName` | `string` | — | Class name for the inner track |
| `analytics` | `AnalyticsHandlers` | — | Custom event handlers (see [Analytics](#analytics)) |
| `slidesPerView` | `number` | `1` | How many slides are visible at once |
| `viewedTimeout` | `number` | `30` | Seconds of ≥50% viewport visibility before `onViewedSlides` fires |
| `autoScroll` | `AutoScrollConfig` | — | Enable automatic slide cycling |
| `navigation` | `NavigationConfig` | — | Show prev/next buttons. Pass `{}` for defaults |
| `pagination` | `PaginationConfig` | — | Show pagination dots. Pass `{}` for defaults |

### `<OptiSlide>`

A single slide. Width is automatically computed as `containerWidth / slidesPerView`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Slide content |
| `style` | `CSSProperties` | — | Additional styles for the slide div |
| `className` | `string` | — | Class name for the slide div |
| `data` | `any` | — | Arbitrary data attached to this slide — included in analytics payloads |

---

## Navigation

### Swipe / drag

Built-in and always active. Drag horizontally to navigate — the slide follows the finger in real time and snaps on release at 50% of slide width or on a fast flick.

### Navigation buttons

```tsx
<OptiSwiper navigation={{}}>  {/* default arrows ‹ › */}
  ...
</OptiSwiper>

<OptiSwiper navigation={{
  prevLabel: "←",
  nextLabel: "→",
  style: { background: "white", color: "black" },   // both buttons
  prevStyle: { left: 16 },                           // prev only
  nextStyle: { right: 16 },                          // next only
  prevClassName: "btn-prev",
  nextClassName: "btn-next",
}}>
```

Buttons are absolutely positioned inside the carousel, vertically centered. They disable and dim at the first/last slide.

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

### Pagination dots

```tsx
<OptiSwiper pagination={{}}>  {/* default dots */}
  ...
</OptiSwiper>

<OptiSwiper pagination={{
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
<OptiSwiper autoScroll={{ enabled: true, interval: 3000 }}>
  ...
</OptiSwiper>
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

---

## slidesPerView

`slidesPerView` accepts any positive number, including floats. A value like `1.5` shows one full slide plus a preview of the next — a "peek" effect that communicates scrollability.

```tsx
<OptiSwiper slidesPerView={1.5}>  {/* 1 full slide + peek of the next */}
<OptiSwiper slidesPerView={3}>    {/* 6 slides → scrolls to index 0–3 */}
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
| `carousel_reached_end` | `onReachedEnd` | User reaches the last scroll position. Once. Not fired by auto-scroll loops. |
| `carousel_viewed_slides` | `onViewedSlides` | After `viewedTimeout` seconds of visibility. Once. |
| `carousel_nav_button` | `onNavButtonClick` | Prev/next button clicked. Fires in addition to `onSlide`. |
| `carousel_pagination_click` | `onPaginationClick` | Pagination dot clicked. Fires in addition to `onSlide`. |

> `onReachedEnd` and `onViewedSlides` are **mutually exclusive** — whichever fires first suppresses the other for the session lifetime.

### Custom handlers

Provide only the events you care about — unhandled events produce no output and have no side effects.

```tsx
import { OptiSlide, OptiSwiper } from "opti-swiper";
import type { AnalyticsHandlers } from "opti-swiper";

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
  NavigationButtonPayload,
  NavigationConfig,
  PaginationClickPayload,
  PaginationConfig,
  OptiSlideProps,
  OptiSwiperProps,
  ReachedEndPayload,
  SlideData,
  SlidePayload,
  ViewedSlidesPayload,
} from "opti-swiper";
```

---

## Styling

`<OptiSwiper>` has `overflow: hidden` and `width: 100%` by default. Use `padding` on `<OptiSlide>` for gutters between cards.

```tsx
<OptiSwiper
  slidesPerView={3}
  style={{ borderRadius: 16, background: "#f5f5f5" }}
  navigation={{ style: { background: "white" } }}
  pagination={{ activeDotStyle: { background: "#111" } }}
>
  <OptiSlide style={{ padding: "0 8px" }}>
    <ProductCard />
  </OptiSlide>
</OptiSwiper>
```

---

## How It Works

### Layout

```
┌─ OptiSwiper (overflow: hidden, position: relative) ──────┐
│  [Prev btn]                                  [Next btn]   │
│  ┌─ track (display: flex, transform: translateX) ───────┐ │
│  │  [Slide 0][Slide 1][Slide 2][Slide 3]...             │ │
│  └───────────────────────────────────────────────────────┘ │
│  ●  ○  ○  ○   ← pagination dots                          │
└──────────────────────────────────────────────────────────┘
```

### Drag & snap

1. **`onPointerDown`** — drag start; pointer is captured so events continue outside the element
2. **`onPointerMove`** — `translateX` updated directly on the DOM (zero React re-renders during drag)
3. **Direction lock** — first 4px decides horizontal vs vertical; vertical cancels drag and lets page scroll
4. **`onPointerUp`** — snap decision: `|drag| > 50% slide width` OR `velocity > 0.3 px/ms` → next/prev; otherwise snap back
5. **Rubber-banding** — `delta / 3` resistance at first and last slide

### Central navigation

All navigation types call `navigateToIndex(index, source)`. The `source` parameter controls which analytics events fire beyond the base `onSlide`.

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
npm test             # 43 tests across 6 suites
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

```
src/
├── analytics/
│   ├── analytics.ts          # Payload builders + mergeHandlers
│   └── analytics.test.ts
├── hooks/
│   ├── useViewedSlides.ts    # Tracks unique viewed slide indices
│   └── useViewedSlides.test.ts
├── utils/
│   ├── swipe.ts              # getSnapIndex — threshold + velocity logic
│   └── swipe.test.ts
├── Navigation.tsx            # Prev/next button component
├── Navigation.test.tsx
├── Pagination.tsx            # Pagination dots component
├── Pagination.test.tsx
├── OptiSwiper.tsx            # Main carousel
├── OptiSwiper.test.tsx
├── OptiSlide.tsx             # Slide (React.memo + forwardRef)
├── swiperContext.ts          # Context: slideWidth, currentIndex, maxIndex, goToIndex
├── types.ts                  # All exported TypeScript types
└── index.ts                  # Public API barrel
```

---

## License

MIT

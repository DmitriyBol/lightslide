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
- **External control** — a controlled `index` prop, `onIndexChange`, and a `ref` handle
  (`goTo` / `next` / `prev` / `getIndex`): the building blocks for thumbnails, synced
  carousels, and custom UIs.
- **Auto-scroll** — optional step cycling at a configurable interval; pauses during drag.
- **Flow** — optional continuous ticker scroll at a configurable speed; seamless with looping;
  pauses on interaction and resumes after a delay.
- **Accessible by default** — the container is an ARIA carousel region, each slide is a labelled
  `slide` group ("N of M"), loop clones are hidden from screen readers and removed from the tab
  order, controls are linked via `aria-controls`, and slide snapping respects
  `prefers-reduced-motion`. (Keyboard, focus-guarding and live announcements ship opt-in — see
  [Accessibility](#accessibility).)
- **Loading fallback** — render your own placeholder node while data is fetched.
- **Analytics** — one typed `onEvent` handler emitting six events (viewport, slide, navigation,
  pagination, engagement).
- **Fully typed** — generic over your slide `data` shape; no unnecessary re-renders (core data
  lives in one imperative store, context is split so navigating doesn't re-render the slides).

## Installation

```bash
npm install lightslide
# peer deps:
npm install react react-dom
```

Requires React ≥ 18 (the accessible id wiring uses `useId`).

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
| `label` | `string` | — | Accessible name — makes the carousel a labelled `region` landmark (see [Accessibility](#accessibility)) |
| `slideLabel` | `(index, count) => string` | `"${i+1} of ${n}"` | Formats each slide's automatic accessible name |
| `analytics` | `AnalyticsConfig<T>` | — | `onEvent` handler + `viewedTimeout` (see [Analytics](#analytics)) |
| `slidesPerView` | `number` | `1` | How many slides are visible at once (floats allowed) |
| `initialIndex` | `number` | `0` | Starting position, uncontrolled (see [External control](#external-control)) |
| `index` | `number` | — | Controlled position — the carousel navigates whenever it changes |
| `onIndexChange` | `(index: number) => void` | — | Fires after every settled position change, from any source |
| `autoScroll` | `AutoScrollConfig` | — | Automatic slide cycling |
| `flow` | `FlowConfig` | — | Continuous ticker scroll (supersedes `autoScroll`) |
| `navigation` | `NavigationConfig` | — | Prev/next buttons. Pass `{}` for defaults |
| `pagination` | `PaginationConfig` | — | Pagination dots. Pass `{}` for defaults |
| `a11y` | `ReactNode` | — | Opt-in accessibility layer from `lightslide/a11y` (see [Accessibility](#accessibility)) |
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
| `aria-*` / `role` / `id` | — | — | ARIA attributes forwarded to the slide's node; `aria-label`/`aria-labelledby` name the card (overriding the automatic "N of M") |

```tsx
type Product = { id: number; name: string };

<LightSlide<Product>
  analytics={{
    onEvent: (e) => {
      if (e.event === "carousel_reached_end")
        e.slides.forEach((s) => s.data?.name);
    },
  }}
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
handler the built-in button uses, so the `carousel_slide` + `carousel_nav_button` events fire
identically) and `disabled`. Your element is wrapped in a minimal positioning slot, so it lands centered and
un-clipped, and the slot dims to 50% at the boundary by default.

**`NavButtonRenderProps`**

| Key | Type | Description |
|---|---|---|
| `onClick` | `() => void` | Triggers navigation (+ `carousel_slide` / `carousel_nav_button`) |
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

Loops back to 0 after the last slide; pauses during drag; does **not** fire `carousel_reached_end`.

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
are never disabled while looping, and `carousel_reached_end` is never fired. No-op when `maxIndex === 0`.

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

## External control

Drive the carousel from outside — the building blocks for thumbnails, synced carousels, and
custom UIs. All indices are the scroll positions pagination dots represent: `0..maxIndex`
(one per slide when `slidesPerView` is an integer).

```tsx
const ref = useRef<LightSlideHandle>(null);

<LightSlide ref={ref} initialIndex={2} onIndexChange={setPosition}>…</LightSlide>;

ref.current?.goTo(4); // animate to a position (clamped into range, never wraps)
ref.current?.next(); // one step right (wraps under isLoop)
ref.current?.prev(); // one step left (wraps under isLoop)
ref.current?.getIndex(); // current settled position
```

Or bind it to state — the controlled `index` prop navigates whenever the value changes:

```tsx
const [index, setIndex] = useState(0);

<Thumbnails active={index} onPick={setIndex} />
<LightSlide index={index} onIndexChange={setIndex}>…</LightSlide>
```

Semantics worth knowing:

- `index` does not lock the carousel: drag and the built-in buttons still navigate. Keep your
  state in sync with `onIndexChange` (the pattern above).
- `onIndexChange` fires after every settled position change from any source — drag, buttons,
  pagination, auto-scroll, the API — and also when a layout change (e.g. a new
  `slidesPerView`) clamps the current position away.
- Programmatic navigation fires `carousel_slide` like any other navigation, but never
  `carousel_nav_button` / `carousel_pagination_click`.
- While `flow` runs the track has no discrete position: the controlled prop and the navigation
  methods are ignored, and `getIndex` reports the last settled position.

## Analytics

All analytics flow through **one** handler — `analytics.onEvent`. It receives every event as a
discriminated union (`AnalyticsEvent<T>`); `switch` on `event` and handle only what you need.
With no `analytics` prop nothing fires. Payloads carry only their own fields (no timestamp — add
your own in the handler if needed).

| `event` | When it fires | Payload |
|---|---|---|
| `carousel_in_viewport` | First time ≥50% visible (once) | `{ event }` |
| `carousel_slide` | Every navigation (drag/button/pagination/auto/API) | `{ event, direction, fromIndex, toIndex }` |
| `carousel_reached_end` | User reaches the last position (once) | `{ event, slides }` — **all** slides |
| `carousel_viewed_slides` | After `viewedTimeout` s of visibility (once, opt-in) | `{ event, slides, viewedSeconds }` — **viewed** slides |
| `carousel_nav_button` | Prev/next clicked (alongside `carousel_slide`) | `{ event, direction, fromIndex, toIndex }` |
| `carousel_pagination_click` | Dot clicked (alongside `carousel_slide`) | `{ event, fromIndex, toIndex }` |

Notes:

- `carousel_reached_end` and `carousel_viewed_slides` are **mutually exclusive** — whichever
  fires first suppresses the other for the session. Together they form the engagement signal:
  "the user reached the end, or watched long enough."
- Viewed-slides tracking is **opt-in via `viewedTimeout`**: the timer starts only when you set it
  (seconds of ≥50% visibility, default knob 30). Omit `viewedTimeout` and `carousel_reached_end`
  stays the armed terminal instead.
- `fromIndex`/`toIndex` on `carousel_slide` may differ by more than one (a drag can cross
  several slides); `toIndex` is the slide actually landed on.

```tsx
analytics={{
  onEvent: (e) => {
    switch (e.event) {
      case "carousel_viewed_slides":
        return track("engagement", e); // e.slides = slides actually seen
      case "carousel_reached_end":
        return track("complete", e);    // e.slides = every slide
    }
  },
  viewedTimeout: 20, // opt in to carousel_viewed_slides
}}
```

`SlideData<T>` is `{ index: number; data?: T }`. With `<LightSlide<T>>` the `slides` arrays on the
terminal events are typed `SlideData<T>[]`.

## Accessibility

The core follows the [WAI-ARIA APG carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
out of the box — no configuration required:

- **Carousel region** — the container carries `aria-roledescription="carousel"`. Pass `label` to
  give it an accessible name and promote it to a `region` landmark; without a label it stays a
  plain `group` (announced as a carousel, but not a landmark).
- **Per-slide labels** — every slide is a `group` with `aria-roledescription="slide"` and an
  `aria-label` of `"N of M"`, so a screen reader announces position as it moves. These are
  injected onto the slide's own node (via `<Slide>`), so there is no extra wrapper and flex
  layout is unchanged. To name a card for a screen reader, set `aria-label` (or `aria-labelledby`)
  on the `<Slide>` — it overrides the automatic "N of M" for that slide; `slideLabel` on
  `<LightSlide>` reshapes the automatic name globally (e.g. to localise it).

```tsx
<Slide aria-label="Ray-Ban Wayfarer, $89">
  <ProductCard … />
</Slide>
```
- **Loop clones hidden** — the duplicate slides added for seamless looping are `aria-hidden` and
  `inert`, so a screen reader never reads them twice and Tab never lands on an off-screen copy.
- **Linked controls** — prev/next buttons and pagination dots set `aria-controls` to the slides
  container, and dots expose `aria-current`. Built-in buttons/dots already carry `aria-label`s.
- **Reduced motion** — when the user requests `prefers-reduced-motion: reduce`, slide snapping is
  instant (no animated transform). Continuous **flow**/**auto-scroll** motion is left to the
  opt-in layer below.

> Custom nav elements from `renderPrev`/`renderNext` own their own markup — attach your own
> `aria-label` there. The `<Slide>` node forwards any native attribute you set on it.

### Opt-in layer (`lightslide/a11y`)

Keyboard navigation, focus-guarding, live-region announcements and reduced-motion handling for
auto-motion ship as a separate entry, so **consumers who don't import it pay nothing** (the whole
layer is ~1 kB). Import it and pass it to the `a11y` prop:

```tsx
import { LightSlide, Slide } from "lightslide";
import { A11y } from "lightslide/a11y";

<LightSlide label="Product highlights" navigation={{}} pagination={{}} a11y={<A11y />}>
  {/* … */}
</LightSlide>;
```

`<A11y>` bundles four independent behaviours, each toggleable:

| Behaviour | Prop (default `true`) | What it does |
|---|---|---|
| Keyboard | `keyboard` | `←`/`→` step a slide, `Home`/`End` jump to the first/last, once focus is inside the carousel. Ignores keys typed into form fields. |
| Focus guard | `focusGuard` | Marks off-screen slides `inert`, so keyboard focus can't land on a slide you can't see. |
| Live region | `liveRegion` | A polite live region announcing `"Slide N of M"` on manual navigation; silent during auto-motion. Customise via `announce={(i, n) => …}`. |
| Reduced motion | `respectReducedMotion` | Stops **flow**/**auto-scroll** while the user prefers reduced motion (slide-snap is already instant — handled by the core). |

```tsx
<LightSlide a11y={<A11y keyboard focusGuard={false} announce={(i, n) => `${i + 1} / ${n}`} />} />
```

Each behaviour is also exported on its own (`Keyboard`, `FocusGuard`, `LiveRegion`, `ReducedMotion`)
to cherry-pick: `a11y={<><Keyboard /><LiveRegion /></>}`. They must be rendered through the `a11y`
prop — they read the carousel's state through an internal context and throw if used elsewhere.

## Styling

The base look ships as scoped CSS-module (SCSS) classes injected on import — no separate CSS file,
no runtime dependency beyond React. Override via `className`/`*ClassName` (appended after the
built-in class) or `style`/`*Style` (inline, always wins). Dynamic geometry (slide width, track
transform) is always applied inline. The outer container is `overflow: visible` so controls
aren't clipped; an inner viewport clips the track. Use `padding` on `<Slide>` for gutters.

## Exported types

```ts
import type {
  AnalyticsConfig, AnalyticsEvent, AutoScrollConfig, FlowConfig,
  InViewportPayload, SlidePayload, ReachedEndPayload, ViewedSlidesPayload,
  NavigationButtonPayload, PaginationClickPayload,
  NavigationConfig, NavButtonRenderProps, PaginationConfig,
  LightSlideProps, LightSlideHandle, SlideProps, SlideData,
} from "lightslide";
```

## Project structure

Each component is a self-contained feature folder (component + test + styles + types):

```
src/
├── LightSlide/
│   ├── LightSlide.tsx              # Main carousel (orchestrator), generic over slide data
│   ├── LightSlide.test.tsx
│   ├── LightSlideControl.test.tsx  # external-control API (index / onIndexChange / ref)
│   ├── LightSlide.module.scss      # Container / stage / viewport / track styles
│   └── helpers/                    # Internal hooks & pure helpers
│       ├── constants.ts            #   tuning constants
│       ├── navigation.ts           #   navigation source/fn types
│       ├── store.ts                #   single core-data store (LightSlideStore<T>)
│       ├── slideData.ts            #   collectSlideData (+ test)
│       ├── loopClones.ts           #   buildDisplayChildren: per-slide ARIA + loop clones (+ test)
│       ├── useSlideMetrics.ts      #   measure container → cached slide px width (+ test)
│       ├── useTrackSnap.ts         #   transform/translateX snapping
│       ├── useAutoScroll.ts        #   interval cycling (+ test)
│       ├── usePointerGesture.ts    #   shared drag mechanics: lock/capture/click (+ test)
│       ├── useDragGesture.ts       #   drag-to-snap, thin over usePointerGesture (+ test)
│       ├── useFlow.ts              #   continuous ticker scroll, thin over it (+ test)
│       └── useViewportEngagement.ts#   IntersectionObserver + terminal events
├── a11y/                           # Opt-in `lightslide/a11y` entry (tree-shakeable)
│   ├── index.ts                    #   subpath barrel
│   ├── A11y.tsx                    #   umbrella component (toggles the four behaviours)
│   ├── Keyboard.tsx                #   arrow / Home / End navigation
│   ├── FocusGuard.tsx              #   inert off-screen slides
│   ├── LiveRegion.tsx              #   polite "Slide N of M" announcements
│   └── ReducedMotion.tsx           #   stop flow/auto-scroll under prefers-reduced-motion
├── a11ySeam.ts                     # Context seam between the core and the a11y plugins
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
├── hooks/
│   ├── useViewedSlides.ts          # Tracks unique viewed slide indices
│   └── useViewedSlides.test.ts
├── utils/
│   ├── cx.ts                       # tiny className combiner (clsx-style)
│   ├── cx.test.ts
│   ├── swipe.ts                    # getSnapIndex — threshold + velocity + multi-slide
│   ├── swipe.test.ts
│   └── reducedMotion.ts            # prefers-reduced-motion check (SSR-safe)
├── lightSlideContext.ts            # Split contexts: SlideMetricsContext + NavContext
├── types.ts                        # Shared + public types
├── styles.d.ts                     # Ambient declaration for *.module.scss imports
└── index.ts                        # Public API barrel
```

## Development

```bash
npm install          # install dependencies
npm test             # 172 integration tests (Jest + jsdom) across 20 suites
npm run lint         # ESLint
npm run stylelint    # Stylelint
npm run format       # Prettier (tabs)
npm run build        # Rollup CJS + ESM + d.ts
npm run size         # bundle size check (after build)
npm run playground   # Vite dev server (playground/)
```

### Tests

Two layers:

- **Integration** (`npm test`) — Jest + Testing Library in jsdom; the fast inner loop over
  component logic.
- **End-to-end** (`npm run test:e2e`) — Playwright (Chromium) driving the live playground in a
  real browser. Covers what jsdom can't: pointer drag/snap, layout-measured slide widths,
  loop/flow motion, and the a11y layer's real keyboard focus flow + `inert` guarding. See
  [`e2e/`](e2e/).

```bash
npx playwright install chromium   # one-time: browser
npm install --prefix playground   # one-time: playground deps
npm run test:e2e                  # headless; boots the playground automatically
npm run test:e2e:ui               # interactive UI mode
```

## License

MIT

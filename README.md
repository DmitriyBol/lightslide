# LightSlide

> The project is currently in testing and may contain bugs. The goal is to find and fix as
> many issues as possible before 1.0.0. Thank you.

A lightweight React carousel that is **accessible by default** and **batteries included**:
WAI-ARIA carousel semantics out of the box, built-in navigation, pagination, autoplay,
infinite loop, a continuous flow (ticker) mode, and one typed analytics event stream —
in a ~5 kB fully-typed core with zero runtime dependencies beyond React. Everything
optional ships as a tree-shakeable entry, so you only pay for what you import.

## What it can do

- **Swipe & drag** — real-time finger tracking via Pointer Events; the track follows the
  pointer and snaps on release. A multi-slide drag lands on the slide you actually dragged to.
- **Free scrolling** (`lightslide/free`) — momentum drag: the track coasts with native-feel
  inertia and rests anywhere (the nearest slide becomes the active index), or lands on a
  slide boundary with `<FreeScroll snap />`.
- **Interactive content friendly** — links/buttons inside slides stay clickable; a tap passes
  through, a drag never triggers them, native image/anchor drag can't hijack the gesture, and a
  drag that leaves the carousel mid-gesture never gets stuck.
- **slidesPerView** — show N slides at once (floats allowed, e.g. `1.5` for a peek).
- **gap** — px spacing between slides, folded into all geometry (snap, drag, loop, flow,
  fractional views) — no padding workarounds.
- **breakpoints** — media-query overrides of `slidesPerView`/`gap`; the carousel listens and
  re-lays itself out, no resize code in your app.
- **isLoop** — seamless infinite loop via cloned edge slides (no first-paint flash).
- **Navigation buttons** (`lightslide/navigation`) — prev/next, fully styleable, or bring your
  own element via `renderPrev`/`renderNext`. Auto-centered on the track, never clipped, dim at
  the edges.
- **Pagination dots** (`lightslide/pagination`) — dot indicators with active-state styling.
- **External control** — a controlled `index` prop, `onIndexChange`, and a `ref` handle
  (`goTo` / `next` / `prev` / `getIndex`): the building blocks for thumbnails, synced
  carousels, and custom UIs.
- **Auto-scroll** — optional step cycling at a configurable interval; pauses during drag, on
  hover, and while keyboard focus is inside (WAI-ARIA APG behaviour, opt-out per config), plus
  `pause()`/`resume()` on the ref handle for a visible pause control.
- **Flow** (`lightslide/flow`) — continuous ticker scroll at a configurable speed; seamless
  with looping; pauses on interaction, hover, and keyboard focus, and resumes after a delay.
- **Wheel & trackpad** (`lightslide/wheel`) — a horizontal two-finger swipe (or shift+wheel)
  turns one page per flick, with the inertia tail filtered out; vertical page scrolling over
  the carousel is never intercepted. During flow the same gesture drifts the strip.
- **Pay for what you use** — arrows, dots, flow, wheel gestures, free scrolling, and the a11y
  layer ship as tree-shakeable entries; the core stays ~5 kB and an unused module never
  reaches your bundle.
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

## How it compares

An honest look at the popular React carousels. Bundle sizes are min+gzip as reported by
[Bundlephobia](https://bundlephobia.com) in July 2026 (the listed package with its own
dependencies; lightslide's core measured identically from its ESM build). "Last release" is
the package's most recent npm publish as of the same date.

| Library | Bundle (min+gzip) | A11y out of the box | Built-in arrows & dots | Analytics | Generic slide data | Last release |
|---|---|---|---|---|---|---|
| **lightslide** | **5.3 kB** core, +0.7–1.6 kB per opt-in module | APG semantics always on; keyboard/announcements +1 kB opt-in | ✓ (tree-shakeable) | ✓ one typed event stream | ✓ | active |
| [embla-carousel-react](https://www.embla-carousel.com) | 7.3 kB | — headless by design, bring your own ARIA | — (DIY / plugins) | — (event emitter) | — | active (Apr 2026) |
| [keen-slider](https://keen-slider.io) | 5.9 kB | — | — (DIY) | — (event hooks) | — | Jul 2023 |
| [swiper](https://swiperjs.com) | 19.6 kB | ✓ a11y module, on by default | ✓ | — (events) | — | active (Jul 2026) |
| [@splidejs/react-splide](https://splidejs.com) | 13.7 kB | ✓ ARIA built in | ✓ | — (events) | — | Sep 2022 |
| [react-slick](https://react-slick.neostack.com) | 15.4 kB | basic, with known gaps | ✓ | — (callbacks) | — | Aug 2025 |

To keep the comparison fair:

- **Embla** is the biggest ecosystem in the React space (and the default in shadcn/ui). It is
  headless on purpose — if you want full control over markup and behaviour and don't mind
  wiring ARIA, arrows, and dots yourself, it's an excellent choice.
- **Swiper** is by far the most feature-rich (virtual slides, effects, zoom, framework-agnostic
  web components) — its size buys real features, and modular imports can trim it.
- **Splide** earned a genuine a11y reputation; its React wrapper just hasn't seen a release
  since 2022.
- **react-slick** additionally requires the separate `slick-carousel` CSS package.

lightslide's lane is the intersection: a small, maintained, fully-typed carousel that is
accessible and complete out of the box — arrows, dots, autoplay, loop, breakpoints, and
analytics without extra wiring, and tree-shakeable so the unused parts cost nothing.

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
import { Navigation } from "lightslide/navigation";
import { Pagination } from "lightslide/pagination";

function ProductCarousel() {
  return (
    <LightSlide slidesPerView={2} navigation={<Navigation />} pagination={<Pagination />}>
      <Slide data={{ id: 1 }}><ProductCard id={1} /></Slide>
      <Slide data={{ id: 2 }}><ProductCard id={2} /></Slide>
      <Slide data={{ id: 3 }}><ProductCard id={3} /></Slide>
      <Slide data={{ id: 4 }}><ProductCard id={4} /></Slide>
    </LightSlide>
  );
}
```

The core ships only what every carousel needs (~5 kB). Arrows, dots, the flow ticker, wheel
gestures, free scrolling, and the accessibility layer are separate tree-shakeable entries —
import a module and pass its node to the matching slot prop; skip the import and none of its
code or styles reaches your bundle.

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
| `gap` | `number` | `0` | Horizontal space between slides, px (see [slidesPerView & gap](#slidesperview--gap)) |
| `breakpoints` | `Record<string, BreakpointOverrides>` | — | Media-query overrides of `slidesPerView`/`gap` (see [Responsive breakpoints](#responsive-breakpoints)) |
| `initialIndex` | `number` | `0` | Starting position, uncontrolled (see [External control](#external-control)) |
| `index` | `number` | — | Controlled position — the carousel navigates whenever it changes |
| `onIndexChange` | `(index: number) => void` | — | Fires after every settled position change, from any source |
| `autoScroll` | `AutoScrollConfig` | — | Automatic slide cycling |
| `flow` | `ReactNode` | — | Continuous ticker from `lightslide/flow` — pass `<Flow />` (supersedes `autoScroll`) |
| `navigation` | `ReactNode` | — | Prev/next buttons from `lightslide/navigation` — pass `<Navigation />` |
| `pagination` | `ReactNode` | — | Pagination dots from `lightslide/pagination` — pass `<Pagination />` |
| `wheel` | `ReactNode` | — | Wheel/trackpad gestures from `lightslide/wheel` — pass `<Wheel />` (see [Wheel & trackpad](#wheel--trackpad-lightslidewheel)) |
| `free` | `ReactNode` | — | Momentum drag physics from `lightslide/free` — pass `<FreeScroll />` (see [Free scrolling](#free-scrolling-lightslidefree)) |
| `a11y` | `ReactNode` | — | Opt-in accessibility layer from `lightslide/a11y` (see [Accessibility](#accessibility)) |
| `isLoop` | `boolean` | `false` | Seamless infinite loop |
| `loading` | `boolean` | `false` | Render `fallback` instead of the slides |
| `fallback` | `ReactNode` | — | Placeholder shown while `loading` (omit → renders nothing) |

### `<Slide<T>>`

A single slide. Width is computed from the container, `slidesPerView`, and `gap` (see
[slidesPerView & gap](#slidesperview--gap)). Generic over `data`, so
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

### Navigation (`lightslide/navigation`)

```tsx
import { Navigation } from "lightslide/navigation";

<LightSlide navigation={<Navigation />} />                       {/* default ‹ › arrows */}
<LightSlide navigation={<Navigation prevStyle={{ left: 16 }} />} />
```

Buttons are absolutely positioned over the **track** (centered, prev-left / next-right) — the
pagination row below never offsets them. They dim to 50% opacity and disable at the first/last
slide unless `isLoop` is active, and are held invisible until the carousel has measured on the
client (no SSR/pre-layout flash). For a custom label or element, use `renderPrev`/`renderNext`.

**`NavigationProps`**

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

### Pagination (`lightslide/pagination`)

```tsx
import { Pagination } from "lightslide/pagination";

<LightSlide pagination={<Pagination activeDotStyle={{ background: "#4f46e5" }} />} />
```

Dot count = `maxIndex + 1` (number of scroll positions). The active dot updates on every
navigation type. Not tracked during a flow (continuous motion has no discrete index).

**`PaginationProps`**: `style`, `className`, `dotStyle`, `dotClassName`, `activeDotStyle`,
`activeDotClassName`.

### Auto-scroll

```tsx
<LightSlide autoScroll={{ enabled: true, interval: 3000 }} />
```

Loops back to 0 after the last slide; pauses during drag; does **not** fire `carousel_reached_end`.

By default the cycling also pauses while the pointer hovers the carousel or keyboard focus is
inside it, and resumes when it leaves — the [WAI-ARIA APG carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
behaviour. Set `pauseOnHover: false` / `pauseOnFocus: false` to opt out.

**`AutoScrollConfig`**: `enabled: boolean`, `interval: number` (ms),
`pauseOnHover?: boolean` (default `true`), `pauseOnFocus?: boolean` (default `true`).

The APG pattern also asks for a **visible pause control**. Build it with the ref handle's
`pause()`/`resume()` — auto-rotation stops while paused, manual navigation keeps working:

```tsx
const ref = useRef<LightSlideHandle>(null);
const [isPaused, setIsPaused] = useState(false);

<button
  type="button"
  aria-pressed={isPaused}
  onClick={() => {
    if (isPaused) ref.current?.resume();
    else ref.current?.pause();
    setIsPaused(!isPaused);
  }}
>
  {isPaused ? "Resume" : "Pause"}
</button>
<LightSlide ref={ref} autoScroll={{ enabled: true, interval: 3000 }}>…</LightSlide>
```

### Flow (continuous ticker, `lightslide/flow`)

```tsx
import { Flow } from "lightslide/flow";

<LightSlide flow={<Flow speed={80} resumeDelay={3000} />} />
```

Scrolls the track continuously at `speed` px/s (driven by `requestAnimationFrame`, no CSS
transition). Presence turns the mode on — pass the node conditionally
(`flow={active ? <Flow /> : undefined}`) to toggle it. Loops seamlessly (clones added
automatically), pauses on interaction, and resumes from where it stopped after `resumeDelay`.
Like auto-scroll, the drift also holds while the pointer hovers the carousel or keyboard focus
is inside it (opt out via `pauseOnHover` / `pauseOnFocus`), and the ref handle's
`pause()`/`resume()` hold it explicitly. Supersedes `autoScroll` when both are set.

**`FlowProps`**: `speed?: number` (default 40), `resumeDelay?: number` (default 2000 ms),
`pauseOnHover?: boolean` (default `true`), `pauseOnFocus?: boolean` (default `true`).

### Wheel & trackpad (`lightslide/wheel`)

```tsx
import { Wheel } from "lightslide/wheel";

<LightSlide wheel={<Wheel />} />
```

A horizontal two-finger trackpad swipe (or shift+wheel on a mouse; line-based mouse deltas
are normalized to px) turns one page per flick, wrapping when `isLoop` is on. Deltas
accumulate until `threshold`, then the gesture commits and the inertia tail a trackpad keeps
emitting is swallowed — 150 ms of silence or a sharply rising delta starts the next gesture.
Vertical-dominant wheel events are never touched, so page scrolling over the carousel stays
native; horizontal ones are consumed, which also suppresses the browser's history swipe.
While `flow` runs the same gesture drifts the strip instead of paging.

**`WheelProps`**: `threshold?: number` (default 30) — accumulated horizontal px before a
page turn commits.

### Free scrolling (`lightslide/free`)

```tsx
import { FreeScroll } from "lightslide/free";

<LightSlide free={<FreeScroll />} />        // coast anywhere
<LightSlide free={<FreeScroll snap />} />   // coast, land on a boundary
```

Momentum physics for the drag gesture, replacing the default one-gesture-one-snap behaviour
while the plugin is mounted:

- **`<FreeScroll />`** — the release keeps its momentum: the track coasts with exponentially
  decaying inertia and rests wherever it stops, boundary or not. At the edges (non-loop) the
  drag rubber-bands and the coast stops flush; with `isLoop` the coast wraps seamlessly
  through the clones. Once it rests, the **nearest slide becomes the active index** —
  pagination, `onIndexChange`, and a single `carousel_slide` (from the drag's start index to
  the settled one) all fire then, and the track is left exactly where the momentum ended.
  Navigating by any other means (buttons, dots, the API) re-aligns the track to a boundary —
  including clicking the active dot.
- **`<FreeScroll snap />`** — the same momentum, quantised: the coast's endpoint is projected
  from the release velocity and the track animates straight to the nearest slide boundary to
  it. No half-slide threshold — the nearest boundary simply wins.

The coast respects `prefers-reduced-motion` (the track rests at the release point instead of
coasting), grabbing a coasting track catches it mid-flight, and while `flow` runs the flow
plugin owns the track — free scrolling stands by until it stops.

**`FreeScrollProps`**: `snap?: boolean` (default `false`) — land on the nearest slide
boundary instead of resting anywhere.

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

## slidesPerView & gap

`slidesPerView` accepts any positive number, including floats — `1.5` shows one full slide plus
a peek of the next. `maxIndex = ⌈slideCount − slidesPerView⌉`.

`gap` adds horizontal space between slides (px, CSS `column-gap` on the track) and participates
in every computation: each slide fills
`(containerWidth − (⌈slidesPerView⌉ − 1) × gap) / slidesPerView` px, navigation steps by
`slideWidth + gap`, a fractional view still lands the last slide flush against the right edge,
and loop clones and the flow ticker space identically. No padding inside the slide, so card
backgrounds and shadows span the full slide width.

## Responsive breakpoints

No resize listeners in your code — hand the carousel a map of media queries and it applies
the matching overrides itself:

```tsx
<LightSlide
  slidesPerView={1.2}
  gap={8}
  breakpoints={{
    "(min-width: 768px)": { slidesPerView: 2, gap: 16 },
    "(min-width: 1200px)": { slidesPerView: 3, gap: 24 },
  }}
>
```

Keys are media queries (any valid query works — width, orientation, `prefers-*`); values
override `slidesPerView` and `gap` while their query matches. When several queries match,
later entries win per property — so mobile-first ordering behaves like CSS. A breakpoint flip
re-measures, re-clamps the position, and re-snaps exactly like a container resize; the
carousel keeps its place with no jump. On the server (or any client without `matchMedia`) the
base props render, and matches apply on hydration.

Only the geometry props participate by design: everything else (plugin slots, `autoScroll`,
`isLoop`) is plain React you can switch on your own media-query state without the carousel's
help.

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
ref.current?.pause(); // hold auto-scroll / flow (the APG pause control)
ref.current?.resume(); // release the hold
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
  methods are ignored, and `getIndex` reports the last settled position. `pause()`/`resume()`
  are the exception — they hold and release the flow drift too.

## Analytics

All analytics flow through **one** handler — `analytics.onEvent`. It receives every event as a
discriminated union (`AnalyticsEvent<T>`); `switch` on `event` and handle only what you need.
With no `analytics` prop nothing fires. Payloads carry only their own fields (no timestamp — add
your own in the handler if needed).

| `event` | When it fires | Payload |
|---|---|---|
| `carousel_in_viewport` | First time ≥50% visible (once) | `{ event }` |
| `carousel_slide` | Every navigation (drag/button/pagination/auto/API), incl. a free-drag coast settling on a new nearest index | `{ event, direction, fromIndex, toIndex }` |
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
- **Autoplay pauses on hover and focus** — `autoScroll` and `flow` hold while the pointer is
  over the carousel or keyboard focus is inside it, and resume when it leaves (opt out via
  `pauseOnHover` / `pauseOnFocus`). For the APG's visible pause control, wire a button to the
  ref handle's `pause()`/`resume()` — see [Auto-scroll](#auto-scroll).
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
| Focus guard | `focusGuard` | Marks off-screen slides `inert`, so keyboard focus can't land on a slide you can't see. Suspends while `flow` runs — a drifting strip has no fixed visible window, and every slide must stay grabbable. |
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
aren't clipped; an inner viewport clips the track. Use the `gap` prop for gutters between
slides.

## Exported types

```ts
import type {
  AnalyticsConfig, AnalyticsEvent, AutoScrollConfig, DragMode,
  InViewportPayload, SlidePayload, ReachedEndPayload, ViewedSlidesPayload,
  NavigationButtonPayload, PaginationClickPayload,
  LightSlideProps, LightSlideHandle, SlideProps, SlideData,
} from "lightslide";

import type { NavigationProps, NavButtonRenderProps } from "lightslide/navigation";
import type { PaginationProps } from "lightslide/pagination";
import type { FlowProps } from "lightslide/flow";
import type { WheelProps } from "lightslide/wheel";
import type { FreeScrollProps } from "lightslide/free";
```

## Project structure

Each component is a self-contained feature folder (component + test + styles + types).
Every opt-in tree-shakeable module lives under `src/modules/`; the seam contexts they bind
to stay in the `src/` root (they are core-side glue, shared chunks between the core and
their entry):

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
│       ├── useLatestRef.ts         #   latest-ref for stable callbacks
│       ├── useNavigation.ts        #   navigateToIndex — the single navigation path (+ test)
│       ├── useExternalControl.ts   #   controlled index prop + LightSlideHandle ref
│       ├── useLayoutResync.ts      #   re-measure/clamp/re-snap on layout-shape changes
│       ├── useSlideMetrics.ts      #   measure container → cached slide px width (+ test)
│       ├── useTrackSnap.ts         #   transform/translateX snapping
│       ├── useBreakpoints.ts       #   media-query overrides of slidesPerView/gap (+ test)
│       ├── useAutoScroll.ts        #   interval cycling (+ test)
│       ├── useHoverFocus.ts        #   hover/focus-within → store pause flags (+ test)
│       ├── usePointerGesture.ts    #   shared drag mechanics: lock/capture/click (+ test)
│       ├── useDragGesture.ts       #   drag-to-snap, thin over usePointerGesture (+ test)
│       ├── useFreeDrag.ts          #   momentum drag + coast, thin over it (+ test)
│       ├── useFlow.ts              #   continuous ticker scroll, thin over it (+ test)
│       ├── useWheel.ts             #   wheel/trackpad gestures → page turns / flow drift (+ test)
│       └── useViewportEngagement.ts#   IntersectionObserver + terminal events
├── modules/                        # Every opt-in tree-shakeable entry lives here
│   ├── a11y/                       #   `lightslide/a11y` (barrel + A11y, Keyboard,
│   │                               #   FocusGuard, LiveRegion, ReducedMotion + tests)
│   ├── Navigation/                 #   `lightslide/navigation` (prev/next buttons,
│   │                               #   render-prop API, types, styles + test)
│   ├── Pagination/                 #   `lightslide/pagination` (dots, types, styles + test)
│   ├── flow/                       #   `lightslide/flow` (continuous ticker plugin)
│   ├── wheel/                      #   `lightslide/wheel` (wheel/trackpad plugin + test)
│   └── free/                       #   `lightslide/free` (momentum drag plugin + test)
├── a11ySeam.ts                     # Context seam between the core and the a11y plugins
├── flowSeam.ts                     # Context seam between the core and the flow plugin
├── wheelSeam.ts                    # Context seam between the core and the wheel plugin
├── freeSeam.ts                     # Context seam between the core and the free plugin
├── Slide/
│   ├── Slide.tsx                   # Slide (memo + forwardRef, generic over data)
│   └── Slide.module.scss
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
npm test             # 255 integration tests (Jest + jsdom) across 27 suites
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

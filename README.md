# LightSlide

[![npm version](https://img.shields.io/npm/v/lightslide)](https://www.npmjs.com/package/lightslide)
[![bundle size](https://img.shields.io/bundlephobia/minzip/lightslide?label=core%20min%2Bgzip)](https://bundlephobia.com/package/lightslide)
[![CI](https://github.com/DmitriyBol/lightslide/actions/workflows/ci.yml/badge.svg)](https://github.com/DmitriyBol/lightslide/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/lightslide)](https://github.com/DmitriyBol/lightslide/blob/main/LICENSE)

A lightweight React carousel that is **accessible by default** and **batteries included**:
WAI-ARIA carousel semantics out of the box, infinite loop, center align, zero-CLS server
rendering, and lazy slide mounting in a ~5.5 kB fully-typed core with zero runtime
dependencies beyond React. Navigation, pagination, autoplay, a continuous flow (ticker)
mode, wheel gestures, momentum scrolling, responsive breakpoints, one typed analytics event
stream, and the deep accessibility layer all ship as tree-shakeable entries — you only pay
for what you import.

**[Live demo →](https://lightslide.vercel.app)** — every feature as an interactive example.

## Contents

- [What it can do](#what-it-can-do)
- [How it compares](#how-it-compares)
- [Installation](#installation) · [Quick start](#quick-start) · [The full kit, via spread](#the-full-kit-via-spread)
- [Components & props](#components--props) — [`<LightSlide>`](#lightslide), [`<Slide>`](#slidet),
  [Navigation](#navigation-lightslidenavigation), [Pagination](#pagination-lightslidepagination),
  [Autoplay](#autoplay-lightslideautoplay), [Flow](#flow-continuous-ticker-lightslideflow),
  [Wheel & trackpad](#wheel--trackpad-lightslidewheel), [Free scrolling](#free-scrolling-lightslidefree)
- [loop](#loop) · [Lazy slide mounting](#lazy-slide-mounting) · [Loading fallback](#loading-fallback)
- [slidesPerView & gap](#slidesperview--gap) · [Center align](#center-align) · [Right-to-left](#right-to-left-dirrtl) · [Vertical axis](#vertical-axis-axisy) · [Responsive breakpoints](#responsive-breakpoints-lightslidebreakpoints)
- [Server-side rendering](#server-side-rendering-nextjs-app-router)
- [External control](#external-control) — [thumbnails / synced carousels](#thumbnails--synced-carousels)
- [Analytics](#analytics)
- [Accessibility](#accessibility)
- [Styling](#styling) · [Exported types](#exported-types)
- [Versioning & stability](#versioning--stability)
- [Project structure](#project-structure) · [Development](#development) · [Contributing](#contributing) · [License](#license)

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
- **Center align** (`align="center"`) — the active slide rests centred with its neighbours
  peeking symmetrically (the hero / stories pattern); edges stay flush without loop, every
  position is centred with it.
- **Right-to-left** (`dir="rtl"`) — full mirroring for RTL locales: slides advance
  right-to-left, drag/wheel/keyboard follow the visual direction, the arrows swap sides, and
  loop, center align, free momentum, and the zero-CLS server paint all follow.
- **Vertical axis** (`axis="y"`) — the same carousel top-to-bottom: vertical drag and
  flick, arrows at the top/bottom edges, ↑/↓ keyboard, and every mode (loop, flow, free
  momentum, lazy mounting, center align) unchanged — give it a height and go.
- **Responsive breakpoints** (`lightslide/breakpoints`) — a `useBreakpoints` hook resolving
  any props per media query; the carousel re-lays itself out on a flip, no resize code in
  your app.
- **loop** — seamless infinite loop via cloned edge slides (no first-paint flash).
- **Lazy slide mounting** (`lazyMount`) — slides outside the visible window render as empty
  shells: the box (and all geometry) stays, the React subtree inside waits for navigation to
  approach. Fewer nodes at first paint, lighter hydration, zero layout shift on mount.
- **Navigation buttons** (`lightslide/navigation`) — prev/next, fully styleable, or bring your
  own element via `renderPrev`/`renderNext`. Auto-centered on the track, never clipped, dim at
  the edges.
- **Pagination dots** (`lightslide/pagination`) — dot indicators with active-state styling.
- **External control** — a controlled `index` prop, `onIndexChange`, and a `ref` handle
  (`goTo` / `next` / `prev` / `getIndex`): the building blocks for thumbnails, synced
  carousels, and custom UIs.
- **Autoplay** (`lightslide/autoplay`) — step cycling at a configurable interval; pauses
  during drag, on hover, and while keyboard focus is inside (WAI-ARIA APG behaviour, opt-out
  per prop), plus `pause()`/`resume()` on the ref handle for a visible pause control.
- **Flow** (`lightslide/flow`) — continuous ticker scroll at a configurable speed; seamless
  with looping; pauses on interaction, hover, and keyboard focus, and resumes after a delay.
- **Wheel & trackpad** (`lightslide/wheel`) — a horizontal two-finger swipe (or shift+wheel)
  turns one page per flick, with the inertia tail filtered out; vertical page scrolling over
  the carousel is never intercepted. During flow the same gesture drifts the strip.
- **SSR / App Router friendly** — the server markup carries the full carousel (slides, ARIA,
  controls) plus its own critical layout CSS, so the pre-hydration paint already matches the
  final layout: zero CLS, no unstyled flash, no hydration mismatches. See
  [Server-side rendering](#server-side-rendering-nextjs-app-router).
- **Pay for what you use** — arrows, dots, autoplay, flow, wheel gestures, free scrolling,
  breakpoints, analytics, and the a11y layer ship as tree-shakeable entries; the core stays
  ~5.5 kB and an unused module never reaches your bundle.
- **Accessible by default** — the container is an ARIA carousel region, each slide is a labelled
  `slide` group ("N of M"), loop clones are hidden from screen readers and removed from the tab
  order, controls are linked via `aria-controls`, and slide snapping respects
  `prefers-reduced-motion`. (Keyboard, focus-guarding and live announcements ship opt-in — see
  [Accessibility](#accessibility).)
- **Loading fallback** — render your own placeholder node while data is fetched.
- **Analytics** (`lightslide/analytics`) — one typed `onEvent` handler emitting six events
  (viewport, slide, navigation, pagination, engagement); bundles without it carry zero
  analytics code.
- **Fully typed** — generic over your slide `data` shape; no unnecessary re-renders (core data
  lives in one imperative store, context is split so navigating doesn't re-render the slides).

## How it compares

An honest look at the popular React carousels. Bundle sizes are min+gzip as reported by
[Bundlephobia](https://bundlephobia.com) in July 2026 (the listed package with its own
dependencies; lightslide's core measured identically from its ESM build). "Last release" is
the package's most recent npm publish as of the same date.

| Library | Bundle (min+gzip) | A11y out of the box | Built-in arrows & dots | Analytics | Generic slide data | Last release |
|---|---|---|---|---|---|---|
| **lightslide** | **5.6 kB** core, +0.4–1.9 kB per opt-in module | APG semantics always on; keyboard/announcements +1 kB opt-in | ✓ (tree-shakeable) | ✓ one typed event stream (opt-in module) | ✓ | active |
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
accessible and complete out of the box — arrows, dots, autoplay, loop, RTL, breakpoints,
and analytics as first-party features without extra wiring, and tree-shakeable so the
unused parts cost nothing.

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

const PRODUCTS = [
  { id: 1, name: "Air Runner" },
  { id: 2, name: "Urban Step" },
  { id: 3, name: "Trail Boot" },
  { id: 4, name: "Flip Pro" },
];

function ProductCarousel() {
  return (
    <LightSlide slidesPerView={2} navigation={<Navigation />} pagination={<Pagination />}>
      {PRODUCTS.map((product) => (
        <Slide key={product.id} data={product}>
          <ProductCard product={product} />
        </Slide>
      ))}
    </LightSlide>
  );
}
```

The core ships only what every carousel needs (~5.5 kB). Arrows, dots, autoplay, the flow
ticker, wheel gestures, free scrolling, breakpoints, analytics, and the accessibility layer
are separate tree-shakeable entries — import a module and pass its node to the matching slot
prop (or call its hook); skip the import and none of its code or styles reaches your bundle.

### The full kit, via spread

Slots are ordinary props, so the "everything on" setup composes once into a preset object
and spreads into every carousel in your app — each instance stays three lines and overrides
stay point-wise:

```tsx
import { useState } from "react";
import type { LightSlideProps } from "lightslide";
import { LightSlide, Slide } from "lightslide";
import { A11y } from "lightslide/a11y";
import { Analytics } from "lightslide/analytics";
import { Autoplay } from "lightslide/autoplay";
import { useBreakpoints } from "lightslide/breakpoints";
import { FreeScroll } from "lightslide/free";
import { Navigation } from "lightslide/navigation";
import { Pagination } from "lightslide/pagination";
import { Wheel } from "lightslide/wheel";

/** Your app's house kit — define once, spread everywhere. */
const carouselKit = {
  navigation: <Navigation />,
  pagination: <Pagination />,
  wheel: <Wheel />,
  free: <FreeScroll snap />,
  a11y: <A11y />,
  analytics: <Analytics onEvent={(e) => track(e.event, e)} />,
} satisfies Partial<LightSlideProps>;

function FullCarousel({ products }: { products: Product[] }) {
  const layout = useBreakpoints(
    { slidesPerView: 1.2, gap: 8 },
    { "(min-width: 768px)": { slidesPerView: 2.5, gap: 16 } },
  );
  const [playing, setPlaying] = useState(true);

  return (
    <LightSlide
      label="Products"
      loop
      lazyMount
      {...layout}
      {...carouselKit}
      autoplay={playing && <Autoplay interval={4000} />}
    >
      {products.map((product) => (
        <Slide key={product.id} data={product}>
          <ProductCard product={product} />
        </Slide>
      ))}
    </LightSlide>
  );
}

/** Elsewhere: the same kit, minus the dots. */
<LightSlide label="Reviews" {...carouselKit} pagination={null}>…</LightSlide>;
```

Only `flow` is left out of the kit on purpose — the continuous ticker is an alternative
motion mode that supersedes `autoplay` while it runs, so pass one or the other per carousel.

## Components & props

### `<LightSlide>`

The container — handles layout and all navigation; everything optional plugs into a slot
prop. (The slide `data` generic lives on `<Slide<T>>` and `<Analytics<T>>` — the container
itself is not generic.)

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | One or more `<Slide>` elements |
| `style` | `CSSProperties` | — | Styles for the outer wrapper |
| `className` | `string` | — | Class for the outer wrapper |
| `trackStyle` | `CSSProperties` | — | Styles for the inner track |
| `trackClassName` | `string` | — | Class for the inner track |
| `label` | `string` | — | Accessible name — makes the carousel a labelled `region` landmark (see [Accessibility](#accessibility)) |
| `slideLabel` | `(index, count) => string` | `"${i+1} of ${n}"` | Formats each slide's automatic accessible name |
| `slidesPerView` | `number` | `1` | How many slides are visible at once (floats allowed) |
| `gap` | `number` | `0` | Space between slides along the scroll axis, px (see [slidesPerView & gap](#slidesperview--gap)) |
| `axis` | `'x' \| 'y'` | `'x'` | Scroll axis — `'y'` is a vertical carousel; give it an explicit height (see [Vertical axis](#vertical-axis-axisy)) |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | Reading direction — `'rtl'` mirrors layout, gestures, controls, and loop (see [Right-to-left](#right-to-left-dirrtl)) |
| `align` | `'start' \| 'center'` | `'start'` | Where the active slide rests (see [Center align](#center-align)) |
| `initialIndex` | `number` | `0` | Starting position, uncontrolled (see [External control](#external-control)) |
| `index` | `number` | — | Controlled position — the carousel navigates whenever it changes |
| `onIndexChange` | `(index: number) => void` | — | Fires after every settled position change, from any source |
| `navigation` | `ReactNode` | — | Prev/next buttons from `lightslide/navigation` — pass `<Navigation />` |
| `pagination` | `ReactNode` | — | Pagination dots from `lightslide/pagination` — pass `<Pagination />` |
| `autoplay` | `ReactNode` | — | Automatic slide cycling from `lightslide/autoplay` — pass `<Autoplay interval={…} />` (see [Autoplay](#autoplay-lightslideautoplay)) |
| `flow` | `ReactNode` | — | Continuous ticker from `lightslide/flow` — pass `<Flow />` (supersedes `autoplay`) |
| `wheel` | `ReactNode` | — | Wheel/trackpad gestures from `lightslide/wheel` — pass `<Wheel />` (see [Wheel & trackpad](#wheel--trackpad-lightslidewheel)) |
| `free` | `ReactNode` | — | Momentum drag physics from `lightslide/free` — pass `<FreeScroll />` (see [Free scrolling](#free-scrolling-lightslidefree)) |
| `analytics` | `ReactNode` | — | Typed event stream from `lightslide/analytics` — pass `<Analytics onEvent={…} />` (see [Analytics](#analytics)) |
| `a11y` | `ReactNode` | — | Opt-in accessibility layer from `lightslide/a11y` (see [Accessibility](#accessibility)) |
| `loop` | `boolean` | `false` | Seamless infinite loop |
| `lazyMount` | `boolean \| LazyMountConfig` | `false` | Mount only slides near the current position (see [Lazy slide mounting](#lazy-slide-mounting)) |
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
import { Analytics } from "lightslide/analytics";

type Product = { id: number; name: string };

<LightSlide
  analytics={
    <Analytics<Product>
      onEvent={(e) => {
        if (e.event === "carousel_reached_end")
          e.slides.forEach((s) => s.data?.name);
      }}
    />
  }
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
slide unless `loop` is active, and are held invisible until the carousel has measured on the
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
| `disabled` | `boolean` | Boundary state. Always `false` when `loop` is active |
| `direction` | `"left" \| "right" \| "up" \| "down"` | Where this button points (`up`/`down` on a [vertical carousel](#vertical-axis-axisy)) |

### Pagination (`lightslide/pagination`)

```tsx
import { Pagination } from "lightslide/pagination";

<LightSlide pagination={<Pagination activeDotStyle={{ background: "#4f46e5" }} />} />
```

Dot count = `maxIndex + 1` (number of scroll positions). The active dot updates on every
navigation type. Not tracked during a flow (continuous motion has no discrete index).

**`PaginationProps`**: `style`, `className`, `dotStyle`, `dotClassName`, `activeDotStyle`,
`activeDotClassName`.

### Autoplay (`lightslide/autoplay`)

```tsx
import { Autoplay } from "lightslide/autoplay";

<LightSlide autoplay={<Autoplay interval={3000} />} />
```

Loops back to 0 after the last slide; pauses during drag; does **not** fire `carousel_reached_end`.
Presence turns the mode on — pass the node conditionally
(`autoplay={playing && <Autoplay interval={3000} />}`) to toggle it — `null`, `undefined`,
and `false` all mean "no module", so the usual JSX conditional idioms work as is.

By default the cycling also pauses while the pointer hovers the carousel or keyboard focus is
inside it, and resumes when it leaves — the [WAI-ARIA APG carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
behaviour. Set `pauseOnHover={false}` / `pauseOnFocus={false}` to opt out.

**`AutoplayProps`**: `interval: number` (ms, required),
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
<LightSlide ref={ref} autoplay={<Autoplay interval={3000} />}>…</LightSlide>
```

### Flow (continuous ticker, `lightslide/flow`)

```tsx
import { Flow } from "lightslide/flow";

<LightSlide flow={<Flow speed={80} resumeDelay={3000} />} />
```

Scrolls the track continuously at `speed` px/s (driven by `requestAnimationFrame`, no CSS
transition). Presence turns the mode on — pass the node conditionally
(`flow={active && <Flow />}`) to toggle it. Loops seamlessly (clones added
automatically), pauses on interaction, and resumes from where it stopped after `resumeDelay`.
Like autoplay, the drift also holds while the pointer hovers the carousel or keyboard focus
is inside it (opt out via `pauseOnHover` / `pauseOnFocus`), and the ref handle's
`pause()`/`resume()` hold it explicitly. Supersedes `autoplay` when both are set.

**`FlowProps`**: `speed?: number` (default 40), `resumeDelay?: number` (default 2000 ms),
`pauseOnHover?: boolean` (default `true`), `pauseOnFocus?: boolean` (default `true`).

### Wheel & trackpad (`lightslide/wheel`)

```tsx
import { Wheel } from "lightslide/wheel";

<LightSlide wheel={<Wheel />} />
```

A horizontal two-finger trackpad swipe (or shift+wheel on a mouse; line-based mouse deltas
are normalized to px) turns one page per flick, wrapping when `loop` is on. Deltas
accumulate until `threshold`, then the gesture commits and the inertia tail a trackpad keeps
emitting is swallowed — 150 ms of silence or a sharply rising delta starts the next gesture.
Vertical-dominant wheel events are never touched, so page scrolling over the carousel stays
native; horizontal ones are consumed, which also suppresses the browser's history swipe.
While `flow` runs the same gesture drifts the strip instead of paging. On a vertical
carousel (`axis="y"`) the slot is ignored entirely — a vertical wheel gesture is
indistinguishable from page scrolling (see [Vertical axis](#vertical-axis-axisy)).

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
  drag rubber-bands and the coast stops flush; with `loop` the coast wraps seamlessly
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

## loop

```tsx
<LightSlide loop>…</LightSlide>
```

`Math.ceil(slidesPerView)` slides are cloned at each end; when a snap lands on a clone, the track
silently repositions to the matching real slide before the next interaction. Prev/next buttons
are never disabled while looping, and `carousel_reached_end` is never fired. No-op when `maxIndex === 0`.

## Lazy slide mounting

```tsx
<LightSlide lazyMount>…</LightSlide>
<LightSlide lazyMount={{ margin: 2 }}>…</LightSlide>
```

With `lazyMount`, slides outside the visible window (± `margin` slides on each side, default
`1`) render as **empty shells**: the consumer's slide element keeps its size, class, style,
and ARIA — geometry, snapping, and loop clones behave exactly as if everything were mounted —
but the children inside don't mount until the window approaches. Mounting can't shift layout
(the box never changes), and heavy subtrees (embeds, charts, product cards) stay out of the
first render and hydration.

- The window follows the settled position — during a multi-slide flick or a free-mode coast a
  shell can be briefly visible before the position settles; raise `margin` if that matters.
- Ignored while `flow` runs: continuous motion has no resting window, so every slide mounts.
- If a slide's height would come from its lazy content, give slides an explicit height or
  `aspect-ratio` so off-window shells keep the track's height.
- For plain images native `loading="lazy"` already defers the bytes — `lazyMount` is for
  deferring the React subtree itself.
- Long strips (100+ slides) are exactly what this is for: mount time and DOM stay flat
  because only the window's subtrees exist. For very long strips raise `margin` to cover
  long flicks.

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

`gap` adds space between slides along the scroll axis (px, CSS `gap` on the track) and participates
in every computation: each slide fills
`(containerWidth − (⌈slidesPerView⌉ − 1) × gap) / slidesPerView` px, navigation steps by
`slideWidth + gap`, a fractional view still lands the last slide flush against the right edge,
and loop clones and the flow ticker space identically. No padding inside the slide, so card
backgrounds and shadows span the full slide width.

## Center align

```tsx
<LightSlide align="center" slidesPerView={1.4} gap={12} loop>
```

`align="center"` rests the **active slide in the middle of the viewport**, neighbours peeking
symmetrically on both sides — the hero / stories pattern. Pair it with a fractional
`slidesPerView` (there is nothing to centre against at exactly `1`, so the prop is a no-op
then). Snapping, dragging, free-mode settling, the server-rendered first paint, and
`lazyMount`'s window all follow the centred geometry.

- **Without `loop`** the track never scrolls past its content (no blank space): the first
  and last positions rest flush against the edges — Embla's `containScroll` behaviour — and
  every position in between is centred. Add `loop` to keep the active slide centred
  everywhere.
- Ignored while `flow` runs — continuous motion has no resting position.

## Right-to-left (`dir="rtl"`)

```tsx
<LightSlide dir="rtl" loop navigation={<Navigation />}>
```

`dir="rtl"` mirrors the whole carousel for right-to-left locales: the container gets the
`dir` attribute (so the browser mirrors the flex layout for you), slides advance
right-to-left, and every input follows the visual direction — drag and flick, wheel/trackpad
paging, and the a11y layer's arrow keys (ArrowLeft steps forward, per the APG pattern). The
navigation buttons swap sides through logical `inset-inline-*` placement and mirror their
glyphs; loop wrap-around, center align, free momentum, and `lazyMount` follow automatically.

- Set the **prop**, not just a `dir` attribute up the tree. The server can't read computed
  styles — the prop is what lets the SSR critical CSS emit the correctly-signed resting
  transform, so the zero-CLS first paint survives in RTL (see
  [Server-side rendering](#server-side-rendering-nextjs-app-router)).
- The analytics `direction` stays the **visual** truth: forward motion reports `'left'`
  under RTL (see [Analytics](#analytics)).
- Custom `renderPrev`/`renderNext` buttons keep their logical `direction` hint (`'left'` =
  prev); the positioning slot swaps sides for you, and glyphs you render yourself are yours
  to mirror.

## Vertical axis (`axis="y"`)

```tsx
<LightSlide axis="y" loop style={{height: 420}} navigation={<Navigation />}>
```

`axis="y"` stacks the slides top-to-bottom and turns the whole input surface with them:
drag and flick run along Y, the navigation buttons move to the top/bottom edges (with ˄ / ˅
glyphs), the a11y layer's keyboard steps with ArrowUp/ArrowDown, and every mode — loop,
flow, free momentum, autoplay, `lazyMount`, `align="center"`, external control — works
unchanged. The SSR critical CSS emits the vertical layout too, so the zero-CLS first paint
survives (see [Server-side rendering](#server-side-rendering-nextjs-app-router)).

- **Give the carousel an explicit height** (`style={{height: 420}}`, a class, or a sized
  parent) — slide heights are fractions of it, exactly as slide widths are fractions of a
  horizontal carousel's width. Without a height there is nothing to measure.
- **Touch trade-off**: the viewport switches to `touch-action: pan-x`, so vertical touch
  gestures over the carousel drive the carousel instead of scrolling the page. That is
  inherent to every vertical carousel (Embla and Swiper behave the same) — size it so users
  can comfortably scroll past it.
- The **`wheel` slot is ignored** while vertical: a vertical wheel gesture is
  indistinguishable from page scrolling, so the carousel never intercepts it.
- Orthogonal to `dir` — vertical order has no reading direction and never mirrors.
- Switching the axis is a layout change, not a responsive tweak — keep it out of
  breakpoints-driven props.
- The analytics `direction` becomes `'down'` / `'up'` (forward is `'down'`); custom
  `renderPrev`/`renderNext` receive `direction: 'up'` / `'down'` (see
  [Navigation](#navigation-lightslidenavigation)).

## Responsive breakpoints (`lightslide/breakpoints`)

No resize listeners in your code — resolve any props per media query with the
`useBreakpoints` hook and spread the result:

```tsx
import { useBreakpoints } from "lightslide/breakpoints";

const layout = useBreakpoints(
  { slidesPerView: 1.2, gap: 8 },
  {
    "(min-width: 768px)": { slidesPerView: 2, gap: 16 },
    "(min-width: 1200px)": { slidesPerView: 3, gap: 24 },
  },
);

<LightSlide {...layout}>
```

The first argument is the base (what applies while nothing matches); keys are media queries
(any valid query works — width, orientation, `prefers-*`) whose partial overrides merge over
the base while they match. When several queries match, later entries win per property — so
mobile-first ordering behaves like CSS. A breakpoint flip re-measures, re-clamps the
position, and re-snaps exactly like a container resize; the carousel keeps its place with no
jump. On the server (or any client without `matchMedia`) the base resolves, and matches
apply on hydration.

The hook is generic over the base shape, so it is not limited to geometry — anything you can
put in props can respond to a breakpoint (`align`, `loop`, even plugin slots), and because
it runs in *your* component, the resolved values are already in the very first render.

## Server-side rendering (Next.js App Router)

LightSlide is a client component that server-renders correctly out of the box — no plugin,
no config:

- **Full HTML on the server.** Slides, ARIA semantics, and controls are all in the server
  markup — good for SEO and readable before (or without) JavaScript.
- **Zero layout shift.** Each instance inlines its critical layout CSS into the markup: the
  flex track, the pre-measure slide width as a `calc()` mirror of the client formula, and the
  loop track pre-positioned past its clones. The pre-hydration paint already matches the
  final layout, so nothing moves when the JS bundle lands. Controls need JS anyway, so they
  stay invisible until hydration — the buttons live outside the flow and the dot row
  reserves its exact final box, so their reveal shifts nothing either. Audited with the
  Layout Instability API against a production App Router build: **CLS 0** even with the JS
  bundle delayed by seconds (the same page measured 0.33 without the inlined CSS).
- **Clean hydration.** Ids come from `useId`, `matchMedia` access is guarded, layout effects
  are isomorphic — no mismatch warnings on either React 18 or 19.

In the App Router, keep pages as server components and wrap the carousel in a minimal
`"use client"` leaf:

```tsx
// components/ProductCarousel.tsx
"use client";

import { LightSlide, Slide } from "lightslide";
import { Navigation } from "lightslide/navigation";

export function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <LightSlide label="Products" slidesPerView={3} gap={16} navigation={<Navigation />}>
      {products.map((p) => (
        <Slide key={p.id} data={p}>
          <ProductCard product={p} />
        </Slide>
      ))}
    </LightSlide>
  );
}
```

```tsx
// app/page.tsx — stays a server component
import { ProductCarousel } from "../components/ProductCarousel";

export default async function Page() {
  const products = await getProducts();
  return <ProductCarousel products={products} />;
}
```

One caveat: `useBreakpoints` resolves through `matchMedia`, which doesn't exist on the
server, so the server HTML always uses the base values. On viewports where an override
applies, the carousel re-lays out once at hydration — pick a base that matches your most
common viewport if that single shift matters to you.

## External control

Drive the carousel from outside — the building blocks for thumbnails, synced carousels, and
custom UIs. All indices are the scroll positions pagination dots represent: `0..maxIndex`
(one per slide when `slidesPerView` is an integer).

```tsx
const ref = useRef<LightSlideHandle>(null);

<LightSlide ref={ref} initialIndex={2} onIndexChange={setPosition}>…</LightSlide>;

ref.current?.goTo(4); // animate to a position (clamped into range, never wraps)
ref.current?.next(); // one step right (wraps under loop)
ref.current?.prev(); // one step left (wraps under loop)
ref.current?.getIndex(); // current settled position
ref.current?.pause(); // hold autoplay / flow (the APG pause control)
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
  pagination, autoplay, the API — and also when a layout change (e.g. a new
  `slidesPerView`) clamps the current position away.
- Programmatic navigation fires `carousel_slide` like any other navigation, but never
  `carousel_nav_button` / `carousel_pagination_click`.
- While `flow` runs the track has no discrete position: the controlled prop and the navigation
  methods are ignored, and `getIndex` reports the last settled position. `pause()`/`resume()`
  are the exception — they hold and release the flow drift too.

### Thumbnails / synced carousels

The product-page classic needs no plugin — two instances and one piece of state:

```tsx
const [index, setIndex] = useState(0);

<LightSlide index={index} navigation={<Navigation />} onIndexChange={setIndex}>
  {images.map((src) => (
    <Slide key={src}>
      <img src={src} alt="" />
    </Slide>
  ))}
</LightSlide>

<LightSlide index={index} slidesPerView={4.5} gap={8}>
  {images.map((src, i) => (
    <Slide key={src}>
      <button type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>
        <img src={src} alt="" />
      </button>
    </Slide>
  ))}
</LightSlide>
```

- A thumb click sets the state and the gallery follows its controlled `index`; the gallery's
  own arrows/drag report back through `onIndexChange`, moving the `aria-pressed` highlight
  your CSS hangs on.
- The strip deliberately gets no `onIndexChange` — dragging it browses the thumbs without
  changing the selection.
- The strip reads the same shared `index`, and out-of-range values clamp to each instance's
  own range — that is what keeps the active thumb scrolled into view for free.
- The same shape syncs any two carousels 1:1: give both `index` and `onIndexChange` and they
  mirror each other.

See it live in the playground's [Thumbnails demo](https://lightslide.vercel.app/#thumbnails).

## Analytics

Analytics ships as the tree-shakeable `lightslide/analytics` entry — pass
`analytics={<Analytics onEvent={…} />}`. Everything flows through **one** handler: `onEvent`
receives every event as a discriminated union (`AnalyticsEvent<T>`); `switch` on `event` and
handle only what you need. Without the slot nothing fires — and none of the analytics code
(viewport observation, viewed tracking, event objects) is in your bundle. Payloads carry
only their own fields (no timestamp — add your own in the handler if needed).

| `event` | When it fires | Payload |
|---|---|---|
| `carousel_in_viewport` | First time ≥50% visible (once) | `{ event }` |
| `carousel_slide` | Every navigation (drag/button/pagination/autoplay/API), incl. a free-drag coast settling on a new nearest index | `{ event, direction, fromIndex, toIndex }` |
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
- `direction` is the **visual** motion of the track: `'left'`/`'right'` on a horizontal
  carousel (forward is `'left'` under `dir="rtl"`), `'up'`/`'down'` on a vertical one
  (forward is `'down'`).

```tsx
import { Analytics } from "lightslide/analytics";

<LightSlide
  analytics={
    <Analytics
      onEvent={(e) => {
        switch (e.event) {
          case "carousel_viewed_slides":
            return track("engagement", e); // e.slides = slides actually seen
          case "carousel_reached_end":
            return track("complete", e);   // e.slides = every slide
        }
      }}
      viewedTimeout={20} // opt in to carousel_viewed_slides
    />
  }
>
```

`SlideData<T>` is `{ index: number; data?: T }`. With `<Analytics<T>>` the `slides` arrays on
the terminal events are typed `SlideData<T>[]`.

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
- **Autoplay pauses on hover and focus** — `autoplay` and `flow` hold while the pointer is
  over the carousel or keyboard focus is inside it, and resume when it leaves (opt out via
  `pauseOnHover` / `pauseOnFocus`). For the APG's visible pause control, wire a button to the
  ref handle's `pause()`/`resume()` — see [Autoplay](#autoplay-lightslideautoplay).
- **Reduced motion** — when the user requests `prefers-reduced-motion: reduce`, slide snapping is
  instant (no animated transform). Continuous **flow**/**autoplay** motion is left to the
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
import { Navigation } from "lightslide/navigation";
import { Pagination } from "lightslide/pagination";

<LightSlide
  label="Product highlights"
  navigation={<Navigation />}
  pagination={<Pagination />}
  a11y={<A11y />}
>
  {/* … */}
</LightSlide>;
```

`<A11y>` bundles four independent behaviours, each toggleable:

| Behaviour | Prop (default `true`) | What it does |
|---|---|---|
| Keyboard | `keyboard` | `←`/`→` step a slide, `Home`/`End` jump to the first/last, once focus is inside the carousel. Ignores keys typed into form fields. |
| Focus guard | `focusGuard` | Marks off-screen slides `inert`, so keyboard focus can't land on a slide you can't see. Suspends while `flow` runs — a drifting strip has no fixed visible window, and every slide must stay grabbable. |
| Live region | `liveRegion` | A polite live region announcing `"Slide N of M"` on manual navigation; silent during auto-motion. Customise via `announce={(i, n) => …}`. |
| Reduced motion | `respectReducedMotion` | Stops **flow**/**autoplay** while the user prefers reduced motion (slide-snap is already instant — handled by the core). |

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
  LazyMountConfig, LightSlideProps, LightSlideHandle, SlideDirection, SlideProps,
} from "lightslide";

import type {
  AnalyticsProps, AnalyticsEvent, SlideData,
  InViewportPayload, SlidePayload, ReachedEndPayload, ViewedSlidesPayload,
  NavigationButtonPayload, PaginationClickPayload,
} from "lightslide/analytics";

import type { AutoplayProps } from "lightslide/autoplay";
import type { A11yProps, LiveRegionProps } from "lightslide/a11y";
import type { NavigationProps, NavButtonRenderProps } from "lightslide/navigation";
import type { PaginationProps } from "lightslide/pagination";
import type { FlowProps } from "lightslide/flow";
import type { WheelProps } from "lightslide/wheel";
import type { FreeScrollProps } from "lightslide/free";
```

## Versioning & stability

From **1.0.0** onward, `lightslide` follows [SemVer](https://semver.org):

- **Major** (`2.0.0`) — a breaking change to the public API.
- **Minor** (`1.1.0`) — new, backward-compatible features.
- **Patch** (`1.0.1`) — backward-compatible bug fixes.

**What the public API covers** — the semver contract applies to: the exports of the root
`lightslide` entry and every `lightslide/*` subpath, the documented component props, the ref
handle (`LightSlideHandle`), the exported types, and the analytics event names and payload
shapes. It does **not** cover internal module paths, the generated (hashed) CSS class names,
exact bundle byte counts, or anything documented as internal.

**Deprecation policy** — an API bound for removal is first marked `@deprecated` in a minor
release and keeps working for the rest of that major; it is removed no earlier than the next
major, and every removal is called out in the [changelog](CHANGELOG.md).

Releases before 1.0.0 were pre-release — `0.x` minors sometimes carried breaking changes
(each noted in the changelog). That settling period is over; 1.0.0 freezes the surface above.

## Project structure

Each component is a self-contained feature folder (component + test + styles + types), and
the same one-folder-per-unit rule runs all the way down: every internal helper and util
lives in its own folder next to its test. Every opt-in tree-shakeable module lives under
`src/modules/`; the seam contexts they bind to live in `src/seams/` (core-side glue, shared
chunks between the core and their entry):

```
src/
├── LightSlide/
│   ├── LightSlide.tsx              # Main carousel — thin composition root over the helpers
│   ├── LightSlide.test.tsx
│   ├── LightSlideControl.test.tsx  # external-control API (index / onIndexChange / ref)
│   ├── LightSlide.ssr.test.tsx     # server-rendering smoke (node env, renderToString)
│   ├── LightSlide.hydration.test.tsx # hydrateRoot adopts server markup w/o mismatches
│   ├── LightSlide.module.scss      # Container / stage / viewport / track styles
│   └── helpers/                    # Internal hooks & pure helpers, one folder each (+ test)
│       ├── constants.ts            #   ── the flat files are the imperative core ──
│       ├── navigation.ts           #   navigation source/fn types + the emitNav mailbox type
│       ├── store.ts                #   single core-data store (LightSlideStore)
│       ├── loopClones/             #   per-slide ARIA + loop clones
│       ├── lazyMount/              #   index-window mount predicate for lazyMount
│       ├── ssrStyles/              #   critical layout CSS served with the markup
│       ├── trackOffset/            #   pure px offset for a visual index
│       ├── trackTransform/         #   offset → translateX/translateY string (axis + direction applied once)
│       ├── useIsomorphicLayoutEffect/ # layout effect that is SSR-silent
│       ├── useLatestRef/           #   latest-ref for stable callbacks
│       ├── useNavigation/          #   navigateToIndex — the single navigation path
│       ├── useExternalControl/     #   controlled index prop + LightSlideHandle ref
│       ├── useLayoutResync/        #   re-measure/clamp/re-snap on layout-shape changes
│       ├── useSlideMetrics/        #   measure container → cached slide px width
│       ├── useTrackSnap/           #   transform/translateX snapping
│       ├── useDisplayChildren/     #   ARIA + loop clones + lazy window → rendered children
│       ├── useGestureHandlers/     #   which handler bag owns the viewport (drag/flow/free)
│       ├── useSeamValues/          #   memoized context values for every plugin seam
│       ├── useHoverFocus/          #   hover/focus-within → store pause flags (autoplay/flow)
│       ├── usePointerGesture/      #   shared drag mechanics: lock/capture/click
│       ├── useDragGesture/         #   drag-to-snap, thin over usePointerGesture
│       ├── useFreeDrag/            #   momentum drag + coast, thin over it
│       ├── useFlow/                #   continuous ticker scroll, thin over it
│       └── useWheel/               #   wheel/trackpad gestures → page turns / flow drift
├── modules/                        # Every opt-in tree-shakeable entry lives here
│   ├── a11y/                       #   `lightslide/a11y` (barrel + A11y, Keyboard,
│   │                               #   FocusGuard, LiveRegion, ReducedMotion + tests)
│   ├── Navigation/                 #   `lightslide/navigation` (prev/next buttons,
│   │                               #   render-prop API, types, styles + test)
│   ├── Pagination/                 #   `lightslide/pagination` (dots, types, styles + test)
│   ├── flow/                       #   `lightslide/flow` (continuous ticker plugin)
│   ├── wheel/                      #   `lightslide/wheel` (wheel/trackpad plugin + test)
│   ├── free/                       #   `lightslide/free` (momentum drag plugin + test)
│   ├── autoplay/                   #   `lightslide/autoplay` (interval cycling + tests)
│   ├── analytics/                  #   `lightslide/analytics` (event types, engagement,
│   │                               #   viewed tracking, slide data + tests)
│   └── breakpoints/                #   `lightslide/breakpoints` (useBreakpoints hook + test)
├── seams/                          # Context seams — core-side glue, one shared chunk each
│   ├── a11ySeam.ts                 #   core ↔ a11y plugins
│   ├── analyticsSeam.ts            #   core ↔ analytics plugin
│   ├── autoplaySeam.ts             #   core ↔ autoplay plugin
│   ├── flowSeam.ts                 #   core ↔ flow plugin
│   ├── freeSeam.ts                 #   core ↔ free plugin
│   ├── wheelSeam.ts                #   core ↔ wheel plugin
│   └── lightSlideContext.ts        #   SlideMetricsContext (→ Slide) + NavContext (→ nav/dots)
├── Slide/
│   ├── Slide.tsx                   # Slide (memo + forwardRef, generic over data)
│   └── Slide.module.scss
├── utils/                          # Generic utilities, one folder each (+ test)
│   ├── cx/                         #   tiny className combiner
│   ├── swipe/                      #   getSnapIndex — threshold + velocity + multi-slide
│   └── reducedMotion/              #   prefers-reduced-motion check (SSR-safe)
├── types.ts                        # Shared + public types
├── styles.d.ts                     # Ambient declaration for *.module.scss imports
└── index.ts                        # Public API barrel
```

## Development

```bash
npm install          # install dependencies
npm test             # 360 unit/integration tests (Jest + jsdom) across 38 suites
npm run lint         # ESLint
npm run stylelint    # Stylelint
npm run format       # Prettier (tabs)
npm run build        # Rollup CJS + ESM + d.ts
npm run size         # bundle size check (after build)
npm run playground   # Vite dev server (playground/ — deployed at lightslide.vercel.app)
```

### Tests

Two layers:

- **Integration** (`npm test`) — Jest + Testing Library in jsdom; the fast inner loop over
  component logic.
- **End-to-end** (`npm run test:e2e`) — Playwright (Chromium) driving the live playground in a
  real browser. Covers what jsdom can't: pointer drag/snap, layout-measured slide widths,
  loop/flow motion, and the a11y layer's real keyboard focus flow + `inert` guarding. See
  [`e2e/`](https://github.com/DmitriyBol/lightslide/tree/main/e2e).

```bash
npx playwright install chromium   # one-time: browser
npm install --prefix playground   # one-time: playground deps
npm run test:e2e                  # headless; boots the playground automatically
npm run test:e2e:ui               # interactive UI mode
```

## Contributing

Bug reports, feature requests, and pull requests are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the
[Code of Conduct](CODE_OF_CONDUCT.md). Planned work and known gaps live in the
[issue tracker](https://github.com/DmitriyBol/lightslide/issues); security issues go through a
[private advisory](https://github.com/DmitriyBol/lightslide/security/advisories/new), never a
public issue.

## License

MIT


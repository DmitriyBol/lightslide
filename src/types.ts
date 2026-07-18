import type {AriaAttributes, AriaRole, CSSProperties, ReactNode} from 'react';

/**
 * Config form of `lazyMount`. `margin` is how many off-screen slides stay mounted on each
 * side of the visible window (default 1): raise it to pre-mount further ahead (long flicks,
 * free mode), lower it to 0 for the tightest window.
 */
export type LazyMountConfig = {
	margin?: number;
};

/**
 * Main carousel props.
 *
 * - `label` — accessible name for the carousel region. When set, the container is a labelled
 *   `region` landmark (else a plain `group`); either way it is announced as a carousel.
 * - `slideLabel` — formats each slide's automatic accessible name (default
 *   `${index + 1} of ${count}`); a per-slide `aria-label` on `<Slide>` overrides it.
 * - `gap` — horizontal space between adjacent slides, px (default 0). Applied as CSS
 *   `column-gap` on the track and folded into all geometry: slide width, snap positions,
 *   the fractional flush of the last slide, loop clones, and flow.
 * - `align` — where the active slide rests in the viewport (default `'start'`, the left
 *   edge). `'center'` centres it, with the neighbours peeking symmetrically — the hero /
 *   stories pattern; pair it with a fractional `slidesPerView` (e.g. 1.2), since with
 *   exactly one slide per view there is nothing to centre against and the prop is a no-op.
 *   Without `isLoop` the track never scrolls past its edges (no blank space): the first and
 *   last positions rest flush against them, so only looping keeps every slide perfectly
 *   centred. Ignored while `flow` runs — continuous motion has no resting position.
 * - `initialIndex` — starting position (0..maxIndex, clamped). Uncontrolled: the carousel owns
 *   the index afterwards — read changes via `onIndexChange`, drive them via `index`/the ref.
 * - `index` — controlled position: whenever the value changes, the carousel animates to it. It
 *   does not lock the carousel — gestures and buttons still navigate; pair with
 *   `onIndexChange` to keep your state in sync. Ignored while `flow` runs.
 * - `onIndexChange` — fires after every settled position change, from any source: drag,
 *   buttons, pagination, autoplay, or the external API.
 * - `navigation` / `pagination` / `flow` / `wheel` / `free` / `autoplay` / `analytics` /
 *   `a11y` — the opt-in plugin slots. Each takes the node(s) from its tree-shakeable entry
 *   (`lightslide/navigation`, `lightslide/pagination`, `lightslide/flow`,
 *   `lightslide/wheel`, `lightslide/free`, `lightslide/autoplay`, `lightslide/analytics`,
 *   `lightslide/a11y`), e.g. `navigation={<Navigation />}` or `flow={<Flow speed={60} />}`.
 *   Omit a slot and none of that entry's code or styles enters your bundle. Flow supersedes
 *   autoplay and forces looping on while it runs. Wheel turns horizontal trackpad/wheel
 *   gestures into page turns (drift during flow) without touching vertical page scrolling.
 *   Free replaces the drag-to-snap gesture with momentum scrolling (`<FreeScroll />` rests
 *   anywhere, `<FreeScroll snap />` lands on a boundary); flow, when running, still owns the
 *   track. Autoplay cycles slides on an interval and pauses on hover/focus. Analytics
 *   receives every carousel event through one typed handler.
 * - `lazyMount` — defer mounting far-away slides: `true` or `{margin}` renders slides
 *   outside the visible window (± `margin` slides, default 1) as empty shells. The shell is
 *   the consumer's own slide element with all its props — size, class, style, ARIA — so
 *   geometry, snap, and loop stay exact and mounting causes no layout shift; only the
 *   children (images, embeds, heavy cards) wait for the window to approach. Loop clones
 *   follow their original slide. Ignored while `flow` runs (continuous motion has no
 *   resting window — every slide mounts). Give slides an explicit height when the height
 *   would come from lazy content, and keep using native `loading="lazy"` for plain images —
 *   this defers React subtrees, not image bytes.
 * - `loading` — when true, the carousel renders `fallback` instead of the slides — useful
 *   while async slide data is still being fetched. With no `fallback` it renders nothing.
 * - `fallback` — node rendered in place of the track while `loading` is true (your own
 *   skeleton / spinner / placeholder).
 */
export type LightSlideProps = {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	trackStyle?: CSSProperties;
	trackClassName?: string;
	label?: string;
	slideLabel?: (index: number, count: number) => string;
	slidesPerView?: number;
	gap?: number;
	align?: 'start' | 'center';
	initialIndex?: number;
	index?: number;
	onIndexChange?: (index: number) => void;
	navigation?: ReactNode;
	pagination?: ReactNode;
	flow?: ReactNode;
	wheel?: ReactNode;
	free?: ReactNode;
	autoplay?: ReactNode;
	analytics?: ReactNode;
	a11y?: ReactNode;
	isLoop?: boolean;
	lazyMount?: boolean | LazyMountConfig;
	loading?: boolean;
	fallback?: ReactNode;
};

/**
 * Individual slide props. Generic over the `data` shape so `<Slide<Product> data={…} />` is fully
 * typed; defaults to unknown, so untyped usage keeps working. `children` is `ReactNode`. Also
 * accepts ARIA attributes (`aria-label`, `aria-labelledby`, …), `role`, and `id`, forwarded to the
 * slide's DOM node — a per-slide `aria-label`/`aria-labelledby` overrides the automatic "N of M".
 * `data` is read by the `lightslide/analytics` plugin for its event payloads, never rendered.
 */
export type SlideProps<T = unknown> = AriaAttributes & {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	data?: T;
	role?: AriaRole;
	id?: string;
};

/**
 * Imperative handle exposed through `ref` on `<LightSlide>`. All indices are scroll positions
 * (0..maxIndex — the same positions pagination dots represent; with an integer slidesPerView
 * that is one per slide). `goTo` clamps out-of-range targets; `next`/`prev` step one position
 * and wrap around when `isLoop` is on. While `flow` runs the track has no discrete position,
 * so the navigation methods no-op and `getIndex` reports the last settled index.
 * `pause`/`resume` hold and release all auto motion (`autoplay` and `flow`) — wire them to a
 * visible button for the WAI-ARIA APG pause control; manual navigation keeps working while
 * paused, and they work during flow too.
 */
export type LightSlideHandle = {
	goTo: (index: number) => void;
	next: () => void;
	prev: () => void;
	getIndex: () => number;
	pause: () => void;
	resume: () => void;
};

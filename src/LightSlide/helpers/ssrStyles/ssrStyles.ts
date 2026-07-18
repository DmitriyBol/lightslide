import styles from '../../LightSlide.module.scss';

type SsrCssInput = {
	slidesId: string;
	slidesPerView: number;
	gap: number;
	startVisual: number;
	centered: boolean;
	isLoop: boolean;
	rtl: boolean;
};

/**
 * Critical layout CSS the carousel serves with its own markup (a `<style>` tag rendered by
 * the component). The stylesheet proper is injected into `<head>` only when the JS bundle
 * executes, so server-rendered HTML would otherwise paint unstyled until hydration — the
 * track a vertical stack of full-width slides (measured CLS 0.33 in the LIG-11 Next.js
 * audit). These rules make the first server paint match the final layout: container
 * geometry, flex track, the pre-measure slide width as a calc() mirror of the
 * useSlideMetrics formula, and the track's resting transform (loop clones + start index +
 * the centring inset) so loop mode doesn't paint the tail clones first. Selectors are
 * scoped through the instance's `slidesId`, and everything here loses to the inline px
 * width / imperative transform once the client measures, so the rules go inert after
 * hydration.
 *
 * Center mode adds `(100% − slideWidth) / 2` to the translate (the calc mirror of
 * store.centerInset — translateX % resolves against the track, whose width equals the
 * viewport) and, without loop, clamps through CSS min(): trackOffset rests the first
 * positions flush at offset 0, and min(0px, …) is that clamp in transform terms. The
 * fractional right-edge flush clamp is not mirrored (unchanged from start mode) — a last
 * position with fractional slidesPerView overshoots by the remainder until hydration.
 *
 * `rtl` flips the transform's sign (offsets are translateX-positive when the flex layout is
 * mirrored — the CSS twin of trackTransform's dirSign) and turns the center clamp into
 * max(0px, …), since the clamped offset is now the translate itself, not its negation.
 *
 * The string lands in the DOM via dangerouslySetInnerHTML, so nothing non-numeric may reach
 * it: `slidesId` and the class names are library-generated (useId / build-time CSS-module
 * hashes), and the three prop-fed values are coerced to finite numbers below — an untyped JS
 * consumer passing a string for `gap`/`slidesPerView` gets the default instead of markup
 * inside the `<style>` text.
 */
export function buildSsrCss({
	slidesId,
	slidesPerView,
	gap,
	startVisual,
	centered,
	isLoop,
	rtl,
}: SsrCssInput): string {
	const spv =
		Number.isFinite(slidesPerView) && slidesPerView > 0 ? slidesPerView : 1;
	const gapPx = Number.isFinite(gap) && gap > 0 ? gap : 0;
	const start = Number.isFinite(startVisual) ? startVisual : 0;

	const visibleGaps = (Math.ceil(spv) - 1) * gapPx;
	const slideWidth = `(100% - ${visibleGaps}px)/${spv}`;
	const track = `[id="${slidesId}"]`;
	const shift = `(${slideWidth} + ${gapPx}px)*${rtl ? start : -start}`;

	let restTransform = '';
	if (centered) {
		const c = `calc(${shift} ${rtl ? '-' : '+'} (100% - (${slideWidth}))/2)`;
		const clamped = rtl ? `max(0px,${c})` : `min(0px,${c})`;
		restTransform = `;transform:translateX(${isLoop ? c : clamped})`;
	} else if (start > 0) {
		restTransform = `;transform:translateX(calc(${shift}))`;
	}

	return (
		`.${styles.container},.${styles.stage}{position:relative;width:100%}` +
		`.${styles.viewport}{width:100%;overflow:hidden}` +
		`${track}{display:flex${restTransform}}` +
		`${track}>*{box-sizing:border-box;flex-shrink:0;width:calc(${slideWidth})}`
	);
}

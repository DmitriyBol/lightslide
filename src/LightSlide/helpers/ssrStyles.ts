import styles from '../LightSlide.module.scss';

type SsrCssInput = {
	slidesId: string;
	slidesPerView: number;
	gap: number;
	startVisual: number;
	centered: boolean;
	isLoop: boolean;
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
 */
export function buildSsrCss({
	slidesId,
	slidesPerView,
	gap,
	startVisual,
	centered,
	isLoop,
}: SsrCssInput): string {
	const visibleGaps = (Math.ceil(slidesPerView) - 1) * gap;
	const slideWidth = `(100% - ${visibleGaps}px)/${slidesPerView}`;
	const track = `[id="${slidesId}"]`;
	const shift = `(${slideWidth} + ${gap}px)*${-startVisual}`;

	let restTransform = '';
	if (centered) {
		const c = `calc(${shift} + (100% - (${slideWidth}))/2)`;
		restTransform = `;transform:translateX(${isLoop ? c : `min(0px,${c})`})`;
	} else if (startVisual > 0) {
		restTransform = `;transform:translateX(calc(${shift}))`;
	}

	return (
		`.${styles.container},.${styles.stage}{position:relative;width:100%}` +
		`.${styles.viewport}{width:100%;overflow:hidden}` +
		`${track}{display:flex${restTransform}}` +
		`${track}>*{box-sizing:border-box;flex-shrink:0;width:calc(${slideWidth})}`
	);
}

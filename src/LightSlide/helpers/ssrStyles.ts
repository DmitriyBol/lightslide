import styles from '../LightSlide.module.scss';

type SsrCssInput = {
	slidesId: string;
	slidesPerView: number;
	gap: number;
	startVisual: number;
};

/**
 * Critical layout CSS the carousel serves with its own markup (a `<style>` tag rendered by
 * the component). The stylesheet proper is injected into `<head>` only when the JS bundle
 * executes, so server-rendered HTML would otherwise paint unstyled until hydration — the
 * track a vertical stack of full-width slides (measured CLS 0.33 in the LIG-11 Next.js
 * audit). These rules make the first server paint match the final layout: container
 * geometry, flex track, the pre-measure slide width as a calc() mirror of the
 * useSlideMetrics formula, and the track's resting transform (loop clones + start index)
 * so loop mode doesn't paint the tail clones first. Selectors are scoped through the
 * instance's `slidesId`, and everything here loses to the inline px width / imperative
 * transform once the client measures, so the rules go inert after hydration.
 */
export function buildSsrCss({
	slidesId,
	slidesPerView,
	gap,
	startVisual,
}: SsrCssInput): string {
	const visibleGaps = (Math.ceil(slidesPerView) - 1) * gap;
	const slideWidth = `(100% - ${visibleGaps}px)/${slidesPerView}`;
	const track = `[id="${slidesId}"]`;
	const restTransform =
		startVisual > 0
			? `;transform:translateX(calc((${slideWidth} + ${gap}px)*${-startVisual}))`
			: '';

	return (
		`.${styles.container},.${styles.stage}{position:relative;width:100%}` +
		`.${styles.viewport}{width:100%;overflow:hidden}` +
		`${track}{display:flex${restTransform}}` +
		`${track}>*{box-sizing:border-box;flex-shrink:0;width:calc(${slideWidth})}`
	);
}

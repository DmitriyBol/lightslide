import {useCallback} from 'react';

import {useNavContext} from '../../seams/lightSlideContext';
import {cx} from '../../utils/cx/cx';
import styles from './Navigation.module.scss';
import type {NavigationProps} from './Navigation.types';

/**
 * Critical placement CSS served with the markup: the stylesheet is head-injected only when
 * the JS bundle runs, so server-rendered buttons would otherwise paint as raw in-flow
 * elements until hydration and shift the content below. Absolute positioning takes them
 * out of the flow and `.hidden` (isReady is false on the server) keeps them invisible;
 * both lose to the full stylesheet once it lands. Both axes' placements are included —
 * the string is static and the rendered class picks one. Keep in sync with
 * Navigation.module.scss.
 */
const ssrCss =
	`.${styles.button},.${styles.slot}{position:absolute}` +
	`.${styles.prev},.${styles.slotPrev}` +
	`{top:50%;inset-inline-start:8px;transform:translateY(-50%)}` +
	`.${styles.next},.${styles.slotNext}` +
	`{top:50%;inset-inline-end:8px;transform:translateY(-50%)}` +
	`.${styles.prevVertical},.${styles.slotPrevVertical}` +
	`{top:8px;left:50%;transform:translateX(-50%)}` +
	`.${styles.nextVertical},.${styles.slotNextVertical}` +
	`{bottom:8px;left:50%;transform:translateX(-50%)}` +
	`.${styles.hidden}{opacity:0}`;

/**
 * Prev/next buttons, shipped as the tree-shakeable `lightslide/navigation` entry — pass to
 * `<LightSlide navigation={<Navigation />}>`. Hidden until the carousel has measured on the
 * client, so they never flash in an un-positioned spot during SSR / before first layout.
 * On a vertical carousel (`axis: 'y'`) the buttons move to the top/bottom edges and the
 * glyphs point along the axis. Custom render-prop buttons are wrapped in a positioning slot
 * that lands them in the same default spots (outside the clipping viewport) and dims itself
 * at the boundary, while the consumer owns the element's own markup.
 */
export function Navigation({
	style,
	className,
	prevStyle,
	nextStyle,
	prevClassName,
	nextClassName,
	renderPrev,
	renderNext,
}: NavigationProps) {
	const {currentIndex, maxIndex, isLoop, isReady, vertical, slidesId, goToIndex} =
		useNavContext();

	const handlePrev = useCallback(() => {
		goToIndex(currentIndex - 1, 'button');
	}, [currentIndex, goToIndex]);

	const handleNext = useCallback(() => {
		goToIndex(currentIndex + 1, 'button');
	}, [currentIndex, goToIndex]);

	const prevDisabled = !isLoop && currentIndex <= 0;
	const nextDisabled = !isLoop && currentIndex >= maxIndex;

	const hidden = isReady ? undefined : styles.hidden;

	return (
		<>
			<style dangerouslySetInnerHTML={{__html: ssrCss}} />
			{renderPrev ? (
				<div
					className={cx(
						styles.slot,
						vertical ? styles.slotPrevVertical : styles.slotPrev,
						prevDisabled ? styles.slotDisabled : undefined,
						hidden,
					)}>
					{renderPrev({
						direction: vertical ? 'up' : 'left',
						onClick: handlePrev,
						disabled: prevDisabled,
					})}
				</div>
			) : (
				<button
					aria-label="Previous slide"
					aria-controls={slidesId || undefined}
					disabled={prevDisabled}
					className={cx(
						styles.button,
						vertical ? styles.prevVertical : styles.prev,
						className,
						prevClassName,
						hidden,
					)}
					style={{...style, ...prevStyle}}
					onClick={handlePrev}>
					{vertical ? '˄' : '‹'}
				</button>
			)}

			{renderNext ? (
				<div
					className={cx(
						styles.slot,
						vertical ? styles.slotNextVertical : styles.slotNext,
						nextDisabled ? styles.slotDisabled : undefined,
						hidden,
					)}>
					{renderNext({
						direction: vertical ? 'down' : 'right',
						onClick: handleNext,
						disabled: nextDisabled,
					})}
				</div>
			) : (
				<button
					aria-label="Next slide"
					aria-controls={slidesId || undefined}
					disabled={nextDisabled}
					className={cx(
						styles.button,
						vertical ? styles.nextVertical : styles.next,
						className,
						nextClassName,
						hidden,
					)}
					style={{...style, ...nextStyle}}
					onClick={handleNext}>
					{vertical ? '˅' : '›'}
				</button>
			)}
		</>
	);
}

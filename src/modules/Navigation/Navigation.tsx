import {useCallback} from 'react';

import {useNavContext} from '../../lightSlideContext';
import {cx} from '../../utils/cx';
import styles from './Navigation.module.scss';
import type {NavigationProps} from './Navigation.types';

/**
 * Prev/next buttons, shipped as the tree-shakeable `lightslide/navigation` entry — pass to
 * `<LightSlide navigation={<Navigation />}>`. Hidden until the carousel has measured on the
 * client, so they never flash in an un-positioned spot during SSR / before first layout.
 * Custom render-prop buttons are wrapped in a positioning slot that lands them left/right of
 * centre (outside the clipping viewport) and dims itself at the boundary, while the consumer
 * owns the element's own markup.
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
	const {currentIndex, maxIndex, isLoop, isReady, slidesId, goToIndex} =
		useNavContext();

	const handlePrev = useCallback(() => {
		goToIndex(currentIndex - 1, 'button');
	}, [currentIndex, goToIndex]);

	const handleNext = useCallback(() => {
		goToIndex(currentIndex + 1, 'button');
	}, [currentIndex, goToIndex]);

	const prevDisabled = !isLoop && currentIndex <= 0;
	const nextDisabled = !isLoop && currentIndex >= maxIndex;

	const hidden = !isReady && styles.hidden;

	return (
		<>
			{renderPrev ? (
				<div
					className={cx(
						styles.slot,
						styles.slotPrev,
						prevDisabled && styles.slotDisabled,
						hidden,
					)}>
					{renderPrev({
						direction: 'left',
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
						styles.prev,
						className,
						prevClassName,
						hidden,
					)}
					style={{...style, ...prevStyle}}
					onClick={handlePrev}>
					‹
				</button>
			)}

			{renderNext ? (
				<div
					className={cx(
						styles.slot,
						styles.slotNext,
						nextDisabled && styles.slotDisabled,
						hidden,
					)}>
					{renderNext({
						direction: 'right',
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
						styles.next,
						className,
						nextClassName,
						hidden,
					)}
					style={{...style, ...nextStyle}}
					onClick={handleNext}>
					›
				</button>
			)}
		</>
	);
}

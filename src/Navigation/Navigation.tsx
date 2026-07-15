import {useCallback} from 'react';

import {useNavContext} from '../lightSlideContext';
import {cx} from '../utils/cx';
import styles from './Navigation.module.scss';
import type {NavigationConfig} from './Navigation.types';

type NavigationProps = {
	config: NavigationConfig;
};

/**
 * Prev/next buttons. Hidden until the carousel has measured on the client, so they never flash
 * in an un-positioned spot during SSR / before first layout. Custom render-prop buttons are
 * wrapped in a positioning slot that lands them left/right of centre (outside the clipping
 * viewport) and dims itself at the boundary, while the consumer owns the element's own markup.
 */
export function Navigation({config}: NavigationProps) {
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
			{config.renderPrev ? (
				<div
					className={cx(
						styles.slot,
						styles.slotPrev,
						prevDisabled && styles.slotDisabled,
						hidden,
					)}>
					{config.renderPrev({
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
						config.className,
						config.prevClassName,
						hidden,
					)}
					style={{...config.style, ...config.prevStyle}}
					onClick={handlePrev}>
					‹
				</button>
			)}

			{config.renderNext ? (
				<div
					className={cx(
						styles.slot,
						styles.slotNext,
						nextDisabled && styles.slotDisabled,
						hidden,
					)}>
					{config.renderNext({
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
						config.className,
						config.nextClassName,
						hidden,
					)}
					style={{...config.style, ...config.nextStyle}}
					onClick={handleNext}>
					›
				</button>
			)}
		</>
	);
}

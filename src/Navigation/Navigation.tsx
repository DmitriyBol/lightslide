import {useCallback} from 'react';

import {useNavContext} from '../lightSlideContext';
import {cx} from '../utils/cx';
import styles from './Navigation.module.scss';
import type {NavigationConfig} from './Navigation.types';

type NavigationProps = {
	config: NavigationConfig;
};

export function Navigation({config}: NavigationProps) {
	const {currentIndex, maxIndex, isLoop, isReady, goToIndex} = useNavContext();

	const handlePrev = useCallback(() => {
		goToIndex(currentIndex - 1, 'button');
	}, [currentIndex, goToIndex]);

	const handleNext = useCallback(() => {
		goToIndex(currentIndex + 1, 'button');
	}, [currentIndex, goToIndex]);

	const prevDisabled = !isLoop && currentIndex <= 0;
	const nextDisabled = !isLoop && currentIndex >= maxIndex;

	// Hidden until the carousel has measured on the client, so the buttons never flash in
	// an un-positioned spot during SSR / before first layout.
	const hidden = !isReady && styles.hidden;

	return (
		<>
			{config.renderPrev ? (
				// Custom JSX is wrapped in a positioning slot so it lands left-of-centre by
				// default (and outside the clipping viewport), while the consumer still owns
				// the element's own markup/styling. The slot dims itself at the boundary so
				// disabled state has a sensible default even for custom buttons.
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

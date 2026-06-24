import {useCallback} from 'react';

import {useLightSlideContext} from '../lightSlideContext';
import {cx} from '../utils/cx';
import styles from './Navigation.module.scss';
import type {NavigationConfig} from './Navigation.types';

type NavigationProps = {
	config: NavigationConfig;
};

export function Navigation({config}: NavigationProps) {
	const {currentIndex, maxIndex, isLoop, goToIndex} = useLightSlideContext();

	const handlePrev = useCallback(() => {
		goToIndex(currentIndex - 1, 'button');
	}, [currentIndex, goToIndex]);

	const handleNext = useCallback(() => {
		goToIndex(currentIndex + 1, 'button');
	}, [currentIndex, goToIndex]);

	const prevDisabled = !isLoop && currentIndex <= 0;
	const nextDisabled = !isLoop && currentIndex >= maxIndex;

	return (
		<>
			{config.renderPrev ? (
				// Custom JSX is wrapped in a positioning slot so it lands left-of-centre by
				// default (and outside the clipping viewport), while the consumer still owns
				// the element's own markup/styling.
				<div className={cx(styles.slot, styles.slotPrev)}>
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
					)}
					style={{...config.style, ...config.prevStyle}}
					onClick={handlePrev}>
					{config.prevLabel ?? '‹'}
				</button>
			)}

			{config.renderNext ? (
				<div className={cx(styles.slot, styles.slotNext)}>
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
					)}
					style={{...config.style, ...config.nextStyle}}
					onClick={handleNext}>
					{config.nextLabel ?? '›'}
				</button>
			)}
		</>
	);
}

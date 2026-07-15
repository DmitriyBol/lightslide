import {useCallback} from 'react';

import {useNavContext} from '../lightSlideContext';
import {cx} from '../utils/cx';
import styles from './Pagination.module.scss';
import type {PaginationConfig} from './Pagination.types';

type PaginationProps = {
	config: PaginationConfig;
};

/** Pagination dots — one per scrollable position, the active one marked aria-current. */
export function Pagination({config}: PaginationProps) {
	const {currentIndex, maxIndex, isReady, slidesId, goToIndex} =
		useNavContext();

	const dotCount = maxIndex + 1;

	const handleDotClick = useCallback(
		(index: number) => {
			goToIndex(index, 'pagination');
		},
		[goToIndex],
	);

	return (
		<div
			className={cx(
				styles.container,
				!isReady && styles.hidden,
				config.className,
			)}
			style={config.style}>
			{Array.from({length: dotCount}, (_, i) => {
				const isActive = i === currentIndex;
				return (
					<button
						key={i}
						aria-label={`Go to slide ${i + 1}`}
						aria-controls={slidesId || undefined}
						aria-current={isActive ? 'true' : undefined}
						className={cx(
							styles.dot,
							isActive && styles.active,
							config.dotClassName,
							isActive ? config.activeDotClassName : undefined,
						)}
						style={{
							...config.dotStyle,
							...(isActive ? config.activeDotStyle : undefined),
						}}
						onClick={() => handleDotClick(i)}
					/>
				);
			})}
		</div>
	);
}

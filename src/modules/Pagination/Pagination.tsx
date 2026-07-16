import {useCallback} from 'react';

import {useNavContext} from '../../lightSlideContext';
import {cx} from '../../utils/cx';
import styles from './Pagination.module.scss';
import type {PaginationProps} from './Pagination.types';

/**
 * Pagination dots — one per scrollable position, the active one marked aria-current. Shipped
 * as the tree-shakeable `lightslide/pagination` entry — pass to
 * `<LightSlide pagination={<Pagination />}>`.
 */
export function Pagination({
	style,
	className,
	dotStyle,
	dotClassName,
	activeDotStyle,
	activeDotClassName,
}: PaginationProps) {
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
			className={cx(styles.container, !isReady && styles.hidden, className)}
			style={style}>
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
							dotClassName,
							isActive ? activeDotClassName : undefined,
						)}
						style={{
							...dotStyle,
							...(isActive ? activeDotStyle : undefined),
						}}
						onClick={() => handleDotClick(i)}
					/>
				);
			})}
		</div>
	);
}

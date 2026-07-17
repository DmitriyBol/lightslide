import {useCallback} from 'react';

import {useNavContext} from '../../lightSlideContext';
import {cx} from '../../utils/cx';
import styles from './Pagination.module.scss';
import type {PaginationProps} from './Pagination.types';

/**
 * Critical layout CSS served with the markup: until the JS bundle injects the stylesheet,
 * server-rendered dots would paint as a column of default-sized buttons and shift the
 * content below on hydration. These rules reserve the dot row's exact final box (flex row,
 * dot size, padding) and `.hidden` (isReady is false on the server) keeps it invisible.
 * Keep in sync with Pagination.module.scss.
 */
const ssrCss =
	`.${styles.container}` +
	`{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 0 2px}` +
	`.${styles.dot}{width:8px;height:8px;padding:0;border:none}` +
	`.${styles.hidden}{opacity:0}`;

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
			<style dangerouslySetInnerHTML={{__html: ssrCss}} />
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

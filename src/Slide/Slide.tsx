import React from 'react';

import {useLightSlideContext} from '../lightSlideContext';
import type {SlideProps} from '../types';
import {cx} from '../utils/cx';
import styles from './Slide.module.scss';

export const Slide = React.memo(
	React.forwardRef<HTMLDivElement, SlideProps>(function Slide(
		{children, style, className},
		ref,
	) {
		const {slideWidth} = useLightSlideContext();

		return (
			<div
				ref={ref}
				className={cx(styles.slide, className)}
				style={{
					width: slideWidth > 0 ? `${slideWidth}px` : '100%',
					...style,
				}}>
				{children}
			</div>
		);
	}),
);

Slide.displayName = 'Slide';

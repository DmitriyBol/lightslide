import React from 'react';

import type {ForwardedRef, ReactElement, Ref} from 'react';

import {useSlideMetricsContext} from '../lightSlideContext';
import type {SlideProps} from '../types';
import {cx} from '../utils/cx';
import styles from './Slide.module.scss';

function SlideInner<T>(
	{children, style, className}: SlideProps<T>,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const {slideWidth} = useSlideMetricsContext();

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
}

// memo + forwardRef erase the type parameter, so the export is re-asserted with a generic
// call signature. `data` is the only generic field and it is render-irrelevant (read by
// the parent, not here), so the cast is purely about preserving the consumer's data type
// at the call site — e.g. `<Slide<Product> data={product} />`.
export const Slide = React.memo(React.forwardRef(SlideInner)) as (<T>(
	props: SlideProps<T> & {ref?: Ref<HTMLDivElement>},
) => ReactElement) & {displayName?: string};

Slide.displayName = 'Slide';

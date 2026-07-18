import React from 'react';

import type {ForwardedRef, ReactElement, Ref} from 'react';

import {useSlideMetricsContext} from '../seams/lightSlideContext';
import type {SlideProps} from '../types';
import {cx} from '../utils/cx/cx';
import styles from './Slide.module.scss';

/**
 * `data` is read by the `lightslide/analytics` plugin (event payloads), never rendered —
 * kept out of the DOM props.
 * `...rest` forwards anything else onto the slide node: the per-slide ARIA the carousel
 * injects via cloneElement (role / aria-roledescription / aria-label, or the hidden+inert
 * markers on loop clones), and any native attribute a consumer sets on <Slide>.
 * No inline width until the client has measured — the carousel's SSR critical CSS owns
 * the pre-measure calc() width, so server and first client paint agree.
 */
function SlideInner<T>(
	{children, style, className, data, ...rest}: SlideProps<T>,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const {slideWidth} = useSlideMetricsContext();

	return (
		<div
			ref={ref}
			{...rest}
			className={cx(styles.slide, className)}
			style={{
				width: slideWidth > 0 ? `${slideWidth}px` : undefined,
				...style,
			}}>
			{children}
		</div>
	);
}

/**
 * memo + forwardRef erase the type parameter, so the export is re-asserted with a generic
 * call signature. `data` is the only generic field and it is render-irrelevant (read by
 * the parent, not here), so the cast is purely about preserving the consumer's data type
 * at the call site — e.g. `<Slide<Product> data={product} />`.
 */
export const Slide = React.memo(React.forwardRef(SlideInner)) as (<T>(
	props: SlideProps<T> & {ref?: Ref<HTMLDivElement>},
) => ReactElement) & {displayName?: string};

Slide.displayName = 'Slide';

import React from 'react';

import type {ForwardedRef, ReactElement, Ref} from 'react';

import {useSlideMetricsContext} from '../seams/lightSlideContext';
import type {SlideProps} from '../types';
import {cx} from '../utils/cx/cx';
import styles from './Slide.module.scss';

/**
 * `data` is read by the `lightslide/analytics` plugin (event payloads), never rendered —
 * kept out of the DOM props.
 * `...rest` forwards the remaining SlideProps onto the slide node: the per-slide ARIA the
 * carousel injects via cloneElement (role / aria-roledescription / aria-label, or the
 * hidden+inert markers on loop clones), plus the `aria-*`, `role`, and `id` a consumer sets
 * on <Slide> (SlideProps is deliberately narrow — put interactive elements in the content).
 * The measured main-axis size applies as inline width — or height on a vertical carousel
 * (the axis comes with the metrics context; the cross axis is left to the flex stretch).
 * No inline size until the client has measured — the carousel's SSR critical CSS owns
 * the pre-measure calc() size, so server and first client paint agree.
 */
function SlideInner<T>(
	{children, style, className, data, ...rest}: SlideProps<T>,
	ref: ForwardedRef<HTMLDivElement>,
) {
	const {slideWidth, vertical} = useSlideMetricsContext();
	const size = slideWidth > 0 ? `${slideWidth}px` : undefined;

	return (
		<div
			ref={ref}
			{...rest}
			className={cx(styles.slide, className)}
			style={{
				...(vertical ? {height: size} : {width: size}),
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

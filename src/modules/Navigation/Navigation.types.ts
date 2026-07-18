import type {CSSProperties, ReactNode} from 'react';

import type {SlideDirection} from '../../types';

/**
 * Props handed to a custom render function for a navigation button. Wire `onClick` to your
 * element to drive navigation — it is the same handler the default button uses, so the
 * carousel_slide + carousel_nav_button analytics events fire exactly as they would for the
 * built-in button. `direction` is where the button points: 'left'/'right' on a horizontal
 * carousel, 'up'/'down' on a vertical one (`axis: 'y'`).
 */
export type NavButtonRenderProps = {
	direction: SlideDirection;
	onClick: () => void;
	disabled: boolean;
};

/**
 * Prev/next navigation buttons. style/className apply to both buttons;
 * prevStyle/nextStyle/prevClassName/nextClassName merge on top. renderPrev/renderNext fully
 * replace the default button with your own JSX (which is where any custom label goes) — you
 * attach the passed props.
 */
export type NavigationProps = {
	style?: CSSProperties;
	className?: string;
	prevStyle?: CSSProperties;
	nextStyle?: CSSProperties;
	prevClassName?: string;
	nextClassName?: string;
	renderPrev?: (props: NavButtonRenderProps) => ReactNode;
	renderNext?: (props: NavButtonRenderProps) => ReactNode;
};

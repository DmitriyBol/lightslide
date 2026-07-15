import type {CSSProperties, ReactNode} from 'react';

/**
 * Props handed to a custom render function for a navigation button.
 * Wire `onClick` to your element to drive navigation — this is the same
 * handler the default button uses, so the onSlide + onNavButtonClick
 * analytics events fire exactly as they would for the built-in button.
 */
export type NavButtonRenderProps = {
	direction: 'left' | 'right';
	onClick: () => void;
	disabled: boolean;
};

/**
 * Prev/next navigation buttons.
 * style/className apply to both buttons; prevStyle/nextStyle/prevClassName/nextClassName merge on top.
 * renderPrev/renderNext fully replace the default button with your own JSX (which is where
 * any custom label goes) — you attach the passed props.
 */
export type NavigationConfig = {
	style?: CSSProperties;
	className?: string;
	prevStyle?: CSSProperties;
	nextStyle?: CSSProperties;
	prevClassName?: string;
	nextClassName?: string;
	renderPrev?: (props: NavButtonRenderProps) => ReactNode;
	renderNext?: (props: NavButtonRenderProps) => ReactNode;
};

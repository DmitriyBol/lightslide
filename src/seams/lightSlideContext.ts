import {createContext, useContext} from 'react';

/**
 * Slide geometry only. Consumed by <Slide>; this changes just on resize, so slides do not
 * re-render on navigation (currentIndex lives in the separate NavContext below).
 * `slideWidth` is the main-axis slide size; `vertical` says which axis that is, so the
 * slide knows whether to apply it as inline width or height. `auto` is variable-width mode
 * (`slidesPerView: 'auto'`): the slide keeps its own content size, so no inline main-axis size
 * is applied at all.
 */
export type SlideMetricsContextType = {
	slideWidth: number;
	vertical: boolean;
	auto: boolean;
};

export const SlideMetricsContext = createContext<SlideMetricsContextType>({
	slideWidth: 0,
	vertical: false,
	auto: false,
});

export const useSlideMetricsContext = () => useContext(SlideMetricsContext);

/**
 * Navigation state. Consumed by Navigation and Pagination; changes on every navigation.
 * `isReady` is false until the carousel has laid out on the client (controls stay hidden
 * until then to avoid an un-positioned SSR/first-paint flash). `slidesId` is the id of the
 * slides container (the track), which the controls point aria-controls at. `vertical` is
 * the scroll axis — the navigation buttons place at the top/bottom edges and point their
 * glyphs along it.
 */
export type NavContextType = {
	currentIndex: number;
	maxIndex: number;
	isLoop: boolean;
	isReady: boolean;
	vertical: boolean;
	slidesId: string;
	goToIndex: (index: number, source: 'button' | 'pagination') => void;
};

export const NavContext = createContext<NavContextType | null>(null);

/**
 * <Navigation> / <Pagination> must be rendered inside a <LightSlide> (via its
 * `navigation`/`pagination` slots); using one anywhere else is a wiring bug, so fail loudly
 * rather than read a default that renders a silently inert control. Matches the rest of the
 * plugin family (a11y/flow/wheel/free/…). The full message is dev-only — consumer bundlers
 * substitute NODE_ENV and drop the long literal from production builds.
 */
export function useNavContext(): NavContextType {
	const ctx = useContext(NavContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? '<Navigation>/<Pagination> must be rendered inside <LightSlide navigation={…}/pagination={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}

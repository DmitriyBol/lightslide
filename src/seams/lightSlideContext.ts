import {createContext, useContext} from 'react';

/**
 * Slide geometry only. Consumed by <Slide>; this changes just on resize, so slides do not
 * re-render on navigation (currentIndex lives in the separate NavContext below).
 * `slideWidth` is the main-axis slide size; `vertical` says which axis that is, so the
 * slide knows whether to apply it as inline width or height.
 */
export type SlideMetricsContextType = {
	slideWidth: number;
	vertical: boolean;
};

export const SlideMetricsContext = createContext<SlideMetricsContextType>({
	slideWidth: 0,
	vertical: false,
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

export const NavContext = createContext<NavContextType>({
	currentIndex: 0,
	maxIndex: 0,
	isLoop: false,
	isReady: false,
	vertical: false,
	slidesId: '',
	goToIndex: () => {},
});

export const useNavContext = () => useContext(NavContext);

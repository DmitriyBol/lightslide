import {createContext, useContext} from 'react';

// Slide geometry only. Consumed by <Slide>; this changes just on resize, so slides do not
// re-render on navigation (currentIndex lives in the separate NavContext below).
export type SlideMetricsContextType = {
	slideWidth: number;
};

export const SlideMetricsContext = createContext<SlideMetricsContextType>({
	slideWidth: 0,
});

export const useSlideMetricsContext = () => useContext(SlideMetricsContext);

// Navigation state. Consumed by Navigation and Pagination; changes on every navigation.
// `isReady` is false until the carousel has laid out on the client (controls stay hidden
// until then to avoid an un-positioned SSR/first-paint flash).
export type NavContextType = {
	currentIndex: number;
	maxIndex: number;
	isLoop: boolean;
	isReady: boolean;
	goToIndex: (index: number, source: 'button' | 'pagination') => void;
};

export const NavContext = createContext<NavContextType>({
	currentIndex: 0,
	maxIndex: 0,
	isLoop: false,
	isReady: false,
	goToIndex: () => {},
});

export const useNavContext = () => useContext(NavContext);

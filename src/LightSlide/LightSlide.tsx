import {
	Children,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import type {DragEvent} from 'react';

import {useViewedSlides} from '../hooks/useViewedSlides';
import {NavContext, SlideMetricsContext} from '../lightSlideContext';
import {Navigation} from '../Navigation/Navigation';
import {Pagination} from '../Pagination/Pagination';
import type {LightSlideProps} from '../types';
import {cx} from '../utils/cx';
import {
	DEFAULT_FLOW_RESUME_DELAY,
	DEFAULT_FLOW_SPEED,
	DEFAULT_VIEWED_TIMEOUT,
} from './helpers/constants';
import {buildLoopChildren} from './helpers/loopClones';
import type {NavigateSource} from './helpers/navigation';
import {collectSlideData} from './helpers/slideData';
import {createStore} from './helpers/store';
import {useAutoScroll} from './helpers/useAutoScroll';
import {useDragGesture} from './helpers/useDragGesture';
import {useFlow} from './helpers/useFlow';
import {useSlideMetrics} from './helpers/useSlideMetrics';
import {useTrackSnap} from './helpers/useTrackSnap';
import {useViewportEngagement} from './helpers/useViewportEngagement';
import styles from './LightSlide.module.scss';

export function LightSlide<T = unknown>({
	children,
	style,
	className,
	trackStyle,
	trackClassName,
	analytics,
	slidesPerView = 1,
	autoScroll,
	flow,
	navigation,
	pagination,
	isLoop = false,
	loading = false,
	fallback,
}: LightSlideProps<T>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);

	// Single mutable store for all core data — read/written imperatively by the gesture
	// and animation hooks (zero re-renders). The "functional" pieces (analytics handlers,
	// the navigate fn) live in their own refs below. See helpers/store.ts.
	const storeRef = useRef(createStore<T>());

	// Latest-ref of the raw analytics prop. The single onEvent handler is called optionally at
	// each fire site (analytics?.onEvent?.(payload)) — no merging, no noop layer.
	const analyticsRef = useRef(analytics);
	analyticsRef.current = analytics;

	// Viewed-slides tracking is opt-in via the presence of `viewedTimeout`: the timer only runs
	// when the consumer sets it (otherwise the carousel_reached_end terminal stays armed). Its
	// value doubles as the duration knob (seconds), defaulting to DEFAULT_VIEWED_TIMEOUT.
	const viewedTrackingEnabled = analytics?.viewedTimeout !== undefined;
	const viewedTimeout = analytics?.viewedTimeout ?? DEFAULT_VIEWED_TIMEOUT;

	const childArray = useMemo(() => Children.toArray(children), [children]);
	const slideCount = childArray.length;
	// ceil, not floor: a fractional slidesPerView (e.g. 1.5) needs one extra reachable
	// position so the last slide can scroll flush to the right edge instead of stopping
	// half-cut. The track offset for that final index is clamped to the flush max by
	// trackOffset. For an integer slidesPerView ceil === floor, so nothing changes.
	const maxIndex = Math.max(0, Math.ceil(slideCount - slidesPerView));

	// While loading we render the fallback, not the track — so all auto motion
	// (flow / auto-scroll) must stay off until the real slides mount.
	const isLoading = loading;

	// The flow needs the loop-clone structure to wrap seamlessly, so it also
	// turns on effectiveLoop (whether or not the consumer set isLoop).
	const effectiveFlow = flow?.enabled === true && maxIndex > 0 && !isLoading;
	const effectiveLoop = (isLoop || effectiveFlow) && maxIndex > 0;
	const loopOffset = effectiveLoop ? Math.ceil(slidesPerView) : 0;

	// Collected once per children change, not on every navigation re-render — the store sync
	// below just points the store at it.
	const slideData = useMemo(() => collectSlideData<T>(childArray), [childArray]);

	// Sync the render-derived core data into the store every render. currentIndex and
	// autoScrollPaused are owned by the imperative path (navigation / drag) and never
	// overwritten here.
	const store = storeRef.current;
	store.slideCount = slideCount;
	store.maxIndex = maxIndex;
	store.slidesPerView = slidesPerView;
	store.viewedTimeout = viewedTimeout;
	store.effectiveFlow = effectiveFlow;
	store.isLoop = effectiveLoop;
	store.loopOffset = loopOffset;
	store.slideData = slideData;

	const getSlideData = useCallback(
		(index: number) => storeRef.current.slideData[index],
		[],
	);
	const {markViewed, getViewedSlides} = useViewedSlides(getSlideData);

	const {fireTerminalIfNeeded} = useViewportEngagement({
		containerRef,
		storeRef,
		analyticsRef,
		viewedTrackingEnabled,
		markViewed,
		getViewedSlides,
		getSlideData,
	});

	const [currentIndex, setCurrentIndex] = useState(0);

	// Reveal the controls only after the first client commit. Server-rendered (or
	// not-yet-measured) prev/next buttons would otherwise flash in an un-positioned spot
	// before the carousel lays out — they render at opacity 0 until ready instead.
	const [isReady, setIsReady] = useState(false);
	useLayoutEffect(() => {
		setIsReady(true);
	}, []);

	const {slideWidth, measureSlideWidth} = useSlideMetrics(
		containerRef,
		storeRef,
	);

	const {snapToVisual, snapTrack} = useTrackSnap(trackRef, storeRef);

	// Re-derive maxIndex, clamp the index, and re-snap (no animation) when the layout
	// shape changes — slidesPerView, loop mode, or loading clearing. Runs as a *layout*
	// effect so loop mode positions the track at its home offset before the first paint;
	// otherwise the prepend clones would flash for one frame and then jump to slide 0.
	useLayoutEffect(() => {
		measureSlideWidth();
		const s = storeRef.current;
		const newMax = Math.max(0, Math.ceil(s.slideCount - s.slidesPerView));
		s.maxIndex = newMax;
		const corrected = Math.min(s.currentIndex, newMax);
		s.currentIndex = corrected;
		setCurrentIndex(corrected);
		// While the flow runs it owns the transform (its rAF/layout effect positions
		// the track); snapping here would fight it. Restore discrete position otherwise.
		if (!s.effectiveFlow) snapTrack(corrected, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [slidesPerView, isLoop, flow?.enabled, loading]);

	// Single navigation path. `source` decides which extra analytics events fire and
	// whether a no-op drag snaps back; loop wrap-around is detected from the raw index.
	const navigateToIndex = useCallback(
		(nextIndex: number, source: NavigateSource) => {
			const {
				maxIndex: maxIdx,
				isLoop: loopMode,
				loopOffset: offset,
				slideCount: count,
				currentIndex: from,
			} = storeRef.current;

			const isBackwardWrap = loopMode && nextIndex < 0;
			const isForwardWrap = loopMode && nextIndex > maxIdx;

			let clamped: number;
			if (isBackwardWrap) clamped = maxIdx;
			else if (isForwardWrap) clamped = 0;
			else clamped = Math.max(0, Math.min(maxIdx, nextIndex));

			if (clamped === from && !isBackwardWrap && !isForwardWrap) {
				if (source === 'drag')
					snapToVisual(from + (loopMode ? offset : 0), true);
				return;
			}

			const direction: 'left' | 'right' =
				isForwardWrap || clamped > from ? 'right' : 'left';

			storeRef.current.currentIndex = clamped;
			setCurrentIndex(clamped);
			markViewed(clamped);

			analyticsRef.current?.onEvent?.({
				event: 'carousel_slide',
				direction,
				fromIndex: from,
				toIndex: clamped,
			});

			if (source === 'button') {
				analyticsRef.current?.onEvent?.({
					event: 'carousel_nav_button',
					direction,
					fromIndex: from,
					toIndex: clamped,
				});
			}
			if (source === 'pagination') {
				analyticsRef.current?.onEvent?.({
					event: 'carousel_pagination_click',
					fromIndex: from,
					toIndex: clamped,
				});
			}

			const isLoopWrap = isBackwardWrap || isForwardWrap;
			if (source !== 'auto' && !isLoopWrap && clamped === maxIdx) {
				fireTerminalIfNeeded('reachedEnd');
			}

			if (isBackwardWrap) {
				snapToVisual(0, true, () => snapToVisual(maxIdx + offset, false));
			} else if (isForwardWrap) {
				snapToVisual(count + offset, true, () => snapToVisual(offset, false));
			} else {
				snapToVisual(clamped + (loopMode ? offset : 0), true);
			}
		},
		[markViewed, fireTerminalIfNeeded, snapToVisual],
	);

	const goToIndex = useCallback(
		(index: number, source: 'button' | 'pagination') => {
			navigateToIndex(index, source);
		},
		[navigateToIndex],
	);

	// Two contexts so the slides don't re-render on navigation: <Slide> consumes only the
	// geometry (slideWidth, changes on resize), while Navigation/Pagination consume the
	// nav state (currentIndex etc., changes on every navigation).
	const metricsValue = useMemo(() => ({slideWidth}), [slideWidth]);
	const navValue = useMemo(
		() => ({
			currentIndex,
			maxIndex,
			isLoop: effectiveLoop,
			isReady,
			goToIndex,
		}),
		[currentIndex, maxIndex, effectiveLoop, isReady, goToIndex],
	);

	const navigateToIndexRef = useRef(navigateToIndex);
	navigateToIndexRef.current = navigateToIndex;

	// Flow supersedes step auto-scroll — they are both "auto motion". Neither runs
	// while loading (no track to move).
	useAutoScroll(effectiveFlow || isLoading ? undefined : autoScroll, {
		storeRef,
		navigateToIndexRef,
	});

	const dragHandlers = useDragGesture({
		trackRef,
		storeRef,
		snapToVisual,
		navigateToIndex,
	});

	const flowHandlers = useFlow({
		enabled: effectiveFlow,
		speed: flow?.speed ?? DEFAULT_FLOW_SPEED,
		resumeDelay: flow?.resumeDelay ?? DEFAULT_FLOW_RESUME_DELAY,
		trackRef,
		storeRef,
	});

	// In flow mode the flow owns the track (continuous drift + auto-resume);
	// otherwise the discrete drag-to-snap gesture is active.
	const pointerHandlers = effectiveFlow ? flowHandlers : dragHandlers;

	// Stop native image/anchor drag-and-drop from hijacking the pointer gesture
	// (which is what "drag is broken when a big component is inside" was).
	const preventNativeDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	const displayChildren = useMemo(
		() => buildLoopChildren(childArray, slideCount, loopOffset),
		[childArray, slideCount, loopOffset],
	);

	return (
		<SlideMetricsContext.Provider value={metricsValue}>
			<NavContext.Provider value={navValue}>
				<div
					ref={containerRef}
					className={cx(styles.container, className)}
					style={style}>
					{/* Stage height tracks the viewport only, so the controls anchored to it
					    centre on the track — never offset by the pagination row below. */}
					<div className={styles.stage}>
						<div className={styles.viewport}>
							{isLoading ? (
								fallback
							) : (
								<div
									ref={trackRef}
									className={cx(styles.track, trackClassName)}
									style={trackStyle}
									onDragStart={preventNativeDrag}
									{...pointerHandlers}>
									{displayChildren}
								</div>
							)}
						</div>

						{!isLoading && navigation && <Navigation config={navigation} />}
					</div>

					{!isLoading && pagination && <Pagination config={pagination} />}
				</div>
			</NavContext.Provider>
		</SlideMetricsContext.Provider>
	);
}

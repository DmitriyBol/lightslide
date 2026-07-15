import {
	Children,
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import type {DragEvent, ForwardedRef, ReactElement, Ref} from 'react';

import {A11yContext} from '../a11ySeam';
import {useViewedSlides} from '../hooks/useViewedSlides';
import {NavContext, SlideMetricsContext} from '../lightSlideContext';
import {Navigation} from '../Navigation/Navigation';
import {Pagination} from '../Pagination/Pagination';
import type {LightSlideHandle, LightSlideProps} from '../types';
import {cx} from '../utils/cx';
import {
	DEFAULT_FLOW_RESUME_DELAY,
	DEFAULT_FLOW_SPEED,
	DEFAULT_SLIDE_LABEL,
	DEFAULT_VIEWED_TIMEOUT,
} from './helpers/constants';
import {buildDisplayChildren} from './helpers/loopClones';
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

/**
 * The carousel orchestrator. The container is a WAI-ARIA APG carousel landmark — a labelled
 * `region` when `label` is given, else a plain `group`. The stage's height tracks the viewport
 * only, so the controls anchored to it centre on the track (never offset by the pagination row).
 * The a11y provider at the bottom only materialises when the consumer passes an `a11y` node,
 * so base consumers pay nothing for it.
 */
function LightSlideInner<T = unknown>(
	{
		children,
		style,
		className,
		trackStyle,
		trackClassName,
		label,
		slideLabel = DEFAULT_SLIDE_LABEL,
		analytics,
		slidesPerView = 1,
		initialIndex = 0,
		index,
		onIndexChange,
		autoScroll,
		flow,
		navigation,
		pagination,
		a11y,
		isLoop = false,
		loading = false,
		fallback,
	}: LightSlideProps<T>,
	ref: ForwardedRef<LightSlideHandle>,
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);

	/** SSR-safe id for the slides container — nav buttons and dots point aria-controls at it. */
	const slidesId = useId();

	/** First-render position; only the lower bound is known here — the mount effect clamps to maxIndex. */
	const startIndex = Math.max(0, index ?? initialIndex);

	/**
	 * Single mutable store for all core data, read/written imperatively by the gesture and
	 * animation hooks so hot paths never re-render. See helpers/store.ts.
	 */
	const storeRef = useRef(createStore<T>({currentIndex: startIndex}));

	/** Latest-refs of the callback props, so the navigation path stays stable across renders. */
	const analyticsRef = useRef(analytics);
	analyticsRef.current = analytics;
	const onIndexChangeRef = useRef(onIndexChange);
	onIndexChangeRef.current = onIndexChange;

	/** Viewed-slides tracking is opt-in via the presence of viewedTimeout (its value = seconds). */
	const viewedTrackingEnabled = analytics?.viewedTimeout !== undefined;
	const viewedTimeout = analytics?.viewedTimeout ?? DEFAULT_VIEWED_TIMEOUT;

	const childArray = useMemo(() => Children.toArray(children), [children]);
	const slideCount = childArray.length;
	/**
	 * ceil so a fractional slidesPerView gets one extra reachable position — the last slide
	 * scrolls flush to the right edge (trackOffset clamps that final offset).
	 */
	const maxIndex = Math.max(0, Math.ceil(slideCount - slidesPerView));

	const isLoading = loading;

	/**
	 * Auto-motion gate. The opt-in reduced-motion plugin flips it off through the a11y seam;
	 * base consumers never touch it.
	 */
	const [motionAllowed, setMotionAllowed] = useState(true);

	/** The flow needs the loop-clone structure to wrap seamlessly, so it forces effectiveLoop on. */
	const effectiveFlow =
		flow?.enabled === true && maxIndex > 0 && !isLoading && motionAllowed;
	const effectiveLoop = (isLoop || effectiveFlow) && maxIndex > 0;
	const loopOffset = effectiveLoop ? Math.ceil(slidesPerView) : 0;

	const slideData = useMemo(() => collectSlideData<T>(childArray), [childArray]);

	/**
	 * Render-derived data syncs into the store every render; currentIndex and autoScrollPaused
	 * are owned by the imperative path and never overwritten here.
	 */
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

	const [currentIndex, setCurrentIndex] = useState(startIndex);

	/** Controls stay at opacity 0 until the first client commit — no un-positioned SSR flash. */
	const [isReady, setIsReady] = useState(false);
	useLayoutEffect(() => {
		setIsReady(true);
	}, []);

	const {slideWidth, measureSlideWidth} = useSlideMetrics(
		containerRef,
		storeRef,
	);

	const {snapToVisual, snapTrack} = useTrackSnap(trackRef, storeRef);

	/**
	 * Re-measure, re-clamp, and re-snap (no animation) when the layout shape changes. A layout
	 * effect so loop mode positions the track before the first paint — no clone flash. A
	 * clamped-away position is reported to onIndexChange (a real change for synced state),
	 * and the snap is skipped while the flow runs — the flow owns the transform.
	 */
	useLayoutEffect(() => {
		measureSlideWidth();
		const s = storeRef.current;
		const newMax = Math.max(0, Math.ceil(s.slideCount - s.slidesPerView));
		s.maxIndex = newMax;
		const corrected = Math.min(s.currentIndex, newMax);
		if (corrected !== s.currentIndex) onIndexChangeRef.current?.(corrected);
		s.currentIndex = corrected;
		setCurrentIndex(corrected);
		if (!s.effectiveFlow) snapTrack(corrected, false);
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
	}, [slidesPerView, isLoop, flow?.enabled, loading]);

	/**
	 * The single navigation path. `source` decides which extra analytics events fire and
	 * whether a no-op drag snaps back; loop wrap-around is detected from the raw index.
	 */
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
			onIndexChangeRef.current?.(clamped);
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

	/**
	 * Split contexts: slides consume only geometry, controls consume nav state — navigating
	 * never re-renders the slides. navigateToIndex doubles as the contexts' goToIndex.
	 */
	const metricsValue = useMemo(() => ({slideWidth}), [slideWidth]);
	const navValue = useMemo(
		() => ({
			currentIndex,
			maxIndex,
			isLoop: effectiveLoop,
			isReady,
			slidesId,
			goToIndex: navigateToIndex,
		}),
		[currentIndex, maxIndex, effectiveLoop, isReady, slidesId, navigateToIndex],
	);

	const navigateToIndexRef = useRef(navigateToIndex);
	navigateToIndexRef.current = navigateToIndex;

	/**
	 * The external-control surface (`index` prop + ref handle): the same path as the built-in
	 * buttons, ignored while the flow owns the track. `step` skips the clamp so next/prev can
	 * wrap under isLoop; goTo and the controlled prop clamp instead of wrapping.
	 */
	const apiNavigate = useCallback((target: number, step?: boolean) => {
		const s = storeRef.current;
		if (s.effectiveFlow) return;
		navigateToIndexRef.current(
			step ? target : Math.max(0, Math.min(s.maxIndex, target)),
			'api',
		);
	}, []);

	/** Controlled position: navigate on `index` change. It does not lock the carousel. */
	useEffect(() => {
		if (index !== undefined) apiNavigate(index);
	}, [index, apiNavigate]);

	useImperativeHandle(
		ref,
		() => ({
			goTo: (target: number) => apiNavigate(target),
			next: () => apiNavigate(storeRef.current.currentIndex + 1, true),
			prev: () => apiNavigate(storeRef.current.currentIndex - 1, true),
			getIndex: () => storeRef.current.currentIndex,
		}),
		[apiNavigate],
	);

	/** Flow supersedes step auto-scroll; neither runs while loading or with the motion gate closed. */
	useAutoScroll(
		effectiveFlow || isLoading || !motionAllowed ? undefined : autoScroll,
		{
			storeRef,
			navigateToIndexRef,
		},
	);

	/** True while any auto motion runs — the live-region plugin stays quiet then. */
	const autoMotion =
		effectiveFlow || (motionAllowed && autoScroll?.enabled === true);

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

	const pointerHandlers = effectiveFlow ? flowHandlers : dragHandlers;

	/** Native image/anchor drag-and-drop would otherwise hijack the pointer gesture. */
	const preventNativeDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	const displayChildren = useMemo(
		() => buildDisplayChildren(childArray, slideCount, loopOffset, slideLabel),
		[childArray, slideCount, loopOffset, slideLabel],
	);

	return (
		<SlideMetricsContext.Provider value={metricsValue}>
			<NavContext.Provider value={navValue}>
				<div
					ref={containerRef}
					role={label ? 'region' : 'group'}
					aria-roledescription="carousel"
					aria-label={label}
					className={cx(styles.container, className)}
					style={style}>
					<div className={styles.stage}>
						<div className={styles.viewport}>
							{isLoading ? (
								fallback
							) : (
								<div
									ref={trackRef}
									id={slidesId}
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

					{a11y && (
						<A11yContext.Provider
							value={{
								containerRef,
								trackRef,
								storeRef,
								currentIndex,
								slideCount,
								maxIndex,
								slidesPerView,
								isLoop: effectiveLoop,
								autoMotion,
								goToIndex: navigateToIndex,
								setMotionAllowed,
							}}>
							{a11y}
						</A11yContext.Provider>
					)}
				</div>
			</NavContext.Provider>
		</SlideMetricsContext.Provider>
	);
}

/**
 * forwardRef erases the type parameter, so the export is re-asserted with a generic call
 * signature (same pattern as <Slide>): the slide data type keeps flowing into the analytics
 * payloads, while `ref` receives the imperative LightSlideHandle.
 */
export const LightSlide = forwardRef(LightSlideInner) as (<T = unknown>(
	props: LightSlideProps<T> & {ref?: Ref<LightSlideHandle>},
) => ReactElement) & {displayName?: string};

LightSlide.displayName = 'LightSlide';

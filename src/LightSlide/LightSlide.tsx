import {
	Children,
	forwardRef,
	useCallback,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import type {DragEvent, ForwardedRef, ReactElement, Ref} from 'react';

import {A11yContext} from '../a11ySeam';
import {FlowContext} from '../flowSeam';
import {FreeContext} from '../freeSeam';
import {useViewedSlides} from '../hooks/useViewedSlides';
import {NavContext, SlideMetricsContext} from '../lightSlideContext';
import type {LightSlideHandle, LightSlideProps} from '../types';
import {cx} from '../utils/cx';
import {WheelContext} from '../wheelSeam';
import {DEFAULT_SLIDE_LABEL, DEFAULT_VIEWED_TIMEOUT} from './helpers/constants';
import {buildMountPredicate, DEFAULT_LAZY_MARGIN} from './helpers/lazyMount';
import {buildDisplayChildren} from './helpers/loopClones';
import {collectSlideData} from './helpers/slideData';
import {createStore} from './helpers/store';
import {useAutoScroll} from './helpers/useAutoScroll';
import {useBreakpoints} from './helpers/useBreakpoints';
import {useDragGesture} from './helpers/useDragGesture';
import {useExternalControl} from './helpers/useExternalControl';
import {useHoverFocus} from './helpers/useHoverFocus';
import {useLatestRef} from './helpers/useLatestRef';
import {useLayoutResync} from './helpers/useLayoutResync';
import {useNavigation} from './helpers/useNavigation';
import type {PointerHandlers} from './helpers/usePointerGesture';
import {useSlideMetrics} from './helpers/useSlideMetrics';
import {useTrackSnap} from './helpers/useTrackSnap';
import {useViewportEngagement} from './helpers/useViewportEngagement';
import styles from './LightSlide.module.scss';

/**
 * The carousel orchestrator — a thin composition root over the helper hooks. It reads
 * top-to-bottom in phases: identity and imperative core, render state, geometry derived from
 * children, store sync, engagement analytics, motion (measure → snap → resync → navigate →
 * external control → auto motion → gestures), and finally the context values and markup.
 *
 * The container is a WAI-ARIA APG carousel landmark — a labelled `region` when `label` is
 * given, else a plain `group`. The stage's height tracks the viewport only, so the controls
 * anchored to it centre on the track (never offset by the pagination row). The viewport, not
 * the track, is the gesture surface: the track's flex box does not cover its overflowing
 * slides, so a pointerdown falling through a pointer-events-none loop clone would miss
 * handlers attached to the track — events from real slides bubble to the viewport all the
 * same. navigation /
 * pagination / flow / wheel / free / a11y are consumer-passed plugin nodes from their
 * tree-shakeable entries, rendered into their slots; their providers only materialise when a
 * node is passed, so base consumers pay nothing for any of them. Flow and free are
 * presence-based: the node being there turns the mode on, and the plugin hands its pointer
 * handlers back through its seam.
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
		slidesPerView: slidesPerViewProp = 1,
		gap: gapProp = 0,
		breakpoints,
		initialIndex = 0,
		index,
		onIndexChange,
		autoScroll,
		flow,
		navigation,
		pagination,
		wheel,
		free,
		a11y,
		isLoop = false,
		lazyMount,
		loading = false,
		fallback,
	}: LightSlideProps<T>,
	ref: ForwardedRef<LightSlideHandle>,
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);

	/** SSR-safe id for the slides container — nav buttons and dots point aria-controls at it. */
	const slidesId = useId();

	/** First-render position; only the lower bound is known here — useLayoutResync clamps to maxIndex. */
	const startIndex = Math.max(0, index ?? initialIndex);

	/**
	 * Single mutable store for all core data, read/written imperatively by the gesture and
	 * animation hooks so hot paths never re-render. See helpers/store.ts.
	 */
	const storeRef = useRef(createStore<T>({currentIndex: startIndex}));

	const [currentIndex, setCurrentIndex] = useState(startIndex);

	/** Controls stay at opacity 0 until the first client commit — no un-positioned SSR flash. */
	const [isReady, setIsReady] = useState(false);
	useLayoutEffect(() => {
		setIsReady(true);
	}, []);

	/**
	 * Auto-motion gate. The opt-in reduced-motion plugin flips it off through the a11y seam;
	 * base consumers never touch it.
	 */
	const [motionAllowed, setMotionAllowed] = useState(true);

	/** Latest-refs of the callback props, so the navigation path stays stable across renders. */
	const analyticsRef = useLatestRef(analytics);
	const onIndexChangeRef = useLatestRef(onIndexChange);

	/**
	 * Media-query overrides resolve into the effective geometry props before any derivation,
	 * so a breakpoint flip flows down the exact same path as a prop change (useLayoutResync
	 * re-measures, re-clamps, and re-snaps).
	 */
	const breakpointOverrides = useBreakpoints(breakpoints);
	const slidesPerView = breakpointOverrides?.slidesPerView ?? slidesPerViewProp;
	const gap = breakpointOverrides?.gap ?? gapProp;

	const childArray = useMemo(() => Children.toArray(children), [children]);
	const slideCount = childArray.length;

	/**
	 * ceil so a fractional slidesPerView gets one extra reachable position — the last slide
	 * scrolls flush to the right edge (trackOffset clamps that final offset).
	 */
	const maxIndex = Math.max(0, Math.ceil(slideCount - slidesPerView));

	/**
	 * Flow is presence-based: passing the node turns the mode on. It needs the loop-clone
	 * structure to wrap seamlessly, so it forces effectiveLoop on.
	 */
	const effectiveFlow =
		flow != null && flow !== false && maxIndex > 0 && !loading && motionAllowed;
	const effectiveLoop = (isLoop || effectiveFlow) && maxIndex > 0;
	const loopOffset = effectiveLoop ? Math.ceil(slidesPerView) : 0;

	/**
	 * True while any auto motion runs — it turns on the hover/focus pause listeners, and the
	 * live-region plugin stays quiet then.
	 */
	const autoMotion =
		effectiveFlow || (motionAllowed && autoScroll?.enabled === true);

	const slideData = useMemo(() => collectSlideData<T>(childArray), [childArray]);

	/** Viewed-slides tracking is opt-in via the presence of viewedTimeout (its value = seconds). */
	const viewedTrackingEnabled = analytics?.viewedTimeout !== undefined;
	const viewedTimeout = analytics?.viewedTimeout ?? DEFAULT_VIEWED_TIMEOUT;

	/**
	 * Render-derived data syncs into the store every render; currentIndex and autoScrollPaused
	 * are owned by the imperative path and never overwritten here.
	 */
	const store = storeRef.current;
	store.slideCount = slideCount;
	store.maxIndex = maxIndex;
	store.slidesPerView = slidesPerView;
	store.gap = gap;
	store.viewedTimeout = viewedTimeout;
	store.effectiveFlow = effectiveFlow;
	store.isLoop = effectiveLoop;
	store.loopOffset = loopOffset;
	store.slideData = slideData;

	const getSlideData = useCallback(
		(slideIndex: number) => storeRef.current.slideData[slideIndex],
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

	const {slideWidth, measureSlideWidth} = useSlideMetrics(
		containerRef,
		storeRef,
	);

	const {snapToVisual, snapTrack} = useTrackSnap(trackRef, storeRef);

	useLayoutResync({
		storeRef,
		measureSlideWidth,
		snapTrack,
		onIndexChangeRef,
		setCurrentIndex,
		slidesPerView,
		gap,
		isLoop,
		flowEnabled: effectiveFlow,
		loading,
	});

	const navigateToIndex = useNavigation<T>({
		storeRef,
		analyticsRef,
		onIndexChangeRef,
		setCurrentIndex,
		markViewed,
		fireTerminalIfNeeded,
		snapToVisual,
	});
	const navigateToIndexRef = useLatestRef(navigateToIndex);

	useExternalControl({ref, index, storeRef, navigateToIndexRef});

	useHoverFocus({enabled: autoMotion, containerRef, storeRef});

	/** Flow supersedes step auto-scroll; neither runs while loading or with the motion gate closed. */
	useAutoScroll(
		effectiveFlow || loading || !motionAllowed ? undefined : autoScroll,
		{
			storeRef,
			navigateToIndexRef,
		},
	);

	const dragHandlers = useDragGesture({
		trackRef,
		storeRef,
		snapToVisual,
		goToIndex: navigateToIndex,
	});

	/**
	 * Plugin-owned gestures replace the built-in drag-to-snap through the seams: while the
	 * flow is active its plugin owns the track outright; otherwise a mounted free plugin's
	 * momentum handlers take over. Drag-to-snap falls back in until a plugin registers.
	 */
	const [flowHandlers, setFlowHandlers] = useState<PointerHandlers | null>(
		null,
	);
	const [freeHandlers, setFreeHandlers] = useState<PointerHandlers | null>(
		null,
	);
	const pointerHandlers =
		effectiveFlow && flowHandlers
			? flowHandlers
			: (freeHandlers ?? dragHandlers);

	const pluginActive = maxIndex > 0 && !loading;

	const flowSeamValue = useMemo(
		() => ({
			trackRef,
			storeRef,
			active: effectiveFlow,
			setPointerHandlers: setFlowHandlers,
		}),
		[effectiveFlow],
	);

	const freeSeamValue = useMemo(
		() => ({
			trackRef,
			storeRef,
			active: pluginActive,
			goToIndex: navigateToIndex,
			setPointerHandlers: setFreeHandlers,
		}),
		[pluginActive, navigateToIndex],
	);

	const wheelSeamValue = useMemo(
		() => ({
			containerRef,
			storeRef,
			active: pluginActive,
			goToIndex: navigateToIndex,
		}),
		[pluginActive, navigateToIndex],
	);

	/** Native image/anchor drag-and-drop would otherwise hijack the pointer gesture. */
	const preventNativeDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	/**
	 * Lazy mounting keys off the settled currentIndex (cheap, synchronous with the
	 * geometry), so it only applies where the track has a resting window — flow's
	 * continuous motion turns it off. While active, the children derivation below
	 * recomputes per navigation; memoized slides whose window state didn't change skip.
	 */
	const lazyActive = lazyMount ? !effectiveFlow : false;
	const lazyMargin =
		typeof lazyMount === 'object'
			? (lazyMount.margin ?? DEFAULT_LAZY_MARGIN)
			: DEFAULT_LAZY_MARGIN;
	const isSlideMounted = useMemo(
		() =>
			lazyActive
				? buildMountPredicate(
						currentIndex,
						slideCount,
						slidesPerView,
						maxIndex,
						effectiveLoop,
						lazyMargin,
					)
				: null,
		[
			lazyActive,
			currentIndex,
			slideCount,
			slidesPerView,
			maxIndex,
			effectiveLoop,
			lazyMargin,
		],
	);

	const displayChildren = useMemo(
		() =>
			buildDisplayChildren(
				childArray,
				slideCount,
				loopOffset,
				slideLabel,
				isSlideMounted,
			),
		[childArray, slideCount, loopOffset, slideLabel, isSlideMounted],
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
						<div
							className={styles.viewport}
							onDragStart={preventNativeDrag}
							{...pointerHandlers}>
							{loading ? (
								fallback
							) : (
								<div
									ref={trackRef}
									id={slidesId}
									className={cx(styles.track, trackClassName)}
									style={gap > 0 ? {columnGap: gap, ...trackStyle} : trackStyle}>
									{displayChildren}
								</div>
							)}
						</div>

						{!loading && navigation}
					</div>

					{!loading && pagination}

					{flow && (
						<FlowContext.Provider value={flowSeamValue}>
							{flow}
						</FlowContext.Provider>
					)}

					{wheel && (
						<WheelContext.Provider value={wheelSeamValue}>
							{wheel}
						</WheelContext.Provider>
					)}

					{free && (
						<FreeContext.Provider value={freeSeamValue}>
							{free}
						</FreeContext.Provider>
					)}

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
								isFlow: effectiveFlow,
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

import {Children, forwardRef, useId, useMemo, useRef, useState} from 'react';

import type {ForwardedRef} from 'react';

import {A11yContext} from '../seams/a11ySeam';
import {AnalyticsContext} from '../seams/analyticsSeam';
import {AutoplayContext} from '../seams/autoplaySeam';
import {FlowContext} from '../seams/flowSeam';
import {FreeContext} from '../seams/freeSeam';
import {NavContext, SlideMetricsContext} from '../seams/lightSlideContext';
import {WheelContext} from '../seams/wheelSeam';
import type {LightSlideHandle, LightSlideProps} from '../types';
import {cx} from '../utils/cx/cx';
import {DEFAULT_SLIDE_LABEL} from './helpers/constants';
import {buildSsrCss} from './helpers/ssrStyles/ssrStyles';
import {createStore} from './helpers/store';
import {centerLead} from './helpers/trackOffset/trackOffset';
import {useDisplayChildren} from './helpers/useDisplayChildren/useDisplayChildren';
import {useExternalControl} from './helpers/useExternalControl/useExternalControl';
import {useGestureHandlers} from './helpers/useGestureHandlers/useGestureHandlers';
import {useIsomorphicLayoutEffect} from './helpers/useIsomorphicLayoutEffect/useIsomorphicLayoutEffect';
import {useLatestRef} from './helpers/useLatestRef/useLatestRef';
import {useLayoutResync} from './helpers/useLayoutResync/useLayoutResync';
import {useNavigation} from './helpers/useNavigation/useNavigation';
import {useSeamValues} from './helpers/useSeamValues/useSeamValues';
import {useSlideMetrics} from './helpers/useSlideMetrics/useSlideMetrics';
import {useTrackSnap} from './helpers/useTrackSnap/useTrackSnap';
import styles from './LightSlide.module.scss';

/**
 * The carousel orchestrator — a thin composition root over the helper hooks, organised in
 * labelled phases: identity & imperative core → render state → geometry → store sync →
 * motion & control → plugin seams → children & critical CSS → contexts & markup.
 *
 * The container is a WAI-ARIA APG carousel landmark — a labelled `region` when `label` is
 * given, else a plain `group`. The stage's height tracks the viewport only, so the controls
 * anchored to it centre on the track (never offset by the pagination row). The viewport, not
 * the track, is the gesture surface: the track's flex box does not cover its overflowing
 * slides, so a pointerdown falling through a pointer-events-none loop clone would miss
 * handlers attached to the track — events from real slides bubble to the viewport all the
 * same. navigation / pagination / flow / wheel / free / autoplay / analytics / a11y are
 * consumer-passed plugin nodes from their tree-shakeable entries, rendered into their slots;
 * their providers only materialise when a node is passed, so base consumers pay nothing for
 * any of them. Flow and free are presence-based: the node being there turns the mode on, and
 * the plugin hands its pointer handlers back through its seam.
 */
function LightSlideInner(
	{
		children,
		style,
		className,
		trackStyle,
		trackClassName,
		label,
		slideLabel = DEFAULT_SLIDE_LABEL,
		slidesPerView = 1,
		gap = 0,
		axis = 'x',
		dir,
		align = 'start',
		initialIndex = 0,
		index,
		onIndexChange,
		flow,
		navigation,
		pagination,
		wheel,
		free,
		autoplay,
		analytics,
		a11y,
		loop = false,
		lazyMount,
		loading = false,
		fallback,
	}: LightSlideProps,
	ref: ForwardedRef<LightSlideHandle>,
) {
	/** ————————————————— Identity & imperative core ————————————————— */

	const containerRef = useRef<HTMLDivElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);

	/** SSR-safe id for the slides container — nav buttons and dots point aria-controls at it. */
	const slidesId = useId();

	/** First-render position; only the lower bound is known here — useLayoutResync clamps to maxIndex. */
	const startIndex = Math.max(0, index ?? initialIndex);

	/**
	 * Single mutable store for all core data, read/written imperatively by the gesture and
	 * animation hooks so hot paths never re-render. See helpers/store.ts.
	 */
	const storeRef = useRef(createStore({currentIndex: startIndex}));

	/** ————————————————— Render state ————————————————— */

	const [currentIndex, setCurrentIndex] = useState(startIndex);

	/** Controls stay at opacity 0 until the first client commit — no un-positioned SSR flash. */
	const [isReady, setIsReady] = useState(false);
	useIsomorphicLayoutEffect(() => {
		setIsReady(true);
	}, []);

	/**
	 * Auto-motion gate. The opt-in reduced-motion plugin flips it off through the a11y seam;
	 * base consumers never touch it.
	 */
	const [motionAllowed, setMotionAllowed] = useState(true);

	/** Latest-ref of the callback prop, so the navigation path stays stable across renders. */
	const onIndexChangeRef = useLatestRef(onIndexChange);

	/** ————————————————— Geometry (props → effective layout) ————————————————— */

	const childArray = useMemo(() => Children.toArray(children), [children]);
	const slideCount = childArray.length;

	/**
	 * ceil so a fractional slidesPerView gets one extra reachable position — the last slide
	 * scrolls flush to the right edge (trackOffset clamps that final offset).
	 */
	const maxIndex = Math.max(0, Math.ceil(slideCount - slidesPerView));

	/**
	 * Flow and autoplay are presence-based: passing the node turns the mode on. Flow needs
	 * the loop-clone structure to wrap seamlessly, so it forces effectiveLoop on.
	 */
	const effectiveFlow =
		flow != null && flow !== false && maxIndex > 0 && !loading && motionAllowed;
	const effectiveLoop = (loop || effectiveFlow) && maxIndex > 0;
	const hasAutoplay = autoplay != null && autoplay !== false;

	/**
	 * With exactly one slide per view there is nothing to centre against, so center mode
	 * only engages past 1. Looping then needs centerLead extra clones per side: the centring
	 * inset exposes slides left of the active one, and the backward wrap-dance parks that
	 * far into the prepend strip (capped — clones can't outnumber the slides they copy).
	 */
	const isCentered = align === 'center' && slidesPerView > 1;
	const isVertical = axis === 'y';
	/** Vertical order has no reading direction — the axis wins over `dir` for the sign. */
	const isRtl = dir === 'rtl' && !isVertical;
	const loopOffset = effectiveLoop
		? Math.min(
				slideCount,
				Math.ceil(slidesPerView) + (isCentered ? centerLead(slidesPerView) : 0),
			)
		: 0;

	/**
	 * True while any auto motion runs — the live-region plugin stays quiet then. The plugins
	 * own their pause listeners; the core only needs the fact of motion for the a11y seam.
	 */
	const autoMotion = effectiveFlow || (motionAllowed && hasAutoplay);

	/** ————————————————— Store sync ————————————————— */

	/**
	 * Render-derived data syncs into the store every render; currentIndex, autoScrollPaused,
	 * and restOffset are owned by the imperative path and never overwritten here.
	 */
	const store = storeRef.current;
	store.slideCount = slideCount;
	store.maxIndex = maxIndex;
	store.slidesPerView = slidesPerView;
	store.gap = gap;
	store.dirSign = isRtl ? -1 : 1;
	store.vertical = isVertical;
	store.effectiveFlow = effectiveFlow;
	store.isLoop = effectiveLoop;
	store.loopOffset = loopOffset;

	/** ————————————————— Motion & control ————————————————— */

	const {slideWidth, measureSlideWidth} = useSlideMetrics(
		viewportRef,
		storeRef,
		isCentered,
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
		vertical: isVertical,
		centered: isCentered,
		isLoop: loop,
		flowEnabled: effectiveFlow,
		loading,
	});

	const navigateToIndex = useNavigation({
		storeRef,
		onIndexChangeRef,
		setCurrentIndex,
		snapToVisual,
	});
	const navigateToIndexRef = useLatestRef(navigateToIndex);

	useExternalControl({ref, index, storeRef, navigateToIndexRef});

	const {pointerHandlers, preventNativeDrag, setFlowHandlers, setFreeHandlers} =
		useGestureHandlers({
			trackRef,
			storeRef,
			snapToVisual,
			goToIndex: navigateToIndex,
			effectiveFlow,
		});

	/** ————————————————— Plugin seams ————————————————— */

	const pluginActive = maxIndex > 0 && !loading;
	/** Flow supersedes autoplay; neither runs while loading or with the motion gate closed. */
	const autoplayActive = pluginActive && motionAllowed && !effectiveFlow;
	/** The wheel slot is inert on a vertical carousel — a vertical wheel is page scrolling. */
	const wheelActive = pluginActive && !isVertical;

	const {
		flowSeamValue,
		freeSeamValue,
		wheelSeamValue,
		autoplaySeamValue,
		analyticsSeamValue,
	} = useSeamValues({
		containerRef,
		trackRef,
		storeRef,
		effectiveFlow,
		pluginActive,
		wheelActive,
		autoplayActive,
		goToIndex: navigateToIndex,
		setFlowHandlers,
		setFreeHandlers,
		childArray,
	});

	/** ————————————————— Children & critical CSS ————————————————— */

	const displayChildren = useDisplayChildren({
		childArray,
		slideCount,
		slidesPerView,
		maxIndex,
		currentIndex,
		loopOffset,
		effectiveLoop,
		effectiveFlow,
		isCentered,
		lazyMount,
		slideLabel,
	});

	/**
	 * Critical layout CSS served inside the markup so the server paint already matches the
	 * final layout (the head stylesheet only exists once the JS bundle runs). Computed once:
	 * the server text and the first client render must agree for hydration, and after mount
	 * the measured px slide width and the imperative track transform override these rules —
	 * they go inert and must not chase prop or navigation changes.
	 */
	const [ssrCss] = useState(() =>
		buildSsrCss({
			slidesId,
			slidesPerView,
			gap,
			startVisual: loopOffset + Math.min(startIndex, maxIndex),
			centered: isCentered,
			isLoop: effectiveLoop,
			rtl: isRtl,
			vertical: isVertical,
		}),
	);

	/** ————————————————— Contexts & markup ————————————————— */

	/**
	 * Split contexts: slides consume only geometry, controls consume nav state — navigating
	 * never re-renders the slides. navigateToIndex doubles as the contexts' goToIndex.
	 */
	const metricsValue = useMemo(
		() => ({slideWidth, vertical: isVertical}),
		[slideWidth, isVertical],
	);
	const navValue = useMemo(
		() => ({
			currentIndex,
			maxIndex,
			isLoop: effectiveLoop,
			isReady,
			vertical: isVertical,
			slidesId,
			goToIndex: navigateToIndex,
		}),
		[
			currentIndex,
			maxIndex,
			effectiveLoop,
			isReady,
			isVertical,
			slidesId,
			navigateToIndex,
		],
	);

	return (
		<SlideMetricsContext.Provider value={metricsValue}>
			<NavContext.Provider value={navValue}>
				<div
					ref={containerRef}
					role={label ? 'region' : 'group'}
					aria-roledescription="carousel"
					aria-label={label}
					dir={dir}
					className={cx(
						styles.container,
						isVertical ? styles.vertical : undefined,
						className,
					)}
					style={style}>
					<style dangerouslySetInnerHTML={{__html: ssrCss}} />
					<div className={styles.stage}>
						<div
							ref={viewportRef}
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
									style={gap > 0 ? {gap, ...trackStyle} : trackStyle}>
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

					{autoplay && (
						<AutoplayContext.Provider value={autoplaySeamValue}>
							{autoplay}
						</AutoplayContext.Provider>
					)}

					{analytics && (
						<AnalyticsContext.Provider value={analyticsSeamValue}>
							{analytics}
						</AnalyticsContext.Provider>
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

export const LightSlide = forwardRef<LightSlideHandle, LightSlideProps>(
	LightSlideInner,
);

LightSlide.displayName = 'LightSlide';

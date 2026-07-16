/**
 * What triggered a navigation — controls which extra analytics events fire.
 * 'api' is the external surface: the controlled `index` prop and the ref handle.
 * 'settle' is a free-drag coast coming to rest: the index commits (state, analytics,
 * pagination) but the track is NOT snapped — it stays where the momentum stopped.
 */
export type NavigateSource =
	| 'drag'
	| 'button'
	| 'pagination'
	| 'auto'
	| 'api'
	| 'settle';

/** The single navigation function shared between LightSlide and its gesture/auto-scroll hooks. */
export type NavigateFn = (nextIndex: number, source: NavigateSource) => void;

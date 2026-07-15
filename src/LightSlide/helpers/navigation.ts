// What triggered a navigation — controls which extra analytics events fire.
// 'api' is the external surface: the controlled `index` prop and the ref handle.
export type NavigateSource = 'drag' | 'button' | 'pagination' | 'auto' | 'api';

// The single navigation function shared between LightSlide and its gesture/auto-scroll hooks.
export type NavigateFn = (nextIndex: number, source: NavigateSource) => void;

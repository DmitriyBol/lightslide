/**
 * Opt-in prev/next buttons, shipped as the tree-shakeable `lightslide/navigation` entry.
 * Import and pass to `<LightSlide navigation={<Navigation />}>`; bundles that don't never
 * pay for the buttons or their styles.
 */
export {Navigation} from './Navigation';
export type {NavButtonRenderProps, NavigationProps} from './Navigation.types';

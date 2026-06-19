// Ambient declaration so TypeScript understands CSS-module imports.
// The runtime transform (SCSS → scoped class map) is done by rollup-plugin-postcss
// at build time and by identity-obj-proxy under Jest.
declare module '*.module.scss' {
	const classes: {readonly [key: string]: string};
	export default classes;
}

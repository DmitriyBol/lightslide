import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Resolve 'lightslide' directly to the package source — no build step needed.
export default defineConfig({
	plugins: [react()],
	resolve: {
		// Order matters: the more specific subpath alias must come first, otherwise the bare
		// `lightslide` alias would swallow `lightslide/a11y` and mis-resolve it.
		alias: [
			{
				find: 'lightslide/a11y',
				replacement: path.resolve(__dirname, '../src/modules/a11y/index.ts'),
			},
			{
				find: 'lightslide/navigation',
				replacement: path.resolve(__dirname, '../src/modules/Navigation/index.ts'),
			},
			{
				find: 'lightslide/pagination',
				replacement: path.resolve(__dirname, '../src/modules/Pagination/index.ts'),
			},
			{
				find: 'lightslide/flow',
				replacement: path.resolve(__dirname, '../src/modules/flow/index.ts'),
			},
			{
				find: 'lightslide/wheel',
				replacement: path.resolve(__dirname, '../src/modules/wheel/index.ts'),
			},
			{
				find: 'lightslide/free',
				replacement: path.resolve(__dirname, '../src/modules/free/index.ts'),
			},
			{
				find: 'lightslide/autoplay',
				replacement: path.resolve(__dirname, '../src/modules/autoplay/index.ts'),
			},
			{
				find: 'lightslide/analytics',
				replacement: path.resolve(
					__dirname,
					'../src/modules/analytics/index.ts',
				),
			},
			{
				find: 'lightslide/breakpoints',
				replacement: path.resolve(
					__dirname,
					'../src/modules/breakpoints/index.ts',
				),
			},
			{
				find: 'lightslide',
				replacement: path.resolve(__dirname, '../src/index.ts'),
			},
		],
	},
});

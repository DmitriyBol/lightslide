import path from 'path';
import react from '@vitejs/plugin-react';
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
				replacement: path.resolve(__dirname, '../src/a11y/index.ts'),
			},
			{
				find: 'lightslide',
				replacement: path.resolve(__dirname, '../src/index.ts'),
			},
		],
	},
});

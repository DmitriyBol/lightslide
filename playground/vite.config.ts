import path from 'path';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// Resolve 'lightslide' directly to the package source — no build step needed.
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			lightslide: path.resolve(__dirname, '../src/index.ts'),
		},
	},
});

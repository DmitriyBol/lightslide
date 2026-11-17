import {defineConfig, devices} from '@playwright/test';

// Vite dev-server address for the playground. 127.0.0.1, not localhost: Vite binds IPv6-only
// (::1) by default while `localhost` health checks can resolve to IPv4 — a ready server the
// webServer check then never sees. strictPort makes Playwright fail fast instead of silently
// waiting on the wrong port if 5173 is already taken.
const HOST = '127.0.0.1';
const PORT = 5173;

// E2E runs against the live playground (Vite), which aliases `lightslide` straight to ../src —
// so these specs exercise the real source in a real browser. The Jest/jsdom integration tests
// stay the fast inner loop; e2e guards what jsdom physically can't: pointer drag, layout-measured
// slide widths, CSS transforms, loop/flow motion.
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	// No accidental `test.only` slipping into CI.
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: [['list'], ['html', {open: 'never'}]],
	use: {
		baseURL: `http://${HOST}:${PORT}`,
		trace: 'on-first-retry',
	},
	// Chromium only to start — firefox/webkit are one extra line here once the suite settles.
	projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
	webServer: {
		command: `npm run dev --prefix playground -- --host ${HOST} --port ${PORT} --strictPort`,
		url: `http://${HOST}:${PORT}`,
		// Locally reuse a playground server you already have running; in CI always boot a fresh one.
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});

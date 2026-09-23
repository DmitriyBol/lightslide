import type {Locator} from '@playwright/test';
import {expect} from '@playwright/test';

/**
 * One live coordinate of something that moves — a box edge, a parsed transform — or NaN while
 * there is nothing to read. The probes below take any reader, so a spec can watch a transform
 * as easily as a box.
 */
export type Reader = () => Promise<number>;

/** Reads the target's box edge along `axis`. */
export function edge(target: Locator, axis: 'x' | 'y' = 'x'): Reader {
	return async () => (await target.boundingBox())?.[axis] ?? Number.NaN;
}

/**
 * Waits for motion itself — the flow drift, a free coast, the playground's smooth scroll and
 * reveal-on-scroll — instead of sleeping a fixed interval. "Sample, sleep N ms, sample" reads
 * the product's timing through the test runner's: on a loaded machine the page handles input
 * late, so a sample can predate the pause or resume it means to measure, and a pointer aimed
 * at a box still scrolling into place lands beside it (LIG-27). Polls until two consecutive
 * samples at least 150 ms apart agree within half a pixel — impossible while anything drifts,
 * coasts, or scrolls — and resolves where the target stopped.
 */
export async function waitForRest(read: Reader): Promise<number> {
	let last = Number.NaN;
	await expect
		.poll(
			async () => {
				const prev = last;
				last = await read();
				return Math.abs(last - prev);
			},
			{intervals: [150], timeout: 10_000, message: 'never came to rest'},
		)
		.toBeLessThan(0.5);
	return last;
}

/** Polls until the reading has left `from` by more than `distance` px, however late. */
export async function expectMovedFrom(
	read: Reader,
	from: number,
	distance: number,
): Promise<void> {
	await expect
		.poll(async () => Math.abs((await read()) - from), {timeout: 10_000})
		.toBeGreaterThan(distance);
}

/**
 * scrollIntoViewIfNeeded returns while the playground's smooth scroll may still be running
 * and before the section's reveal (a 480 ms slide up) settles — and hover()'s stability check
 * passes on any two matching frames, which a dropped frame mid-scroll provides. A pointer
 * aimed then lands beside the target once it stops (the wheel spec's missed flicks). Scroll,
 * then wait the motion out.
 */
export async function scrollToRest(target: Locator): Promise<void> {
	await target.scrollIntoViewIfNeeded();
	await waitForRest(edge(target, 'y'));
}

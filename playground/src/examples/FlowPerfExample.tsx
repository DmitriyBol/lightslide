import {useEffect, useRef, useState} from 'react';
import type {RefObject} from 'react';

import {Controls, Demo} from '../components/Demo';
import {Toggle} from '../components/Toggle';
import perf from './FlowPerfExample.module.scss';

// Isolates the v0.5.7 fix: the flow rAF loop used to read container.offsetWidth every frame,
// forcing a synchronous reflow whenever layout was dirty. One shared loop drives both strips in
// a fixed order each frame: (1) dirty a big DOM (only while "heavy" is on), (2) step the CACHED
// strip (reads a stored width, writes only transform), (3) step the LIVE strip (reads
// offsetWidth → pays a reflow because step 1 left layout dirty). The per-strip work meter makes
// the cost visible.

const ITEMS = [
	'React',
	'TypeScript',
	'Vite',
	'Rollup',
	'Jest',
	'SCSS',
	'ESLint',
	'Prettier',
	'Zero deps',
	'Cached width',
];

const HEAVY_NODES = 5000;

type StripProps = {
	label: string;
	note: string;
	ms: number;
	containerRef: RefObject<HTMLDivElement>;
	trackRef: RefObject<HTMLDivElement>;
};

function Strip({label, note, ms, containerRef, trackRef}: StripProps) {
	const hot = ms > 1;
	return (
		<div className={perf.strip}>
			<div className={perf.stripHead}>
				<span className={perf.stripLabel}>{label}</span>
				<span
					className={`${perf.meter} ${hot ? perf.meterHot : perf.meterCool} tnum`}>
					{ms.toFixed(2)} ms / frame
				</span>
			</div>
			<div ref={containerRef} className={perf.viewport}>
				<div ref={trackRef} className={perf.track}>
					{[...ITEMS, ...ITEMS].map((it, i) => (
						<span key={i} className={perf.chip}>
							<span className={perf.dot} />
							{it}
						</span>
					))}
				</div>
			</div>
			<p className={perf.note}>{note}</p>
		</div>
	);
}

export function FlowPerfExample() {
	const [heavy, setHeavy] = useState(false);
	const [msCached, setMsCached] = useState(0);
	const [msLive, setMsLive] = useState(0);
	const [fps, setFps] = useState(60);

	const heavyOn = useRef(false);
	const heavyRef = useRef<HTMLDivElement>(null);
	const cachedContainer = useRef<HTMLDivElement>(null);
	const cachedTrack = useRef<HTMLDivElement>(null);
	const liveContainer = useRef<HTMLDivElement>(null);
	const liveTrack = useRef<HTMLDivElement>(null);
	const cachedWidth = useRef(0);

	useEffect(() => {
		heavyOn.current = heavy;
	}, [heavy]);

	useEffect(() => {
		// The cached strip's stored width — measured once and on resize, never in the loop.
		const measure = () => {
			if (cachedContainer.current)
				cachedWidth.current = cachedContainer.current.offsetWidth;
		};
		measure();
		const ro = new ResizeObserver(measure);
		if (cachedContainer.current) ro.observe(cachedContainer.current);

		const cachedSet = cachedTrack.current
			? cachedTrack.current.scrollWidth / 2
			: 1;
		const liveSet = liveTrack.current ? liveTrack.current.scrollWidth / 2 : 1;

		let raf = 0;
		let n = 0;
		let last = 0;
		let offCached = 0;
		let offLive = 0;
		const sCached: number[] = [];
		const sLive: number[] = [];
		let frames = 0;
		let fpsLast = performance.now();

		const loop = (ts: number) => {
			const dt = last ? ts - last : 16;
			last = ts;

			// 1) Dirty the big DOM so the live read below pays a reflow (a busy host page).
			if (heavyOn.current && heavyRef.current)
				heavyRef.current.style.paddingTop = `${n++ % 2}px`;

			// 2) CACHED strip — reads a stored width, writes only transform → no reflow.
			{
				const t0 = performance.now();
				if (cachedWidth.current > 0 && cachedTrack.current) {
					offCached = (offCached + dt * 0.06) % (cachedSet || 1);
					cachedTrack.current.style.transform = `translateX(${-offCached}px)`;
				}
				sCached.push(performance.now() - t0);
				if (sCached.length > 40) sCached.shift();
			}

			// 3) LIVE strip — reads offsetWidth every frame → forces a reflow while dirty.
			{
				const t0 = performance.now();
				const w = liveContainer.current ? liveContainer.current.offsetWidth : 0;
				if (w > 0 && liveTrack.current) {
					offLive = (offLive + dt * 0.06) % (liveSet || 1);
					liveTrack.current.style.transform = `translateX(${-offLive}px)`;
				}
				sLive.push(performance.now() - t0);
				if (sLive.length > 40) sLive.shift();
			}

			frames++;
			const now = performance.now();
			if (now - fpsLast >= 500) {
				setFps(Math.round((frames * 1000) / (now - fpsLast)));
				frames = 0;
				fpsLast = now;
			}

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);

		const avg = (s: number[]) =>
			s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0;
		const meter = window.setInterval(() => {
			setMsCached(avg(sCached));
			setMsLive(avg(sLive));
		}, 200);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.clearInterval(meter);
		};
	}, []);

	return (
		<Demo
			id="flow-perf"
			number="12"
			title="Flow performance"
			tag="cached width"
			description={
				<>
					The v0.5.7 fix. Both strips run the same ticker; they differ in one
					line — the <strong>live</strong> one reads <code>offsetWidth</code>{' '}
					every frame (the old behaviour), the <strong>cached</strong> one reads
					a stored width (what ships). Turn on the heavy DOM to dirty layout
					each frame.
				</>
			}>
			<Controls>
				<span
					className={`${perf.meter} ${fps < 50 ? perf.meterHot : perf.meterCool} tnum`}>
					page · {fps} fps
				</span>
				<Toggle checked={heavy} onChange={setHeavy} label="heavy page" />
			</Controls>

			<Strip
				label="Cached width — what ships"
				note="Reads a stored width, writes only transform. Stays flat under load."
				ms={msCached}
				containerRef={cachedContainer}
				trackRef={cachedTrack}
			/>
			<Strip
				label="Live offsetWidth every frame — pre-fix"
				note="Forces a synchronous reflow each frame when the page is busy → dropped frames."
				ms={msLive}
				containerRef={liveContainer}
				trackRef={liveTrack}
			/>

			{heavy && (
				<div className={perf.heavyOuter}>
					<span className={perf.heavyTag}>
						simulated heavy DOM · ~{HEAVY_NODES.toLocaleString()} nodes
						re-laid-out every frame
					</span>
					<div ref={heavyRef} aria-hidden className={perf.heavyGrid}>
						{Array.from({length: HEAVY_NODES}, (_, i) => (
							<span key={i} className={perf.heavyCell} />
						))}
					</div>
				</div>
			)}
		</Demo>
	);
}

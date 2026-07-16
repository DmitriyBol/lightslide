import {useRef, useState} from 'react';

import type {AnalyticsConfig, LightSlideHandle} from 'lightslide';
import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Console} from '../components/Console';
import {Controls, Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';
import auto from './AutoScrollExample.module.scss';

const ITEMS = [
	{label: 'New Arrivals', sub: 'Spring 2026'},
	{label: 'Best Sellers', sub: 'All time'},
	{label: 'Sale', sub: 'Up to 50% off'},
	{label: 'Exclusive', sub: 'Members only'},
];

const INTERVALS = [
	{label: '1s', value: 1000},
	{label: '2s', value: 2000},
	{label: '4s', value: 4000},
];

export function AutoScrollExample() {
	const [enabled, setEnabled] = useState(true);
	const [intervalMs, setIntervalMs] = useState(2000);
	const {entries, log, clear} = useConsole();

	// APG pause control: a visible, keyboard-reachable button wired to the ref handle's
	// pause()/resume(). The key below remounts the carousel when the knobs change, so the
	// pressed state resets alongside it.
	const apiRef = useRef<LightSlideHandle>(null);
	const [isPaused, setIsPaused] = useState(false);
	const togglePause = () => {
		if (isPaused) apiRef.current?.resume();
		else apiRef.current?.pause();
		setIsPaused(!isPaused);
	};

	const analytics: AnalyticsConfig = {
		onEvent: e => {
			if (e.event === 'carousel_in_viewport') log('viewport');
			else if (e.event === 'carousel_slide')
				log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
		},
	};

	return (
		<Demo
			id="auto-scroll"
			number="09"
			title="Auto-scroll"
			tag="autoScroll"
			description={
				<>
					<code>autoScroll</code> cycles slides on an interval and pauses while
					you drag, hover, or keep keyboard focus inside (the WAI-ARIA APG
					behaviour — opt out via <code>pauseOnHover</code> /{' '}
					<code>pauseOnFocus</code>). The visible pause button is the APG pause
					control, wired to <code>ref.pause()</code> / <code>resume()</code>. It
					loops back to the first slide after the last —{' '}
					<code>carousel_reached_end</code> never fires on wrap-around.
				</>
			}>
			<Controls>
				<Toggle
					checked={enabled}
					onChange={value => {
						setEnabled(value);
						setIsPaused(false);
					}}
					label="autoplay"
				/>
				<Segmented
					ariaLabel="interval"
					options={INTERVALS}
					value={intervalMs}
					onChange={value => {
						setIntervalMs(value);
						setIsPaused(false);
					}}
				/>
				<button
					type="button"
					className={auto.pause}
					aria-pressed={isPaused}
					onClick={togglePause}>
					{isPaused ? 'resume()' : 'pause()'}
				</button>
			</Controls>

			<Well>
				<LightSlide
					key={`${enabled}-${intervalMs}`}
					ref={apiRef}
					analytics={analytics}
					autoScroll={{enabled, interval: intervalMs}}
					navigation={<Navigation />}
					pagination={
						<Pagination
							dotStyle={{background: 'var(--border-strong)'}}
							activeDotStyle={{background: 'var(--accent)'}}
						/>
					}>
					{ITEMS.map((item, i) => (
						<Slide key={item.label}>
							<div
								className={slides.tile}
								style={{height: 190, background: cardTone(i)}}>
								<span className={slides.eyebrow}>{item.sub}</span>
								<span
									style={{
										fontSize: 24,
										fontWeight: 800,
										letterSpacing: '-0.02em',
									}}>
									{item.label}
								</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console entries={entries} onClear={clear} />
		</Demo>
	);
}

import {useState} from 'react';

import type {AnalyticsConfig} from 'lightslide';
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
			number="08"
			title="Auto-scroll"
			tag="autoScroll"
			description={
				<>
					<code>autoScroll</code> cycles slides on an interval and pauses while
					you drag. It loops back to the first slide after the last —{' '}
					<code>carousel_reached_end</code> never fires on wrap-around.
				</>
			}>
			<Controls>
				<Toggle checked={enabled} onChange={setEnabled} label="autoplay" />
				<Segmented
					ariaLabel="interval"
					options={INTERVALS}
					value={intervalMs}
					onChange={setIntervalMs}
				/>
			</Controls>

			<Well>
				<LightSlide
					key={`${enabled}-${intervalMs}`}
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

import {useState} from 'react';

import type {AnalyticsConfig} from 'lightslide';
import {LightSlide, Slide} from 'lightslide';

import {Console} from '../components/Console';
import {Controls, Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = [
	'Air Runner',
	'Urban Step',
	'Trail Boot',
	'Flip Pro',
	'Velvet Hi',
	'Flat Step',
];

const OPTIONS = [
	{label: '1', value: 1},
	{label: '1.5', value: 1.5},
	{label: '2', value: 2},
	{label: '2.5', value: 2.5},
	{label: '3', value: 3},
];

const GAP_OPTIONS = [
	{label: '0', value: 0},
	{label: '12', value: 12},
	{label: '24', value: 24},
];

export function SlidesPerViewExample() {
	const [spv, setSpv] = useState(1.5);
	const [gap, setGap] = useState(0);
	const {entries, log, clear} = useConsole();

	const analytics: AnalyticsConfig<{index: number}> = {
		onEvent: e => {
			if (e.event === 'carousel_slide')
				log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
			else if (e.event === 'carousel_reached_end')
				log('end', `${e.slides.length} slides seen`);
		},
	};

	const maxIndex = Math.max(0, Math.ceil(ITEMS.length - spv));

	return (
		<Demo
			id="slides-per-view"
			number="04"
			title="slidesPerView & gap"
			tag={`slidesPerView={${spv}} gap={${gap}}`}
			description={
				<>
					Show several slides at once — fractional values reveal a peek of the
					next, and with a fractional view (1.5 / 2.5) the{' '}
					<strong>last slide scrolls flush</strong> to the right edge instead
					of stopping half-cut. <code>gap</code> spaces the slides and is
					folded into all the geometry — no padding workarounds, so card
					backgrounds span the full slide.
				</>
			}>
			<Controls>
				<Segmented
					ariaLabel="slidesPerView"
					options={OPTIONS}
					value={spv}
					onChange={setSpv}
				/>
				<Segmented
					ariaLabel="gap"
					options={GAP_OPTIONS}
					value={gap}
					onChange={setGap}
				/>
			</Controls>

			<Well>
				<LightSlide<{index: number}>
					analytics={analytics}
					slidesPerView={spv}
					gap={gap}>
					{ITEMS.map((label, i) => (
						<Slide key={label} data={{index: i}}>
							<div
								className={slides.tile}
								style={{height: 150, background: cardTone(i)}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span style={{fontSize: 15, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<p
				className="tnum"
				style={{
					margin: 0,
					fontFamily: 'var(--font-mono)',
					fontSize: '0.75rem',
					color: 'var(--text-faint)',
				}}>
				slidesPerView={spv} · gap={gap}px · {ITEMS.length} slides · maxIndex{' '}
				{maxIndex}
			</p>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="swipe to the end…"
			/>
		</Demo>
	);
}

import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Controls, Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';

const ITEMS = [
	'Aurora',
	'Basalt',
	'Cinder',
	'Dune',
	'Ember',
	'Fjord',
	'Gale',
];

const SPV_OPTIONS = [
	{label: '1', value: 1},
	{label: '1.2', value: 1.2},
	{label: '2', value: 2},
	{label: '3', value: 3},
];

const ALIGN_OPTIONS = [
	{label: 'start', value: 'start' as const},
	{label: 'center', value: 'center' as const},
];

/**
 * The geometry torture chamber: every axis of the layout combinatorics — loop × slidesPerView
 * (whole & fractional) × align × gap × axis — dialled live against one 7-slide carousel.
 * The e2e combo matrix drives these knobs, but it doubles as a manual "does it break when I
 * stack everything" scratchpad: the combo zone where every competitor's tracker fills up.
 */
export function ComboMatrixExample() {
	const [spv, setSpv] = useState(1.2);
	const [align, setAlign] = useState<'start' | 'center'>('start');
	const [loop, setLoop] = useState(true);
	const [gap, setGap] = useState(false);
	const [vertical, setVertical] = useState(false);

	const gapPx = gap ? 24 : 0;
	const config = `loop=${loop ? 'on' : 'off'} · slidesPerView=${spv} · align=${align} · gap=${gapPx} · axis=${vertical ? 'y' : 'x'}`;

	return (
		<Demo
			id="combo-matrix"
			number="05b"
			title="Combo matrix"
			tag="loop × slidesPerView × align × gap × axis"
			description={
				<>
					Stack every layout knob at once — the exact territory where
					competitors&apos; issue trackers fill up: loop clones × multiple or
					fractional slides per view × centring × spacing, on either axis. The
					active slide always rests where its <code>align</code> promises, wraps
					leave no gaps, and without <code>loop</code> the last position clamps
					flush — the combinations below are e2e-verified, not hoped for.
				</>
			}>
			<Controls>
				<Segmented
					ariaLabel="slidesPerView"
					options={SPV_OPTIONS}
					value={spv}
					onChange={setSpv}
				/>
				<Segmented
					ariaLabel="align"
					options={ALIGN_OPTIONS}
					value={align}
					onChange={setAlign}
				/>
				<Toggle
					ariaLabel="loop"
					checked={loop}
					onChange={setLoop}
					label={`loop ${loop ? 'on' : 'off'}`}
				/>
				<Toggle
					ariaLabel="gap"
					checked={gap}
					onChange={setGap}
					label={`gap ${gapPx}`}
				/>
				<Toggle
					ariaLabel="axis"
					checked={vertical}
					onChange={setVertical}
					label={`axis ${vertical ? 'y' : 'x'}`}
				/>
			</Controls>

			<Well>
				<LightSlide
					key={config}
					loop={loop}
					align={align}
					slidesPerView={spv}
					gap={gapPx}
					axis={vertical ? 'y' : 'x'}
					style={vertical ? {height: 420} : undefined}
					navigation={<Navigation />}
					pagination={
						<Pagination
							dotStyle={{background: 'var(--border-strong)'}}
							activeDotStyle={{background: 'var(--accent)'}}
						/>
					}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{
									height: vertical ? '100%' : 150,
									background: cardTone(i),
								}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span
									style={{
										fontSize: 22,
										fontWeight: 800,
										letterSpacing: '-0.02em',
									}}>
									{label}
								</span>
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
				{config}
			</p>
		</Demo>
	);
}

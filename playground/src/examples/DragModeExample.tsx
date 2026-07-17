import {useState} from 'react';

import type {AnalyticsConfig} from 'lightslide';
import {LightSlide, Slide} from 'lightslide';
import {FreeScroll} from 'lightslide/free';
import {Pagination} from 'lightslide/pagination';

import {Console} from '../components/Console';
import {Controls, Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = [
	'Momentum',
	'Coast',
	'Glide',
	'Drift',
	'Slide',
	'Roll',
	'Sweep',
	'Settle',
];

type Mode = 'snap' | 'free' | 'free-snap';

const MODES: {label: string; value: Mode}[] = [
	{label: 'snap', value: 'snap'},
	{label: 'free', value: 'free'},
	{label: 'free-snap', value: 'free-snap'},
];

const PLUGINS: Record<Mode, JSX.Element | undefined> = {
	snap: undefined,
	free: <FreeScroll />,
	'free-snap': <FreeScroll snap />,
};

export function DragModeExample() {
	const [mode, setMode] = useState<Mode>('free');
	const {entries, log, clear} = useConsole();

	const analytics: AnalyticsConfig = {
		onEvent: e => {
			if (e.event === 'carousel_slide')
				log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
		},
	};

	return (
		<Demo
			id="drag-mode"
			number="15"
			title="Free scrolling"
			tag={
				mode === 'snap'
					? 'default drag'
					: `free={<FreeScroll${mode === 'free-snap' ? ' snap' : ''} />}`
			}
			description={
				<>
					Native-feel momentum from <code>lightslide/free</code>.{' '}
					<code>&lt;FreeScroll /&gt;</code> keeps the flick's inertia: the track{' '}
					<strong>coasts and rests anywhere</strong>, and the active index
					settles on the nearest slide. <code>&lt;FreeScroll snap /&gt;</code>{' '}
					coasts the same distance but lands on a slide boundary. Remove the
					plugin and the default one-gesture-one-snap drag is back.
				</>
			}>
			<Controls>
				<Segmented
					ariaLabel="drag mode"
					options={MODES}
					value={mode}
					onChange={setMode}
				/>
			</Controls>

			<Well>
				<LightSlide
					analytics={analytics}
					free={PLUGINS[mode]}
					slidesPerView={2.5}
					gap={12}
					pagination={<Pagination />}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
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

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="flick the cards and let them coast…"
			/>
		</Demo>
	);
}

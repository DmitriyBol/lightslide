import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsEvent} from 'lightslide/analytics';
import {Analytics} from 'lightslide/analytics';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Console} from '../components/Console';
import {Controls, Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = [
	{label: 'Slide 1', sub: 'First'},
	{label: 'Slide 2', sub: 'Second'},
	{label: 'Slide 3', sub: 'Third'},
	{label: 'Slide 4', sub: 'Fourth'},
	{label: 'Slide 5', sub: 'Fifth'},
];

export function LoopExample() {
	const [loop, setLoop] = useState(true);
	const {entries, log, clear} = useConsole();

	const onEvent = (e: AnalyticsEvent) => {
		if (e.event === 'carousel_slide')
			log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
		else if (e.event === 'carousel_reached_end')
			log('end', 'fires only without loop');
	};

	return (
		<Demo
			id="loop"
			number="12"
			title="Seamless loop"
			tag="loop"
			description={
				<>
					With <code>loop</code>, edge slides are cloned so wrap-around is
					continuous and the nav arrows never disable. Toggle to compare —{' '}
					<code>carousel_reached_end</code> never fires in loop mode.
				</>
			}>
			<Controls>
				<Toggle
					checked={loop}
					onChange={v => {
						setLoop(v);
						clear();
					}}
					label={`loop ${loop ? 'on' : 'off'}`}
				/>
			</Controls>

			<Well>
				<LightSlide
					key={String(loop)}
					loop={loop}
					analytics={<Analytics onEvent={onEvent} />}
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
										fontSize: 28,
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

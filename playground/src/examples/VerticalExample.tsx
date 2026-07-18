import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsEvent} from 'lightslide/analytics';
import {Analytics} from 'lightslide/analytics';
import {FreeScroll} from 'lightslide/free';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Console} from '../components/Console';
import {Controls, Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = ['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4', 'Slide 5'];

export function VerticalExample() {
	const [isFree, setIsFree] = useState(false);
	const {entries, log, clear} = useConsole();

	const onEvent = (e: AnalyticsEvent) => {
		if (e.event === 'carousel_slide')
			log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
	};

	return (
		<Demo
			id="vertical"
			number="18"
			title="Vertical axis"
			tag='axis="y"'
			description={
				<>
					<code>axis="y"</code> stacks the slides top-to-bottom: drag, snap,
					loop, flow, free, keyboard (↑/↓), and the arrows all turn vertical,
					and the analytics <code>direction</code> becomes{' '}
					<code>down</code>/<code>up</code>. Give the carousel an explicit
					height — slide heights are fractions of it, exactly as widths are of
					a horizontal one. Touches pan the page horizontally over the
					carousel (<code>touch-action: pan-x</code>), and the <code>wheel</code>{' '}
					slot is ignored — a vertical wheel gesture is indistinguishable from
					page scrolling.
				</>
			}>
			<Controls>
				<Toggle
					checked={isFree}
					onChange={v => {
						setIsFree(v);
						clear();
					}}
					label={`free momentum ${isFree ? 'on' : 'off'}`}
				/>
			</Controls>

			<Well>
				<LightSlide
					axis="y"
					loop
					gap={12}
					style={{height: 420}}
					free={isFree ? <FreeScroll /> : undefined}
					analytics={<Analytics onEvent={onEvent} />}
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
								style={{height: '100%', background: cardTone(i)}}>
								<span className={slides.eyebrow}>vertical</span>
								<span
									style={{
										fontSize: 28,
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

			<Console entries={entries} onClear={clear} />
		</Demo>
	);
}

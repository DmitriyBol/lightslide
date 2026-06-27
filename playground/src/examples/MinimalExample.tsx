import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsConfig} from 'lightslide';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const LABELS = ['Slide A', 'Slide B', 'Slide C'];

export function MinimalExample() {
	const {entries, log, clear} = useConsole();

	// One onEvent handler receives every event; switch on `event` and ignore what you don't need.
	const analytics: AnalyticsConfig = {
		onEvent: e => {
			switch (e.event) {
				case 'carousel_in_viewport':
					return log('viewport');
				case 'carousel_slide':
					return log(
						'slide',
						`${e.fromIndex} → ${e.toIndex} (${e.direction})`,
					);
				case 'carousel_reached_end':
					return log('end', `${e.slides.length} slides seen`);
				case 'carousel_viewed_slides':
					return log('viewed', `after ${e.viewedSeconds}s`);
			}
		},
		viewedTimeout: 30,
	};

	return (
		<Demo
			id="minimal"
			number="02"
			title="Silent by default"
			tag="zero config"
			description={
				<>
					Without an <code>analytics</code> prop nothing is logged — no console
					noise, no errors. Here all four base events are wired up; drop the
					prop and the carousel stays mute.
				</>
			}>
			<Well>
				<LightSlide analytics={analytics}>
					{LABELS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{height: 130, background: cardTone(i)}}>
								<span style={{fontSize: 18, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console entries={entries} onClear={clear} />
		</Demo>
	);
}

import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsHandlers} from 'lightslide';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const LABELS = ['Slide A', 'Slide B', 'Slide C'];

export function MinimalExample() {
	const {entries, log, clear} = useConsole();

	// Pass only the handlers you care about; everything unhandled is completely silent.
	const analytics: AnalyticsHandlers = {
		onInViewport: () => log('viewport'),
		onSlide: p =>
			log('slide', `${p.fromIndex} → ${p.toIndex} (${p.direction})`),
		onReachedEnd: p => log('end', `${p.slides.length} slides seen`),
		onViewedSlides: p => log('viewed', `after ${p.viewedSeconds}s`),
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

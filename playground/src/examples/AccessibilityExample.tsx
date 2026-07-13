import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsConfig} from 'lightslide';
import {A11y} from 'lightslide/a11y';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = [
	'Air Runner Pro',
	'Urban Step',
	'Trail Blazer X',
	'Velvet Stride',
	'Cloud Walker',
];

export function AccessibilityExample() {
	const {entries, log, clear} = useConsole();

	const analytics: AnalyticsConfig = {
		onEvent: e => {
			if (e.event === 'carousel_slide')
				log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
		},
	};

	return (
		<Demo
			id="a11y"
			number="15"
			title="Accessibility layer"
			tag="a11y"
			description={
				<>
					Core ARIA (carousel region, per-slide <code>N of M</code> labels, hidden
					loop clones, linked controls) ships built-in. The opt-in{' '}
					<code>lightslide/a11y</code> layer adds keyboard nav (arrows / Home /
					End), focus-guarding of off-screen slides, live announcements and
					reduced-motion handling — tree-shaken away unless you import it. Tab to a
					control, then use the arrow keys.
				</>
			}>
			<Well>
				<LightSlide
					label="Product highlights"
					analytics={analytics}
					navigation={{}}
					pagination={{}}
					a11y={<A11y />}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{height: 160, background: cardTone(i)}}>
								<a
									href="#a11y"
									style={{fontSize: 17, fontWeight: 600, color: 'inherit'}}>
									{label}
								</a>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="tab in, then press ← / → …"
			/>
		</Demo>
	);
}

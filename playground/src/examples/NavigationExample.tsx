import type {AnalyticsConfig} from 'lightslide';
import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';
import nav from './NavigationExample.module.scss';

const ITEMS = [
	'Air Runner Pro',
	'Urban Step',
	'Trail Blazer X',
	'Velvet Stride',
	'Cloud Walker',
];

function Arrow({dir}: {dir: 'left' | 'right'}) {
	return (
		<svg width="9" height="14" viewBox="0 0 9 14" fill="none" aria-hidden>
			<path
				d={dir === 'left' ? 'M8 1 2 7l6 6' : 'M1 1l6 6-6 6'}
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function NavigationExample() {
	const {entries, log, clear} = useConsole();

	const analytics: AnalyticsConfig = {
		onEvent: e => {
			if (e.event === 'carousel_nav_button')
				log('nav', `${e.direction} · ${e.fromIndex} → ${e.toIndex}`);
			else if (e.event === 'carousel_slide')
				log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
		},
	};

	return (
		<Demo
			id="navigation"
			number="06"
			title="Navigation arrows"
			tag="navigation"
			description={
				<>
					Pass <code>navigation</code> to render prev/next buttons inside the
					carousel — dimmed and disabled at the edges. <code>renderPrev</code>/
					<code>renderNext</code> let you supply your own buttons, centred and
					never clipped by <code>overflow:hidden</code>.
				</>
			}>
			<Well>
				<LightSlide analytics={analytics} navigation={<Navigation />}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{height: 160, background: cardTone(i)}}>
								<span style={{fontSize: 17, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Well>
				<LightSlide
					slidesPerView={2}
					navigation={
						<Navigation
							renderPrev={({onClick, disabled}) => (
								<button
									type="button"
									className={nav.btn}
									onClick={onClick}
									disabled={disabled}
									aria-label="Previous slide">
									<Arrow dir="left" />
								</button>
							)}
							renderNext={({onClick, disabled}) => (
								<button
									type="button"
									className={nav.btn}
									onClick={onClick}
									disabled={disabled}
									aria-label="Next slide">
									<Arrow dir="right" />
								</button>
							)}
						/>
					}>
					{ITEMS.map((label, i) => (
						<Slide key={label} style={{padding: '0 5px'}}>
							<div
								className={slides.tile}
								style={{height: 120, background: cardTone(i)}}>
								<span style={{fontSize: 14, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="click a button to log…"
			/>
		</Demo>
	);
}

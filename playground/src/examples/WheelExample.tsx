import type {AnalyticsConfig} from 'lightslide';
import {LightSlide, Slide} from 'lightslide';
import {Flow} from 'lightslide/flow';
import {Pagination} from 'lightslide/pagination';
import {Wheel} from 'lightslide/wheel';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';
import flow from './FlowExample.module.scss';

const ITEMS = ['Aurora', 'Breeze', 'Cinder', 'Dune', 'Ember'];

const FLOW_ITEMS = [
	'Swipe to drift',
	'Shift+wheel',
	'No scroll theft',
	'One page per flick',
	'Inertia-aware',
	'~0.7 kB',
];

export function WheelExample() {
	const {entries, log, clear} = useConsole();

	const analytics: AnalyticsConfig = {
		onEvent: e => {
			if (e.event === 'carousel_slide')
				log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
		},
	};

	return (
		<Demo
			id="wheel"
			number="13"
			title="Wheel & trackpad"
			tag="wheel"
			description={
				<>
					Pass <code>wheel</code> to page with a horizontal trackpad swipe (or{' '}
					<kbd>shift</kbd>+wheel on a mouse) — one page per flick, with the
					inertia tail filtered out. Vertical scrolling over the carousel is
					never intercepted, so the page keeps scrolling naturally. In{' '}
					<code>flow</code> mode the same gesture drifts the strip instead.
				</>
			}>
			<Well>
				<LightSlide
					analytics={analytics}
					wheel={<Wheel />}
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
								style={{height: 170, background: cardTone(i)}}>
								<span style={{fontSize: 17, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Well>
				<LightSlide
					slidesPerView={2.5}
					wheel={<Wheel />}
					flow={<Flow speed={30} />}>
					{FLOW_ITEMS.map(label => (
						<Slide key={label}>
							<div className={flow.chip}>
								<span className={flow.dot} />
								{label}
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="swipe horizontally on a trackpad…"
			/>
		</Demo>
	);
}

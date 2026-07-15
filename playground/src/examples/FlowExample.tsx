import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {Flow} from 'lightslide/flow';

import {Controls, Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import {Toggle} from '../components/Toggle';
import flow from './FlowExample.module.scss';

const ITEMS = [
	'React',
	'TypeScript',
	'Vite',
	'Rollup',
	'Jest',
	'SCSS',
	'ESLint',
	'Prettier',
	'Zero deps',
	'~4.5 kB',
];

const SPEEDS = [
	{label: 'Slow', value: 20},
	{label: 'Normal', value: 40},
	{label: 'Fast', value: 90},
];

export function FlowExample() {
	const [enabled, setEnabled] = useState(true);
	const [speed, setSpeed] = useState(40);

	return (
		<Demo
			id="flow"
			number="10"
			title="Flow ticker"
			tag="flow"
			description={
				<>
					<code>flow</code> turns the carousel into a continuously drifting
					ticker (a marquee). It auto-enables looping so the wrap is seamless;
					drag to nudge it and it resumes <code>resumeDelay</code> ms after you
					let go.
				</>
			}>
			<Controls>
				<Toggle checked={enabled} onChange={setEnabled} label="running" />
				<Segmented
					ariaLabel="flow speed"
					options={SPEEDS}
					value={speed}
					onChange={setSpeed}
				/>
			</Controls>

			<Well>
				<LightSlide
					key={`${enabled}-${speed}`}
					slidesPerView={3.5}
					flow={enabled ? <Flow speed={speed} resumeDelay={1500} /> : undefined}>
					{ITEMS.map(label => (
						<Slide key={label}>
							<div className={flow.chip}>
								<span className={flow.dot} />
								{label}
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>
		</Demo>
	);
}

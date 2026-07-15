import {useRef, useState} from 'react';

import type {LightSlideHandle} from 'lightslide';
import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';
import ctl from './ControlledExample.module.scss';

const ITEMS = [
	'Air Runner Pro',
	'Urban Step',
	'Trail Blazer X',
	'Velvet Stride',
	'Cloud Walker',
];

export function ControlledExample() {
	const {entries, log, clear} = useConsole();

	// Well 1 — imperative: the ref handle drives the carousel, onIndexChange reports back.
	const apiRef = useRef<LightSlideHandle>(null);
	const [position, setPosition] = useState(0);

	// Well 2 — controlled: `index` drives the carousel, onIndexChange closes the loop, so
	// dragging the carousel moves the segmented control and vice versa.
	const [index, setIndex] = useState(0);

	return (
		<Demo
			id="controlled"
			number="08"
			title="External control"
			tag="index / onIndexChange / ref"
			description={
				<>
					Drive the carousel from outside: a <code>ref</code> exposes{' '}
					<code>goTo</code> / <code>next</code> / <code>prev</code> /{' '}
					<code>getIndex</code>, the controlled <code>index</code> prop follows
					your state, and <code>onIndexChange</code> reports every settled
					position — the building blocks for thumbnails and synced carousels.
				</>
			}>
			<Well>
				<div className={ctl.toolbar}>
					<button
						type="button"
						className={ctl.api}
						onClick={() => apiRef.current?.prev()}>
						prev()
					</button>
					<button
						type="button"
						className={ctl.api}
						onClick={() => apiRef.current?.next()}>
						next()
					</button>
					<button
						type="button"
						className={ctl.api}
						onClick={() => apiRef.current?.goTo(ITEMS.length - 1)}>
						goTo(last)
					</button>
					<span className={`${ctl.readout} tnum`}>
						position {position + 1} of {ITEMS.length}
					</span>
				</div>

				<LightSlide
					ref={apiRef}
					pagination={<Pagination />}
					onIndexChange={i => {
						setPosition(i);
						log('slide', `onIndexChange → ${i}`);
					}}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{height: 150, background: cardTone(i)}}>
								<span style={{fontSize: 16, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Well>
				<div className={ctl.toolbar}>
					<Segmented
						ariaLabel="Controlled index"
						options={ITEMS.map((_, i) => ({label: String(i + 1), value: i}))}
						value={index}
						onChange={setIndex}
					/>
				</div>

				<LightSlide
					index={index}
					navigation={<Navigation />}
					onIndexChange={setIndex}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
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
				emptyHint="drive the carousel from the buttons above…"
			/>
		</Demo>
	);
}

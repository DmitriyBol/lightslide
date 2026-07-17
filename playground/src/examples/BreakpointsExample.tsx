import {useEffect, useState} from 'react';

import {LightSlide, Slide} from 'lightslide';

import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';

const ITEMS = [
	'Air Runner',
	'Urban Step',
	'Trail Boot',
	'Flip Pro',
	'Velvet Hi',
	'Flat Step',
];

const BREAKPOINTS = {
	'(min-width: 720px)': {slidesPerView: 2, gap: 16},
	'(min-width: 1080px)': {slidesPerView: 3, gap: 24},
};

const BASE_LABEL = 'base → slidesPerView 1.2 · gap 8';

const LABELS = [
	{query: '(min-width: 1080px)', label: '≥1080px → slidesPerView 3 · gap 24'},
	{query: '(min-width: 720px)', label: '≥720px → slidesPerView 2 · gap 16'},
];

/**
 * Mirrors the carousel's own media-query matching so the readout can display which
 * breakpoint is currently driving the geometry — demo chrome only, the library needs none
 * of this.
 */
function useActiveBreakpointLabel() {
	const [label, setLabel] = useState(BASE_LABEL);
	useEffect(() => {
		const lists = LABELS.map(entry => matchMedia(entry.query));
		const update = () => {
			const hit = LABELS.findIndex((_, i) => lists[i].matches);
			setLabel(hit === -1 ? BASE_LABEL : LABELS[hit].label);
		};
		update();
		lists.forEach(list => list.addEventListener('change', update));
		return () =>
			lists.forEach(list => list.removeEventListener('change', update));
	}, []);
	return label;
}

export function BreakpointsExample() {
	const label = useActiveBreakpointLabel();

	return (
		<Demo
			id="breakpoints"
			number="06"
			title="breakpoints"
			tag="breakpoints={{'(min-width: …)': {…}}}"
			description={
				<>
					Responsive without a resize listener: keys are media queries, values
					override <code>slidesPerView</code> and <code>gap</code> while they
					match. Later entries win, so ordering them mobile-first works the way
					CSS does. <strong>Resize the window</strong> — one column and a peek on
					phones, two from 720px, three from 1080px.
				</>
			}>
			<Well>
				<LightSlide slidesPerView={1.2} gap={8} breakpoints={BREAKPOINTS}>
					{ITEMS.map((item, i) => (
						<Slide key={item}>
							<div
								className={slides.tile}
								style={{height: 150, background: cardTone(i)}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span style={{fontSize: 15, fontWeight: 600}}>{item}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<p
				className="tnum"
				style={{
					margin: 0,
					fontFamily: 'var(--font-mono)',
					fontSize: '0.75rem',
					color: 'var(--text-faint)',
				}}>
				{label}
			</p>
		</Demo>
	);
}

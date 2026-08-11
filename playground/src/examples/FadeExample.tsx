import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {Fade} from 'lightslide/fade';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Controls, Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';

const BANNERS = ['Aurora', 'Dune', 'Reef', 'Ember'];

export function FadeExample() {
	const [crossfade, setCrossfade] = useState(true);

	return (
		<Demo
			id="fade"
			number="12b"
			title="fade"
			tag="fade={<Fade />}"
			description={
				<>
					The hero-banner transition: slides stack in place and{' '}
					<strong>crossfade</strong> instead of sliding sideways. Every control
					keeps working — buttons, dots, swipe (it becomes “swipe to change”),
					loop wraps without clones in sight — and inactive slides are
					unclickable, <code>aria-hidden</code> and <code>inert</code>. Toggle
					it off to compare with the default slide; from the tree-shakeable{' '}
					<code>lightslide/fade</code> entry.
				</>
			}>
			<Controls>
				<Toggle
					checked={crossfade}
					onChange={setCrossfade}
					label="fade"
					ariaLabel="fade"
				/>
			</Controls>

			<Well>
				<LightSlide
					loop
					gap={12}
					fade={crossfade && <Fade />}
					navigation={<Navigation />}
					pagination={<Pagination />}>
					{BANNERS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{height: 200, background: cardTone(i)}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span style={{fontSize: 15, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>
		</Demo>
	);
}

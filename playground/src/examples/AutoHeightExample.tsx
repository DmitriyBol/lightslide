import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {AutoHeight} from 'lightslide/autoheight';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Controls, Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';

const ITEMS = [
	{label: 'Teaser', height: 120},
	{label: 'Article card', height: 220},
	{label: 'Compact note', height: 140},
	{label: 'Full story', height: 280},
	{label: 'Quote', height: 170},
];

export function AutoHeightExample() {
	const [adaptive, setAdaptive] = useState(true);

	return (
		<Demo
			id="auto-height"
			number="4c"
			title="autoHeight"
			tag="autoHeight={<AutoHeight />}"
			description={
				<>
					Slides of different heights — cards, posts, variable-length text. The
					viewport <strong>tracks the active slide&apos;s height</strong> and
					animates the change in step with the snap, instead of staying as tall
					as the tallest slide (dead air) or cropping. Toggle it off to compare;
					from the tree-shakeable <code>lightslide/autoheight</code> entry.
				</>
			}>
			<Controls>
				<Toggle
					checked={adaptive}
					onChange={setAdaptive}
					label="autoHeight"
					ariaLabel="autoHeight"
				/>
			</Controls>

			<Well>
				<LightSlide
					gap={12}
					autoHeight={adaptive && <AutoHeight />}
					navigation={<Navigation />}
					pagination={<Pagination />}>
					{ITEMS.map((item, i) => (
						<Slide key={item.label}>
							<div
								className={slides.tile}
								style={{height: item.height, background: cardTone(i)}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span style={{fontSize: 15, fontWeight: 600}}>{item.label}</span>
								<span style={{fontSize: 13, opacity: 0.7}}>
									{item.height}px tall
								</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>
		</Demo>
	);
}

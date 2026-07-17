import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';

import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import thumbs from './ThumbnailsExample.module.scss';

const PRODUCTS = [
	'Air Runner',
	'Urban Step',
	'Trail Boot',
	'Flip Pro',
	'Velvet Hi',
	'Flat Step',
];

/**
 * The README "thumbnails / synced carousels" recipe, live: two independent instances wired
 * through one piece of state. The gallery is controlled (`index` + `onIndexChange`); the
 * strip shares the same value, so a thumb click navigates the gallery while the gallery's
 * arrows/drag move the highlight. The strip gets no `onIndexChange` — dragging it browses
 * the thumbs without changing the selection — and the controlled index clamps to its own
 * shorter range, which is what keeps the active thumb scrolled into view.
 */
export function ThumbnailsExample() {
	const [index, setIndex] = useState(0);

	return (
		<Demo
			id="thumbnails"
			number="10"
			title="Thumbnails"
			tag="two instances · one state"
			description={
				<>
					The product-page classic as a recipe, not a plugin: the gallery is
					controlled via <code>index</code> / <code>onIndexChange</code>, and the
					thumb strip is simply a second <code>LightSlide</code> sharing the same
					state — a thumb click navigates the gallery, arrows and drag move the
					highlight, and the strip auto-scrolls to keep the active thumb in view.
				</>
			}>
			<Well>
				<LightSlide
					index={index}
					gap={12}
					navigation={<Navigation />}
					onIndexChange={setIndex}>
					{PRODUCTS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{height: 190, background: cardTone(i)}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span style={{fontSize: 16, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>

				<div className={thumbs.strip}>
					<LightSlide index={index} slidesPerView={4.2} gap={8}>
						{PRODUCTS.map((label, i) => (
							<Slide key={label}>
								<button
									type="button"
									aria-pressed={i === index}
									className={thumbs.thumb}
									style={{background: cardTone(i)}}
									onClick={() => setIndex(i)}>
									<span className={slides.eyebrow}>
										{String(i + 1).padStart(2, '0')}
									</span>
									<span className={thumbs.label}>{label}</span>
								</button>
							</Slide>
						))}
					</LightSlide>
				</div>
			</Well>
		</Demo>
	);
}

import {useState} from 'react';
import {LightSlide, Slide} from 'lightslide';
import type {ViewedSlidesPayload} from 'lightslide';

import {cx} from '../components/cx';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import ct from './CustomTimeoutExample.module.scss';

const LABELS = ['First', 'Second', 'Last — swipe here'];

export function CustomTimeoutExample() {
	const [result, setResult] = useState<string | null>(null);

	return (
		<Demo
			id="custom-timeout"
			number="13"
			title="Terminal event exclusion"
			tag="viewedTimeout={5}"
			description={
				<>
					<code>viewedTimeout=5</code> fires <code>onViewedSlides</code> after
					5s in view. Swipe to the last slide first and{' '}
					<code>onReachedEnd</code> wins instead — whichever fires first
					permanently suppresses the other.
				</>
			}>
			<Well>
				<LightSlide
					key={result ?? 'active'}
					analytics={{
						viewedTimeout: 5,
						onReachedEnd: p =>
							setResult(`reached_end fired · ${p.slides.length} slides`),
						onViewedSlides: (p: ViewedSlidesPayload) =>
							setResult(`viewed_slides fired · after ${p.viewedSeconds}s`),
					}}>
					{LABELS.map((label, i) => {
						const isLast = i === LABELS.length - 1;
						return (
							<Slide key={label}>
								<div
									className={slides.tile}
									style={{
										height: 156,
										padding: 24,
										textAlign: 'center',
										background: cardTone(i),
										borderColor: isLast ? 'var(--accent)' : undefined,
									}}>
									{isLast && <span className={slides.eyebrow}>Terminal</span>}
									<span style={{fontSize: 18, fontWeight: 600}}>{label}</span>
								</div>
							</Slide>
						);
					})}
				</LightSlide>
			</Well>

			<div className={ct.result}>
				{result ? (
					<>
						<span className={ct.value}>{result}</span>
						<button
							type="button"
							className={ct.reset}
							onClick={() => setResult(null)}>
							Reset
						</button>
					</>
				) : (
					<span className={cx(ct.value, ct.waiting)}>
						waiting for a terminal event
						<span className={ct.caret} />
					</span>
				)}
			</div>
		</Demo>
	);
}

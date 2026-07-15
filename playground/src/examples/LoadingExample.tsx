import {useEffect, useRef, useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';

import {Controls, Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import load from './LoadingExample.module.scss';

const PRODUCTS = [
	'Air Runner Pro',
	'Urban Step',
	'Trail Blazer X',
	'Velvet Stride',
	'Cloud Walker',
];

// Your own placeholder — the library ships none, so the bundle stays tiny.
function SkeletonRow({count}: {count: number}) {
	return (
		<div className={load.skeletonRow}>
			{Array.from({length: count}, (_, i) => (
				<div key={i} className={load.skeletonCard} />
			))}
		</div>
	);
}

export function LoadingExample() {
	const [loading, setLoading] = useState(true);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchData = () => {
		if (timer.current) clearTimeout(timer.current);
		setLoading(true);
		timer.current = setTimeout(() => setLoading(false), 1600);
	};

	useEffect(() => {
		fetchData();
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
		 
	}, []);

	return (
		<Demo
			id="loading"
			number="16"
			title="Loading fallback"
			tag="loading · fallback"
			description={
				<>
					Pass <code>loading</code> with your own <code>fallback</code> node to
					show a placeholder while data is fetched. The library ships no
					skeleton — you supply and style it, so the bundle stays tiny.
				</>
			}>
			<Controls>
				<button type="button" className={load.reload} onClick={fetchData}>
					↻ Reload data
				</button>
				<span className={load.status}>{loading ? 'fetching…' : 'loaded'}</span>
			</Controls>

			<Well>
				<LightSlide
					slidesPerView={3}
					loading={loading}
					fallback={<SkeletonRow count={3} />}
					navigation={<Navigation />}>
					{PRODUCTS.map((name, i) => (
						<Slide key={name} style={{padding: '0 6px'}}>
							<div
								className={slides.tile}
								style={{height: 120, background: cardTone(i)}}>
								<span style={{fontSize: 14, fontWeight: 600}}>{name}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>
		</Demo>
	);
}

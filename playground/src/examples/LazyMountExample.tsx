import {useCallback, useEffect, useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';

import {Controls, Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';

const ITEMS = [
	'Aurora',
	'Basalt',
	'Cirrus',
	'Dune',
	'Ember',
	'Fjord',
	'Glacier',
	'Harbor',
	'Isle',
	'Juniper',
	'Kelp',
	'Lagoon',
];

const MARGIN_OPTIONS = [
	{label: '0', value: 0},
	{label: '1', value: 1},
	{label: '2', value: 2},
];

type MountReportingCardProps = {
	index: number;
	label: string;
	onMountChange: (index: number, isMounted: boolean) => void;
};

/** Reports its own mount/unmount so the demo can visualise which subtrees exist. */
function MountReportingCard({
	index,
	label,
	onMountChange,
}: MountReportingCardProps) {
	useEffect(() => {
		onMountChange(index, true);
		return () => onMountChange(index, false);
	}, [index, onMountChange]);

	return (
		<div
			className={slides.tile}
			style={{height: 150, background: cardTone(index)}}>
			<span className={slides.eyebrow}>
				{String(index + 1).padStart(2, '0')}
			</span>
			<span style={{fontSize: 15, fontWeight: 600}}>{label}</span>
		</div>
	);
}

export function LazyMountExample() {
	const [enabled, setEnabled] = useState(true);
	const [margin, setMargin] = useState(1);
	const [mounted, setMounted] = useState<ReadonlySet<number>>(new Set());

	const handleMountChange = useCallback(
		(index: number, isMounted: boolean) => {
			setMounted(prev => {
				const next = new Set(prev);
				if (isMounted) next.add(index);
				else next.delete(index);
				return next;
			});
		},
		[],
	);

	return (
		<Demo
			id="lazy-mount"
			number="20"
			title="Lazy slide mounting"
			tag={enabled ? `lazyMount={{margin: ${margin}}}` : 'lazyMount off'}
			description={
				<>
					<code>lazyMount</code> keeps far-away slides as{' '}
					<strong>empty shells</strong> — the slide box (width, class, style)
					stays in the track so geometry and snap are exact, but the React
					subtree inside doesn&apos;t mount until the window (visible slides ±{' '}
					<code>margin</code>) reaches it. The strip below lights up per mounted
					subtree — navigate and watch the window slide. For plain images you
					can often just use native <code>loading=&quot;lazy&quot;</code>; this
					is for expensive React content — embeds, charts, product cards.
				</>
			}>
			<Controls>
				<Toggle
					checked={enabled}
					onChange={setEnabled}
					label="lazyMount"
					ariaLabel="Toggle lazy mounting"
				/>
				<Segmented
					ariaLabel="margin"
					options={MARGIN_OPTIONS}
					value={margin}
					onChange={setMargin}
				/>
			</Controls>

			<Well>
				<LightSlide
					lazyMount={enabled ? {margin} : false}
					slidesPerView={2.5}
					gap={12}
					navigation={<Navigation />}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
							<MountReportingCard
								index={i}
								label={label}
								onMountChange={handleMountChange}
							/>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<div style={{display: 'flex', alignItems: 'center', gap: 10}}>
				<span style={{display: 'flex', gap: 4}}>
					{ITEMS.map((label, i) => (
						<span
							key={label}
							title={label}
							style={{
								width: 14,
								height: 6,
								borderRadius: 3,
								background: mounted.has(i)
									? 'var(--accent)'
									: 'var(--surface-alt)',
								boxShadow: mounted.has(i)
									? 'none'
									: 'inset 0 0 0 1px var(--accent-soft)',
							}}
						/>
					))}
				</span>
				<p
					className="tnum"
					style={{
						margin: 0,
						fontFamily: 'var(--font-mono)',
						fontSize: '0.75rem',
						color: 'var(--text-faint)',
					}}>
					{mounted.size} of {ITEMS.length} slide subtrees mounted
				</p>
			</div>
		</Demo>
	);
}

// The wordmark mark — three offset bars that read as slides sliding past a viewport.
export function Logo({size = 18}: {size?: number}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 20 20"
			fill="none"
			aria-hidden
			role="img">
			<rect
				x="1"
				y="5"
				width="4.5"
				height="10"
				rx="1.5"
				fill="currentColor"
				opacity="0.4"
			/>
			<rect
				x="7.75"
				y="2.5"
				width="4.5"
				height="15"
				rx="1.5"
				fill="currentColor"
			/>
			<rect
				x="14.5"
				y="5"
				width="4.5"
				height="10"
				rx="1.5"
				fill="currentColor"
				opacity="0.4"
			/>
		</svg>
	);
}

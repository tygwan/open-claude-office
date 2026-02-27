<script lang="ts">
	import type { PipelineNode, NodeStatus, CliType } from '$lib/types';

	interface Props {
		node: PipelineNode;
	}

	let { node }: Props = $props();

	function getCliColor(cli: CliType): string {
		switch (cli) {
			case 'claude': return 'var(--dash-node-claude)';
			case 'codex': return 'var(--dash-node-codex)';
			case 'gemini': return 'var(--dash-node-gemini)';
			case 'team': return 'var(--dash-node-team)';
			default: return 'var(--dash-text-dim)';
		}
	}

	function getStatusAnimation(status: NodeStatus): string {
		switch (status) {
			case 'active': return 'animate-node-active';
			case 'streaming': return 'animate-node-streaming';
			case 'idle':
			case 'queued': return 'animate-node-pulse';
			default: return '';
		}
	}

	function getStatusIcon(status: NodeStatus): string {
		switch (status) {
			case 'done': return 'M5 13l4 4L19 7';
			case 'error': return 'M6 18L18 6M6 6l12 12';
			case 'streaming': return 'M13 10V3L4 14h7v7l9-11h-7z';
			case 'active': return 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z';
			case 'queued': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
			default: return 'M20 12H4';
		}
	}

	let cliColor = $derived(getCliColor(node.cli));
	let animClass = $derived(getStatusAnimation(node.status));
	let statusIcon = $derived(getStatusIcon(node.status));
	let opacity = $derived(node.status === 'idle' ? 0.4 : node.status === 'queued' ? 0.6 : 1);
</script>

<g
	transform="translate({node.x}, {node.y})"
	class="cursor-pointer {animClass}"
	style:color={cliColor}
	role="button"
	tabindex="0"
>
	<!-- Outer glow for active/streaming -->
	{#if node.status === 'active' || node.status === 'streaming'}
		<circle
			cx="0"
			cy="0"
			r="42"
			fill="none"
			stroke={cliColor}
			stroke-width="1"
			opacity="0.2"
		/>
	{/if}

	<!-- Main node circle -->
	<circle
		cx="0"
		cy="0"
		r="32"
		fill="var(--dash-bg)"
		stroke={cliColor}
		stroke-width="2.5"
		opacity={opacity}
	/>

	<!-- Inner fill for status -->
	<circle
		cx="0"
		cy="0"
		r="28"
		fill={cliColor}
		opacity={node.status === 'done' ? 0.15 : node.status === 'error' ? 0.15 : 0.08}
	/>

	<!-- Status icon -->
	<svg
		x="-8"
		y="-8"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke={cliColor}
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d={statusIcon} />
	</svg>

	<!-- Label -->
	<text
		y="48"
		text-anchor="middle"
		class="text-xs font-medium"
		fill="var(--dash-text)"
		font-size="12"
	>
		{node.label}
	</text>

	<!-- CLI type badge -->
	<g transform="translate(20, -28)">
		<rect
			x="0"
			y="0"
			width="28"
			height="14"
			rx="3"
			fill={cliColor}
			opacity="0.9"
		/>
		<text
			x="14"
			y="10.5"
			text-anchor="middle"
			fill="white"
			font-size="8"
			font-weight="600"
		>
			{node.cli.slice(0, 3).toUpperCase()}
		</text>
	</g>

	<!-- File target tooltip -->
	{#if node.file}
		<text
			y="62"
			text-anchor="middle"
			fill="var(--dash-text-dim)"
			font-size="10"
		>
			{node.file}
		</text>
	{/if}
</g>

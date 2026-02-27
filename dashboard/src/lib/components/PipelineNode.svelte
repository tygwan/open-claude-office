<script lang="ts">
	import type { PipelineNode, NodeStatus, CliType, FileDomain } from '$lib/types';
	import { DOMAIN_COLORS } from '$lib/utils/classifier';

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

	// Use domain color if available, otherwise CLI color
	let nodeColor = $derived(
		node.domain && DOMAIN_COLORS[node.domain]
			? DOMAIN_COLORS[node.domain]
			: getCliColor(node.cli)
	);
	let animClass = $derived(getStatusAnimation(node.status));
	let statusIcon = $derived(getStatusIcon(node.status));
	let opacity = $derived(node.status === 'idle' ? 0.4 : node.status === 'queued' ? 0.6 : 1);

	// Short file name for display
	let shortFile = $derived(
		node.file ? node.file.split('/').slice(-2).join('/') : ''
	);
</script>

<g
	transform="translate({node.x}, {node.y})"
	class="cursor-pointer {animClass}"
	style:color={nodeColor}
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
			stroke={nodeColor}
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
		stroke={nodeColor}
		stroke-width="2.5"
		opacity={opacity}
	/>

	<!-- Inner fill for status -->
	<circle
		cx="0"
		cy="0"
		r="28"
		fill={nodeColor}
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
		stroke={nodeColor}
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d={statusIcon} />
	</svg>

	<!-- Label (tool action) -->
	<text
		y="48"
		text-anchor="middle"
		fill="var(--dash-text)"
		font-size="11"
		font-weight="500"
	>
		{node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
	</text>

	<!-- Tech badge (top-right) — shows tech stack instead of CLI type -->
	{#if node.tech}
		{@const badgeW = Math.max(28, node.tech.length * 6 + 8)}
		<g transform="translate({20}, {-28})">
			<rect
				x="0"
				y="0"
				width={badgeW}
				height="14"
				rx="3"
				fill={nodeColor}
				opacity="0.9"
			/>
			<text
				x={badgeW / 2}
				y="10.5"
				text-anchor="middle"
				fill="white"
				font-size="8"
				font-weight="600"
			>
				{node.tech}
			</text>
		</g>
	{:else}
		<!-- Fallback: CLI badge -->
		<g transform="translate(20, -28)">
			<rect
				x="0"
				y="0"
				width="28"
				height="14"
				rx="3"
				fill={nodeColor}
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
	{/if}

	<!-- Domain badge (top-left) -->
	{#if node.domain && node.domain !== 'general'}
		{@const domainLabel = node.domain.charAt(0).toUpperCase() + node.domain.slice(1)}
		<g transform="translate({-50}, {-28})">
			<rect
				x="0"
				y="0"
				width="36"
				height="14"
				rx="3"
				fill={nodeColor}
				opacity="0.25"
			/>
			<text
				x="18"
				y="10.5"
				text-anchor="middle"
				fill={nodeColor}
				font-size="7"
				font-weight="600"
			>
				{domainLabel}
			</text>
		</g>
	{/if}

	<!-- File target tooltip -->
	{#if shortFile}
		<text
			y="62"
			text-anchor="middle"
			fill="var(--dash-text-dim)"
			font-size="9"
			opacity="0.6"
		>
			{shortFile}
		</text>
	{/if}
</g>

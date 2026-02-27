<script lang="ts">
	import type { Pipeline } from '$lib/types';
	import { isConnected, totalTokens } from '$lib/stores/events';

	interface Props {
		pipeline: Pipeline | null;
	}

	let { pipeline }: Props = $props();

	function formatTokens(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
		return n.toString();
	}

	let activeCli = $derived(() => {
		if (!pipeline) return null;
		const activeNode = pipeline.nodes.find(
			(n) => n.status === 'active' || n.status === 'streaming'
		);
		return activeNode?.cli ?? null;
	});

	function getCliLabel(cli: string | null): string {
		if (!cli) return 'No active CLI';
		switch (cli) {
			case 'claude': return 'Claude Code';
			case 'codex': return 'Codex CLI';
			case 'gemini': return 'Gemini CLI';
			case 'team': return 'Team Agent';
			default: return cli;
		}
	}
</script>

<footer class="flex h-6 items-center border-t border-[var(--dash-border)] bg-[var(--dash-panel)] px-2 text-[11px] select-none">
	<!-- Connection status -->
	<div class="flex items-center gap-1.5 border-r border-[var(--dash-border)] pr-3">
		<span class="h-2 w-2 rounded-full {$isConnected ? 'bg-[var(--dash-success)]' : 'bg-[var(--dash-error)]'}"></span>
		<span class="text-[var(--dash-text-dim)]">
			{$isConnected ? 'Connected' : 'Disconnected'}
		</span>
	</div>

	<!-- Active CLI -->
	<div class="flex items-center gap-1.5 border-r border-[var(--dash-border)] px-3">
		<svg class="h-3 w-3 text-[var(--dash-text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
		<span class="text-[var(--dash-text-dim)]">{getCliLabel(activeCli())}</span>
	</div>

	<!-- Pipeline status -->
	{#if pipeline}
		<div class="flex items-center gap-1.5 border-r border-[var(--dash-border)] px-3">
			<span class="text-[var(--dash-text-dim)]">Pipeline:</span>
			<span class="font-medium {pipeline.status === 'running' ? 'text-[var(--dash-accent)]' : pipeline.status === 'complete' ? 'text-[var(--dash-success)]' : pipeline.status === 'error' ? 'text-[var(--dash-error)]' : 'text-[var(--dash-text-dim)]'}">
				{pipeline.status}
			</span>
		</div>
	{/if}

	<!-- Spacer -->
	<div class="flex-1"></div>

	<!-- Token count -->
	<div class="flex items-center gap-1.5 border-l border-[var(--dash-border)] pl-3">
		<svg class="h-3 w-3 text-[var(--dash-text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
		</svg>
		<span class="text-[var(--dash-text-dim)]">
			{formatTokens($totalTokens.total)} tokens
		</span>
		<span class="text-[var(--dash-text-dim)]/50">
			({formatTokens($totalTokens.input)}in / {formatTokens($totalTokens.output)}out)
		</span>
	</div>

	<!-- Node count -->
	{#if pipeline}
		<div class="flex items-center gap-1.5 border-l border-[var(--dash-border)] pl-3">
			<span class="text-[var(--dash-text-dim)]">
				{pipeline.nodes.filter((n) => n.status === 'done').length}/{pipeline.nodes.length} complete
			</span>
		</div>
	{/if}
</footer>

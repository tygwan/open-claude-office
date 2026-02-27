<script lang="ts">
	import { commandLog } from '$lib/stores/events';
	import type { CliType } from '$lib/types';

	interface Props {
		height: number;
		collapsed: boolean;
		onToggle: () => void;
	}

	let { height, collapsed, onToggle }: Props = $props();

	let logContainer: HTMLDivElement | undefined = $state();

	// Auto-scroll to bottom when new entries appear
	$effect(() => {
		const _entries = $commandLog;
		if (logContainer && !collapsed) {
			requestAnimationFrame(() => {
				if (logContainer) {
					logContainer.scrollTop = logContainer.scrollHeight;
				}
			});
		}
	});

	function getCliColor(cli: CliType): string {
		switch (cli) {
			case 'claude': return 'text-blue-400';
			case 'codex': return 'text-emerald-400';
			case 'gemini': return 'text-amber-400';
			case 'team': return 'text-purple-400';
			default: return 'text-gray-400';
		}
	}

	function getStatusBadge(status: string): { color: string; label: string } {
		switch (status) {
			case 'running': return { color: 'text-[var(--dash-accent)]', label: 'RUNNING' };
			case 'success': return { color: 'text-[var(--dash-success)]', label: 'DONE' };
			case 'error': return { color: 'text-[var(--dash-error)]', label: 'ERROR' };
			default: return { color: 'text-[var(--dash-text-dim)]', label: status.toUpperCase() };
		}
	}

	function formatTime(ts: string): string {
		try {
			return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
		} catch {
			return '--:--:--';
		}
	}

	function formatDuration(ms?: number): string {
		if (!ms) return '';
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}
</script>

<div
	class="flex flex-col border-t border-[var(--dash-border)] bg-[var(--dash-panel)]"
	style:height={collapsed ? '28px' : `${height}px`}
>
	<!-- Panel header -->
	<button
		class="flex h-7 shrink-0 items-center gap-2 border-b border-[var(--dash-border)] px-3 text-xs hover:bg-[var(--dash-border)]/30 transition-colors"
		onclick={onToggle}
	>
		<svg
			class="h-3 w-3 text-[var(--dash-text-dim)] transition-transform {collapsed ? '' : 'rotate-180'}"
			fill="none" stroke="currentColor" viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
		</svg>
		<span class="font-medium text-[var(--dash-text-dim)]">Command History</span>
		<span class="rounded bg-[var(--dash-border)] px-1.5 py-0.5 text-[10px] text-[var(--dash-text-dim)]">
			{$commandLog.length}
		</span>

		<!-- Running indicator -->
		{#if $commandLog.some((c) => c.status === 'running')}
			<span class="ml-1 flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-[var(--dash-accent)] animate-pulse"></span>
				<span class="text-[10px] text-[var(--dash-accent)]">
					{$commandLog.filter((c) => c.status === 'running').length} running
				</span>
			</span>
		{/if}
	</button>

	<!-- Log entries -->
	{#if !collapsed}
		<div bind:this={logContainer} class="flex-1 overflow-y-auto font-mono text-[12px] leading-5">
			{#if $commandLog.length === 0}
				<div class="flex h-full items-center justify-center text-[var(--dash-text-dim)]/50">
					No commands yet
				</div>
			{:else}
				{#each $commandLog as entry (entry.id)}
					{@const badge = getStatusBadge(entry.status)}
					<div class="flex items-center gap-2 border-b border-[var(--dash-border)]/30 px-3 py-0.5 hover:bg-[var(--dash-border)]/20 animate-fade-in">
						<!-- Timestamp -->
						<span class="shrink-0 text-[var(--dash-text-dim)]/50">{formatTime(entry.timestamp)}</span>

						<!-- Status indicator -->
						{#if entry.status === 'running'}
							<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dash-accent)] animate-pulse"></span>
						{:else if entry.status === 'success'}
							<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dash-success)]"></span>
						{:else}
							<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dash-error)]"></span>
						{/if}

						<!-- CLI badge -->
						<span class="shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold leading-none {getCliColor(entry.cli)} bg-current/10">
							{entry.cli.toUpperCase()}
						</span>

						<!-- Command -->
						<span class="flex-1 truncate text-[var(--dash-text)]">{entry.command}</span>

						<!-- Duration -->
						{#if entry.duration}
							<span class="shrink-0 text-[var(--dash-text-dim)]/50">{formatDuration(entry.duration)}</span>
						{/if}

						<!-- Tokens -->
						{#if entry.tokens}
							<span class="shrink-0 text-[var(--dash-text-dim)]/40">{entry.tokens}tok</span>
						{/if}

						<!-- Status text -->
						<span class="shrink-0 text-[10px] font-medium {badge.color}">{badge.label}</span>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<script lang="ts">
	import type { ChatToolUse } from '$lib/types';

	interface Props {
		tool: ChatToolUse;
	}

	let { tool }: Props = $props();
	let expanded = $state(false);

	const toolIcon: Record<string, string> = {
		Read: '📖',
		Write: '✏️',
		Edit: '✏️',
		Bash: '💻',
		Glob: '🔍',
		Grep: '🔍',
		WebFetch: '🌐',
		WebSearch: '🌐',
		Task: '🔄'
	};

	const statusColor = $derived(
		tool.status === 'running'
			? 'bg-[var(--dash-accent)]'
			: tool.status === 'done'
				? 'bg-[var(--dash-success)]'
				: 'bg-[var(--dash-error)]'
	);

	const icon = $derived(toolIcon[tool.tool_name] ?? '🔧');
</script>

<div class="my-1 rounded border border-[var(--dash-border)]/50 bg-[var(--dash-bg)]/50 text-xs">
	<!-- Header -->
	<button
		onclick={() => expanded = !expanded}
		class="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-[var(--dash-border)]/20 transition-colors"
	>
		<!-- Status dot -->
		<span class="h-2 w-2 shrink-0 rounded-full {statusColor} {tool.status === 'running' ? 'animate-pulse' : ''}"></span>

		<!-- Icon + tool name -->
		<span class="shrink-0">{icon}</span>
		<span class="font-medium text-[var(--dash-text-dim)]">{tool.tool_name}</span>

		<!-- Target -->
		{#if tool.target}
			<span class="flex-1 truncate text-[var(--dash-text-dim)]/70 font-mono">{tool.target}</span>
		{/if}

		<!-- Expand chevron -->
		<svg
			class="h-3 w-3 shrink-0 text-[var(--dash-text-dim)]/50 transition-transform {expanded ? 'rotate-180' : ''}"
			fill="none" stroke="currentColor" viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Expanded output -->
	{#if expanded && tool.output}
		<div class="border-t border-[var(--dash-border)]/30 px-2 py-1.5">
			<pre class="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-[var(--dash-text-dim)]">{tool.output}</pre>
		</div>
	{/if}
</div>

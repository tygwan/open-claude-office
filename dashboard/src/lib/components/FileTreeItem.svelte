<script lang="ts">
	import type { FileEntry } from '$lib/types';
	import FileTreeItem from './FileTreeItem.svelte';

	interface Props {
		entry: FileEntry;
		depth?: number;
	}

	let { entry, depth = 0 }: Props = $props();

	let expanded = $state(false);
	let children = $state<FileEntry[]>([]);
	let loading = $state(false);
	let loaded = $state(false);

	async function toggle() {
		if (entry.type !== 'directory') return;

		if (!loaded) {
			loading = true;
			try {
				const res = await fetch(`/api/files?path=${encodeURIComponent(entry.path)}`);
				if (res.ok) {
					children = await res.json();
				}
			} catch {
				// ignore
			}
			loading = false;
			loaded = true;
		}

		expanded = !expanded;
	}

	function getFileIcon(name: string): { d: string; color: string; fill: boolean } {
		const ext = name.split('.').pop()?.toLowerCase() ?? '';
		switch (ext) {
			case 'ts':
			case 'tsx':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-blue-400', fill: false };
			case 'js':
			case 'jsx':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-yellow-400', fill: false };
			case 'svelte':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-orange-400', fill: false };
			case 'json':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-green-400', fill: false };
			case 'md':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-gray-400', fill: false };
			case 'css':
			case 'scss':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-purple-400', fill: false };
			case 'html':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-red-400', fill: false };
			case 'yaml':
			case 'yml':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-pink-400', fill: false };
			case 'sh':
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-green-300', fill: false };
			default:
				return { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z', color: 'text-[var(--dash-text-dim)]', fill: false };
		}
	}
</script>

<div>
	<button
		class="group flex w-full items-center gap-1 rounded py-0.5 text-[12px] text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)]/40 hover:text-[var(--dash-text)] transition-colors"
		style:padding-left="{depth * 12 + 8}px"
		onclick={toggle}
	>
		<!-- Chevron (directories only) -->
		{#if entry.type === 'directory'}
			<svg class="h-3 w-3 shrink-0 transition-transform {expanded ? 'rotate-90' : ''}" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
			</svg>
		{:else}
			<span class="w-3 shrink-0"></span>
		{/if}

		<!-- Icon -->
		{#if entry.type === 'directory'}
			<svg class="h-3.5 w-3.5 shrink-0 {expanded ? 'text-[var(--dash-accent)]' : 'text-[var(--dash-text-dim)]'}" fill="currentColor" viewBox="0 0 20 20">
				{#if expanded}
					<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" />
					<path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
				{:else}
					<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
				{/if}
			</svg>
		{:else}
			{@const icon = getFileIcon(entry.name)}
			<svg class="h-3.5 w-3.5 shrink-0 {icon.color}" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d={icon.d} />
				<path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6" />
			</svg>
		{/if}

		<!-- Name -->
		<span class="truncate">{entry.name}</span>

		<!-- Loading spinner -->
		{#if loading}
			<svg class="h-3 w-3 shrink-0 animate-spin text-[var(--dash-accent)]" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		{/if}
	</button>

	<!-- Children (recursive) -->
	{#if expanded && children.length > 0}
		{#each children as child (child.path)}
			<FileTreeItem entry={child} depth={depth + 1} />
		{/each}
	{/if}
</div>

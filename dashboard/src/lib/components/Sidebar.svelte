<script lang="ts">
	import type { Project } from '$lib/types';
	import { activeProjectName, selectProject } from '$lib/stores/projects';

	interface Props {
		projects: Project[];
		width: number;
	}

	let { projects, width }: Props = $props();

	let expandedFolders = $state<Set<string>>(new Set());
	let searchQuery = $state('');

	let filteredProjects = $derived(
		searchQuery
			? projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: projects
	);

	function toggleFolder(name: string) {
		expandedFolders = new Set(expandedFolders);
		if (expandedFolders.has(name)) {
			expandedFolders.delete(name);
		} else {
			expandedFolders.add(name);
		}
	}

	function getStageColor(stage: string): string {
		switch (stage) {
			case 'mvp': return 'bg-amber-500/20 text-amber-400';
			case 'poc': return 'bg-blue-500/20 text-blue-400';
			case 'production': return 'bg-green-500/20 text-green-400';
			default: return 'bg-gray-500/20 text-gray-400';
		}
	}

	function getStageLabel(stage: string): string {
		switch (stage) {
			case 'mvp': return 'MVP';
			case 'poc': return 'PoC';
			case 'production': return 'Prod';
			default: return stage;
		}
	}
</script>

<aside
	class="flex flex-col border-r border-[var(--dash-border)] bg-[var(--dash-sidebar)] select-none overflow-hidden"
	style:width="{width}px"
	style:min-width="{width}px"
>
	<!-- Sidebar header -->
	<div class="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--dash-text-dim)]">
		<span>Explorer</span>
		<button
			class="rounded p-1 hover:bg-[var(--dash-border)] transition-colors"
			title="Refresh projects"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
		</button>
	</div>

	<!-- Search -->
	<div class="px-2 pb-2">
		<input
			type="text"
			placeholder="Search projects..."
			bind:value={searchQuery}
			class="w-full rounded border border-[var(--dash-border)] bg-[var(--dash-bg)] px-2 py-1 text-xs text-[var(--dash-text)] placeholder-[var(--dash-text-dim)] outline-none focus:border-[var(--dash-accent)]"
		/>
	</div>

	<!-- Dev folder root -->
	<div class="px-2 pb-1">
		<button
			class="flex w-full items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)]/50"
			onclick={() => toggleFolder('~/dev')}
		>
			<svg class="h-3 w-3 transition-transform" class:rotate-90={expandedFolders.has('~/dev') || true} fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
			</svg>
			<svg class="h-3.5 w-3.5 text-[var(--dash-accent)]" fill="currentColor" viewBox="0 0 20 20">
				<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
			</svg>
			<span>~/dev</span>
		</button>
	</div>

	<!-- Project list -->
	<div class="flex-1 overflow-y-auto px-1">
		{#each filteredProjects as project (project.name)}
			{@const isActive = $activeProjectName === project.name}
			<button
				class="group flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[13px] transition-colors {isActive ? 'bg-[var(--dash-accent)]/15 text-[var(--dash-text)]' : 'text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)]/40 hover:text-[var(--dash-text)]'}"
				onclick={() => selectProject(project.name)}
			>
				<!-- Folder icon -->
				<svg class="h-4 w-4 shrink-0 {isActive ? 'text-[var(--dash-accent)]' : 'text-[var(--dash-text-dim)]'}" fill="currentColor" viewBox="0 0 20 20">
					{#if project.hasClaudeConfig}
						<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
					{:else}
						<path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clip-rule="evenodd" />
						<path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
					{/if}
				</svg>

				<!-- Name -->
				<span class="flex-1 truncate">{project.name}</span>

				<!-- Claude config indicator -->
				{#if project.hasClaudeConfig}
					<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dash-node-claude)]" title="Has .claude/ config"></span>
				{/if}

				<!-- Stage badge -->
				<span class="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium leading-none {getStageColor(project.lifecycleStage)}">
					{getStageLabel(project.lifecycleStage)}
				</span>
			</button>
		{/each}

		{#if filteredProjects.length === 0}
			<div class="px-3 py-4 text-center text-xs text-[var(--dash-text-dim)]">
				{searchQuery ? 'No matching projects' : 'No projects found in ~/dev/'}
			</div>
		{/if}
	</div>

	<!-- Sidebar footer -->
	<div class="border-t border-[var(--dash-border)] px-3 py-2 text-[11px] text-[var(--dash-text-dim)]">
		{projects.length} project{projects.length !== 1 ? 's' : ''}
	</div>
</aside>

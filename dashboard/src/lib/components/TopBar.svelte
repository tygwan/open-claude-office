<script lang="ts">
	import type { Project, LifecycleStage } from '$lib/types';
	import { activeProjectName, closeProject, selectProject, updateLifecycleStage } from '$lib/stores/projects';

	interface Props {
		openProjects: Project[];
		activeProject: Project | null;
	}

	let { openProjects, activeProject }: Props = $props();

	const stages: { value: LifecycleStage; label: string }[] = [
		{ value: 'mvp', label: 'MVP' },
		{ value: 'poc', label: 'PoC' },
		{ value: 'production', label: 'Production' }
	];

	function handleStageChange(stage: LifecycleStage) {
		if (activeProject) {
			updateLifecycleStage(activeProject.name, stage);
		}
	}
</script>

<header class="flex h-10 items-center border-b border-[var(--dash-border)] bg-[var(--dash-panel)]">
	<!-- Logo -->
	<div class="flex h-full items-center gap-2 border-r border-[var(--dash-border)] px-4">
		<svg class="h-4 w-4 text-[var(--dash-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
		</svg>
		<span class="text-xs font-semibold tracking-tight text-[var(--dash-text)]">open-claude-office</span>
	</div>

	<!-- Tab bar -->
	<div class="flex h-full flex-1 items-end overflow-x-auto" role="tablist">
		{#each openProjects as project (project.name)}
			{@const isActive = $activeProjectName === project.name}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="group relative flex h-[calc(100%-1px)] cursor-pointer items-center gap-2 border-r border-[var(--dash-border)] px-3 text-xs transition-colors {isActive ? 'bg-[var(--dash-bg)] text-[var(--dash-text)]' : 'bg-[var(--dash-panel)] text-[var(--dash-text-dim)] hover:bg-[var(--dash-sidebar)]'}"
				onclick={() => selectProject(project.name)}
				onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') selectProject(project.name); }}
				role="tab"
				tabindex="0"
				aria-selected={isActive}
			>
				<!-- Active indicator -->
				{#if isActive}
					<div class="absolute left-0 right-0 top-0 h-[2px] bg-[var(--dash-accent)]"></div>
				{/if}

				<!-- Dot color -->
				<span class="h-2 w-2 shrink-0 rounded-full {project.hasClaudeConfig ? 'bg-[var(--dash-node-claude)]' : 'bg-[var(--dash-text-dim)]'}"></span>

				<span class="max-w-[120px] truncate">{project.name}</span>

				<!-- Close button -->
				<button
					class="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-[var(--dash-border)] group-hover:opacity-100 {isActive ? 'opacity-100' : ''}"
					onclick={(e: MouseEvent) => { e.stopPropagation(); closeProject(project.name); }}
					title="Close tab"
				>
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}

		{#if openProjects.length === 0}
			<div class="flex h-full items-center px-4 text-xs text-[var(--dash-text-dim)]">
				Select a project from the sidebar
			</div>
		{/if}
	</div>

	<!-- Lifecycle stage toggle -->
	{#if activeProject}
		<div class="flex items-center gap-1 border-l border-[var(--dash-border)] px-3">
			<div class="flex rounded-md border border-[var(--dash-border)] bg-[var(--dash-bg)]">
				{#each stages as stage (stage.value)}
					{@const isActiveStage = activeProject.lifecycleStage === stage.value}
					<button
						class="px-2 py-1 text-[11px] font-medium transition-colors first:rounded-l-md last:rounded-r-md {isActiveStage ? 'bg-[var(--dash-accent)]/20 text-[var(--dash-accent)]' : 'text-[var(--dash-text-dim)] hover:text-[var(--dash-text)]'}"
						onclick={() => handleStageChange(stage.value)}
					>
						{stage.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Settings -->
	<div class="flex items-center border-l border-[var(--dash-border)] px-3">
		<button class="rounded p-1 text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)] hover:text-[var(--dash-text)] transition-colors" title="Settings">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
		</button>
	</div>
</header>

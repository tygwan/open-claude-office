<script lang="ts">
	import { activeProject } from '$lib/stores/projects';
	import { activePipeline } from '$lib/stores/events';
	import PipelineGraph from '$lib/components/PipelineGraph.svelte';

	let currentView = $state<'pipeline' | 'history'>('pipeline');
</script>

<div class="flex h-full flex-col overflow-hidden">
	<!-- View tabs -->
	<div class="flex h-8 shrink-0 items-center gap-0 border-b border-[var(--dash-border)] bg-[var(--dash-sidebar)]">
		<button
			class="flex h-full items-center gap-1.5 border-r border-[var(--dash-border)] px-3 text-xs transition-colors {currentView === 'pipeline' ? 'bg-[var(--dash-bg)] text-[var(--dash-text)]' : 'text-[var(--dash-text-dim)] hover:text-[var(--dash-text)]'}"
			onclick={() => currentView = 'pipeline'}
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			Pipeline Flow
		</button>
		<button
			class="flex h-full items-center gap-1.5 border-r border-[var(--dash-border)] px-3 text-xs transition-colors {currentView === 'history' ? 'bg-[var(--dash-bg)] text-[var(--dash-text)]' : 'text-[var(--dash-text-dim)] hover:text-[var(--dash-text)]'}"
			onclick={() => currentView = 'history'}
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			History
		</button>

		<!-- Active project label -->
		{#if $activeProject}
			<div class="ml-auto flex items-center gap-2 px-3">
				<span class="text-[11px] text-[var(--dash-text-dim)]">
					{$activeProject.name}
				</span>
				<span class="rounded bg-[var(--dash-accent)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--dash-accent)]">
					{$activeProject.lifecycleStage.toUpperCase()}
				</span>
			</div>
		{/if}
	</div>

	<!-- View content -->
	<div class="flex-1 overflow-hidden">
		{#if currentView === 'pipeline'}
			<PipelineGraph pipeline={$activePipeline} />
		{:else}
			<!-- History View -->
			<div class="h-full overflow-y-auto p-4">
				<div class="mx-auto max-w-3xl">
					<h2 class="mb-4 text-sm font-medium text-[var(--dash-text)]">Pipeline History</h2>

					{#if $activePipeline}
						<div class="space-y-3">
							<!-- Timeline -->
							<div class="relative border-l-2 border-[var(--dash-border)] pl-6">
								{#each $activePipeline.nodes as node, i (node.id)}
									<div class="relative mb-6">
										<!-- Timeline dot -->
										<div class="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-[var(--dash-border)] bg-[var(--dash-bg)] {node.status === 'done' ? '!border-[var(--dash-success)] !bg-[var(--dash-success)]' : node.status === 'active' || node.status === 'streaming' ? '!border-[var(--dash-accent)] !bg-[var(--dash-accent)]' : node.status === 'error' ? '!border-[var(--dash-error)] !bg-[var(--dash-error)]' : ''}"></div>

										<!-- Content -->
										<div class="rounded border border-[var(--dash-border)] bg-[var(--dash-panel)] p-3">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium text-[var(--dash-text)]">{node.label}</span>
												<span class="rounded px-1.5 py-0.5 text-[10px] font-semibold {node.cli === 'claude' ? 'bg-blue-500/20 text-blue-400' : node.cli === 'codex' ? 'bg-emerald-500/20 text-emerald-400' : node.cli === 'gemini' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}">
													{node.cli.toUpperCase()}
												</span>
												<span class="rounded px-1.5 py-0.5 text-[10px] {node.status === 'done' ? 'bg-green-500/20 text-green-400' : node.status === 'active' || node.status === 'streaming' ? 'bg-blue-500/20 text-blue-400' : node.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}">
													{node.status}
												</span>
											</div>
											{#if node.file}
												<p class="mt-1 text-xs text-[var(--dash-text-dim)]">
													Target: <code class="rounded bg-[var(--dash-bg)] px-1 py-0.5">{node.file}</code>
												</p>
											{/if}
											{#if node.tokens}
												<p class="mt-1 text-xs text-[var(--dash-text-dim)]">{node.tokens} tokens used</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="rounded border border-[var(--dash-border)] bg-[var(--dash-panel)] p-8 text-center">
							<p class="text-sm text-[var(--dash-text-dim)]">No pipeline history available</p>
							<p class="mt-1 text-xs text-[var(--dash-text-dim)]/60">Run a pipeline to see its history here</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

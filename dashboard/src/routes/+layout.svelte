<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import type { Project } from '$lib/types';
	import { projects, activeProject, openProjects, activeProjectName } from '$lib/stores/projects';
	import { connectEvents, disconnectEvents, activePipeline, injectDemoPipeline } from '$lib/stores/events';
	import { onMount, onDestroy } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import BottomPanel from '$lib/components/BottomPanel.svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();

	// Sidebar state
	let sidebarWidth = $state(240);
	let isResizingSidebar = $state(false);
	let sidebarMinWidth = 180;
	let sidebarMaxWidth = 420;

	// Bottom panel state
	let bottomPanelHeight = $state(200);
	let isResizingPanel = $state(false);
	let bottomPanelCollapsed = $state(false);
	let panelMinHeight = 100;
	let panelMaxHeight = 500;

	// Initialize stores with server data
	onMount(() => {
		projects.set(data.projects);

		// Inject demo pipeline data for visual testing
		injectDemoPipeline();
	});

	onDestroy(() => {
		disconnectEvents();
	});

	// Single authoritative SSE connection — reacts to project changes
	$effect(() => {
		const name = $activeProjectName;
		connectEvents(name ?? undefined);
	});

	// Resize handling — use window-level listeners so the overlay never blocks events
	function handleMouseMove(e: MouseEvent) {
		if (isResizingSidebar) {
			sidebarWidth = Math.max(sidebarMinWidth, Math.min(sidebarMaxWidth, e.clientX));
		}
		if (isResizingPanel) {
			bottomPanelHeight = Math.max(panelMinHeight, Math.min(panelMaxHeight, window.innerHeight - e.clientY - 24));
		}
	}

	function handleMouseUp() {
		isResizingSidebar = false;
		isResizingPanel = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	function startSidebarResize(e: MouseEvent) {
		isResizingSidebar = true;
		e.preventDefault();
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function startPanelResize(e: MouseEvent) {
		isResizingPanel = true;
		e.preventDefault();
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function toggleBottomPanel() {
		bottomPanelCollapsed = !bottomPanelCollapsed;
	}
</script>

<div class="flex h-screen w-screen flex-col overflow-hidden">
	<!-- Top Bar -->
	<TopBar openProjects={$openProjects} activeProject={$activeProject} />

	<!-- Middle: Sidebar + Content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		<Sidebar projects={$projects} width={sidebarWidth} />

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- Sidebar resize handle -->
		<div
			class="w-[3px] cursor-col-resize hover:bg-[var(--dash-accent)]/50 active:bg-[var(--dash-accent)] transition-colors {isResizingSidebar ? 'bg-[var(--dash-accent)]' : 'bg-transparent'}"
			onmousedown={startSidebarResize}
			role="separator"
			aria-orientation="vertical"
		></div>

		<!-- Main Content + Bottom Panel -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- Main content area -->
			<div class="flex-1 overflow-hidden">
				{@render children()}
			</div>

			<!-- Bottom panel resize handle -->
			{#if !bottomPanelCollapsed}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="h-[3px] cursor-row-resize hover:bg-[var(--dash-accent)]/50 active:bg-[var(--dash-accent)] transition-colors {isResizingPanel ? 'bg-[var(--dash-accent)]' : 'bg-transparent'}"
					onmousedown={startPanelResize}
					role="separator"
					aria-orientation="horizontal"
				></div>
			{/if}

			<!-- Bottom Panel: Command Log + Chat -->
			<BottomPanel
				height={bottomPanelHeight}
				collapsed={bottomPanelCollapsed}
				onToggle={toggleBottomPanel}
			/>
		</div>
	</div>

	<!-- Status Bar -->
	<StatusBar pipeline={$activePipeline} />
</div>

<!-- Resize overlay to prevent iframe/svg capturing mouse events -->
{#if isResizingSidebar || isResizingPanel}
	<div class="fixed inset-0 z-50" style:cursor={isResizingSidebar ? 'col-resize' : 'row-resize'}></div>
{/if}

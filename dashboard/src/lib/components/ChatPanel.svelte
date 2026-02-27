<script lang="ts">
	import { chatMessages, chatStatus, currentSession, sendMessage, cancelChat, clearChat, newSession } from '$lib/stores/chat';
	import { activeProject } from '$lib/stores/projects';
	import ChatMessageComponent from './ChatMessage.svelte';
	import ChatInput from './ChatInput.svelte';

	let messageContainer: HTMLDivElement | undefined = $state();
	let lastProjectName: string | null = $state(null);

	// Auto-scroll to bottom when messages change
	$effect(() => {
		const _msgs = $chatMessages;
		if (messageContainer) {
			requestAnimationFrame(() => {
				if (messageContainer) {
					messageContainer.scrollTop = messageContainer.scrollHeight;
				}
			});
		}
	});

	// Auto-initialize session when project changes
	$effect(() => {
		const project = $activeProject;
		if (project && project.name !== lastProjectName) {
			lastProjectName = project.name;
			newSession(project.path, project.name);
		}
	});

	function handleSend(prompt: string) {
		const project = $activeProject;
		if (!project) return;

		// Ensure we have a session
		if (!$currentSession) {
			newSession(project.path, project.name);
		}

		sendMessage(prompt, project.path);
	}

	function handleStop() {
		cancelChat();
	}

	function handleNewSession() {
		const project = $activeProject;
		if (project) {
			newSession(project.path, project.name);
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Session header -->
	<div class="flex items-center gap-2 border-b border-[var(--dash-border)]/50 px-3 py-1.5 text-xs">
		{#if $currentSession?.sessionId}
			<span class="font-mono text-[var(--dash-text-dim)]/60">
				Session: {$currentSession.sessionId.slice(0, 8)}...
			</span>
		{:else}
			<span class="text-[var(--dash-text-dim)]/60">New session</span>
		{/if}

		{#if $currentSession?.projectName}
			<span class="rounded bg-[var(--dash-node-claude)]/20 px-1.5 py-0.5 text-[10px] text-[var(--dash-node-claude)]">
				{$currentSession.projectName}
			</span>
		{/if}

		<div class="flex-1"></div>

		<!-- Status indicator -->
		{#if $chatStatus === 'streaming'}
			<span class="flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-[var(--dash-accent)] animate-pulse"></span>
				<span class="text-[10px] text-[var(--dash-accent)]">Streaming</span>
			</span>
		{:else if $chatStatus === 'connecting'}
			<span class="text-[10px] text-[var(--dash-warning)]">Connecting...</span>
		{:else if $chatStatus === 'error'}
			<span class="text-[10px] text-[var(--dash-error)]">Error</span>
		{/if}

		<button
			onclick={handleNewSession}
			class="rounded px-2 py-0.5 text-[10px] text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)]/30 hover:text-[var(--dash-text)] transition-colors"
		>
			New Session
		</button>
	</div>

	<!-- Messages -->
	<div bind:this={messageContainer} class="flex-1 overflow-y-auto">
		{#if $chatMessages.length === 0}
			<div class="flex h-full flex-col items-center justify-center gap-2 text-[var(--dash-text-dim)]/40">
				<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
				</svg>
				<span class="text-xs">Send a message to start chatting with Claude Code</span>
				{#if !$activeProject}
					<span class="text-[10px]">Select a project from the sidebar first</span>
				{/if}
			</div>
		{:else}
			{#each $chatMessages as msg (msg.id)}
				<ChatMessageComponent message={msg} />
			{/each}
		{/if}
	</div>

	<!-- Input -->
	<ChatInput
		onSend={handleSend}
		onStop={handleStop}
		disabled={!$activeProject}
	/>
</div>

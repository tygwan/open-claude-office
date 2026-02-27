<script lang="ts">
	import {
		chatMessages, chatStatus, currentSession, sessionList,
		sendMessage, cancelChat, newSession,
		loadSessionList, resumeSession, deleteSession
	} from '$lib/stores/chat';
	import { activeProject } from '$lib/stores/projects';
	import ChatMessageComponent from './ChatMessage.svelte';
	import ChatInput from './ChatInput.svelte';

	let messageContainer: HTMLDivElement | undefined = $state();
	let lastProjectName: string | null = $state(null);
	let showSessionMenu = $state(false);

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
			loadSessionList(project.name);
		}
	});

	function handleSend(prompt: string) {
		const project = $activeProject;
		if (!project) return;

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

	async function handleResumeSession(sessionId: string) {
		const project = $activeProject;
		if (!project) return;
		await resumeSession(sessionId, project.name);
		showSessionMenu = false;
	}

	async function handleDeleteSession(e: MouseEvent, sessionId: string) {
		e.stopPropagation();
		const project = $activeProject;
		if (!project) return;

		// If deleting the current session, start a new one
		if ($currentSession?.sessionId === sessionId) {
			newSession(project.path, project.name);
		}
		await deleteSession(sessionId, project.name);
	}

	function formatSessionTime(ts: string): string {
		try {
			const d = new Date(ts);
			const now = new Date();
			const isToday = d.toDateString() === now.toDateString();
			if (isToday) {
				return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
			}
			return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
				d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
		} catch {
			return '--';
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Session header -->
	<div class="flex items-center gap-2 border-b border-[var(--dash-border)]/50 px-3 py-1.5 text-xs">
		<!-- Session selector -->
		<div class="relative">
			<button
				onclick={() => { showSessionMenu = !showSessionMenu; if (!showSessionMenu) return; const p = $activeProject; if (p) loadSessionList(p.name); }}
				class="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[var(--dash-border)]/30 transition-colors"
			>
				{#if $currentSession?.sessionId}
					<span class="font-mono text-[var(--dash-text-dim)]/60">
						{$currentSession.sessionId.slice(0, 8)}...
					</span>
				{:else}
					<span class="text-[var(--dash-text-dim)]/60">New session</span>
				{/if}
				<svg class="h-3 w-3 text-[var(--dash-text-dim)] transition-transform {showSessionMenu ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			<!-- Session dropdown -->
			{#if showSessionMenu}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border border-[var(--dash-border)] bg-[var(--dash-panel)] shadow-lg"
					onmouseleave={() => showSessionMenu = false}
				>
					<div class="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--dash-text-dim)]">
						Previous Sessions
					</div>
					<div class="max-h-48 overflow-y-auto">
						{#if $sessionList.length === 0}
							<div class="px-3 py-2 text-[11px] text-[var(--dash-text-dim)]/50">
								No saved sessions
							</div>
						{:else}
							{#each $sessionList as session (session.sessionId)}
								{@const isCurrent = $currentSession?.sessionId === session.sessionId}
								<div class="group flex w-full items-center gap-2 px-2 py-1.5 transition-colors {isCurrent ? 'bg-[var(--dash-accent)]/10' : 'hover:bg-[var(--dash-border)]/30'}">
									<button
										class="flex flex-1 items-center gap-2 text-left min-w-0"
										onclick={() => handleResumeSession(session.sessionId)}
									>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-1.5">
												<span class="font-mono text-[10px] text-[var(--dash-text-dim)]">
													{session.sessionId.slice(0, 8)}
												</span>
												<span class="text-[10px] text-[var(--dash-text-dim)]/50">
													{formatSessionTime(session.lastActiveAt)}
												</span>
												{#if isCurrent}
													<span class="h-1.5 w-1.5 rounded-full bg-[var(--dash-accent)]"></span>
												{/if}
											</div>
											{#if session.firstMessage}
												<div class="truncate text-[11px] text-[var(--dash-text-dim)]">
													{session.firstMessage}
												</div>
											{/if}
										</div>
										<span class="shrink-0 text-[10px] text-[var(--dash-text-dim)]/40">
											{session.messageCount} msg
										</span>
									</button>
									<button
										onclick={(e) => handleDeleteSession(e, session.sessionId)}
										class="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[var(--dash-error)]/20 hover:text-[var(--dash-error)] transition-all"
										title="Delete session"
									>
										<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		</div>

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
				{#if $sessionList.length > 0}
					<button
						onclick={() => showSessionMenu = true}
						class="mt-2 rounded-md border border-[var(--dash-border)] px-3 py-1.5 text-xs text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)]/30 hover:text-[var(--dash-text)] transition-colors"
					>
						Resume previous session ({$sessionList.length})
					</button>
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

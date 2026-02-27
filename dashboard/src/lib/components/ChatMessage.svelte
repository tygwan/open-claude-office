<script lang="ts">
	import type { ChatMessage } from '$lib/types';
	import ChatToolUseBlock from './ChatToolUseBlock.svelte';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	function formatTime(ts: string): string {
		try {
			return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
		} catch {
			return '--:--';
		}
	}

	function formatCost(usd?: number): string {
		if (!usd) return '';
		return `$${usd.toFixed(4)}`;
	}

	function formatDuration(ms?: number): string {
		if (!ms) return '';
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}
</script>

<div class="animate-fade-in px-3 py-2 {message.role === 'user' ? 'flex justify-end' : ''}">
	{#if message.role === 'user'}
		<!-- User bubble: right-aligned, blue -->
		<div class="max-w-[80%] rounded-lg bg-[var(--dash-accent)]/20 px-3 py-2 text-sm text-[var(--dash-text)]">
			<div class="whitespace-pre-wrap break-words">{message.content}</div>
			<div class="mt-1 text-right text-[10px] text-[var(--dash-text-dim)]/50">{formatTime(message.timestamp)}</div>
		</div>
	{:else}
		<!-- Assistant bubble: left-aligned -->
		<div class="max-w-[95%]">
			<!-- Tool uses -->
			{#if message.toolUses && message.toolUses.length > 0}
				<div class="mb-1">
					{#each message.toolUses as tool (tool.id)}
						<ChatToolUseBlock {tool} />
					{/each}
				</div>
			{/if}

			<!-- Text content -->
			{#if message.content}
				<div class="text-sm text-[var(--dash-text)] whitespace-pre-wrap break-words leading-relaxed">
					{message.content}{#if message.isStreaming}<span class="chat-typing-cursor">▎</span>{/if}
				</div>
			{:else if message.isStreaming}
				<span class="chat-typing-cursor">▎</span>
			{/if}

			<!-- Metadata footer -->
			<div class="mt-1 flex items-center gap-3 text-[10px] text-[var(--dash-text-dim)]/50">
				<span>{formatTime(message.timestamp)}</span>
				{#if message.durationMs}
					<span>{formatDuration(message.durationMs)}</span>
				{/if}
				{#if message.costUsd}
					<span>{formatCost(message.costUsd)}</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

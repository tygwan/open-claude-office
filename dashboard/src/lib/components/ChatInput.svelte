<script lang="ts">
	import { chatStatus } from '$lib/stores/chat';

	interface Props {
		onSend: (prompt: string) => void;
		onStop: () => void;
		disabled?: boolean;
	}

	let { onSend, onStop, disabled = false }: Props = $props();
	let text = $state('');
	let textarea: HTMLTextAreaElement | undefined = $state();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}

	function submit() {
		const trimmed = text.trim();
		if (!trimmed || disabled || $chatStatus === 'streaming' || $chatStatus === 'connecting') return;
		onSend(trimmed);
		text = '';
		if (textarea) textarea.style.height = 'auto';
	}

	function autoResize() {
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
	}

	const isStreaming = $derived($chatStatus === 'streaming' || $chatStatus === 'connecting');
</script>

<div class="flex items-end gap-2 border-t border-[var(--dash-border)] bg-[var(--dash-panel)] px-3 py-2">
	<textarea
		bind:this={textarea}
		bind:value={text}
		onkeydown={handleKeydown}
		oninput={autoResize}
		placeholder="Send a message..."
		rows="1"
		disabled={disabled || isStreaming}
		class="flex-1 resize-none rounded-md border border-[var(--dash-border)] bg-[var(--dash-bg)] px-3 py-2 text-sm text-[var(--dash-text)] placeholder-[var(--dash-text-dim)]/50 outline-none transition-colors focus:border-[var(--dash-accent)] disabled:opacity-50"
	></textarea>

	{#if isStreaming}
		<button
			onclick={onStop}
			class="shrink-0 rounded-md bg-[var(--dash-error)] px-3 py-2 text-xs font-medium text-white transition-colors hover:brightness-110"
		>
			Stop
		</button>
	{:else}
		<button
			onclick={submit}
			disabled={!text.trim() || disabled}
			class="shrink-0 rounded-md bg-[var(--dash-accent)] px-3 py-2 text-xs font-medium text-white transition-colors hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
		>
			Send
		</button>
	{/if}
</div>

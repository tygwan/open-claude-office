import { writable, get } from 'svelte/store';
import type {
	ChatMessage,
	ChatSession,
	ChatStatus,
	ChatToolUse,
	StreamJsonEvent,
	PipelineEvent,
	SessionSummary
} from '$lib/types';
import { processEvent } from '$lib/stores/events';

export const chatMessages = writable<ChatMessage[]>([]);
export const chatStatus = writable<ChatStatus>('idle');
export const currentSession = writable<ChatSession | null>(null);
export const sessionList = writable<SessionSummary[]>([]);

let abortController: AbortController | null = null;
let currentAssistantId: string | null = null;

/**
 * Send a prompt to the Claude Code CLI backend and stream the response.
 */
export async function sendMessage(prompt: string, projectPath: string) {
	const session = get(currentSession);

	// Add user message
	const userMsg: ChatMessage = {
		id: `msg-${Date.now()}-user`,
		role: 'user',
		content: prompt,
		timestamp: new Date().toISOString()
	};
	chatMessages.update((msgs) => [...msgs, userMsg]);

	// Prepare assistant message placeholder
	currentAssistantId = `msg-${Date.now()}-assistant`;
	const assistantMsg: ChatMessage = {
		id: currentAssistantId,
		role: 'assistant',
		content: '',
		timestamp: new Date().toISOString(),
		toolUses: [],
		isStreaming: true
	};
	chatMessages.update((msgs) => [...msgs, assistantMsg]);

	chatStatus.set('connecting');

	abortController = new AbortController();

	try {
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				prompt,
				projectPath,
				sessionId: session?.sessionId
			}),
			signal: abortController.signal
		});

		if (!res.ok || !res.body) {
			chatStatus.set('error');
			updateAssistant({ content: `Error: ${res.statusText}`, isStreaming: false });
			return;
		}

		chatStatus.set('streaming');

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const payload = line.slice(6).trim();
					if (!payload) continue;
					try {
						const event: StreamJsonEvent = JSON.parse(payload);
						processStreamEvent(event);
					} catch {
						// skip malformed JSON
					}
				}
			}
		}

		// Process any remaining buffer
		const trailing = buffer.trim();
		if (trailing.startsWith('data: ')) {
			const payload = trailing.slice(6).trim();
			if (payload) {
				try {
					const event: StreamJsonEvent = JSON.parse(payload);
					processStreamEvent(event);
				} catch {
					// ignore
				}
			}
		}

		updateAssistant({ isStreaming: false });
		chatStatus.set('idle');
		saveSession();
	} catch (err: unknown) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			updateAssistant({ isStreaming: false });
			chatStatus.set('idle');
		} else {
			chatStatus.set('error');
			updateAssistant({
				content: (get(chatMessages).find((m) => m.id === currentAssistantId)?.content ?? '') +
					`\n\n[Error: ${err instanceof Error ? err.message : 'Unknown error'}]`,
				isStreaming: false
			});
		}
	} finally {
		abortController = null;
		currentAssistantId = null;
	}
}

/** Process a single stream-json event from Claude CLI */
function processStreamEvent(event: StreamJsonEvent) {
	switch (event.type) {
		case 'init':
			// Capture session ID for --resume
			if (event.session_id) {
				currentSession.update((s) =>
					s
						? { ...s, sessionId: event.session_id! }
						: {
								sessionId: event.session_id!,
								projectPath: '',
								projectName: '',
								startedAt: new Date().toISOString()
							}
				);
			}
			break;

		case 'assistant': {
			// Accumulate text content
			const content = extractTextContent(event);
			if (content) {
				appendAssistantText(content);
			}
			// Check for tool_use blocks in message content
			if (event.message?.content && Array.isArray(event.message.content)) {
				for (const block of event.message.content) {
					if (block.type === 'tool_use' && block.name && block.id) {
						addToolUse({
							id: block.id,
							tool_name: block.name,
							target: extractToolTarget(block.name, block.input),
							status: 'running'
						});
						bridgeToPipeline(block.name, block.input);
					}
				}
			}
			break;
		}

		case 'tool_use':
			if (event.tool_name && event.tool_use_id) {
				addToolUse({
					id: event.tool_use_id,
					tool_name: event.tool_name,
					target: extractToolTarget(event.tool_name, event.input),
					status: 'running'
				});
				bridgeToPipeline(event.tool_name, event.input);
			}
			break;

		case 'tool_result':
			if (event.tool_use_id) {
				const output = typeof event.content === 'string'
					? event.content.slice(0, 500)
					: Array.isArray(event.content)
						? event.content.map((c) => c.text ?? '').join('').slice(0, 500)
						: undefined;
				updateToolUse(event.tool_use_id, { status: 'done', output });
			}
			break;

		case 'result':
			// Final result – may contain cost / duration
			if (event.result) {
				appendAssistantText(event.result);
			}
			updateAssistant({
				costUsd: event.cost_usd,
				durationMs: event.duration_ms ?? event.duration_api_ms,
				isStreaming: false
			});
			break;

		case 'error':
			if (event.tool_use_id) {
				updateToolUse(event.tool_use_id, { status: 'error' });
			}
			const errContent = typeof event.content === 'string' ? event.content : '';
			if (errContent) {
				appendAssistantText(`\n[Error: ${errContent}]`);
			}
			break;

		case 'system':
			// Process close or other system events – no-op for now
			break;
	}
}

// ─── Helpers ────────────────────────────────────────────

function extractTextContent(event: StreamJsonEvent): string {
	if (event.message?.content) {
		if (typeof event.message.content === 'string') return event.message.content;
		if (Array.isArray(event.message.content)) {
			return event.message.content
				.filter((b) => b.type === 'text' && b.text)
				.map((b) => b.text!)
				.join('');
		}
	}
	return '';
}

function extractToolTarget(toolName: string, input?: Record<string, unknown>): string | undefined {
	if (!input) return undefined;
	// Common Claude Code tool patterns
	if (input.file_path) return String(input.file_path);
	if (input.path) return String(input.path);
	if (input.command) return String(input.command).slice(0, 120);
	if (input.pattern) return String(input.pattern);
	if (input.query) return String(input.query).slice(0, 120);
	if (input.url) return String(input.url);
	return undefined;
}

function appendAssistantText(text: string) {
	chatMessages.update((msgs) =>
		msgs.map((m) =>
			m.id === currentAssistantId ? { ...m, content: m.content + text } : m
		)
	);
}

function updateAssistant(patch: Partial<ChatMessage>) {
	chatMessages.update((msgs) =>
		msgs.map((m) =>
			m.id === currentAssistantId ? { ...m, ...patch } : m
		)
	);
}

function addToolUse(tool: ChatToolUse) {
	chatMessages.update((msgs) =>
		msgs.map((m) => {
			if (m.id !== currentAssistantId) return m;
			const existing = m.toolUses ?? [];
			if (existing.find((t) => t.id === tool.id)) return m;
			return { ...m, toolUses: [...existing, tool] };
		})
	);
}

function updateToolUse(toolUseId: string, patch: Partial<ChatToolUse>) {
	chatMessages.update((msgs) =>
		msgs.map((m) => {
			if (m.id !== currentAssistantId) return m;
			return {
				...m,
				toolUses: (m.toolUses ?? []).map((t) =>
					t.id === toolUseId ? { ...t, ...patch } : t
				)
			};
		})
	);
}

// ─── Pipeline Bridge (stage-aware) ──────────────────────

import { classifyFile, detectStage, buildNodeLabel } from '$lib/utils/classifier';

let bridgeNodeCounter = 0;

function bridgeToPipeline(toolName: string, input?: Record<string, unknown>) {
	const target = extractToolTarget(toolName, input);
	const stage = detectStage(toolName, target);
	const classification = target ? classifyFile(target) : { domain: 'general' as const, tech: '' };
	const label = buildNodeLabel(toolName, target, classification.tech);

	// All tool uses become agent_spawn so they create visible nodes
	const pipelineEvent: PipelineEvent = {
		timestamp: new Date().toISOString(),
		pipeline_id: `chat-${get(currentSession)?.sessionId ?? 'live'}`,
		event_type: 'agent_spawn',
		stage: stage,
		agent: `${stage}-${classification.domain}-${bridgeNodeCounter++}`,
		cli: 'claude',
		file: target,
		message: label,
		metadata: {
			domain: classification.domain,
			tech: classification.tech,
			devStage: stage
		}
	};

	processEvent(pipelineEvent);
}

// ─── Session Management ─────────────────────────────────

export function cancelChat() {
	if (abortController) {
		abortController.abort();
		abortController = null;
	}
}

export function clearChat() {
	cancelChat();
	chatMessages.set([]);
	currentSession.set(null);
	chatStatus.set('idle');
	currentAssistantId = null;
	bridgeNodeCounter = 0;
}

export function newSession(projectPath: string, projectName: string) {
	clearChat();
	currentSession.set({
		sessionId: '',
		projectPath,
		projectName,
		startedAt: new Date().toISOString()
	});
}

// ─── Session Persistence ────────────────────────────────

/** Save current session to server */
async function saveSession() {
	const session = get(currentSession);
	const messages = get(chatMessages);
	if (!session?.sessionId || messages.length === 0) return;

	try {
		await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: session.sessionId,
				projectName: session.projectName,
				projectPath: session.projectPath,
				startedAt: session.startedAt,
				messages
			})
		});
	} catch {
		// silent fail — persistence is best-effort
	}
}

/** Load session list for a project */
export async function loadSessionList(projectName: string) {
	try {
		const res = await fetch(`/api/sessions?project=${encodeURIComponent(projectName)}`);
		if (res.ok) {
			const data: SessionSummary[] = await res.json();
			sessionList.set(data);
		}
	} catch {
		sessionList.set([]);
	}
}

/** Resume a previous session — restore messages and prepare --resume */
export async function resumeSession(sessionId: string, projectName: string) {
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}?project=${encodeURIComponent(projectName)}`);
		if (!res.ok) return;

		const data = await res.json();
		const messages: ChatMessage[] = data.messages ?? [];

		cancelChat();
		chatMessages.set(messages);
		chatStatus.set('idle');
		currentAssistantId = null;

		currentSession.set({
			sessionId: data.sessionId,
			projectPath: data.projectPath,
			projectName: data.projectName,
			startedAt: data.startedAt
		});
	} catch {
		// silent fail
	}
}

/** Delete a session from server */
export async function deleteSession(sessionId: string, projectName: string) {
	try {
		await fetch(`/api/sessions/${encodeURIComponent(sessionId)}?project=${encodeURIComponent(projectName)}`, {
			method: 'DELETE'
		});
		sessionList.update((list) => list.filter((s) => s.sessionId !== sessionId));
	} catch {
		// silent fail
	}
}

import { writable, derived } from 'svelte/store';
import type { PipelineEvent, Pipeline, PipelineNode, PipelineEdge, CommandLogEntry } from '$lib/types';

export const events = writable<PipelineEvent[]>([]);
export const pipelines = writable<Map<string, Pipeline>>(new Map());
export const commandLog = writable<CommandLogEntry[]>([]);
export const isConnected = writable<boolean>(false);
export const totalTokens = writable<{ input: number; output: number; total: number }>({
	input: 0,
	output: 0,
	total: 0
});

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const activePipeline = derived(pipelines, ($pipelines) => {
	for (const [, pipeline] of $pipelines) {
		if (pipeline.status === 'running') return pipeline;
	}
	// Return the most recent pipeline if none running
	const sorted = [...$pipelines.values()].sort(
		(a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? '')
	);
	return sorted[0] ?? null;
});

export const recentEvents = derived(events, ($events) => {
	return $events.slice(-100);
});

export function processEvent(event: PipelineEvent) {
	events.update((list) => [...list.slice(-500), event]);

	if (event.tokens) {
		totalTokens.update((t) => ({
			input: t.input + (event.tokens?.input ?? 0),
			output: t.output + (event.tokens?.output ?? 0),
			total: t.total + (event.tokens?.total ?? 0)
		}));
	}

	pipelines.update((map) => {
		const pipelineId = event.pipeline_id;
		if (!pipelineId) return map;

		let pipeline = map.get(pipelineId);
		if (!pipeline) {
			pipeline = {
				id: pipelineId,
				project: '',
				stage: 'mvp',
				nodes: [],
				edges: [],
				status: 'idle',
				startedAt: event.timestamp
			};
		}

		switch (event.event_type) {
			case 'pipeline_start':
				pipeline.status = 'running';
				pipeline.startedAt = event.timestamp;
				break;

			case 'agent_spawn': {
				const nodeId = `${event.agent ?? 'unknown'}-${pipeline.nodes.length}`;
				const existingNode = pipeline.nodes.find((n) => n.agent === event.agent);
				if (!existingNode) {
					const col = pipeline.nodes.length % 3;
					const row = Math.floor(pipeline.nodes.length / 3);
					const newNode: PipelineNode = {
						id: nodeId,
						label: event.agent ?? 'Agent',
						cli: event.cli ?? 'claude',
						status: 'active',
						x: 180 + col * 220,
						y: 80 + row * 160,
						file: event.file,
						agent: event.agent
					};
					pipeline.nodes = [...pipeline.nodes, newNode];

					if (pipeline.nodes.length > 1) {
						const prevNode = pipeline.nodes[pipeline.nodes.length - 2];
						const newEdge: PipelineEdge = {
							id: `edge-${prevNode.id}-${nodeId}`,
							source: prevNode.id,
							target: nodeId,
							active: true
						};
						pipeline.edges = [...pipeline.edges, newEdge];
					}
				} else {
					existingNode.status = 'active';
					pipeline.nodes = [...pipeline.nodes];
				}
				break;
			}

			case 'agent_output': {
				const outputNode = pipeline.nodes.find((n) => n.agent === event.agent);
				if (outputNode) {
					outputNode.status = 'streaming';
					pipeline.nodes = [...pipeline.nodes];
				}
				break;
			}

			case 'stage_complete': {
				const doneNode = pipeline.nodes.find((n) => n.agent === event.agent);
				if (doneNode) {
					doneNode.status = 'done';
					pipeline.nodes = [...pipeline.nodes];
				}
				pipeline.edges = pipeline.edges.map((e) => ({ ...e, active: false }));
				break;
			}

			case 'agent_error': {
				const errorNode = pipeline.nodes.find((n) => n.agent === event.agent);
				if (errorNode) {
					errorNode.status = 'error';
					pipeline.nodes = [...pipeline.nodes];
				}
				break;
			}

			case 'pipeline_complete':
				pipeline.status = 'complete';
				pipeline.completedAt = event.timestamp;
				pipeline.nodes = pipeline.nodes.map((n) => ({
					...n,
					status: n.status === 'error' ? 'error' : 'done'
				}));
				pipeline.edges = pipeline.edges.map((e) => ({ ...e, active: false }));
				break;
		}

		map.set(pipelineId, { ...pipeline });
		return new Map(map);
	});

	// Track command log entries
	if (event.event_type === 'agent_spawn' || event.event_type === 'stage_start') {
		const entry: CommandLogEntry = {
			id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			timestamp: event.timestamp,
			cli: event.cli ?? 'claude',
			command: event.message ?? `${event.agent ?? 'agent'} ${event.stage ?? ''}`.trim(),
			status: 'running',
			tokens: 0
		};
		commandLog.update((log) => [...log.slice(-200), entry]);
	}
}

export function connectEvents(projectFilter?: string) {
	disconnectEvents();

	const params = new URLSearchParams();
	if (projectFilter) params.set('project', projectFilter);

	const url = `/api/events${params.toString() ? '?' + params.toString() : ''}`;

	try {
		eventSource = new EventSource(url);

		eventSource.onopen = () => {
			isConnected.set(true);
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
		};

		eventSource.onmessage = (msg) => {
			try {
				const event: PipelineEvent = JSON.parse(msg.data);
				processEvent(event);
			} catch {
				// Skip malformed events
			}
		};

		eventSource.onerror = () => {
			isConnected.set(false);
			eventSource?.close();
			eventSource = null;

			// Reconnect after 3 seconds
			reconnectTimer = setTimeout(() => {
				connectEvents(projectFilter);
			}, 3000);
		};
	} catch {
		isConnected.set(false);
	}
}

export function disconnectEvents() {
	if (eventSource) {
		eventSource.close();
		eventSource = null;
	}
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	isConnected.set(false);
}

/** Inject demo pipeline data for visual testing */
export function injectDemoPipeline() {
	const demoNodes: PipelineNode[] = [
		{ id: 'n-planner', label: 'Planner', cli: 'claude', status: 'done', x: 120, y: 80, agent: 'planner' },
		{ id: 'n-architect', label: 'Architect', cli: 'claude', status: 'done', x: 340, y: 80, agent: 'architect' },
		{ id: 'n-frontend', label: 'Frontend', cli: 'codex', status: 'streaming', x: 180, y: 240, file: 'src/app.tsx', agent: 'frontend' },
		{ id: 'n-backend', label: 'Backend', cli: 'claude', status: 'active', x: 500, y: 240, file: 'src/server.ts', agent: 'backend' },
		{ id: 'n-reviewer', label: 'Reviewer', cli: 'gemini', status: 'queued', x: 340, y: 400, agent: 'reviewer' },
		{ id: 'n-deployer', label: 'Deployer', cli: 'team', status: 'idle', x: 340, y: 540, agent: 'deployer' }
	];

	const demoEdges: PipelineEdge[] = [
		{ id: 'e-1', source: 'n-planner', target: 'n-architect', active: false },
		{ id: 'e-2', source: 'n-architect', target: 'n-frontend', active: true },
		{ id: 'e-3', source: 'n-architect', target: 'n-backend', active: true },
		{ id: 'e-4', source: 'n-frontend', target: 'n-reviewer', active: false },
		{ id: 'e-5', source: 'n-backend', target: 'n-reviewer', active: false },
		{ id: 'e-6', source: 'n-reviewer', target: 'n-deployer', active: false }
	];

	const demoPipeline: Pipeline = {
		id: 'demo-pipeline-001',
		project: 'open-claude-office',
		stage: 'mvp',
		nodes: demoNodes,
		edges: demoEdges,
		status: 'running',
		startedAt: new Date().toISOString()
	};

	pipelines.update((map) => {
		map.set(demoPipeline.id, demoPipeline);
		return new Map(map);
	});

	const demoCommands: CommandLogEntry[] = [
		{ id: 'cmd-1', timestamp: new Date(Date.now() - 120000).toISOString(), cli: 'claude', command: 'planner: analyze project requirements', status: 'success', duration: 8200, tokens: 3400 },
		{ id: 'cmd-2', timestamp: new Date(Date.now() - 90000).toISOString(), cli: 'claude', command: 'architect: design system architecture', status: 'success', duration: 12500, tokens: 5600 },
		{ id: 'cmd-3', timestamp: new Date(Date.now() - 45000).toISOString(), cli: 'codex', command: 'frontend: implement src/app.tsx', status: 'running', tokens: 2100 },
		{ id: 'cmd-4', timestamp: new Date(Date.now() - 30000).toISOString(), cli: 'claude', command: 'backend: implement src/server.ts', status: 'running', tokens: 1800 },
		{ id: 'cmd-5', timestamp: new Date(Date.now() - 5000).toISOString(), cli: 'gemini', command: 'reviewer: queued for code review', status: 'running', tokens: 0 }
	];

	commandLog.set(demoCommands);
	totalTokens.set({ input: 8200, output: 4700, total: 12900 });
}

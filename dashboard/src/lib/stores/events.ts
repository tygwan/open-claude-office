import { writable, derived } from 'svelte/store';
import type { PipelineEvent, Pipeline, PipelineNode, PipelineEdge, CommandLogEntry, DevStage, FileDomain } from '$lib/types';
import { STAGE_X } from '$lib/utils/classifier';

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
					// Stage-based positioning when metadata.devStage is present
					const devStage = event.metadata?.devStage as DevStage | undefined;
					const domain = event.metadata?.domain as FileDomain | undefined;
					const tech = event.metadata?.tech as string | undefined;
					let x: number, y: number;

					if (devStage && STAGE_X[devStage]) {
						const stageNodes = pipeline.nodes.filter(
							(n) => n.devStage === devStage
						);
						x = STAGE_X[devStage];
						y = 80 + stageNodes.length * 120;
					} else {
						// Fallback: grid layout for non-chat events
						const col = pipeline.nodes.length % 3;
						const row = Math.floor(pipeline.nodes.length / 3);
						x = 180 + col * 220;
						y = 80 + row * 160;
					}

					const newNode: PipelineNode = {
						id: nodeId,
						label: event.message ?? event.agent ?? 'Agent',
						cli: event.cli ?? 'claude',
						status: 'active',
						x,
						y,
						file: event.file,
						agent: event.agent,
						devStage,
						domain,
						tech
					};
					pipeline.nodes = [...pipeline.nodes, newNode];

					// Connect edge: same-stage nodes stack, cross-stage nodes link
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

/** Inject demo pipeline data for visual testing (stage-based layout) */
export function injectDemoPipeline() {
	const demoNodes: PipelineNode[] = [
		// Analyze stage (x=120)
		{ id: 'n-read-pkg', label: 'Read package.json', cli: 'claude', status: 'done', x: 120, y: 80, agent: 'analyze-general-0', file: 'package.json', devStage: 'analyze', domain: 'general', tech: 'Config' },
		{ id: 'n-grep-todo', label: 'Grep TODO', cli: 'claude', status: 'done', x: 120, y: 200, agent: 'analyze-general-1', devStage: 'analyze', domain: 'general', tech: 'Search' },
		// Design stage (x=340)
		{ id: 'n-arch', label: 'Write SPEC.md', cli: 'claude', status: 'done', x: 340, y: 80, agent: 'design-docs-0', file: 'docs/SPEC.md', devStage: 'design', domain: 'docs', tech: 'Markdown' },
		// Implement stage (x=560)
		{ id: 'n-frontend', label: 'Edit App.svelte', cli: 'claude', status: 'streaming', x: 560, y: 80, file: 'src/App.svelte', agent: 'impl-frontend-0', devStage: 'implement', domain: 'frontend', tech: 'Svelte' },
		{ id: 'n-backend', label: 'Create server.ts', cli: 'claude', status: 'active', x: 560, y: 200, file: 'src/server.ts', agent: 'impl-backend-0', devStage: 'implement', domain: 'backend', tech: 'Node.js' },
		{ id: 'n-api', label: 'Edit +server.ts', cli: 'claude', status: 'active', x: 560, y: 320, file: 'src/routes/api/+server.ts', agent: 'impl-backend-1', devStage: 'implement', domain: 'backend', tech: 'SvelteKit' },
		// Test stage (x=780)
		{ id: 'n-test', label: '$ npm test', cli: 'claude', status: 'queued', x: 780, y: 80, agent: 'test-test-0', devStage: 'test', domain: 'test', tech: 'Vitest' },
		// Deploy stage (x=1000)
		{ id: 'n-deploy', label: '$ npm run build', cli: 'claude', status: 'idle', x: 1000, y: 80, agent: 'deploy-infra-0', devStage: 'deploy', domain: 'infra', tech: 'Build' },
	];

	const demoEdges: PipelineEdge[] = [
		{ id: 'e-1', source: 'n-read-pkg', target: 'n-grep-todo', active: false },
		{ id: 'e-2', source: 'n-grep-todo', target: 'n-arch', active: false },
		{ id: 'e-3', source: 'n-arch', target: 'n-frontend', active: true },
		{ id: 'e-4', source: 'n-arch', target: 'n-backend', active: true },
		{ id: 'e-5', source: 'n-backend', target: 'n-api', active: true },
		{ id: 'e-6', source: 'n-frontend', target: 'n-test', active: false },
		{ id: 'e-7', source: 'n-api', target: 'n-test', active: false },
		{ id: 'e-8', source: 'n-test', target: 'n-deploy', active: false }
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

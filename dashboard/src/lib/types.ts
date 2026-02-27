export type CliType = 'claude' | 'codex' | 'gemini' | 'team';

export type DevStage = 'analyze' | 'design' | 'implement' | 'test' | 'deploy';
export type FileDomain = 'frontend' | 'backend' | 'infra' | 'test' | 'docs' | 'general';

export type LifecycleStage = 'mvp' | 'poc' | 'production';

export type NodeStatus = 'idle' | 'queued' | 'active' | 'streaming' | 'done' | 'error';

export interface FileEntry {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileEntry[];
}

export interface Project {
	name: string;
	path: string;
	lifecycleStage: LifecycleStage;
	hasClaudeConfig: boolean;
	hasOrchestrator: boolean;
	lastActivity?: string;
}

export interface PipelineEvent {
	timestamp: string;
	pipeline_id: string;
	event_type: 'pipeline_start' | 'stage_start' | 'stage_complete' | 'agent_spawn' | 'agent_output' | 'agent_error' | 'pipeline_complete' | 'file_change' | 'token_usage';
	stage?: string;
	agent?: string;
	cli?: CliType;
	file?: string;
	message?: string;
	status?: NodeStatus;
	tokens?: {
		input: number;
		output: number;
		total: number;
	};
	metadata?: Record<string, unknown>;
}

export interface PipelineNode {
	id: string;
	label: string;
	cli: CliType;
	status: NodeStatus;
	x: number;
	y: number;
	file?: string;
	agent?: string;
	tokens?: number;
	/** Development lifecycle stage */
	devStage?: DevStage;
	/** File domain (frontend, backend, etc.) */
	domain?: FileDomain;
	/** Detected tech stack label */
	tech?: string;
}

export interface PipelineEdge {
	id: string;
	source: string;
	target: string;
	active: boolean;
}

export interface Pipeline {
	id: string;
	project: string;
	stage: LifecycleStage;
	nodes: PipelineNode[];
	edges: PipelineEdge[];
	status: 'idle' | 'running' | 'complete' | 'error';
	startedAt?: string;
	completedAt?: string;
}

export interface CommandLogEntry {
	id: string;
	timestamp: string;
	cli: CliType;
	command: string;
	status: 'running' | 'success' | 'error';
	duration?: number;
	tokens?: number;
}

// Chat types for Claude Code integration

export type ChatStatus = 'idle' | 'connecting' | 'streaming' | 'error';

export interface ChatToolUse {
	id: string;
	tool_name: string;
	/** e.g. file path, command string, glob pattern */
	target?: string;
	status: 'running' | 'done' | 'error';
	/** tool output preview (truncated) */
	output?: string;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: string;
	toolUses?: ChatToolUse[];
	/** cost in USD if available */
	costUsd?: number;
	/** duration in ms */
	durationMs?: number;
	/** whether this message is still streaming */
	isStreaming?: boolean;
}

export interface ChatSession {
	sessionId: string;
	projectPath: string;
	projectName: string;
	startedAt: string;
}

export interface SessionSummary {
	sessionId: string;
	projectName: string;
	startedAt: string;
	lastActiveAt: string;
	messageCount: number;
	firstMessage?: string;
}

/** Events emitted by `claude --output-format stream-json` */
export interface StreamJsonEvent {
	type: 'init' | 'assistant' | 'tool_use' | 'tool_result' | 'result' | 'error' | 'system';
	session_id?: string;
	message?: {
		role?: string;
		content?: string | Array<{ type: string; text?: string; name?: string; id?: string; input?: Record<string, unknown> }>;
	};
	tool_use_id?: string;
	tool_name?: string;
	input?: Record<string, unknown>;
	content?: string | Array<{ type: string; text?: string }>;
	cost_usd?: number;
	duration_ms?: number;
	duration_api_ms?: number;
	result?: string;
	subtype?: string;
}

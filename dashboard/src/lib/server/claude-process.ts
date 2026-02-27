import { spawn, type ChildProcess } from 'node:child_process';

export interface SpawnClaudeOptions {
	prompt: string;
	cwd: string;
	sessionId?: string;
	permissionMode?: string;
}

export interface ClaudeProcess {
	process: ChildProcess;
	kill: () => void;
}

/**
 * Spawn a Claude Code CLI subprocess with stream-json output.
 *
 * Uses `-p` for non-interactive prompt mode and `--output-format stream-json`
 * to emit NDJSON events on stdout. When `sessionId` is provided, appends
 * `--resume` so the conversation context is maintained.
 */
export function spawnClaude(opts: SpawnClaudeOptions): ClaudeProcess {
	const args: string[] = [
		'-p',
		opts.prompt,
		'--output-format',
		'stream-json'
	];

	if (opts.sessionId) {
		args.push('--resume', opts.sessionId);
	}

	if (opts.permissionMode) {
		args.push('--permission-mode', opts.permissionMode);
	}

	const child = spawn('claude', args, {
		cwd: opts.cwd,
		env: { ...process.env },
		stdio: ['ignore', 'pipe', 'pipe']
	});

	return {
		process: child,
		kill: () => {
			if (!child.killed) {
				child.kill('SIGTERM');
			}
		}
	};
}

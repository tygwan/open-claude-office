import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawnClaude } from '$lib/server/claude-process';
import type { RequestHandler } from './$types';

const MAX_PROMPT_LENGTH = 100_000;
const PROCESS_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const POST: RequestHandler = async ({ request }) => {
	const { prompt, projectPath, sessionId } = await request.json();

	if (!prompt || !projectPath) {
		return new Response(JSON.stringify({ error: 'prompt and projectPath are required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Security: limit prompt length to avoid ARG_MAX issues
	if (typeof prompt !== 'string' || prompt.length > MAX_PROMPT_LENGTH) {
		return new Response(JSON.stringify({ error: 'prompt too long' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Security: validate projectPath is within ~/dev/
	const allowedRoot = resolve(homedir(), 'dev');
	const resolvedPath = resolve(projectPath);
	if (!resolvedPath.startsWith(allowedRoot)) {
		return new Response(JSON.stringify({ error: 'projectPath must be within ~/dev/' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const claude = spawnClaude({
		prompt,
		cwd: resolvedPath,
		sessionId
	});

	// Abort child process when the client disconnects
	request.signal.addEventListener('abort', () => {
		claude.kill();
	});

	// Watchdog: kill process after timeout to prevent indefinite hangs
	const timeout = setTimeout(() => claude.kill(), PROCESS_TIMEOUT_MS);

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			let closed = false;

			const sendSSE = (data: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				} catch {
					closed = true;
				}
			};

			const closeOnce = () => {
				if (closed) return;
				closed = true;
				try {
					controller.close();
				} catch {
					// already closed
				}
			};

			claude.process.stdout?.on('data', (chunk: Buffer) => {
				const text = chunk.toString();
				const lines = text.split('\n').filter((l) => l.trim());
				for (const line of lines) {
					sendSSE(line);
				}
			});

			claude.process.stderr?.on('data', (chunk: Buffer) => {
				const errText = chunk.toString().trim();
				if (errText) {
					sendSSE(JSON.stringify({ type: 'error', content: errText }));
				}
			});

			claude.process.on('close', (code) => {
				clearTimeout(timeout);
				sendSSE(JSON.stringify({ type: 'system', subtype: 'close', code }));
				closeOnce();
			});

			claude.process.on('error', (err) => {
				clearTimeout(timeout);
				sendSSE(JSON.stringify({ type: 'error', content: err.message }));
				closeOnce();
			});
		},
		cancel() {
			clearTimeout(timeout);
			claude.kill();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

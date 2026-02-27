import { spawnClaude } from '$lib/server/claude-process';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { prompt, projectPath, sessionId } = await request.json();

	if (!prompt || !projectPath) {
		return new Response(JSON.stringify({ error: 'prompt and projectPath are required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const claude = spawnClaude({
		prompt,
		cwd: projectPath,
		sessionId
	});

	// Abort child process when the client disconnects
	request.signal.addEventListener('abort', () => {
		claude.kill();
	});

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
				sendSSE(JSON.stringify({ type: 'system', subtype: 'close', code }));
				closeOnce();
			});

			claude.process.on('error', (err) => {
				sendSSE(JSON.stringify({ type: 'error', content: err.message }));
				closeOnce();
			});
		},
		cancel() {
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

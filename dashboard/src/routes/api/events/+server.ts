import type { RequestHandler } from './$types';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { open, watch, access } from 'node:fs/promises';
import { statSync, existsSync } from 'node:fs';

export const GET: RequestHandler = async ({ request, url }) => {
	const projectFilter = url.searchParams.get('project');

	const eventsDir = join(homedir(), '.orchestrator');
	const eventsFile = join(eventsDir, 'events.jsonl');

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			function sendEvent(data: string) {
				try {
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				} catch {
					// Controller might be closed
				}
			}

			// Send initial connection event
			sendEvent(JSON.stringify({
				timestamp: new Date().toISOString(),
				pipeline_id: 'system',
				event_type: 'pipeline_start',
				message: 'Connected to event stream'
			}));

			// Check if events file exists
			let fileExists = false;
			try {
				await access(eventsFile);
				fileExists = true;
			} catch {
				// File doesn't exist yet
			}

			if (fileExists) {
				// Read existing events from the tail of the file (last 50 lines)
				try {
					const stats = statSync(eventsFile);
					const fileSize = stats.size;

					// Read last chunk to get recent events
					const chunkSize = Math.min(fileSize, 32768); // 32KB max
					const fd = await open(eventsFile, 'r');
					const buffer = Buffer.alloc(chunkSize);
					await fd.read(buffer, 0, chunkSize, Math.max(0, fileSize - chunkSize));
					await fd.close();

					const content = buffer.toString('utf-8');
					const lines = content.split('\n').filter((l) => l.trim());

					// Take last 50 events
					const recentLines = lines.slice(-50);
					for (const line of recentLines) {
						try {
							const event = JSON.parse(line);
							if (projectFilter && event.project && event.project !== projectFilter) {
								continue;
							}
							sendEvent(line);
						} catch {
							// Skip malformed lines
						}
					}
				} catch (err) {
					console.error('Error reading events file:', err);
				}
			}

			// Watch for new events
			let watcher: AsyncIterable<{ eventType: string }> | null = null;
			let lastSize = fileExists ? statSync(eventsFile).size : 0;

			const abortController = new AbortController();

			// Listen for client disconnect
			request.signal.addEventListener('abort', () => {
				abortController.abort();
			});

			try {
				// Watch the directory for changes to the events file
				const watchDir = existsSync(eventsDir) ? eventsDir : homedir();
				watcher = watch(watchDir, { signal: abortController.signal });

				for await (const event of watcher) {
					if (abortController.signal.aborted) break;

					try {
						if (!existsSync(eventsFile)) continue;

						const currentSize = statSync(eventsFile).size;
						if (currentSize <= lastSize) {
							if (currentSize < lastSize) lastSize = 0; // File was truncated
							else continue;
						}

						// Read new content
						const fd = await open(eventsFile, 'r');
						const newBytes = currentSize - lastSize;
						const buffer = Buffer.alloc(newBytes);
						await fd.read(buffer, 0, newBytes, lastSize);
						await fd.close();
						lastSize = currentSize;

						const newContent = buffer.toString('utf-8');
						const newLines = newContent.split('\n').filter((l) => l.trim());

						for (const line of newLines) {
							try {
								const parsedEvent = JSON.parse(line);
								if (projectFilter && parsedEvent.project && parsedEvent.project !== projectFilter) {
									continue;
								}
								sendEvent(line);
							} catch {
								// Skip malformed lines
							}
						}
					} catch {
						// File might not exist yet or be temporarily unavailable
					}
				}
			} catch (err: unknown) {
				if (err instanceof Error && err.name !== 'AbortError') {
					console.error('Watch error:', err);
				}
			}

			try {
				controller.close();
			} catch {
				// Already closed
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};

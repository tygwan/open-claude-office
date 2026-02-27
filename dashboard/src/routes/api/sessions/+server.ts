import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SessionSummary, ChatMessage } from '$lib/types';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SESSIONS_ROOT = join(homedir(), '.claude-dashboard', 'sessions');

async function ensureDir(dir: string) {
	await mkdir(dir, { recursive: true });
}

/** GET /api/sessions?project=<name> — list sessions for a project */
export const GET: RequestHandler = async ({ url }) => {
	const project = url.searchParams.get('project');
	if (!project) throw error(400, 'Missing project parameter');

	const projectDir = join(SESSIONS_ROOT, project);
	await ensureDir(projectDir);

	const summaries: SessionSummary[] = [];

	try {
		const files = await readdir(projectDir);
		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			try {
				const raw = await readFile(join(projectDir, file), 'utf-8');
				const data = JSON.parse(raw);
				summaries.push({
					sessionId: data.sessionId,
					projectName: data.projectName,
					startedAt: data.startedAt,
					lastActiveAt: data.lastActiveAt,
					messageCount: data.messageCount,
					firstMessage: data.firstMessage
				});
			} catch {
				// skip corrupt files
			}
		}
	} catch {
		// directory doesn't exist yet
	}

	// Sort by most recent first
	summaries.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());

	return json(summaries);
};

/** POST /api/sessions — save a session */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sessionId, projectName, projectPath, startedAt, messages } = body as {
		sessionId: string;
		projectName: string;
		projectPath: string;
		startedAt: string;
		messages: ChatMessage[];
	};

	if (!sessionId || !projectName) {
		throw error(400, 'sessionId and projectName are required');
	}

	const projectDir = join(SESSIONS_ROOT, projectName);
	await ensureDir(projectDir);

	const firstUserMsg = messages.find((m) => m.role === 'user');

	const data = {
		sessionId,
		projectName,
		projectPath,
		startedAt,
		lastActiveAt: new Date().toISOString(),
		messageCount: messages.length,
		firstMessage: firstUserMsg?.content.slice(0, 100),
		messages
	};

	await writeFile(join(projectDir, `${sessionId}.json`), JSON.stringify(data, null, 2), 'utf-8');

	return json({ ok: true });
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SESSIONS_ROOT = join(homedir(), '.claude-dashboard', 'sessions');

/** GET /api/sessions/{id}?project=<name> — get full session with messages */
export const GET: RequestHandler = async ({ params, url }) => {
	const project = url.searchParams.get('project');
	if (!project) throw error(400, 'Missing project parameter');

	const filePath = join(SESSIONS_ROOT, project, `${params.id}.json`);

	try {
		const raw = await readFile(filePath, 'utf-8');
		return json(JSON.parse(raw));
	} catch {
		throw error(404, 'Session not found');
	}
};

/** DELETE /api/sessions/{id}?project=<name> — delete a session */
export const DELETE: RequestHandler = async ({ params, url }) => {
	const project = url.searchParams.get('project');
	if (!project) throw error(400, 'Missing project parameter');

	const filePath = join(SESSIONS_ROOT, project, `${params.id}.json`);

	try {
		await unlink(filePath);
		return json({ ok: true });
	} catch {
		throw error(404, 'Session not found');
	}
};

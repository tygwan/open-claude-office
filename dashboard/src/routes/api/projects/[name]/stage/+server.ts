import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LifecycleStage } from '$lib/types';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const VALID_STAGES: LifecycleStage[] = ['mvp', 'poc', 'production'];

export const PUT: RequestHandler = async ({ params, request }) => {
	const projectName = params.name;
	if (!projectName) {
		throw error(400, 'Missing project name');
	}

	const body = await request.json();
	const stage = body.stage as LifecycleStage;

	if (!stage || !VALID_STAGES.includes(stage)) {
		throw error(400, `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`);
	}

	const projectPath = join(homedir(), 'dev', projectName);
	const claudeDir = join(projectPath, '.claude');
	const configPath = join(claudeDir, 'settings.json');

	try {
		// Ensure .claude directory exists
		await mkdir(claudeDir, { recursive: true });

		// Read existing config or start fresh
		let config: Record<string, unknown> = {};
		try {
			const content = await readFile(configPath, 'utf-8');
			config = JSON.parse(content);
		} catch {
			// No existing config, use empty object
		}

		// Update lifecycle stage
		if (!config.lifecycle || typeof config.lifecycle !== 'object') {
			config.lifecycle = {};
		}
		(config.lifecycle as Record<string, unknown>).current_stage = stage;

		// Write back
		await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

		return json({ success: true, stage });
	} catch (err) {
		console.error(`Failed to update stage for ${projectName}:`, err);
		throw error(500, 'Failed to update lifecycle stage');
	}
};

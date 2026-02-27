import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Project, LifecycleStage } from '$lib/types';
import { readdir, stat, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const GET: RequestHandler = async () => {
	const devDir = join(homedir(), 'dev');
	const projects: Project[] = [];

	try {
		const entries = await readdir(devDir, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			if (entry.name.startsWith('.')) continue;

			const projectPath = join(devDir, entry.name);
			let hasClaudeConfig = false;
			let hasOrchestrator = false;
			let lifecycleStage: LifecycleStage = 'mvp';
			let lastActivity: string | undefined;

			// Check for .claude/settings.json
			const claudeConfigPath = join(projectPath, '.claude', 'settings.json');
			try {
				await access(claudeConfigPath);
				hasClaudeConfig = true;

				const configContent = await readFile(claudeConfigPath, 'utf-8');
				const config = JSON.parse(configContent);
				if (config.lifecycle?.current_stage) {
					lifecycleStage = config.lifecycle.current_stage as LifecycleStage;
				}
			} catch {
				// No .claude config
			}

			// Check for .orchestrator directory
			const orchestratorPath = join(projectPath, '.orchestrator');
			try {
				await access(orchestratorPath);
				hasOrchestrator = true;
			} catch {
				// No .orchestrator
			}

			// Get last modification time
			try {
				const stats = await stat(projectPath);
				lastActivity = stats.mtime.toISOString();
			} catch {
				// Skip
			}

			projects.push({
				name: entry.name,
				path: projectPath,
				lifecycleStage,
				hasClaudeConfig,
				hasOrchestrator,
				lastActivity
			});
		}

		projects.sort((a, b) => {
			if (a.hasClaudeConfig && !b.hasClaudeConfig) return -1;
			if (!a.hasClaudeConfig && b.hasClaudeConfig) return 1;
			return a.name.localeCompare(b.name);
		});
	} catch (err) {
		console.error('Failed to read ~/dev/ directory:', err);
	}

	return json(projects);
};

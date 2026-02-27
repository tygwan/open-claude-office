import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { FileEntry } from '$lib/types';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const EXCLUDED = new Set([
	'node_modules',
	'.git',
	'.svn',
	'__pycache__',
	'.next',
	'.nuxt',
	'.output',
	'.vercel',
	'.turbo',
	'dist',
	'.cache',
	'.parcel-cache',
	'coverage',
	'.DS_Store'
]);

export const GET: RequestHandler = async ({ url }) => {
	const dirPath = url.searchParams.get('path');
	if (!dirPath) {
		throw error(400, 'Missing path parameter');
	}

	const resolved = resolve(dirPath);
	const devDir = join(homedir(), 'dev');

	// Security: only allow paths under ~/dev/
	if (!resolved.startsWith(devDir)) {
		throw error(403, 'Access denied');
	}

	try {
		const entries = await readdir(resolved, { withFileTypes: true });
		const items: FileEntry[] = [];

		for (const entry of entries) {
			if (entry.name.startsWith('.') && entry.name !== '.claude') continue;
			if (EXCLUDED.has(entry.name)) continue;

			items.push({
				name: entry.name,
				path: join(resolved, entry.name),
				type: entry.isDirectory() ? 'directory' : 'file'
			});
		}

		// Directories first, then files, alphabetical within each
		items.sort((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});

		return json(items);
	} catch {
		throw error(404, 'Directory not found');
	}
};

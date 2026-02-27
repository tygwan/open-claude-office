import { writable, derived } from 'svelte/store';
import type { Project, LifecycleStage } from '$lib/types';

export const projects = writable<Project[]>([]);
export const activeProjectName = writable<string | null>(null);
export const openProjectNames = writable<string[]>([]);

export const activeProject = derived(
	[projects, activeProjectName],
	([$projects, $activeProjectName]) => {
		if (!$activeProjectName) return null;
		return $projects.find((p) => p.name === $activeProjectName) ?? null;
	}
);

export const openProjects = derived(
	[projects, openProjectNames],
	([$projects, $openProjectNames]) => {
		return $openProjectNames
			.map((name) => $projects.find((p) => p.name === name))
			.filter((p): p is Project => p !== undefined);
	}
);

export function selectProject(name: string) {
	activeProjectName.set(name);
	openProjectNames.update((names) => {
		if (!names.includes(name)) {
			return [...names, name];
		}
		return names;
	});
}

export function closeProject(name: string) {
	openProjectNames.update((names) => names.filter((n) => n !== name));
	activeProjectName.update((current) => {
		if (current === name) {
			return null;
		}
		return current;
	});
}

export async function updateLifecycleStage(projectName: string, stage: LifecycleStage) {
	try {
		const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/stage`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stage })
		});

		if (response.ok) {
			projects.update((list) =>
				list.map((p) => (p.name === projectName ? { ...p, lifecycleStage: stage } : p))
			);
		}
	} catch (err) {
		console.error('Failed to update lifecycle stage:', err);
	}
}

export async function loadProjects() {
	try {
		const response = await fetch('/api/projects');
		if (response.ok) {
			const data: Project[] = await response.json();
			projects.set(data);
		}
	} catch (err) {
		console.error('Failed to load projects:', err);
	}
}

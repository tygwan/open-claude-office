import type { DevStage, FileDomain } from '$lib/types';

// ─── Stage Layout Constants ────────────────────────────

export const STAGE_ORDER: DevStage[] = ['analyze', 'design', 'implement', 'test', 'deploy'];

export const STAGE_X: Record<DevStage, number> = {
	analyze: 120,
	design: 340,
	implement: 560,
	test: 780,
	deploy: 1000
};

export const STAGE_LABELS: Record<DevStage, string> = {
	analyze: 'Analyze',
	design: 'Design',
	implement: 'Implement',
	test: 'Test',
	deploy: 'Deploy'
};

// ─── Domain Colors ─────────────────────────────────────

export const DOMAIN_COLORS: Record<FileDomain, string> = {
	frontend: '#3B82F6',
	backend: '#10B981',
	infra: '#8B5CF6',
	test: '#F59E0B',
	docs: '#6B7280',
	general: '#8b949e'
};

export const DOMAIN_LABELS: Record<FileDomain, string> = {
	frontend: 'Frontend',
	backend: 'Backend',
	infra: 'Infra',
	test: 'Test',
	docs: 'Docs',
	general: 'General'
};

// ─── File → Domain + Tech Classification ───────────────

export interface FileClassification {
	domain: FileDomain;
	tech: string;
}

export function classifyFile(filePath: string): FileClassification {
	const p = filePath.toLowerCase();
	const ext = p.split('.').pop() ?? '';

	// Test files
	if (/\.(test|spec|e2e)\.(ts|js|tsx|jsx|mjs)$/.test(p) || /__tests?__\//.test(p) || /cypress\/|playwright\//.test(p)) {
		const tech = /playwright/.test(p) ? 'Playwright' : /cypress/.test(p) ? 'Cypress' : /vitest|vite/.test(p) ? 'Vitest' : 'Jest';
		return { domain: 'test', tech };
	}

	// Infra / DevOps / CI
	if (/docker|compose|k8s|kubernetes|terraform|\.github\/|\.gitlab|jenkinsfile|ci\.yml|cd\.yml|deploy|nginx|helm/i.test(p)) {
		const tech = /docker/.test(p) ? 'Docker' : /terraform/.test(p) ? 'Terraform' : /\.github/.test(p) ? 'GitHub Actions' : /nginx/.test(p) ? 'Nginx' : 'DevOps';
		return { domain: 'infra', tech };
	}

	// Documentation
	if (/\.(md|mdx|txt|rst|adoc)$/.test(ext) || /docs?\/|readme/i.test(p)) {
		return { domain: 'docs', tech: 'Markdown' };
	}

	// Frontend detection
	if (/\.(svelte|vue|tsx|jsx|astro)$/.test(p)) {
		const tech = ext === 'svelte' ? 'Svelte' : ext === 'vue' ? 'Vue' : ext === 'astro' ? 'Astro' : 'React';
		return { domain: 'frontend', tech };
	}
	if (/\.(css|scss|sass|less|postcss|tailwind)/.test(p) || /styles?\/|theme/.test(p)) {
		return { domain: 'frontend', tech: /tailwind/.test(p) ? 'Tailwind' : 'CSS' };
	}
	if (/src\/(components|pages|views|layouts|routes\/.*page|app)\b/.test(p) && !p.includes('server')) {
		return { domain: 'frontend', tech: detectFramework(p) };
	}
	if (/public\/|static\/|assets\//.test(p)) {
		return { domain: 'frontend', tech: 'Assets' };
	}

	// Backend detection
	if (/\+server\.(ts|js)$/.test(p) || /src\/(api|server|lib\/server)\b/.test(p)) {
		return { domain: 'backend', tech: detectFramework(p) };
	}
	if (/\.(controller|service|middleware|resolver|repository|model|schema|migration)\.(ts|js|py|go|rs)$/.test(p)) {
		return { domain: 'backend', tech: detectLang(ext) };
	}
	if (/prisma|drizzle|knex|sequelize|typeorm|\.sql$/.test(p)) {
		return { domain: 'backend', tech: 'Database' };
	}
	if (/routes\/api\/|api\/|server\/|graphql|trpc/.test(p)) {
		return { domain: 'backend', tech: /graphql/.test(p) ? 'GraphQL' : /trpc/.test(p) ? 'tRPC' : 'API' };
	}

	// Config files → general
	if (/\.(json|yaml|yml|toml|env|ini|cfg)$/.test(p) || /config|settings/.test(p)) {
		return { domain: 'general', tech: 'Config' };
	}

	// Source code fallback by extension
	if (/\.(ts|js|mjs)$/.test(p)) return { domain: 'general', tech: detectLang(ext) };
	if (/\.(py)$/.test(p)) return { domain: 'backend', tech: 'Python' };
	if (/\.(go)$/.test(p)) return { domain: 'backend', tech: 'Go' };
	if (/\.(rs)$/.test(p)) return { domain: 'backend', tech: 'Rust' };
	if (/\.(java|kt)$/.test(p)) return { domain: 'backend', tech: 'Java' };

	return { domain: 'general', tech: '' };
}

function detectFramework(path: string): string {
	if (/svelte/.test(path)) return 'SvelteKit';
	if (/next/.test(path)) return 'Next.js';
	if (/nuxt/.test(path)) return 'Nuxt';
	if (/astro/.test(path)) return 'Astro';
	if (/remix/.test(path)) return 'Remix';
	return 'Node.js';
}

function detectLang(ext: string): string {
	switch (ext) {
		case 'ts': case 'mts': return 'TypeScript';
		case 'js': case 'mjs': return 'JavaScript';
		case 'py': return 'Python';
		case 'go': return 'Go';
		case 'rs': return 'Rust';
		case 'java': return 'Java';
		case 'kt': return 'Kotlin';
		default: return ext.toUpperCase();
	}
}

// ─── Tool Use → Development Stage ──────────────────────

export function detectStage(toolName: string, target?: string): DevStage {
	// Analyze: reading/searching existing code
	if (['Read', 'Glob', 'Grep'].includes(toolName)) {
		// Reading test files → test stage
		if (target && /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(target)) return 'test';
		// Reading deploy configs
		if (target && /deploy|docker|ci\.yml|\.github/i.test(target)) return 'deploy';
		return 'analyze';
	}

	// Write / Edit
	if (toolName === 'Write' || toolName === 'Edit') {
		if (!target) return 'implement';
		// Design docs / specs / plans
		if (/\.(md|yaml|yml)$/.test(target) && /design|spec|plan|prd|arch/i.test(target)) return 'design';
		// Test files
		if (/\.(test|spec|e2e)\.(ts|js|tsx|jsx)$/.test(target)) return 'test';
		// Deploy / infra
		if (/docker|deploy|ci\.yml|\.github|nginx|terraform/i.test(target)) return 'deploy';
		// Docs
		if (/\.(md|mdx)$/.test(target) && !/src\//.test(target)) return 'design';
		return 'implement';
	}

	// Bash commands
	if (toolName === 'Bash') {
		if (!target) return 'implement';
		if (/test|jest|vitest|pytest|mocha|cypress|playwright/i.test(target)) return 'test';
		if (/build|deploy|push|publish|docker|npm run (build|deploy)/i.test(target)) return 'deploy';
		if (/lint|format|check|prettier|eslint/i.test(target)) return 'test';
		if (/install|npm|pnpm|yarn|bun/i.test(target)) return 'implement';
		if (/ls|cat|find|grep|git (log|diff|status|show)/i.test(target)) return 'analyze';
		return 'implement';
	}

	// WebSearch / WebFetch → analyze
	if (toolName === 'WebSearch' || toolName === 'WebFetch') return 'analyze';

	// Task (subagent) → analyze
	if (toolName === 'Task') return 'analyze';

	return 'implement';
}

// ─── Build Node Label ──────────────────────────────────

export function buildNodeLabel(toolName: string, target?: string, tech?: string): string {
	const shortTarget = target ? target.split('/').pop() ?? target : '';

	switch (toolName) {
		case 'Read':
			return shortTarget ? `Read ${shortTarget}` : 'Read';
		case 'Write':
			return shortTarget ? `Create ${shortTarget}` : 'Write';
		case 'Edit':
			return shortTarget ? `Edit ${shortTarget}` : 'Edit';
		case 'Bash':
			return target ? `$ ${target.slice(0, 30)}` : 'Shell';
		case 'Glob':
			return target ? `Find ${target}` : 'Search';
		case 'Grep':
			return target ? `Grep ${target.slice(0, 25)}` : 'Search';
		default:
			return tech || toolName;
	}
}

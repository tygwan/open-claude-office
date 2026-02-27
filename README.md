# open-claude-office

A Claude Code agent ecosystem framework that transforms Git repositories into portfolio sites and manages the full development lifecycle -- from MVP through Production -- with 47 specialized agents, 23 skills, 12 slash commands, and 9 automation hooks.

Install only what you need. Each module is self-contained with its own agents, skills, commands, and hooks.

---

## Quick Start (5 minutes)

```bash
git clone https://github.com/tygwan/open-claude-office.git
cd open-claude-office
./install.sh --target=/your/project
```

By default, all modules are installed. To install specific modules only:

```bash
# Full install (default)
./install.sh --target=/your/project

# Specific modules only
./install.sh --target=/your/project --modules=core,lifecycle,git

# Preview without changes
./install.sh --target=/your/project --dry-run
```

After installation, your project gains a `.claude/` directory with the selected agents, skills, commands, and hooks. Claude Code automatically discovers and routes to the appropriate agent based on your prompts.

---

## Features

- **Multi-Project Dashboard** -- VSCode-like UI with project sidebar, lifecycle stage toggle, and Interactive Pipeline Flow. Manage all `~/dev/` projects from one dashboard.
- **Lifecycle Management** -- Phase-gated development from MVP to PoC to Production, with Sprint tracking, quality gates, and automated documentation. Switch lifecycle stage from the dashboard UI.
- **Portfolio Generation Pipeline** -- Analyze any Git repo (code, commits, stack) and generate a custom portfolio site with unique design tokens, content structure, and deployment.
- **Multi-CLI Orchestration** -- Claude Code leads; Codex CLI handles analysis and validation; Gemini CLI handles design and visualization. Automatic fallback if any CLI is unavailable.
- **Interactive Pipeline Flow** -- Real-time SVG node graph showing CLI events with pulse animations. Every command becomes a visible pipeline.
- **Keyword-Routed Agents** -- `MANIFEST.md` matches your prompt keywords to the right agent. No manual selection required.
- **Quality Gates** -- Automated checks at commit, merge, build, deploy, and release stages.
- **Context Optimization** -- Token budget management with incremental loading across four budget levels (2K/10K/30K/50K).

---

## Modules

| Module | Description | Agents | Skills | Commands | Hooks | Required |
|--------|-------------|--------|--------|----------|-------|----------|
| **core** | Safety, routing, project initialization | 5 | 4 | -- | 1 | Yes |
| **craft** | Git repo to portfolio site pipeline | 8 | 2 | 8 | 2 | No |
| **lifecycle** | MVP/PoC/Prod phases, Sprint tracking | 17 | 8 | 5 | 3 | No |
| **git** | GitHub Flow, commits, PRs, branching | 6 | 2 | 1 | 1 | No |
| **quality** | Code review, testing, refactoring, docs | 6 | 3 | -- | -- | No |
| **multi-cli** | Claude + Codex + Gemini orchestration | -- | 4 | -- | -- | No |
| **meta** | Create new agents, skills, hooks, commands | 4 | 8 | -- | -- | No |
| **analytics** | Usage stats, token tracking, cost reports | 1 | 3 | -- | 2 | No |

All modules depend on **core**. Install core first, then add modules as needed.

---

## Architecture

```
open-claude-office/
├── .claude/            <- Agent ecosystem (47 agents, 28 skills, 14 commands, 9 hooks)
│   ├── agents/         <- Keyword-routed via MANIFEST.md
│   ├── skills/         <- Invocable via /skill-name
│   ├── commands/       <- Slash commands
│   ├── hooks/          <- Automation hooks
│   ├── docs/           <- ROLE-MAP.md, ARCHITECTURE.md
│   └── settings.json   <- Unified configuration (lifecycle, quality gates, ...)
├── dashboard/          <- SvelteKit multi-project dashboard (localhost:4173)
├── modules/            <- 8 install module manifests
│   └── craft/assets/   <- Design presets, site templates, workspaces
├── docs/               <- Project documentation + pipeline plan
├── install.sh          <- Full installation script
└── CLAUDE.md           <- AI agent system prompt
```

### Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Master system prompt -- loaded by Claude Code on every session |
| `.claude/agents/MANIFEST.md` | Keyword routing index for all 47 agents |
| `.claude/settings.json` | Unified config including `lifecycle.current_stage` |
| `.claude/docs/ROLE-MAP.md` | Complete cross-reference of all components by role |
| `dashboard/` | Multi-project Interactive Pipeline Dashboard |

---

## Dashboard

A multi-project Interactive Pipeline Dashboard with VSCode-like layout:

```
┌──────────────────────────────────────────────────────────────┐
│  open-claude-office    [project-A] [project-B]    MVP ▼      │
├─────────┬────────────────────────────────────────────────────┤
│  ~/dev/ │  Pipeline Flow                                     │
│         │  ┌──────┐    ┌──────┐    ┌──────┐                 │
│  algo/  │  │ api  │───→│ code │───→│ test │                 │
│  bim/   │  │  ◉   │    │  ●   │    │  ○   │                 │
│  memo/  │  └──────┘    └──────┘    └──────┘                 │
│★ open/  │                                                    │
│  folio/ ├────────────────────────────────────────────────────┤
│         │  Command History                                   │
├─────────┴────────────────────────────────────────────────────┤
│  Claude idle │ Codex idle │ Gemini idle │ Tokens: 12.5k      │
└──────────────────────────────────────────────────────────────┘
```

- **Left sidebar**: Browse `~/dev/` project folders. Projects with `.claude/` config are marked with a star.
- **Top bar**: Project tabs + lifecycle stage toggle (MVP / PoC / Production). Changing the stage updates the project's `.claude/settings.json`.
- **Main area**: Real-time Interactive Pipeline Flow with animated SVG nodes per CLI event.
- **Bottom panel**: Collapsible command history timeline.

```bash
cd dashboard && npm run dev    # Start at localhost:4173
```

---

## Multi-CLI Orchestration

Three CLI tools work in concert, with Claude Code as the lead orchestrator:

```
            Claude Code (Lead)
            Orchestration + Code Generation
                    |
        +-----------+-----------+
        |                       |
  Codex CLI                Gemini CLI
  Analysis, Validation     Design, Visualization
  --sandbox read-only      -y (auto-confirm)
```

### Phase-to-CLI Distribution

| Phase | Task | Primary CLI | Fallback |
|-------|------|-------------|----------|
| 1 -- Analyze | Code analysis, stack detection | Codex | Claude |
| 2 -- Design | Design profile generation | Gemini | Claude |
| 3 -- Build | Diagrams, SVG visualization | Gemini | Claude |
| 3.5 -- Validate | Build verification, code review | Codex | Claude |
| All | Orchestration, content generation | Claude | -- |

**Fallback behavior**: If an external CLI fails, the system retries once, then falls back to Claude's built-in capabilities. All fallback events are logged in `.state.yaml`.

---

## Role Map

All 47 agents, 23 skills, 12 commands, and 9 hooks organized into 13 functional groups:

| # | Role Group | Agents | Skills | Commands | Hooks | Total |
|---|------------|--------|--------|----------|-------|-------|
| 1 | Planning and Discovery | 4 | 4 | -- | -- | 8 |
| 2 | Architecture and Design | 6 | 1 | -- | -- | 7 |
| 3 | Code Development | 5 | -- | 7 | -- | 12 |
| 4 | Code Quality and Review | 7 | 4 | -- | -- | 11 |
| 5 | Documentation | 5 | 3 | -- | -- | 8 |
| 6 | Git and Release Management | 6 | 2 | 4 | -- | 12 |
| 7 | Project Management | 2 | 4 | 1 | -- | 7 |
| 8 | Infrastructure and CI/CD | 3 | 1 | -- | -- | 4 |
| 9 | Lifecycle Gates | 2 | -- | -- | -- | 2 |
| 10 | Multi-CLI Orchestration | -- | 4 | -- | -- | 4 |
| 11 | Analytics and Monitoring | 1 | 3 | -- | -- | 4 |
| 12 | Meta / Tooling Creation | 4 | 6 | -- | -- | 10 |
| 13 | Automation Hooks | -- | -- | -- | 9 | 9 |
| | **Total** | **45** | **32** | **12** | **9** | **98** |

Full details in `.claude/docs/ROLE-MAP.md`.

---

## Pipeline

The craft pipeline transforms a Git repository into a deployed portfolio site in four phases:

```
Phase 1: Analyze          Phase 2: Design          Phase 3: Build           Phase 4: Deploy
-------------------       ------------------       ------------------       ------------------
 code-analyst   -+                                   page-writer
 story-analyst  -+-> SUMMARY.md -> design-profile -> content.json  -> site/ -> GitHub Pages
 stack-detector -+        |          tokens.css       figure-designer         Vercel / Netlify
                          |        (human review)     (Mermaid/SVG)
                          v
               experience-interviewer
               (gap analysis -> user interview -> experience-blocks.md)
```

### Phase Artifacts

| Phase | Artifact | Format | Rationale |
|-------|----------|--------|-----------|
| 1 -- Analyze | architecture.md, narrative.md, stack-profile.md | Markdown | Human-reviewable with file:line citations |
| 2 -- Design | design-profile.yaml | YAML | Human-editable with comment support |
| 3 -- Build | content.json, tokens.css, site/ | JSON/CSS/HTML | Machine-consumable for templates |
| 4 -- Deploy | deploy.yaml | YAML | Deployment config with live URL |

### State Machine

Each project tracks its state in `workspace/{project}/.state.yaml`:

```
init -> analyzing -> analyzed -> designing -> design_review -> building -> validating -> build_review -> deploying -> done
                                     ^              |                          ^              |
                                     +-- revision --+                          +-- issues ----+
```

Special states: `paused`, `failed`, `cancelled` (reachable from any active state).

---

## Lifecycle Management

Projects advance through three lifecycle stages with quality gates at each transition:

```
  MVP                        PoC                       Production
  +-----------------------+  +-----------------------+  +-----------------------+
  | Core feature only     |  | Validated with users  |  | Scalable, tested,     |
  | Minimal viable scope  |  | Performance baselines |  | documented, deployed  |
  | Basic tests           |  | Integration tests     |  | Full test coverage    |
  +-----------------------+  +-----------------------+  +-----------------------+
            |                          |                          |
            v                          v                          v
     [MVP Gate]                 [PoC Gate]                 [Prod Gate]
     - Core features work       - User validation done     - 80%+ test coverage
     - Basic tests pass         - Performance acceptable   - Security scan clean
     - README exists            - Integration tests pass   - All docs complete
                                - Architecture documented  - CI/CD pipeline live
```

### Gate Agents

| Agent | Role |
|-------|------|
| `lifecycle-gate` | Validates requirements at each stage transition |
| `migration-planner` | Plans technical migration between stages |
| `scaffolder` | Generates project structure appropriate to the current stage |

### Quality Gates

| Gate | Trigger | Checks |
|------|---------|--------|
| pre-commit | Before commit | Lint, format, types, secrets scan |
| pre-merge | Before merge | 80% coverage, review required, changelog required |
| pre-build | Phase 3 to 3.5 | content.json schema, tokens.css completeness, no PLACEHOLDERs |
| pre-deploy | Phase 3.5 to 4 | All validations pass, site builds, deploy config exists |
| pre-release | Before release | 80% coverage, security scan, full documentation |
| post-release | After release | Sprint archive, release notes, retrospective prompt |

---

## Slash Commands

### Craft Pipeline

| Command | Description |
|---------|-------------|
| `/craft` | Run the full pipeline (Phase 1 through 4) |
| `/craft-analyze` | Phase 1 only: code, story, and stack analysis |
| `/craft-design` | Phase 2 only: generate design profile from analysis |
| `/craft-preview` | Local build and preview server |
| `/craft-deploy` | Deploy to GitHub Pages, Vercel, or Netlify |
| `/craft-sync` | Sync data with main portfolio |
| `/craft-state` | Inspect, log, reset, resume, or pause project state |
| `/craft-export` | Export project data |

### Development Lifecycle

| Command | Description |
|---------|-------------|
| `/feature` | Feature development workflow (Phase + Sprint + Git + docs) |
| `/bugfix` | Bug fix workflow (issue analysis to fix to PR) |
| `/release` | Release management (versioning + docs + deploy) |
| `/phase` | Phase status, transitions, and progress |

---

## Template Stacks

Portfolio sites are built using framework-specific templates selected based on project characteristics:

| Template | Stack | Best For |
|----------|-------|----------|
| sveltekit-dashboard | SvelteKit | Interactive dashboards, workflow visualization, animations |
| astro-landing | Astro | Static product landings, research showcases, zero-JS default |

Template selection is automatic based on `stack-detector` analysis, but can be overridden in `design-profile.yaml`.

---

## Requirements

**Required:**

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) -- primary orchestrator
- `jq` -- JSON processing for hooks and state management
- `bash` 4.0+ -- hook execution

**Optional (for multi-CLI orchestration):**

- [Codex CLI](https://github.com/openai/codex) -- code analysis and validation (Phase 1, 3.5)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) -- design and visualization (Phase 2, 3)
- [GitHub CLI (gh)](https://cli.github.com/) -- issue/PR/release management
- Node.js 18+ -- for SvelteKit/Astro template builds

If optional CLIs are not installed, all tasks fall back to Claude Code automatically.

---

## License

MIT

# open-claude-office

> **Status: In Development** — Core agent ecosystem is functional. Dashboard, craft pipeline, and multi-CLI orchestration are actively being built.

A Claude Code agent ecosystem framework. Copy `.claude/` into any project to gain 47 agents, 34 skills, 15 commands, and 10 hooks — all working through the native CLI.

---

## Quick Start

### Option A: Copy `.claude/` directly (Recommended)

No dependencies. No build step. Just copy and use.

```bash
git clone https://github.com/tygwan/open-claude-office.git
cp -r open-claude-office/.claude /your/project/.claude
cd /your/project
claude
```

That's it. Claude Code automatically discovers the agents, skills, commands, and hooks inside `.claude/`. Everything works through the native Claude Code CLI — no dashboard or external tools required.

### Option B: Modular install via `install.sh`

Use this if you want selective module installation, settings.json merge, or clean uninstall support. Requires `jq`.

```bash
cd open-claude-office

# Full install (default)
./install.sh --target=/your/project

# Specific modules only
./install.sh --target=/your/project --modules=core,lifecycle,git

# Preview without changes
./install.sh --target=/your/project --dry-run

# Uninstall
./install.sh --target=/your/project --uninstall
```

---

## How It Works

Copy `.claude/` into any project and Claude Code gains 47 agents, 34 skills, 15 commands, and 10 hooks — all working through the native CLI. No server, no dashboard, no extra runtime.

```
your-project/
├── .claude/
│   ├── agents/         <- 47 keyword-routed agents (via MANIFEST.md)
│   ├── skills/         <- 34 skills (invocable via /skill-name)
│   ├── commands/       <- 15 slash commands (/feature, /craft, /phase, ...)
│   ├── hooks/          <- 10 automation hooks (safety, progress, analytics)
│   └── settings.json   <- Unified config (lifecycle, quality gates, ...)
└── your code...
```

**Everything runs inside `claude` CLI.** Ask naturally and the right agent handles it:

```
> "Review this code"              → code-reviewer agent
> "Write a commit message"        → commit-helper agent
> /feature                        → feature development workflow
> /craft                          → portfolio generation pipeline
> /phase                          → phase status and transitions
```

## Features

- **Keyword-Routed Agents** — `MANIFEST.md` matches your prompt keywords to the right agent. No manual selection needed.
- **Lifecycle Management** — Phase-gated development from MVP to PoC to Production, with Sprint tracking, quality gates, and automated documentation.
- **Portfolio Generation Pipeline** — Analyze any Git repo (code, commits, stack) and generate a custom portfolio site with unique design tokens, content structure, and deployment.
- **Multi-CLI Orchestration** — Claude Code leads; Codex CLI handles analysis and validation; Gemini CLI handles design and visualization. Automatic fallback if any CLI is unavailable.
- **Quality Gates** — Automated checks at commit, merge, build, deploy, and release stages.
- **Context Optimization** — Token budget management with incremental loading across four budget levels (2K/10K/30K/50K).
- **Interactive Dashboard** (optional) — Real-time pipeline visualization, project file explorer, chat with session history. See [Dashboard](#dashboard-optional) section.

---

<details>
<summary><strong>Modules</strong></summary>

| Module | Description | Agents | Skills | Commands | Hooks | Required |
|--------|-------------|--------|--------|----------|-------|----------|
| **core** | Safety, routing, project initialization | 5 | 4 | — | 1 | Yes |
| **craft** | Git repo to portfolio site pipeline | 8 | 2 | 8 | 2 | No |
| **lifecycle** | MVP/PoC/Prod phases, Sprint tracking | 17 | 8 | 5 | 3 | No |
| **git** | GitHub Flow, commits, PRs, branching | 6 | 2 | 1 | 1 | No |
| **quality** | Code review, testing, refactoring, docs | 6 | 3 | — | — | No |
| **multi-cli** | Claude + Codex + Gemini orchestration | — | 4 | — | — | No |
| **meta** | Create new agents, skills, hooks, commands | 4 | 8 | — | — | No |
| **analytics** | Usage stats, token tracking, cost reports | 1 | 3 | — | 2 | No |
| **notion** | Bidirectional Notion sync (8 DBs, MCP-based) | — | 1 | 1 | 1 | No |
| **external-skills** | stitch-skills, remotion, claude-office-skills | — | 3 | — | — | No |

All modules depend on **core**. Install core first, then add modules as needed.

</details>

<details>
<summary><strong>Architecture</strong></summary>

```
open-claude-office/
├── .claude/            <- Agent ecosystem (47 agents, 34 skills, 15 commands, 10 hooks)
│   ├── agents/         <- Keyword-routed via MANIFEST.md
│   ├── skills/         <- Invocable via /skill-name
│   ├── commands/       <- Slash commands
│   ├── hooks/          <- Automation hooks
│   ├── docs/           <- ROLE-MAP.md, ARCHITECTURE.md
│   └── settings.json   <- Unified configuration (lifecycle, quality gates, ...)
├── dashboard/          <- SvelteKit multi-project dashboard (localhost:4173)
├── modules/            <- 10 install module manifests
│   └── craft/assets/   <- Design presets, site templates, workspaces
├── docs/               <- Project documentation + pipeline plan
├── install.sh          <- Full installation script
└── CLAUDE.md           <- AI agent system prompt
```

### Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Master system prompt — loaded by Claude Code on every session |
| `.claude/agents/MANIFEST.md` | Keyword routing index for all 47 agents |
| `.claude/settings.json` | Unified config including `lifecycle.current_stage` |
| `.claude/docs/ROLE-MAP.md` | Complete cross-reference of all components by role |
| `dashboard/` | Multi-project Interactive Pipeline Dashboard |

</details>

<details>
<summary><strong>Dashboard (Optional)</strong></summary>

A multi-project Interactive Pipeline Dashboard with VSCode-like layout. **Not required** — all orchestration features work through the native Claude Code CLI. The dashboard adds real-time visualization on top.

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

- **Left sidebar**: Browse `~/dev/` project folders with nested file tree. Projects with `.claude/` config are marked.
- **Top bar**: Project tabs + lifecycle stage toggle (MVP / PoC / Production).
- **Main area**: Real-time Interactive Pipeline Flow with animated SVG nodes per CLI event.
- **Bottom panel**: Tabbed command history + chat with session resume.

```bash
cd dashboard && npm run dev    # Start at localhost:4173
```

</details>

<details>
<summary><strong>Multi-CLI Orchestration</strong></summary>

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
| 1 — Analyze | Code analysis, stack detection | Codex | Claude |
| 2 — Design | Design profile generation | Gemini | Claude |
| 3 — Build | Diagrams, SVG visualization | Gemini | Claude |
| 3.5 — Validate | Build verification, code review | Codex | Claude |
| All | Orchestration, content generation | Claude | — |

**Fallback behavior**: If an external CLI fails, the system retries once, then falls back to Claude's built-in capabilities. All fallback events are logged in `.state.yaml`.

</details>

<details>
<summary><strong>Role Map</strong></summary>

All 47 agents, 34 skills, 15 commands, and 10 hooks organized into 13 functional groups:

| # | Role Group | Agents | Skills | Commands | Hooks | Total |
|---|------------|--------|--------|----------|-------|-------|
| 1 | Planning and Discovery | 4 | 4 | — | — | 8 |
| 2 | Architecture and Design | 6 | 1 | — | — | 7 |
| 3 | Code Development | 5 | — | 7 | — | 12 |
| 4 | Code Quality and Review | 7 | 4 | — | — | 11 |
| 5 | Documentation | 5 | 3 | — | — | 8 |
| 6 | Git and Release Management | 6 | 2 | 4 | — | 12 |
| 7 | Project Management | 2 | 4 | 1 | — | 7 |
| 8 | Infrastructure and CI/CD | 3 | 1 | — | — | 4 |
| 9 | Lifecycle Gates | 2 | — | — | — | 2 |
| 10 | Multi-CLI Orchestration | — | 4 | — | — | 4 |
| 11 | Analytics and Monitoring | 1 | 3 | — | — | 4 |
| 12 | Meta / Tooling Creation | 4 | 6 | — | — | 10 |
| 13 | Automation Hooks | — | — | — | 10 | 10 |

Full details in `.claude/docs/ROLE-MAP.md`.

</details>

<details>
<summary><strong>Craft Pipeline</strong></summary>

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
| 1 — Analyze | architecture.md, narrative.md, stack-profile.md | Markdown | Human-reviewable with file:line citations |
| 2 — Design | design-profile.yaml | YAML | Human-editable with comment support |
| 3 — Build | content.json, tokens.css, site/ | JSON/CSS/HTML | Machine-consumable for templates |
| 4 — Deploy | deploy.yaml | YAML | Deployment config with live URL |

### State Machine

Each project tracks its state in `workspace/{project}/.state.yaml`:

```
init -> analyzing -> analyzed -> designing -> design_review -> building -> validating -> build_review -> deploying -> done
                                     ^              |                          ^              |
                                     +-- revision --+                          +-- issues ----+
```

Special states: `paused`, `failed`, `cancelled` (reachable from any active state).

</details>

<details>
<summary><strong>Lifecycle Management</strong></summary>

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

### Quality Gates

| Gate | Trigger | Checks |
|------|---------|--------|
| pre-commit | Before commit | Lint, format, types, secrets scan |
| pre-merge | Before merge | 80% coverage, review required, changelog required |
| pre-build | Phase 3 to 3.5 | content.json schema, tokens.css completeness, no PLACEHOLDERs |
| pre-deploy | Phase 3.5 to 4 | All validations pass, site builds, deploy config exists |
| pre-release | Before release | 80% coverage, security scan, full documentation |
| post-release | After release | Sprint archive, release notes, retrospective prompt |

</details>

<details>
<summary><strong>Slash Commands</strong></summary>

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
| `/dev-doc-planner` | Documentation planning (PRD, TECH-SPEC, PROGRESS templates) |
| `/git-workflow` | Git workflow management (branch strategy, commit conventions) |
| `/notion` | Bidirectional Notion sync (sync, push, pull, status, diff, init) |

</details>

<details>
<summary><strong>Template Stacks</strong></summary>

Portfolio sites are built using framework-specific templates selected based on project characteristics:

| Template | Stack | Best For |
|----------|-------|----------|
| sveltekit-dashboard | SvelteKit | Interactive dashboards, workflow visualization, animations |
| astro-landing | Astro | Static product landings, research showcases, zero-JS default |

Template selection is automatic based on `stack-detector` analysis, but can be overridden in `design-profile.yaml`.

</details>

---

## Requirements

**To use `.claude/` features (copy approach):**

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) — that's it

**Additional for `install.sh`:**

- `jq` — JSON processing for settings.json merge
- `bash` 4.0+ — hook execution

**Optional (enhanced orchestration):**

- [Codex CLI](https://github.com/openai/codex) — code analysis and validation (Phase 1, 3.5)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) — design and visualization (Phase 2, 3)
- [GitHub CLI (gh)](https://cli.github.com/) — issue/PR/release management
- Node.js 18+ — for dashboard and SvelteKit/Astro template builds

If optional CLIs are not installed, all tasks fall back to Claude Code automatically.

---

## License

MIT

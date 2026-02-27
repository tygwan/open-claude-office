# Claw-Empire → open-pantheon Absorption Design

## Source Analysis

**Claw-Empire v1.1.1** — AI Agent Office Simulator
- Location: `/home/coffin/dev/0.other-dev/claw-empire/`
- Stack: React 19 + Vite 7 + Express 5 + SQLite (node:sqlite) + PixiJS 8 + Tailwind 4 + WebSocket
- 6 AI Providers: Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot, Antigravity

---

## Architecture Breakdown

### 1. Multi-AI Provider Gateway (`server/gateway/client.ts`, `server/modules/workflow/agents/providers.ts`)

**What it does:**
- Abstracts 6 AI CLIs + API-based providers into a unified interface
- CLI agents spawned via `child_process.spawn()` with streaming output
- API agents called via HTTP (OpenAI, Anthropic, Google, Ollama, OpenRouter, Together, Groq, Cerebras, custom)
- OAuth token management: GitHub Copilot (device flow), Google/Antigravity (OAuth2)
- Token rotation: `rotateOAuthAccounts()`, `prioritizeOAuthAccount()`, `markOAuthAccountFailure()`
- Model config per provider: `getProviderModelConfig()`, model cache with TTL
- Gateway WebSocket protocol v3 for external integration (OpenClaw)

**Key patterns:**
- `spawnCliAgent()` — spawn CLI process, stream stdout/stderr, parse JSON lines
- `launchHttpAgent()` — HTTP-based agent with prompt + context
- `launchApiProviderAgent()` — direct API calls to LLM providers
- `execWithTimeout()` — timeout-safe command execution
- `detectAllCli()` — detect installed CLI tools (`claude`, `codex`, `gemini`, `opencode`)

### 2. Agent System (`server/modules/workflow/agents.ts`)

**Organization:**
- Departments (e.g., Development, Design, Analysis, Documentation, Presentation)
- Roles: `team_leader`, `senior`, `junior` — hierarchy within departments
- Agents have: id, name, avatar, department_id, role, status, level, xp, skills
- Agent status: `idle`, `working`, `meeting`, `break`

**Task lifecycle:**
```
inbox → planned → in_progress → review → done
                      ↓           ↓
                  cancelled    → done (after approval)
```

**Subtask system:**
- Tasks decomposed into subtasks with department routing
- `analyzeSubtaskDepartment()` — NLP-based routing to appropriate dept
- Cross-department cooperation via `crossDeptNextCallbacks`
- Subtask delegation with batch processing

### 3. Meeting/Review System (`server/modules/workflow/orchestration/meetings.ts`)

**Meeting flow:**
- `startPlannedApprovalMeeting()` — agents called to CEO office
- Review rounds (max configurable, default 3)
- Decision classification: `approved`, `hold`, `reviewing`
- Consensus-based: multiple dept leaders vote
- Meeting minutes generated automatically
- Review revision subtasks spawned on `hold` decisions

### 4. Git Worktree Management (`server/modules/workflow/core.ts`)

- `createWorktree()` — isolated branch per task
- `mergeWorktree()` — merge completed work back
- `rollbackTaskWorktree()` — discard failed work
- `getWorktreeDiffSummary()` — review changes before merge
- Per-task isolation: `taskWorktrees` Map tracks active worktrees

### 5. WebSocket Event System (`server/ws/hub.ts`, `src/hooks/useWebSocket.ts`)

**Events:**
| Event | Data | Direction |
|-------|------|-----------|
| `task_update` | task state change | server → client |
| `agent_status` | agent state + subAgents | server → client |
| `new_message` | chat message | server → client |
| `announcement` | broadcast message | server → client |
| `task_report` | completion report | server → client |
| `cross_dept_delivery` | from_agent → to_agent | server → client |
| `ceo_office_call` | meeting attendance | server → client |
| `subtask_update` | subtask state | server → client |
| `cli_output` | streaming CLI output | server → client |
| `chat_stream` | start/delta/end SSE | server → client |

### 6. i18n System (`src/i18n.ts`)

- 4 languages: KO, EN, JA, ZH
- `pickLang(lang, { ko, en, ja?, zh? })` — inline translation utility
- `detectBrowserLanguage()` — auto-detect from navigator
- `normalizeLanguage()` — normalize input to UiLanguage
- Server-side: `resolveLang()`, `detectLang()`, `l()`, `getRoleLabel()`

### 7. SQLite State Management (`server/db/runtime.ts`)

- WAL journal mode for concurrent reads
- Busy retry with exponential backoff (configurable)
- Idempotent message insertion
- Security audit logging (NDJSON)
- Transaction support with rollback

### 8. PixiJS Office UI (`src/components/OfficeView.tsx`)

- Isometric pixel-art office rendering
- Agent sprites with 3 directions (Down/Left/Right), animation frames
- Department rooms with customizable themes (floor, wall, accent colors)
- CEO office with meeting seats
- Cross-dept delivery animations (throw/walk)
- Meeting visualization with speech bubbles
- Break room for idle agents

---

## Absorption Scope

### FULL ABSORB — Core systems to integrate

| # | Component | Source Files | Why | Integration Target |
|---|-----------|-------------|-----|--------------------|
| 1 | **Enhanced Provider Gateway** | `server/gateway/client.ts`, `server/modules/workflow/agents/providers.ts` | open-pantheon's CLI distribution is basic (3 CLIs). claw-empire adds OAuth, API-mode, token rotation, 6+ providers | Extend existing `skills/codex/`, `skills/gemini/` + new provider abstraction layer |
| 2 | **Department + Role Hierarchy** | `server/modules/routes/collab.ts` DEPT_KEYWORDS | open-pantheon's 25 agents are flat. claw-empire's dept→role hierarchy enables better task routing | New `.claude/agents/departments.yaml` + MANIFEST.md enhancement |
| 3 | **Subtask Delegation** | `server/modules/workflow/orchestration.ts` | Enables /craft pipeline phases to auto-delegate subtasks to specialized agents | Integrate with state machine transitions |
| 4 | **Review Consensus** | `server/modules/workflow/orchestration/meetings.ts` | Quality gates become multi-agent review meetings | Enhance quality-gate skill with consensus protocol |
| 5 | **i18n Framework** | `src/i18n.ts` (pattern only) | open-pantheon targets international users | New `.claude/i18n/` with pickLang pattern for all user-facing output |
| 6 | **Git Worktree Per Task** | `server/modules/workflow/core.ts` (patterns) | Task isolation for parallel craft pipeline execution | Enhance `/craft` to use worktrees per project |

### PATTERN ABSORB — Extract patterns, not code

| # | Pattern | Source | What to Extract |
|---|---------|--------|-----------------|
| 7 | **WebSocket Event Bus** | `server/ws/hub.ts` | Event naming convention + broadcast pattern for future real-time dashboard |
| 8 | **Task State Machine** | Task lifecycle (inbox→planned→in_progress→review→done) | Merge with existing 13-state machine, add quality gate nodes |
| 9 | **CLI Output Streaming** | `normalizeStreamChunk()`, `shouldSkipDuplicateCliOutput()` | Better Codex/Gemini output handling in pipeline |
| 10 | **Deferred Runtime Proxy** | `server/modules/deferred-runtime.ts` | Lazy initialization pattern for heavy modules |
| 11 | **OAuth Account Rotation** | `rotateOAuthAccounts()`, `markOAuthAccountFailure()` | Multi-account fallback for API-heavy operations |
| 12 | **Project Context Generation** | `generateProjectContext()`, `buildFileTree()`, `detectTechStack()` | Enhance Phase 1 analysis with claw-empire's context builder |

### DO NOT ABSORB

| # | Component | Reason |
|---|-----------|--------|
| 13 | **PixiJS Office UI** | Domain-specific (office simulator). open-pantheon is CLI-first. |
| 14 | **React Frontend** | open-pantheon generates static portfolio sites, not dashboards |
| 15 | **SQLite Database** | open-pantheon uses YAML files for state (`.state.yaml`). Different paradigm. |
| 16 | **Office Room Themes** | Pixel-art specific. Irrelevant to portfolio generation. |
| 17 | **Agent Sprites/Avatars** | Visual assets for office simulator only. |
| 18 | **Update Banner System** | Version check UI. Not applicable. |
| 19 | **Meeting Seat/Presence UI** | Office-specific visualization. Pattern (review rounds) is absorbed instead. |

---

## Implementation Plan

### Phase CE-1: Provider Gateway Enhancement (~6 files)

**Goal:** Extend open-pantheon's 3-CLI system to support 6+ providers with OAuth and API modes.

1. **CREATE `.claude/skills/provider-gateway/SKILL.md`** — Unified provider abstraction
   - Provider types: `cli` (Claude, Codex, Gemini, OpenCode), `oauth` (Copilot, Antigravity), `api` (direct LLM)
   - Model selection per provider with fallback chain
   - Token rotation for API providers
   - Detection: `detectAllCli()` pattern

2. **UPDATE `.claude/skills/codex/SKILL.md`** — Add OAuth mode + Copilot integration
   - Codex can also work via API mode (OpenAI key)
   - Add Copilot as Codex alternative

3. **UPDATE `.claude/skills/gemini/SKILL.md`** — Add API mode
   - Gemini via API key as alternative to CLI
   - Google OAuth integration pattern

4. **CREATE `.claude/skills/opencode/SKILL.md`** — New provider
   - OpenCode CLI integration
   - Model: deepseek, local LLMs

5. **UPDATE `.claude/settings.json`** — Expand `craft.cli_distribution`
   ```json
   {
     "craft": {
       "cli_distribution": {
         "claude": { "mode": "cli", "default": true },
         "codex": { "mode": "cli", "sandbox": "read-only", "fallback": "api" },
         "gemini": { "mode": "cli", "auto_accept": true, "fallback": "api" },
         "opencode": { "mode": "cli", "optional": true },
         "copilot": { "mode": "oauth", "optional": true },
         "antigravity": { "mode": "oauth", "optional": true }
       },
       "api_providers": {
         "openai": { "models": ["gpt-5-mini", "gpt-5"] },
         "anthropic": { "models": ["claude-opus-4-6", "claude-sonnet-4-6"] },
         "google": { "models": ["gemini-2.5-flash", "gemini-2.5-pro"] }
       }
     }
   }
   ```

### Phase CE-2: Department + Subtask System (~5 files)

**Goal:** Organize agents into departments with subtask delegation.

1. **CREATE `.claude/agents/departments.yaml`**
   ```yaml
   departments:
     analysis:
       name: "Analysis"
       agents: [code-analyst, story-analyst, stack-detector]
       leader: code-analyst
     design:
       name: "Design"
       agents: [design-agent, figure-designer]
       leader: design-agent
     build:
       name: "Build"
       agents: [page-writer]
       leader: page-writer
     validation:
       name: "Validation"
       agents: [validation-agent]
       leader: validation-agent
     dev-lifecycle:
       name: "Dev Lifecycle"
       agents: [progress-tracker, phase-tracker, commit-helper, pr-creator, ...]
       leader: progress-tracker
   ```

2. **UPDATE `.claude/agents/MANIFEST.md`** — Add department column
3. **CREATE `.claude/skills/subtask-delegation/SKILL.md`** — Subtask routing pattern
4. **UPDATE `.claude/docs/ARCHITECTURE.md`** — Document department hierarchy

### Phase CE-3: Review Consensus Protocol (~4 files)

**Goal:** Quality gates become multi-agent review meetings.

1. **CREATE `.claude/skills/review-consensus/SKILL.md`**
   - Review rounds (max 3)
   - Agent votes: `approved` / `hold` / `revision`
   - Consensus rules: unanimous approval or majority after final round
   - Revision memo generation

2. **UPDATE `.claude/skills/quality-gate/SKILL.md`**
   - Add consensus meeting trigger at each gate
   - Pre-build → validation-agent + code-analyst review
   - Pre-deploy → validation-agent + page-writer review
   - Pre-release → all lead agents consensus

3. **UPDATE `workspace/.state-schema.yaml`** — Add review fields
   ```yaml
   review:
     round: 0-3
     decisions: { agent_id: approved|hold|revision }
     minutes: string
   ```

### Phase CE-4: i18n Framework (~3 files)

**Goal:** Multi-language support for all user-facing output.

1. **CREATE `.claude/i18n/translations.yaml`**
   ```yaml
   pipeline:
     analyzing:
       ko: "분석 중..."
       en: "Analyzing..."
       ja: "分析中..."
       zh: "分析中..."
     building:
       ko: "빌드 중..."
       en: "Building..."
   ```

2. **CREATE `.claude/skills/i18n/SKILL.md`** — Translation guidelines
   - pickLang pattern for inline translations
   - Language detection from system locale
   - Fallback: always EN

3. **UPDATE `.claude/settings.json`** — Add language config
   ```json
   { "ui": { "language": "auto", "supported": ["ko", "en", "ja", "zh"] } }
   ```

### Phase CE-5: Enhanced CLI Output Handling (~3 files)

**Goal:** Better streaming output handling for external CLIs.

1. **UPDATE `.claude/skills/codex/SKILL.md`** — Add streaming patterns
   - JSON line parsing from CLI stdout
   - Dedup window for repeated output
   - ANSI escape stripping
   - Timeout handling with graceful kill

2. **UPDATE `.claude/skills/gemini/SKILL.md`** — Add SSE parsing
   - Gemini SSE stream parsing pattern
   - Partial result handling

3. **UPDATE `.claude/hooks/state-transition.sh`** — Add CLI event logging
   - Log CLI invocations with timing
   - Track model usage per provider

---

## Updated Component Counts (After Absorption)

| Category | Before (foliocraft + ultra) | After (+ claw-empire) |
|----------|---------------------------|----------------------|
| CLI Providers | 3 (Claude + Codex + Gemini) | **6** (+ OpenCode + Copilot + Antigravity) |
| Provider Modes | 1 (CLI only) | **3** (CLI + OAuth + API) |
| Agent Departments | 0 (flat) | **5** (Analysis, Design, Build, Validation, DevLifecycle) |
| Skills | 29 | **33** (+ provider-gateway, subtask-delegation, review-consensus, i18n) |
| Languages | 1 (KO) | **4** (KO + EN + JA + ZH) |
| Review Protocol | Simple pass/fail | **Multi-round consensus** |

---

## File Summary

| Phase | Files | Count |
|-------|-------|-------|
| CE-1: Provider Gateway | 1 new skill + 2 updated skills + 1 new skill + settings.json | ~5 |
| CE-2: Departments | departments.yaml + MANIFEST.md + 1 skill + ARCHITECTURE.md | ~4 |
| CE-3: Review Consensus | 1 new skill + quality-gate update + state-schema | ~3 |
| CE-4: i18n | translations.yaml + 1 skill + settings.json | ~3 |
| CE-5: CLI Output | 2 skill updates + 1 hook update | ~3 |
| **Total** | | **~18 file operations** |

---

## Decision Points for User

1. **Provider Scope**: Absorb all 6 providers or just add OpenCode (4th CLI)?
2. **OAuth Complexity**: Add OAuth flows or keep CLI-only simplicity?
3. **API Provider Mode**: Support direct API keys to LLMs or stay CLI-mediated?
4. **i18n Priority**: Full 4-language support now or EN+KO first?
5. **Review Consensus**: Full multi-round meeting protocol or simplified vote system?

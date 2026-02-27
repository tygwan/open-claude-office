# Claw-Empire v1.1.1 — Complete Technical Reference

> AI Agent Office Simulator
> Location: `/home/coffin/dev/0.other-dev/claw-empire/`

---

## 1. Project Overview

| Item | Value |
|------|-------|
| Package | `climpire` v1.1.1 |
| Node.js | >= 22 (native `node:sqlite`) |
| Package Manager | pnpm |
| Frontend | React 19 + Vite 7 + PixiJS 8 + Tailwind 4 + Lucide React |
| Backend | Express 5 + tsx + ws (WebSocket) |
| Database | SQLite (WAL mode, `node:sqlite`) |
| Validation | Zod 4 |
| Reports | pptxgenjs (PowerPoint generation) |
| Testing | Vitest + Playwright + Testing Library + MSW + Supertest |
| TypeScript | 5.9 |
| AI Providers | 6 CLI + 9 API = **15 total** |

### Dependencies (production)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | React DOM renderer |
| `react-router-dom` | ^7.6.2 | Client-side routing |
| `express` | ^5.2.1 | HTTP server |
| `ws` | ^8.19.0 | WebSocket server |
| `pixi.js` | ^8.6.6 | Office pixel-art rendering |
| `pptxgenjs` | ^3.12.0 | PowerPoint report generation |
| `lucide-react` | ^0.511.0 | Icon library |
| `cors` | ^2.8.6 | CORS middleware |
| `zod` | ^4.3.6 | Runtime schema validation |

### Dev Dependencies (key)

| Package | Version |
|---------|---------|
| `typescript` | ~5.9.3 |
| `vite` | ^7.2.4 |
| `tailwindcss` | ^4.1.8 |
| `vitest` | ^3.0.3 |
| `playwright` | ^1.58.2 |
| `sharp` | ^0.34.5 |
| `nodemon` | ^3.1.11 |
| `tsx` | ^4.21.0 |

---

## 2. Full SQLite Schema (18 Tables)

Source: `server/server-main.ts:568-800`

### 2.1 Core Tables

**`departments`**
```sql
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ko TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`agents`**
```sql
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ko TEXT,
  department_id TEXT REFERENCES departments(id),
  role TEXT CHECK(role IN ('team_leader','senior','junior','intern')),
  cli_provider TEXT CHECK(cli_provider IN ('claude','codex','gemini','opencode','copilot','antigravity','api')),
  oauth_account_id TEXT,
  api_provider_id TEXT,
  api_model TEXT,
  avatar_emoji TEXT,
  personality TEXT,
  status TEXT CHECK(status IN ('idle','working','break','offline')) DEFAULT 'idle',
  current_task_id TEXT,
  stats_tasks_done INTEGER DEFAULT 0,
  stats_xp INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`tasks`**
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department_id TEXT REFERENCES departments(id),
  assigned_agent_id TEXT REFERENCES agents(id),
  status TEXT CHECK(status IN ('inbox','planned','collaborating','in_progress','review','done','cancelled','pending'))
    DEFAULT 'inbox',
  priority INTEGER DEFAULT 0,
  task_type TEXT CHECK(task_type IN ('general','development','design','analysis','presentation','documentation'))
    DEFAULT 'general',
  project_path TEXT,
  result TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`subtasks`**
```sql
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('pending','in_progress','done','blocked')) DEFAULT 'pending',
  assigned_agent_id TEXT REFERENCES agents(id),
  blocked_reason TEXT,
  cli_tool_use_id TEXT,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`messages`**
```sql
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_type TEXT CHECK(sender_type IN ('ceo','agent','system')) NOT NULL,
  sender_id TEXT,
  receiver_type TEXT CHECK(receiver_type IN ('agent','department','all')) NOT NULL,
  receiver_id TEXT,
  content TEXT NOT NULL,
  message_type TEXT CHECK(message_type IN ('chat','task_assign','announcement','directive','report','status_update'))
    DEFAULT 'chat',
  task_id TEXT REFERENCES tasks(id),
  idempotency_key TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`task_logs`**
```sql
CREATE TABLE IF NOT EXISTS task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  kind TEXT NOT NULL,
  message TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
```

### 2.2 Meeting Tables

**`meeting_minutes`**
```sql
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  meeting_type TEXT CHECK(meeting_type IN ('planned','review')) NOT NULL,
  round INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('in_progress','completed','revision_requested','failed')) DEFAULT 'in_progress',
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`meeting_minute_entries`**
```sql
CREATE TABLE IF NOT EXISTS meeting_minute_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id TEXT NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  speaker_agent_id TEXT REFERENCES agents(id),
  speaker_name TEXT NOT NULL,
  department_name TEXT,
  role_label TEXT,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`review_revision_history`**
```sql
CREATE TABLE IF NOT EXISTS review_revision_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  normalized_note TEXT NOT NULL,
  raw_note TEXT NOT NULL,
  first_round INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(task_id, normalized_note)
);
```

### 2.3 OAuth Tables

**`oauth_credentials`** (legacy single-credential)
```sql
CREATE TABLE IF NOT EXISTS oauth_credentials (
  provider TEXT PRIMARY KEY,
  source TEXT,
  encrypted_data TEXT,
  email TEXT,
  scope TEXT,
  expires_at INTEGER
);
```

**`oauth_accounts`** (multi-account)
```sql
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  provider TEXT CHECK(provider IN ('github','google_antigravity')) NOT NULL,
  source TEXT,
  label TEXT,
  email TEXT,
  scope TEXT,
  expires_at INTEGER,
  access_token_enc TEXT,
  refresh_token_enc TEXT,
  status TEXT CHECK(status IN ('active','disabled')) DEFAULT 'active',
  priority INTEGER DEFAULT 0,
  model_override TEXT,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at INTEGER,
  last_success_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`oauth_active_accounts`**
```sql
CREATE TABLE IF NOT EXISTS oauth_active_accounts (
  provider TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  updated_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (provider, account_id)
);
```

**`oauth_states`** (PKCE flow)
```sql
CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  verifier_enc TEXT,
  redirect_to TEXT
);
```

### 2.4 AI Provider Tables

**`api_providers`**
```sql
CREATE TABLE IF NOT EXISTS api_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('openai','anthropic','google','ollama','openrouter','together','groq','cerebras','custom'))
    NOT NULL,
  base_url TEXT NOT NULL,
  api_key_enc TEXT,
  enabled INTEGER DEFAULT 1,
  models_cache TEXT,
  models_cached_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**`cli_usage_cache`**
```sql
CREATE TABLE IF NOT EXISTS cli_usage_cache (
  provider TEXT PRIMARY KEY,
  data_json TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);
```

**`skill_learning_history`**
```sql
CREATE TABLE IF NOT EXISTS skill_learning_history (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  provider TEXT CHECK(provider IN ('claude','codex','gemini','opencode','copilot','antigravity','api')),
  repo TEXT,
  skill_id TEXT,
  skill_label TEXT,
  status TEXT CHECK(status IN ('queued','running','succeeded','failed')),
  command TEXT,
  error TEXT,
  run_started_at INTEGER,
  run_completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(job_id, provider)
);
```

### 2.5 Other Tables

**`settings`**
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**`task_report_archives`**
```sql
CREATE TABLE IF NOT EXISTS task_report_archives (
  id TEXT PRIMARY KEY,
  root_task_id TEXT UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  generated_by_agent_id TEXT REFERENCES agents(id),
  summary_markdown TEXT,
  source_snapshot_json TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
```

### 2.6 Indexes (16)

```sql
-- Core
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_type, receiver_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);

-- Meeting
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_task ON meeting_minutes(task_id);
CREATE INDEX IF NOT EXISTS idx_meeting_entries_meeting ON meeting_minute_entries(meeting_id);
CREATE INDEX IF NOT EXISTS idx_review_revision_task ON review_revision_history(task_id);

-- OAuth
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_active_provider ON oauth_active_accounts(provider);

-- Skills
CREATE INDEX IF NOT EXISTS idx_skill_learning_job ON skill_learning_history(job_id);
CREATE INDEX IF NOT EXISTS idx_skill_learning_repo ON skill_learning_history(repo);
```

---

## 3. Multi-AI Provider Gateway

Source: `server/modules/workflow/agents/providers.ts` (1800+ LOC)

### 3.1 Provider Categories

| Category | Providers | Invocation |
|----------|-----------|------------|
| **CLI** | Claude Code, Codex CLI, Gemini CLI, OpenCode | `child_process.spawn()` |
| **OAuth HTTP** | GitHub Copilot, Google Antigravity | HTTP API + OAuth tokens |
| **API HTTP** | OpenAI, Anthropic, Google, Ollama, OpenRouter, Together, Groq, Cerebras, Custom | Direct LLM API calls |

### 3.2 CLI Agent Spawning

Source: `server/modules/workflow/core.ts:894-934`, `agents.ts:1003-1100`

```
buildAgentArgs(provider) → string[]
```

| Provider | Command | Key Args |
|----------|---------|----------|
| `claude` | `claude` | `--dangerously-skip-permissions --print --verbose --output-format=stream-json --include-partial-messages --max-turns 200` |
| `codex` | `codex` | `--enable multi_agent -m <model> --yolo exec --json` |
| `gemini` | `gemini` | `-m <model> --yolo --output-format=stream-json` |
| `opencode` | `opencode` | `run -m <model> --format json` |

**Spawn pattern** (`spawnCliAgent`, agents.ts:1003):
```
1. Save prompt to <logsDir>/<taskId>.prompt.txt
2. Spawn child_process with detached:true, env: { NO_COLOR=1, FORCE_COLOR=0, CI=1 }
   - Deletes CLAUDECODE / CLAUDE_CODE env vars (prevents nested detection)
3. Write prompt to child.stdin → end()
4. Stream stdout → broadcast("cli_output") + parseAndCreateSubtasks()
5. Stream stderr → broadcast("cli_output")
6. Register in activeProcesses Map
7. On close → remove from Map, delete prompt file
```

**Process management**:
- `activeProcesses: Map<string, ChildProcess>` — live process registry
- `stopRequestedTasks: Set<string>` — tasks flagged for stop
- `stopRequestModeByTask: Map<string, "pause" | "cancel">` — stop mode
- Idle timeout: `TASK_RUN_IDLE_TIMEOUT_MS` (default 15 min)
- Hard timeout: `TASK_RUN_HARD_TIMEOUT_MS` (default 0, disabled)
- `killPidTree(pid)` — full tree kill on timeout

### 3.3 In-Stream Subtask Detection

Source: `agents.ts:861-1000` — `parseAndCreateSubtasks()`

Parses stream-json lines during agent execution to dynamically create/complete subtasks:

| Provider | Spawn Signal | Complete Signal |
|----------|-------------|-----------------|
| Claude Code | `type=tool_use, tool=Task` | `type=tool_result, tool=Task` |
| Codex | `type=item.started, item.type=collab_tool_call, tool=spawn_agent` | `type=item.completed, tool=close_agent` (via `codexThreadToSubtask` map) |
| Gemini | `type=message` with `{"subtasks": [...]}` JSON pattern | `{"subtask_done": "..."}` JSON pattern |

### 3.4 OAuth System

Source: `providers.ts:175-460`

**Token type**:
```typescript
interface DecryptedOAuthToken {
  id: string | null;
  provider: string;        // "github" | "google_antigravity"
  source: string | null;
  label: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  email: string | null;
  status?: string;          // "active" | "disabled"
  priority?: number;
  modelOverride?: string | null;
  failureCount?: number;
  lastError?: string | null;
  lastErrorAt?: number | null;
  lastSuccessAt?: number | null;
}
```

**Key functions**:

| Function | Line | Purpose |
|----------|------|---------|
| `getOAuthAccounts(provider, includeDisabled?)` | 279 | Query all accounts for provider |
| `getPreferredOAuthAccounts(provider, opts?)` | 337 | Get accounts sorted by priority |
| `getDecryptedOAuthToken(provider)` | 356 | Get single best token |
| `rotateOAuthAccounts(provider, accounts)` | 236 | Rotate to next account on failure |
| `prioritizeOAuthAccount(accounts, preferredId?)` | 245 | Sort by preferred > priority > success |
| `markOAuthAccountFailure(accountId, message)` | 256 | Increment failure_count, set last_error |
| `markOAuthAccountSuccess(accountId)` | 267 | Reset failure_count, update last_success_at |
| `getOAuthAutoSwapEnabled()` | 227 | Check if auto-swap is enabled in settings |
| `refreshGoogleToken(credential)` | 382 | Refresh expired Google OAuth token |
| `exchangeCopilotToken(githubToken)` | 426 | GitHub → Copilot API token exchange |
| `loadCodeAssistProject(accessToken)` | 458 | Load Google Code Assist project ID |

### 3.5 HTTP Agent Execution

**Copilot** (`executeCopilotAgent`, line 671):
```
1. Get preferred GitHub OAuth account
2. exchangeCopilotToken(githubToken) → { token, baseUrl, expiresAt }
3. POST ${baseUrl}/chat/completions (OpenAI-compatible)
   - model: "gpt-4o" (or agent's model override)
   - stream: true
4. parseSSEStream() → safeWrite chunks to log
5. On success: markOAuthAccountSuccess()
6. On failure: markOAuthAccountFailure() → retry with rotated account
```

**Antigravity** (`executeAntigravityAgent`, line 768):
```
1. Get preferred google_antigravity OAuth account
2. refreshGoogleToken() if expired
3. loadCodeAssistProject() → project ID (cached 300s)
4. POST ${ANTIGRAVITY_ENDPOINT}/v1/chat (Google Cloud Code API)
   - Headers: x-goog-user-project, Authorization: Bearer
5. parseGeminiSSEStream() → safeWrite chunks
6. Auto-swap on failure
```

**API Provider** (`executeApiProviderAgent`, line 1111):
```
1. Lookup api_providers DB row by ID
2. Decrypt api_key_enc
3. Build request per provider type:
   - OpenAI/OpenRouter/Together/Groq/Cerebras/Custom: OpenAI-compatible format
   - Anthropic: Anthropic messages format
   - Google: Gemini GenerateContent format
4. Use matching SSE parser (parseSSEStream / parseAnthropicSSEStream / parseGeminiSSEStream)
```

### 3.6 SSE Parsers

| Parser | Line | Format | Used For |
|--------|------|--------|----------|
| `parseSSEStream` | 570 | OpenAI `data: {"choices":[{"delta":{"content":"..."}}]}` | Copilot, OpenAI, OpenRouter, Together, Groq, Cerebras, Custom |
| `parseGeminiSSEStream` | 610 | Google `data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}` | Antigravity, Google API |
| `parseAnthropicSSEStream` | 946 | Anthropic `event: content_block_delta\ndata: {"delta":{"text":"..."}}` | Anthropic API |

### 3.7 CLI Detection & Usage

```typescript
// Line 1304-1340
interface CliToolStatus {
  installed: boolean;
  version: string | null;
  authenticated: boolean;
  authHint: string;
}

type CliStatusResult = Record<string, CliToolStatus>;

detectAllCli(): CliStatusResult
// Detects: claude, codex, gemini, opencode
// Checks: which/where → version → auth status
// Cached: CLI_STATUS_TTL = 30_000ms
```

**Usage fetchers** (cached in `cli_usage_cache` table):

| Function | Provider | Data |
|----------|----------|------|
| `fetchClaudeUsage()` | Claude | Token windows, utilization |
| `fetchCodexUsage()` | Codex/OpenAI | API usage, rate limits |
| `fetchGeminiUsage()` | Gemini | API quota, model limits |

### 3.8 Model Configuration

```typescript
// Line 377
getProviderModelConfig(): Record<string, {
  model: string;
  subModel?: string;
  reasoningLevel?: string;
  subModelReasoningLevel?: string;
}>
```

Cached with `MODELS_CACHE_TTL = 60_000ms`. Returns per-provider model settings from DB.

### 3.9 Constants

```typescript
ANTIGRAVITY_ENDPOINTS = ["https://cloudcode-pa.googleapis.com", ...]; // 3 endpoints
ANTIGRAVITY_DEFAULT_PROJECT = "rising-fact-p41fc";
MODELS_CACHE_TTL = 60_000;
CLI_STATUS_TTL = 30_000;
GEMINI_PROJECT_TTL = 300_000;
```

---

## 4. Agent System & Department Hierarchy

### 4.1 Department Structure

Source: `server/modules/routes/collab.ts:156-163`

```typescript
const DEPT_KEYWORDS: Record<string, string[]> = {
  dev:        ["개발", "코딩", "프론트", "백엔드", "API", "서버", "코드", "버그", "프로그램", "앱", "웹"],
  design:     ["디자인", "UI", "UX", "목업", "피그마", "아이콘", "로고", "배너", "레이아웃", "시안"],
  planning:   ["기획", "전략", "분석", "리서치", "보고서", "PPT", "발표", "시장", "조사", "제안"],
  operations: ["운영", "배포", "인프라", "모니터링", "서버관리", "CI", "CD", "DevOps", "장애"],
  qa:         ["QA", "QC", "품질", "테스트", "검수", "버그리포트", "회귀", "자동화테스트", "성능테스트", "리뷰"],
  devsecops:  ["보안", "취약점", "인증", "SSL", "방화벽", "해킹", "침투", "파이프라인", "컨테이너", "도커", "쿠버네티스", "암호화"],
};
```

### 4.2 Agent Properties

| Field | Type | Values |
|-------|------|--------|
| `role` | TEXT | `team_leader`, `senior`, `junior`, `intern` |
| `cli_provider` | TEXT | `claude`, `codex`, `gemini`, `opencode`, `copilot`, `antigravity`, `api` |
| `status` | TEXT | `idle`, `working`, `break`, `offline` |
| `avatar_emoji` | TEXT | Emoji identifier |
| `personality` | TEXT | Agent persona description |
| `stats_tasks_done` | INT | Completed task counter |
| `stats_xp` | INT | Experience points |

### 4.3 Agent Status Flow

```
idle ←→ working
idle ←→ meeting
idle ←→ break
any → offline
```

### 4.4 Department Routing Algorithm

Source: `agents.ts:164-200` — `analyzeSubtaskDepartment(subtaskTitle, parentDeptId)`

```
1. Strip [tags] from title
2. Check prefix (text before ":") for explicit department name/alias match
3. Check whole title for department name/alias match
4. Run detectTargetDepartments() — keyword match against DEPT_KEYWORDS
5. Disambiguate multiple matches:
   - Count keyword hits per department
   - Earliest position wins ties
6. If foreign department detected → subtask status = 'blocked', blocked_reason = '<dept> 협업 대기'
```

### 4.5 Cross-Department Cooperation

Source: `orchestration.ts:198-206`

```typescript
// Sequential queue for cross-dept task completion
const crossDeptNextCallbacks = new Map<string, () => void>();

// Subtask delegation queue
const subtaskDelegationCallbacks = new Map<string, () => void>();
const subtaskDelegationDispatchInFlight = new Set<string>();

// Tracking: delegated task → original subtask
const delegatedTaskToSubtask = new Map<string, string>();
const subtaskDelegationCompletionNoticeSent = new Set<string>();
```

---

## 5. Task & Subtask State Machines

### 5.1 Task Lifecycle

```
inbox → planned → collaborating → in_progress → review → done
                                       ↓            ↓
                                   cancelled    → done (after approval)

+ pending (delegation waiting)
```

**Status values**: `inbox`, `planned`, `collaborating`, `in_progress`, `review`, `done`, `cancelled`, `pending`

### 5.2 Subtask Lifecycle

```
pending → in_progress → done
    ↓
  blocked (cross-dept cooperation waiting)
```

**Status values**: `pending`, `in_progress`, `done`, `blocked`

**Subtask creation from CLI** (`agents.ts:494-541`):
```typescript
createSubtaskFromCli(taskId, toolUseId, title)
  → INSERT subtask (status='in_progress', cli_tool_use_id=toolUseId)
  → analyzeSubtaskDepartment(title, parentDeptId)
  → if foreign dept: UPDATE status='blocked'
  → broadcast("subtask_update", subtask)

completeSubtaskFromCli(toolUseId)
  → SELECT by cli_tool_use_id
  → UPDATE status='done', completed_at=now
  → broadcast("subtask_update", subtask)
```

### 5.3 Task Execution Sessions

Source: `orchestration.ts:218-295`

```typescript
interface TaskExecutionSessionState {
  sessionId: string;
  taskId: string;
  agentId: string;
  provider: string;
  openedAt: number;
  lastTouchedAt: number;
}

const taskExecutionSessions = new Map<string, TaskExecutionSessionState>();

ensureTaskExecutionSession(taskId, agentId, provider)  // create or rotate session
endTaskExecutionSession(taskId, reason)                 // delete + log duration
isTaskWorkflowInterrupted(taskId)                       // check DB status + stop set
clearTaskWorkflowState(taskId)                          // clear all 6 maps/sets
```

### 5.4 Orphan Watchdog

Source: `server/db/runtime.ts`

```typescript
IN_PROGRESS_ORPHAN_GRACE_MS = 600_000;   // 10 min grace period
IN_PROGRESS_ORPHAN_SWEEP_MS = 30_000;    // sweep every 30s
SUBTASK_DELEGATION_SWEEP_MS = 15_000;    // delegation check every 15s
```

---

## 6. Meeting Consensus Protocol

Source: `server/modules/workflow/orchestration/meetings.ts`

### 6.1 Meeting Types

| Type | Purpose | Trigger |
|------|---------|---------|
| `planned` | Kickoff approval | Task enters `planned` state |
| `review` | Quality review | Task enters `review` state |

### 6.2 Review Round Modes

Source: `orchestration.ts:297`

```typescript
type ReviewRoundMode = "parallel_remediation" | "merge_synthesis" | "final_decision";

// Round 1 → parallel_remediation: seeds revision subtasks, spawns parallel execution
// Round 2 → merge_synthesis: no new remediation, converts holds to residual-risk docs
// Round 3 → final_decision: calls onApproved() regardless of residual risks
```

### 6.3 Meeting Flow

```
1. getTaskReviewLeaders(taskId) → select relevant dept leaders
2. startPlannedApprovalMeeting() → agents called to CEO office
3. For each round (max 3):
   a. Each leader provides feedback based on dept stance
   b. emitMeetingSpeech() → generates speech, classifies decision
   c. classifyMeetingReviewDecision(text) → "approved" | "hold" | "reviewing"
   d. meetingReviewDecisionByAgent.set(agentId, decision)
4. After round:
   - All "approved" → finishMeetingMinutes("completed"), proceed
   - Any "hold" (round 1) → spawn revision subtasks, schedule round 2
   - Any "hold" (round 2) → convert to residual-risk, schedule round 3
   - Round 3 → force approve regardless
```

### 6.4 Hold Caps (guardrails)

Source: `server/db/runtime.ts`

```typescript
REVIEW_FINAL_DECISION_ROUND = 3;
REVIEW_MAX_ROUNDS = 3;                              // max 6 via env
REVIEW_MAX_REVISION_SIGNALS_PER_DEPT_PER_ROUND = 2; // per-dept cap
REVIEW_MAX_REVISION_SIGNALS_PER_ROUND = 6;          // round-level cap
REVIEW_MAX_MEMO_ITEMS_PER_DEPT = 2;                 // per-dept memo cap
REVIEW_MAX_MEMO_ITEMS_PER_ROUND = 8;                // round memo cap
REVIEW_MAX_REMEDIATION_REQUESTS = 1;                // if exceeded, skip to final
```

### 6.5 Meeting Minutes Management

```typescript
beginMeetingMinutes(taskId, meetingType, round, title) → meetingId: UUID
appendMeetingMinuteEntry(meetingId, seq, agent, lang, messageType, content)
finishMeetingMinutes(meetingId, status: "completed" | "revision_requested" | "failed")
```

### 6.6 Revision Memo System

```typescript
// Dedup via normalized_note UNIQUE constraint
reserveReviewRevisionMemoItems(taskId, round, memoItems[])
  → { freshItems: string[], duplicateCount: number }

loadRecentReviewRevisionMemoItems(taskId, maxItems=4) → string[]

// Keyword-filtered extraction from meeting transcript
collectRevisionMemoItems(transcript, maxItems, maxPerDept) → string[]
collectPlannedActionItems(transcript, maxItems=10) → string[]

// Normalization: strip markers, punctuation, lowercase
normalizeRevisionMemoNote(note) → string
```

### 6.7 Deferrable Holds

`isDeferrableReviewHold()` (line 994) — detects when a hold is minor enough to convert to SLA monitoring note instead of blocking the entire revision cycle.

### 6.8 Meeting State Maps

Source: `orchestration.ts:209-216`

```typescript
const reviewRoundState = new Map<string, number>();                        // taskId → current round
const reviewInFlight = new Set<string>();                                  // taskId set
const meetingPresenceUntil = new Map<string, number>();                    // agentId → expiry timestamp
const meetingSeatIndexByAgent = new Map<string, number>();                 // agentId → seat 0-8
const meetingPhaseByAgent = new Map<string, "kickoff" | "review">();       // agentId → phase
const meetingTaskIdByAgent = new Map<string, string>();                    // agentId → taskId
const meetingReviewDecisionByAgent = new Map<string, MeetingReviewDecision>(); // agentId → decision
```

---

## 7. WebSocket Event System

Source: `server/ws/hub.ts` (19 lines)

### 7.1 Hub Implementation

```typescript
export function createWsHub(nowMs: () => number) {
  const wsClients = new Set<WebSocket>();

  function broadcast(type: string, payload: unknown): void {
    const message = JSON.stringify({ type, payload, ts: nowMs() });
    for (const ws of wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  return { wsClients, broadcast };
}
```

**Wire format**: `{ type: string, payload: unknown, ts: number }`

### 7.2 Event Catalog

| Event | Payload | Trigger |
|-------|---------|---------|
| `task_update` | task state change | Any task status transition |
| `agent_status` | agent state + subAgents list | Agent status change |
| `new_message` | message object with sender info | New chat message |
| `announcement` | broadcast message | System-wide announcement |
| `task_report` | completion report | Task completed |
| `cross_dept_delivery` | `{ from_agent, to_agent }` | Cross-dept subtask delegation |
| `ceo_office_call` | meeting attendance (arrive/speak/dismiss) | Meeting event |
| `subtask_update` | subtask state | Subtask created/completed/blocked |
| `cli_output` | `{ task_id, stream: "stdout"|"stderr", data }` | CLI agent output |
| `chat_stream` | `start` / `delta` / `end` SSE | Streaming chat response |

### 7.3 Client Hook

Source: `src/hooks/useWebSocket.ts`

- Manages WebSocket connection lifecycle
- Auto-reconnect: 2-second delay
- API: `on(eventType, callback)` — subscribe to specific events
- Components use this hook to react to real-time changes

### 7.4 Client-Side Event Handlers

Source: `src/App.tsx:402-596`

| Event | Handler |
|-------|---------|
| `task_update` | `scheduleLiveSync(80)` — debounced re-fetch |
| `agent_status` | Merge agent fields in-place; update subAgents |
| `new_message` | Append to messages (cap: 600); mark unread |
| `announcement` | Same as new_message |
| `task_report` | Fetch full report → setTaskReport |
| `cross_dept_delivery` | Append (cap: 240) |
| `ceo_office_call` | Update meetingPresence; append (cap: 480) |
| `subtask_update` | Upsert in subtasks array; scheduleLiveSync(160) |
| `cli_output` | Parse stream-json for Task tool events → update subAgents |

**Caps**:
```typescript
MAX_LIVE_MESSAGES = 600;
MAX_LIVE_SUBTASKS = 2000;
MAX_LIVE_SUBAGENTS = 600;
MAX_CROSS_DEPT_DELIVERIES = 240;
MAX_CEO_OFFICE_CALLS = 480;
```

---

## 8. Git Worktree Management

Source: `server/modules/workflow/core.ts:186-396`

### 8.1 Data Structure

```typescript
const taskWorktrees = new Map<string, {
  worktreePath: string;   // .climpire-worktrees/{shortId}
  branchName: string;     // climpire/{shortId}
  projectPath: string;    // original project path
}>();
```

### 8.2 Operations

**Create** (`createWorktree`, line 202):
```
1. git rev-parse HEAD → get base commit
2. git worktree add <.climpire-worktrees/{shortId}> -b climpire/{shortId} <base>
3. Register in taskWorktrees Map
→ Returns worktree path or null on failure
```

**Merge** (`mergeWorktree`, line 240):
```
1. Check diff exists (getWorktreeDiffSummary)
2. git merge --no-ff climpire/{shortId}
3. On conflict: git diff --diff-filter=U → git merge --abort
→ Returns multilingual success/failure message
```

**Cleanup** (`cleanupWorktree`, line 329):
```
1. git worktree remove --force <path>
2. git branch -D climpire/{shortId}
3. Fallback: fs.rmSync() + git worktree prune
```

**Rollback** (`rollbackTaskWorktree`, line 364):
```
1. Log diff summary to task_logs
2. Call cleanupWorktree()
3. Append "worktree_rollback" event to task log
```

**Diff Summary** (`getWorktreeDiffSummary`, line 378):
```
git diff <main>...<worktree-branch> --stat
```

---

## 9. i18n System

Source: `src/i18n.ts`

### 9.1 Types

```typescript
type UiLanguage = "ko" | "en" | "ja" | "zh";
type LangText = { ko: string; en: string; ja?: string; zh?: string; };
```

### 9.2 Client-Side Functions

| Function | Purpose |
|----------|---------|
| `normalizeLanguage(value?)` | Normalize locale string → UiLanguage |
| `detectBrowserLanguage()` | Read `navigator.languages[]` → UiLanguage |
| `localeFromLanguage(lang)` | ko→ko-KR, en→en-US, ja→ja-JP, zh→zh-CN |
| `pickLang(lang, text)` | Select text for language (fallback: ja/zh → en) |

### 9.3 React Integration

```typescript
interface I18nContextValue {
  language: UiLanguage;
  locale: string;
  t: (text: LangText | string) => string;
}

// Provider component
function I18nProvider({ language, children }) → JSX.Element
// Hook
function useI18n() → I18nContextValue
```

### 9.4 Server-Side Functions

Source: `server/modules/routes/collab.ts:199-259`

```typescript
type Lang = "ko" | "en" | "ja" | "zh";

detectLang(text: string): Lang
  // Unicode range ratio: ko >15%, ja >15%, zh >30%, else en

resolveLang(text?, fallback?): Lang
  // Settings DB → detectLang fallback

getPreferredLanguage(): Lang
  // Read settings.language from DB

l(ko, en, ja?, zh?): L10n
  // Create multilingual template object

pickL(pool: L10n, lang: Lang): string
  // Random pick from language array

getRoleLabel(role, lang): string
  // ROLE_LABEL_L10N lookup
```

### 9.5 Storage Keys

```typescript
LANGUAGE_STORAGE_KEY = "climpire.language";
LANGUAGE_USER_SET_STORAGE_KEY = "climpire.language.user_set";
```

---

## 10. Security & Idempotency

Source: `server/server-main.ts:86-561`

### 10.1 Security Audit Chain (NDJSON)

```typescript
const SECURITY_AUDIT_CHAIN_SEED = process.env.SECURITY_AUDIT_CHAIN_SEED || "claw-empire-security-audit-v1";
const SECURITY_AUDIT_CHAIN_KEY = process.env.SECURITY_AUDIT_CHAIN_KEY ?? "";

// Hash: SHA256(seed | prevHash | [key |] stableJson(entry))
computeAuditChainHash(prevHash, entry) → string

// Bootstrap from last line of log file, fallback "GENESIS"
loadSecurityAuditPrevHash() → string

// Append NDJSON, update in-memory prevHash
appendSecurityAuditLog(entry) → void

// Fallback log file for audit failures
appendSecurityAuditFallbackLog(payload) → boolean
```

**Audit entry type**:
```typescript
type MessageIngressAuditOutcome =
  | "accepted" | "duplicate" | "idempotency_conflict" | "storage_busy" | "validation_error";

type MessageIngressAuditInput = {
  endpoint: "/api/messages" | "/api/announcements" | "/api/directives" | "/api/inbox";
  req: { get(name: string): string | undefined; ip?: string; ... };
  body: Record<string, unknown>;
  idempotencyKey: string | null;
  outcome: MessageIngressAuditOutcome;
  statusCode: number;
  messageId?: string | null;
  detail?: string | null;
};
```

### 10.2 Message Idempotency

```typescript
IDEMPOTENCY_KEY_MAX_LENGTH = 200;

// Trims, hashes if >200 chars ("sha256:{hex}")
normalizeIdempotencyKey(value) → string | null

// Checks body.idempotency_key, body.request_id, headers x-idempotency-key
// Scopes key as "scope:sha256(scope:raw_key)"
resolveMessageIdempotencyKey(req, body, scope) → string | null

// Pre-check → INSERT → catch UNIQUE → re-check
insertMessageWithIdempotencyOnce(input) → { message, created: boolean }

// Wraps above with withSqliteBusyRetry
insertMessageWithIdempotency(input) → Promise<{ message, created: boolean }>
```

**Flow**:
```
1. resolveMessageIdempotencyKey() → normalize + scope
2. insertMessageWithIdempotencyOnce():
   a. SELECT existing by idempotency_key
   b. If found → return { message: existing, created: false }
   c. INSERT new message
   d. Catch UNIQUE violation → re-SELECT → return { created: false }
3. recordAcceptedIngressAuditOrRollback():
   a. Append audit log
   b. If audit fails → DELETE inserted message → return 503
```

### 10.3 SQLite Busy Retry

Source: `server/server-main.ts:464-490`

```typescript
// Exponential backoff: base * 2^attempt, capped at max, + random jitter
sqliteBusyBackoffDelayMs(attempt) → number

// Loops attempt 0..MAX_ATTEMPTS, throws StorageBusyError on exhaustion
async function withSqliteBusyRetry<T>(operation: string, fn: () => T): Promise<T>
```

Parameters:
| Param | Default | Cap |
|-------|---------|-----|
| `SQLITE_BUSY_TIMEOUT_MS` | 5000 ms | env |
| `SQLITE_BUSY_RETRY_MAX_ATTEMPTS` | 4 | max 20 |
| `SQLITE_BUSY_RETRY_BASE_DELAY_MS` | 40 ms | env |
| `SQLITE_BUSY_RETRY_MAX_DELAY_MS` | 400 ms | env |
| `SQLITE_BUSY_RETRY_JITTER_MS` | 20 ms | env |

### 10.4 Error Classes

```typescript
class IdempotencyConflictError extends Error  // duplicate key detected
class StorageBusyError extends Error          // SQLite busy after all retries
```

### 10.5 Transaction Support

```typescript
runInTransaction(fn: () => T) → T
// BEGIN → fn() → COMMIT
// On error → ROLLBACK → rethrow
```

---

## 11. Deferred Runtime Proxy Pattern

Source: `server/modules/deferred-runtime.ts`

### 11.1 Problem

Circular module dependencies: workflow/core exports functions used by workflow/agents, which exports functions used by workflow/orchestration, which needs functions from workflow/core.

### 11.2 Solution

```typescript
// Unique Symbol tag
const DEFERRED_RUNTIME_FN_TAG = Symbol.for("climpire.deferredRuntimeFnName");

// Proxy trap: on GET of unknown key → create deferred stub
createDeferredRuntimeProxy<T>(runtime: T): T
  → Proxy handler.get: if key not in target → createDeferredRuntimeFunction(target, key)

// Stub: stores name in Symbol tag, throws if called before resolution
createDeferredRuntimeFunction(runtime, name): (...args) => any
  → At call time: checks if runtime[name] is still deferred → throw
  → Otherwise: calls runtime[name](...args)

// Validation
isDeferredRuntimeFunction(value) → boolean
getDeferredRuntimeFunctionName(value) → string | null
collectUnresolvedDeferredRuntimeFunctions(runtime) → string[]
assertNoUnresolvedDeferredRuntimeFunctions(runtime, label?, options?)
assertRuntimeFunctionsPresent(runtime, names, label?)
assertRuntimeFunctionsResolved(runtime, names, label?)  // combined check
```

### 11.3 Usage in Startup

Source: `server/server-main.ts:1589-1594`

```typescript
const runtimeProxy = createDeferredRuntimeProxy(runtimeContext);
Object.assign(runtimeContext, initializeWorkflow(runtimeProxy));
Object.assign(runtimeContext, registerApiRoutes(runtimeContext));
assertRuntimeFunctionsResolved(runtimeContext, ROUTE_RUNTIME_HELPER_KEYS, ...);
startLifecycle(runtimeContext);
```

### 11.4 Three-Part Initialization

Source: `server/modules/workflow.ts`

```
initializeWorkflow(runtimeProxy):
  1. initializeWorkflowPartA(runtimeProxy) → core exports (CLI spawn, worktree, prompts)
  2. initializeWorkflowPartB(runtimeProxy) → agent exports (providers, OAuth, execution)
  3. initializeWorkflowPartC(runtimeProxy) → orchestration exports (meetings, sessions)
  → Returns ~98 functions merged into unified object
```

---

## 12. CLI Output Streaming

Source: `agents.ts:861-1000`

### 12.1 Stream Normalization

```typescript
// Dedup window for repeated CLI output
CLI_OUTPUT_DEDUP_WINDOW_MS = 1500;

normalizeStreamChunk(data: string) → string
  // Strip ANSI escapes, normalize whitespace

shouldSkipDuplicateCliOutput(chunk, lastChunk, lastTimestamp) → boolean
  // Skip if identical within dedup window
```

### 12.2 Safe Write Pattern

All streaming paths use a `safeWrite(text: string): boolean` callback:
- Returns `false` if the write failed (stream closed)
- Used to detect when agent output should stop being processed
- Prevents writes to closed/destroyed streams

### 12.3 JSON Line Parsing

CLI agents output stream-json format. The parser handles:
- Partial JSON lines (buffered across chunks)
- Multiple JSON objects per chunk
- Non-JSON output (treated as plain text)
- Provider-specific event types (Claude `tool_use`, Codex `item.started`, Gemini patterns)

---

## 13. OpenClaw Gateway Protocol

Source: `server/gateway/client.ts`

### 13.1 Configuration

```typescript
GATEWAY_PROTOCOL_VERSION = 3;
GATEWAY_WS_PATH = "/ws";
WAKE_DEBOUNCE_DEFAULT_MS = 12_000;
```

Config loaded from `OPENCLAW_CONFIG_PATH` JSON file:
- `gateway.port` — WebSocket server port
- `gateway.auth.token` — authentication token

### 13.2 WebSocket Protocol

**Connection sequence**:
```
Client → Server: { type: "req", id: connectId, method: "connect", params: {
  minProtocol: 3, maxProtocol: 3,
  client: { name, version },
  auth: { token },
  role: "operator",
  scopes: ["operator.admin"]
}}

Server → Client: { type: "res", id: connectId, ... }

Client → Server: { type: "req", id: wakeId, method: "wake", params: {
  mode: "now",
  text: "notification text"
}}

Server → Client: { type: "res", id: wakeId, ... }
```

Timeout: 8000ms per request.

### 13.3 Task Notifications

```typescript
notifyTaskStatus(taskId, title, status, lang?) → void
  // Debounce: key="task:{taskId}:{status}", 5s window
  // Formats: "{emoji} [{label}] {title}"
  // Labels: multilingual (ko/en/ja/zh)
```

Status → emoji mapping:
| Status | Emoji | EN Label | KO Label |
|--------|-------|----------|----------|
| inbox | 📥 | New | 새 작업 |
| planned | 📋 | Planned | 계획됨 |
| in_progress | ⚙️ | Working | 작업 중 |
| review | 🔍 | Review | 검토 중 |
| done | ✅ | Done | 완료 |
| cancelled | ❌ | Cancelled | 취소됨 |

### 13.4 HTTP Tool Invoke

```typescript
gatewayHttpInvoke(req: { tool, action?, args? }) → Promise<any>
  // POST http://127.0.0.1:<port>/tools/invoke
  // Headers: content-type + Bearer token
  // Returns data.result
```

### 13.5 Language Detection

```typescript
detectGatewayLang(text) → "ko" | "en" | "ja" | "zh"
  // Same Unicode-range heuristic as collab.ts
  // CJK character ratio → language classification
```

---

## 14. Project Context Generation

Source: `server/modules/workflow/core.ts:697-850`

### 14.1 Context Builder

```typescript
generateProjectContext(projectPath) → string
  // Builds/caches project context in .climpire/project-context.md
  // Cache key: git HEAD hash
  // Contents: file tree + tech stack + recent changes + README excerpt
```

### 14.2 Supporting Functions

```typescript
buildFileTree(projectPath) → string
  // Traverses directory, respects .gitignore
  // Returns tree-formatted string

detectTechStack(projectPath) → TechStack
  // Scans package.json, requirements.txt, Cargo.toml, etc.
  // Returns { languages, frameworks, buildTools, ... }

getRecentChanges(projectPath) → string
  // Combines:
  //   - Recent git log (last 20 commits)
  //   - Active worktree diffs
  //   - Recently completed tasks from DB
```

### 14.3 Agent Prompt Building

```typescript
buildTaskExecutionPrompt(task, agent, projectPath) → string
  // Joins: project context + task description + continuity policy + MVP code review policy

buildMeetingPrompt(agent, task, transcript) → string
  // CEO-office meeting prompt with dept stance

buildDirectReplyPrompt(agent, message) → string
  // 1:1 chat prompt for agent → CEO reply

buildAvailableSkillsPromptBlock(provider, repo) → string
  // Queries skill_learning_history DB
  // Formats [Available Skills][provider=...] block
```

### 14.4 Output Normalization

```typescript
chooseSafeReply(output) → string
  // Cleans/validates one-shot output
  // Falls back to fallbackTurnReply on empty/invalid

normalizeConversationReply(output) → string
  // Strips: tool-call noise, markdown artifacts, ANSI escapes
  // Collapses repeated sentences
  // Trims excess length
```

---

## 15. TypeScript Architecture

Source: `server/types/runtime-context.ts` (481 lines)

### 15.1 Module Export Interfaces

| Interface | Line | Source Module |
|-----------|------|--------------|
| `BaseRuntimeContext` | 72 | server-main.ts (app, db, security, idempotency) |
| `WorkflowCoreExports` | 146 | workflow/core.ts (CLI spawn, worktree, prompts) |
| `WorkflowAgentExports` | 196 | workflow/agents.ts (providers, OAuth, execution) |
| `WorkflowOrchestrationExports` | 237 | workflow/orchestration.ts (meetings, sessions) |
| `RouteCollabExports` | 271 | routes/collab.ts (dept keywords, messaging, i18n) |
| `RouteOpsExports` | 305 | routes/ops.ts (operational utilities) |
| `RuntimeContextAutoAugmented` | 315 | ~110 auto-generated `any`-typed fields |

### 15.2 Composite Type

```typescript
type RuntimeContext = BaseRuntimeContext
  & WorkflowCoreExports
  & WorkflowAgentExports
  & WorkflowOrchestrationExports
  & RouteCollabExports
  & RouteOpsExports
  & RuntimeContextAutoAugmented;
```

### 15.3 Key Helper Types

```typescript
type MessageInsertInput = {
  senderType: string; senderId: string | null;
  receiverType: string; receiverId: string | null;
  content: string; messageType: string;
  taskId?: string | null; idempotencyKey?: string | null;
};

type StoredMessage = {
  id: string; sender_type: string; sender_id: string | null;
  receiver_type: string; receiver_id: string | null;
  content: string; message_type: string;
  task_id: string | null; idempotency_key: string | null; created_at: number;
};
```

---

## 16. PixiJS Office UI (DO NOT ABSORB — reference only)

Source: `src/components/OfficeView.tsx`

- Isometric pixel-art office rendering via PixiJS Application
- Agent sprites: 3 directions (Down/Left/Right), multiple animation frames
- Department rooms with customizable themes (floor, wall, accent colors)
- CEO office: 9 meeting seats (0-8) with speech bubbles
- Cross-dept delivery animations (throw/walk between departments)
- Break room for idle agents
- Procedural theming: single accent color + tone → full palette via `blendColor()`

### React Frontend Component Tree

```
App
├── Sidebar
├── OfficeView (PixiJS)
├── ChatPanel
├── Dashboard
├── TaskBoard
├── AgentDetail
├── SettingsPanel
├── TerminalPanel
├── SkillsLibrary
├── TaskReportPopup
├── ReportHistory
├── AgentStatusPanel
└── OfficeRoomManager
```

---

## 17. Reusable Patterns Summary

### 17.1 Deferred Runtime Proxy
**What**: Lazy initialization via ES Proxy for circular module dependencies.
**Where**: `server/modules/deferred-runtime.ts`
**Reuse**: Any multi-module system with initialization order constraints.

### 17.2 OAuth Account Rotation
**What**: Multi-account failover with priority, failure tracking, auto-swap.
**Where**: `providers.ts:236-280`
**Reuse**: Any system using multiple API keys or OAuth accounts.

### 17.3 Security Audit Chain
**What**: NDJSON hash chain (SHA256) for immutable message ingress audit.
**Where**: `server-main.ts:86-330`
**Reuse**: Any system requiring tamper-evident audit logs.

### 17.4 Message Idempotency
**What**: Scoped idempotency keys with pre-check → INSERT → catch UNIQUE pattern.
**Where**: `server-main.ts:346-561`
**Reuse**: Any API accepting POST/PUT that must be retry-safe.

### 17.5 SQLite Busy Retry
**What**: Exponential backoff with jitter for WAL-mode concurrent access.
**Where**: `server/db/runtime.ts:464-490`
**Reuse**: Any SQLite application with concurrent writers.

### 17.6 In-Stream Subtask Detection
**What**: Parse streaming CLI output for JSON task creation patterns.
**Where**: `agents.ts:861-1000`
**Reuse**: Any system orchestrating multiple AI agents that spawn sub-tasks.

### 17.7 CLI Output Dedup
**What**: Time-window deduplication of repeated CLI output lines.
**Where**: `agents.ts` + `runtime.ts:CLI_OUTPUT_DEDUP_WINDOW_MS`
**Reuse**: Any system streaming output from external processes.

### 17.8 Three-Part Module Initialization
**What**: Split initialization into independent phases (A→B→C) with deferred proxy.
**Where**: `server/modules/workflow.ts`
**Reuse**: Large server modules with cross-dependencies.

### 17.9 Lightweight WebSocket Pub-Sub
**What**: Type-agnostic broadcast hub with timestamp.
**Where**: `server/ws/hub.ts` (19 lines)
**Reuse**: Any real-time dashboard or event notification system.

### 17.10 Meeting Consensus Protocol
**What**: Multi-round review with progressive escalation (remediation → synthesis → forced decision).
**Where**: `orchestration/meetings.ts`
**Reuse**: Any multi-agent quality gate or approval workflow.

### 17.11 Department Keyword Routing
**What**: NLP-based task routing using keyword match + position heuristic.
**Where**: `collab.ts:156-163`, `agents.ts:164-200`
**Reuse**: Any system routing tasks to specialized agent groups.

### 17.12 Project Context Caching
**What**: Git HEAD-keyed cache for expensive project analysis.
**Where**: `core.ts:697-850`
**Reuse**: Any system that repeatedly needs project context across agent calls.

---

## 18. Additional Systems (from Codex gpt-5.3-codex analysis)

### 18.1 Lifecycle Module (`server/modules/lifecycle.ts`)

Handles startup and runtime maintenance:
- **Startup reconciliation** (line 154): Recovers tasks stuck in `in_progress` after server restart
- **Orphan recovery** (line 277): Sweeps tasks with no active process, resets to previous state
- **WebSocket server attach** (line 406): Binds WS upgrade handler to Express server
- **Connected event** (line 425): Registers new WS clients into `wsClients` Set

### 18.2 Skill Learn/Unlearn System (`server/modules/routes/ops.ts:2168-2704`)

Background job system for installing/removing agent skills:

```typescript
type SkillLearnProvider = "claude" | "codex" | "gemini" | "opencode";
type SkillHistoryProvider = SkillLearnProvider | "copilot" | "antigravity" | "api";
type SkillLearnStatus = "queued" | "running" | "succeeded" | "failed";

interface SkillLearnJob {
  id: string; repo: string; skillId: string;
  providers: SkillLearnProvider[]; agents: string[];
  status: SkillLearnStatus; command: string;
  createdAt: number; startedAt: number | null;
  completedAt: number | null; updatedAt: number;
}
```

- Maps providers to agent CLI commands (`SKILL_LEARN_PROVIDER_TO_AGENT`, line 2193)
- Background `npx skills add/remove` execution per provider
- History tracked in `skill_learning_history` table with job dedup
- TTL-based job cleanup for completed/failed jobs

### 18.3 Report Pipeline (`server/modules/routes/collab/coordination.ts`)

Format-aware report routing:
- `stripReportRequestPrefix(content)` (line 718) — extracts report intent from message
- `detectReportOutputFormat(content)` — determines output format (PPT, MD, etc.)
- `pickPlanningReportAssignee()` — selects best agent for report generation
- `handleReportRequest()` — orchestrates full report flow
- PPT generation via `pptxgenjs` for presentation-type tasks
- Archive materialization via `archivePlanningConsolidatedReport()` (orchestration.ts:846)

### 18.4 Polling Fallback Hook (`src/hooks/usePolling.ts`)

Complement to WebSocket for robustness:
```typescript
function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 3000,
  deps: unknown[] = []
) → { data, loading, error, refresh }
```

Used at `src/App.tsx:649` as periodic fallback alongside WS-driven live updates.

### 18.5 Provider Dispatch Flow (`server/modules/workflow/orchestration.ts`)

Central dispatch at line 1054 selects execution path per agent config:
```
orchestration.ts:1131 → API provider path      (executeApiProviderAgent)
orchestration.ts:1144 → OAuth HTTP path         (launchHttpAgent: copilot/antigravity)
orchestration.ts:1158 → CLI path                (spawnCliAgent: claude/codex/gemini/opencode)
```

### 18.6 Module Composition Pattern

Source: `server/modules/workflow.ts:18`, `server/modules/routes.ts:13`

Large domains split into composable "parts":
```
workflow.ts → initializeWorkflowPartA (core) + PartB (agents) + PartC (orchestration)
routes.ts   → registerRoutesPartA (core) + PartB (collab) + PartC (ops)
```

Each part receives `RuntimeContext`, destructures needed functions, adds new ones.
Validated at startup via `assertRuntimeFunctionsResolved()`.

### 18.7 Codex Analysis Token Usage

| Metric | Value |
|--------|-------|
| Model | gpt-5.3-codex |
| Total tokens | 469,037 |
| Tool calls | ~60 (bash exec, file reads, grep) |
| Key finding | Low test depth (smoke only), heavy `@ts-nocheck` in aggregators |

---

## 19. Absorption Scope for open-pantheon

See: [`CLAW-EMPIRE-ABSORPTION.md`](./CLAW-EMPIRE-ABSORPTION.md)

| Category | Count | Items |
|----------|-------|-------|
| **FULL ABSORB** | 6 | Provider Gateway, Dept Hierarchy, Subtask Delegation, Review Consensus, i18n, Git Worktree |
| **PATTERN ABSORB** | 6 | WS Event Bus, Task State Machine, CLI Streaming, Deferred Proxy, OAuth Rotation, Context Gen |
| **DO NOT ABSORB** | 7 | PixiJS UI, React Frontend, SQLite DB, Room Themes, Sprites, Update Banner, Meeting Seat UI |

Implementation: 5 phases (CE-1 ~ CE-5), ~18 file operations.

---

## 20. Analysis Sources

이 레퍼런스는 6개의 독립 분석을 종합한 결과입니다:

| # | Source | Model | Tokens | Key Focus |
|---|--------|-------|--------|-----------|
| 1 | Explore Agent #1 | claude-sonnet-4-6 | ~121k | DB schema, 10 reusable patterns |
| 2 | Explore Agent #2 | claude-sonnet-4-6 | ~109k | Code patterns with line evidence |
| 3 | Gemini CLI #1 | gemini-2.5-flash | - | Design pattern analysis |
| 4 | Gemini CLI #2 | gemini-2.5-flash | - | Portfolio-specific insights |
| 5 | Codex CLI | gpt-5.3-codex | 469,037 | file:line evidence, 5-section deep dive |
| 6 | Manual reading | claude-opus-4-6 | - | 15+ source files direct inspection |

---

## 21. Decision Points

1. **Provider Scope**: All 6 CLI providers or just add OpenCode (4th CLI)?
2. **OAuth Complexity**: Add OAuth flows (Copilot/Antigravity) or keep CLI-only?
3. **API Provider Mode**: Support direct LLM API keys (9 providers) or stay CLI-mediated?
4. **i18n Priority**: Full 4-language (KO/EN/JA/ZH) now or EN+KO first?
5. **Review Consensus**: Full 3-round meeting protocol or simplified vote system?

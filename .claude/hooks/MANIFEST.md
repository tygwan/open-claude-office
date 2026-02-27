# Hook Manifest

> Compact index for 10 automation hooks. All hooks execute automatically on tool events.

## PreToolUse Hooks (2)

| Hook | Matcher | Category | Purpose |
|------|---------|----------|---------|
| pre-tool-use-safety.sh | Bash, Write, Edit | Safety | 위험 명령 차단 (rm -rf, force push 등) |
| mvp-safety-guard.sh | Bash, Write, Edit | Safety | 라이프사이클 단계 초과 경고 |

## PostToolUse Hooks (7)

| Hook | Matcher | Category | Purpose |
|------|---------|----------|---------|
| auto-doc-sync.sh | Bash, Write, Edit | Documentation | git commit → CHANGELOG + README 통계 동기화 |
| phase-progress.sh | Write, Edit | Tracking | TASKS.md 변경 → Phase 진행률 업데이트 |
| post-tool-use-tracker.sh | Bash, Write, Edit | Analytics | 변경사항 로깅 (metrics.jsonl) |
| state-transition.sh | Write, Edit | Pipeline | State Machine ↔ Quality Gate 브릿지 |
| craft-progress.sh | Write, Edit | Pipeline | Craft 파이프라인 진행률 → docs/PROGRESS.md |
| notion-sync.sh | Bash, Write, Edit | Integration | 문서/상태 변경 감지 → Notion pending sync 큐 |
| lifecycle-tracker.sh | Bash, Write, Edit | Analytics | 도메인별 활동 추적 |

## Notification Hooks (1)

| Hook | Matcher | Category | Purpose |
|------|---------|----------|---------|
| notification-handler.sh | * | Communication | 알림 처리 |

## Dependencies

| Hook | Reads | Writes |
|------|-------|--------|
| pre-tool-use-safety.sh | settings.json | stdout (allow/block) |
| mvp-safety-guard.sh | settings.json, lifecycle.current_stage | stdout (warn) |
| auto-doc-sync.sh | git log | CHANGELOG.md, README stats |
| phase-progress.sh | phases/*/TASKS.md | docs/PROGRESS.md |
| post-tool-use-tracker.sh | tool event | .claude/analytics/metrics.jsonl |
| state-transition.sh | workspace/*/.state.yaml | .claude/logs/state-transitions.log |
| craft-progress.sh | workspace/*/.state.yaml | docs/PROGRESS.md |
| notion-sync.sh | settings.json, docs/* | .claude/cache/notion/pending-sync.* |
| lifecycle-tracker.sh | tool event | .claude/analytics/metrics.jsonl |
| notification-handler.sh | notification event | .claude/logs/notifications.log |

## Category Index

| Category | Hooks | Count |
|----------|-------|-------|
| Safety | pre-tool-use-safety.sh, mvp-safety-guard.sh | 2 |
| Documentation | auto-doc-sync.sh | 1 |
| Tracking | phase-progress.sh | 1 |
| Analytics | post-tool-use-tracker.sh, lifecycle-tracker.sh | 2 |
| Pipeline | state-transition.sh, craft-progress.sh | 2 |
| Integration | notion-sync.sh | 1 |
| Communication | notification-handler.sh | 1 |
| **Total** | | **10** |

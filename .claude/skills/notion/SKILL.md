---
name: notion
description: Bidirectional Notion sync for project management data via Notion MCP. Sync tasks, documents, sprints, gates, and activity logs. "notion", "노션", "동기화", "sync", "notion push", "notion pull", "notion status" 키워드에 반응.
---

# Notion Sync Skill

Notion MCP 기반 양방향 동기화. 프로젝트 관리 데이터(태스크, 문서, 스프린트, 게이트, 활동 로그)를 Notion과 실시간 동기화합니다.

## Pre-check

Notion MCP가 설정되어 있는지 확인합니다. `mcp__notion__*` 도구가 현재 세션에서 사용 가능해야 합니다. 사용 불가 시 설정 안내를 출력합니다.

## Usage

```
/notion <subcommand> [options]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `/notion init [--db-only\|--migrate]` | DB 8개 생성 + 관계 설정. `--migrate`로 기존 마크다운 데이터 마이그레이션 |
| `/notion sync` | 양방향 전체 동기화 |
| `/notion push [--project P] [--tasks-only] [--docs-only]` | 로컬 → Notion |
| `/notion pull [--project P] [--changes-only]` | Notion → 로컬 캐시 |
| `/notion status` | 동기화 상태, 마지막 동기화 시간 |
| `/notion diff` | 로컬과 Notion 차이점 |

---

## Notion MCP Tool Mapping

| MCP Tool | Purpose | Used By |
|----------|---------|---------|
| `mcp__notion__search` | DB/페이지 검색 | pull, status, diff |
| `mcp__notion__query_database` | DB 행 쿼리 (필터, 정렬) | pull, sync, status |
| `mcp__notion__create_page` | 새 행/페이지 생성 | push, init |
| `mcp__notion__update_page` | 기존 행/페이지 업데이트 | push, sync |
| `mcp__notion__get_page` | 페이지 상세 조회 | pull, diff |

---

## 8 Notion Databases

| DB | Config Key | Purpose |
|----|-----------|---------|
| Projects DB | `notion.databases.projects` | 프로젝트 현황 (Stage, Progress, Health) |
| Tasks DB | `notion.databases.tasks` | 전 프로젝트 태스크 통합 관리 |
| Gates DB | `notion.databases.gates` | Stage 전환 기록 (MVP/PoC/Prod Gate) |
| Documents DB | `notion.databases.documents` | PRD, TECH-SPEC 등 문서 관리 |
| Sprints DB | `notion.databases.sprints` | Sprint 관리 (velocity, burndown) |
| Tech Debt DB | `notion.databases.tech_debt` | 기술 부채 추적 |
| Feedback DB | `notion.databases.feedback` | 학습, ADR, 회고 |
| Activity Log DB | `notion.databases.activity_log` | 활동 이력 |

DB 스키마 상세: `docs/archive/NOTION-SYNC-ARCHITECTURE.md`

---

## Source of Truth Strategy

| Data Type | Source of Truth | Reason |
|-----------|----------------|--------|
| 코드, 설정 (.claude/) | Local files | Claude Code가 직접 관리 |
| Task status | Local (Claude Code) | 코드 상태를 정확히 아는 쪽 |
| Priority, Content | Notion | PM/사람이 편집한 것 존중 |
| 프로젝트 관리 | Notion | 브라우저에서 확인 가능 |

## Conflict Resolution

| Field | Winner | Rationale |
|-------|--------|-----------|
| Status | `local_wins` | Claude Code가 코드 상태를 정확히 앎 |
| Priority | `notion_wins` | PM의 판단 존중 |
| Content | `notion_wins` | 사람이 편집한 것 존중 |
| Default | `latest_wins` | 최신 timestamp |

설정: `.claude/settings.json` > `notion.sync.conflict_resolution`

---

## Cache Management

캐시 위치: `.claude/cache/notion/` (TTL: 5분)

| File | Content | Refresh |
|------|---------|---------|
| `projects.json` | Projects DB 스냅샷 | 세션 시작 시 |
| `tasks-active.json` | 현재 Sprint In Progress 태스크 | 세션 시작 시 |
| `current-sprint.json` | 현재 Sprint 정보 | 세션 시작 시 |
| `docs/*.md` | 문서 요약 캐시 | 명시적 요청 시 |
| `pending-sync.json` | Hook이 마킹한 pending sync | notion-sync.sh hook |

---

## Sync Workflows

### /notion init

1. Notion MCP 연결 확인
2. 8개 DB 생성 (`mcp__notion__create_page`) 또는 기존 DB ID 확인
3. DB 간 Relation 설정
4. Database ID를 `settings.json > notion.databases`에 기록
5. `--migrate` 옵션: 기존 PROGRESS.md, TASKS.md, docs/*.md 파싱 → Notion DB에 push

### /notion push

1. 로컬 상태 읽기 (PROGRESS.md, TASKS.md, docs/*.md, settings.json)
2. Notion 기존 항목 쿼리 (`mcp__notion__query_database`)
3. 변경 사항 비교
4. 충돌 해결 규칙 적용
5. 변경 항목 push (`mcp__notion__update_page` / `mcp__notion__create_page`)
6. 캐시 업데이트

### /notion pull

1. Notion DB 쿼리 — 마지막 동기화 이후 변경 사항
2. 로컬 캐시 파일에 기록
3. 변경 사항 사용자에게 리포트
4. `--changes-only`: diff만 표시, 로컬 기록 안 함

### /notion sync

1. Pull 실행
2. 충돌 해결 적용
3. Push 실행
4. 캐시에 동기화 timestamp 기록

### /notion status

1. 캐시 timestamp 읽기
2. 마지막 동기화 시간, pending 변경 수 리포트
3. 연결 상태 표시

### /notion diff

1. Notion에서 최신 데이터 pull (캐시에)
2. 캐시와 로컬 상태 비교
3. DB별 차이점 그룹화 표시

---

## Integration with Existing Workflows

| Workflow | Integration Point |
|----------|-------------------|
| `/feature start` | Tasks DB에 태스크 자동 추가 |
| `/feature complete` | Tasks DB status 업데이트 + Activity Log |
| `/lifecycle promote` | Gates DB 기록 + Projects DB Stage 변경 |
| `/sprint start/end` | Sprints DB 동기화 |
| `auto-doc-sync.sh` hook | Activity Log 기록 |
| `notion-sync.sh` hook | docs/ 변경 감지 → pending sync 마킹 |

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Notion MCP not configured | 설정 안내 메시지 출력 |
| Database ID not set | `/notion init` 실행 안내 |
| Network error | 1회 재시도, 캐시에 마지막 상태 보관 |
| Conflict detected | 충돌 해결 규칙 적용, 사용자에게 로그 |

## Configuration

`.claude/settings.json` > `notion` 섹션 참조.

`notion.enabled`가 `false`(기본값)이면 모든 동기화가 비활성화됩니다. `/notion init` 실행 후 `true`로 전환됩니다.

## Related

- **Architecture**: `docs/archive/NOTION-SYNC-ARCHITECTURE.md`
- **Command**: `.claude/commands/notion.md`
- **Hook**: `.claude/hooks/notion-sync.sh`
- **Skills**: `sprint`, `agile-sync`, `phase`, `feedback-loop`

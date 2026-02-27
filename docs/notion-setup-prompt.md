# Notion AI 세팅 프롬프트

> 아래 프롬프트를 Notion AI에게 전달하세요. 한 번에 전달하기 어려우면 "1. Dashboard 페이지"부터 순서대로 진행하세요.

---

## 프롬프트

나는 Claude Code(AI 코딩 에이전트)로 여러 개발 프로젝트를 동시에 관리하고 있어. Claude Code가 MCP를 통해 Notion DB에 데이터를 자동으로 push/pull 하는 구조야. 팀원이나 공유 대상자가 내 작업 현황을 실시간으로 볼 수 있는 Notion 워크스페이스를 구성해줘.

### 전체 구조

Dashboard 페이지 1개 + 데이터베이스 8개를 만들어야 해. 데이터베이스 간 관계(Relation)가 핵심이야.

```
Dashboard (메인 페이지)
├── Projects DB    ← 프로젝트 현황 (Gallery 뷰)
├── Tasks DB       ← 태스크 관리 (칸반 보드)
├── Gates DB       ← 품질 검증 기록
├── Documents DB   ← 개발 문서 관리
├── Sprints DB     ← Sprint 관리
├── Tech Debt DB   ← 기술 부채 추적
├── Feedback DB    ← 학습, 회고, ADR
└── Activity Log DB ← 활동 이력
```

---

### 1. Dashboard 페이지

"Development Dashboard"라는 이름의 페이지를 만들어줘. 레이아웃:

- 상단: **Projects DB**의 Gallery 뷰 (Linked Database). 카드에 프로젝트 이름, Progress Bar, Stage 표시.
- 중간: **Tasks DB**의 Board 뷰 (Linked Database). 칸반 형태.
- 하단: 2열 레이아웃으로 왼쪽에 **Activity Log DB** (최근 10개 Table 뷰), 오른쪽에 **Sprints DB** (현재 Sprint Gallery 뷰).

---

### 2. Projects DB

**이름**: Projects

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Name | Title | 프로젝트 이름 |
| Stage | Select | 옵션: `MVP`, `PoC`, `Production` |
| Health | Select | 옵션: `🟢 Good`, `🟡 Warning`, `🔴 Critical` |
| Priority | Select | 옵션: `High`, `Medium`, `Low` |
| Progress | Formula | Tasks DB에서 해당 프로젝트의 (완료 태스크 수 / 전체 태스크 수) × 100. 결과를 녹색 사각형(🟩)으로 시각화. 10% 단위로 🟩 개수 증가, 나머지는 ⬜로 채움. 예: 50% → 🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ 50% |
| Task Count | Rollup | Tasks relation에서 Count all |
| Repo URL | URL | GitHub 저장소 링크 |
| Tech Stack | Multi-select | 옵션 예시: `React`, `Node.js`, `Python`, `SvelteKit`, `TypeScript` |
| Test Coverage | Number | 퍼센트 형식 |
| CI Status | Select | 옵션: `✅ Passing`, `❌ Failing`, `⬜ None` |
| Sprint | Relation | → Sprints DB |
| Deploy Target | Select | 옵션: `Local`, `Staging`, `Production` |
| Description | Text | 한 줄 설명 |
| Last Activity | Date | 마지막 활동 일시 |
| Tasks | Relation | → Tasks DB (양방향) |

**뷰**:
1. **Gallery** (기본 뷰): 카드에 Name, Progress formula, Stage 표시. Stage별로 그룹화.
2. **Board**: Stage별 칸반 (MVP | PoC | Production)
3. **Table**: 전체 프로젝트 목록

---

### 3. Tasks DB

**이름**: Tasks

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Task | Title | 태스크 이름 |
| Project | Relation | → Projects DB (양방향) |
| Status | Select | 아래 상세 참조 |
| Priority | Select | 옵션: `🔴 P0`, `🟠 P1`, `🟡 P2` |
| Phase | Select | 옵션: `Phase 1`, `Phase 2`, `Phase 3`, `Phase 3.5`, `Phase 4` |
| Assignee | Person | 담당자 |
| Sprint | Relation | → Sprints DB |
| Story Points | Number | 스토리 포인트 (1, 2, 3, 5, 8, 13) |
| Due Date | Date | 마감일 |
| Time Allocation | Select | 옵션: `30m`, `1h`, `2h`, `4h`, `1d` |
| Tags | Multi-select | 옵션: `feature`, `bug`, `tech-debt`, `docs`, `refactor`, `test` |
| GitHub Issue | URL | |
| GitHub PR | URL | |
| Notes | Text | 메모 |
| Completed At | Date | 완료 일시 |

**Status 속성 옵션** (순서 중요):

보이는 열:
- `Do` (할 일 — 이번 주 계획)
- `Monday` (진행 중 — 월요일)
- `Tuesday` (진행 중 — 화요일)
- `Wednesday` (진행 중 — 수요일)
- `Thursday` (진행 중 — 목요일)
- `Friday` (진행 중 — 금요일)
- `Saturday` (진행 중 — 토요일)
- `Sunday` (진행 중 — 일요일)
- `Done` (완료)

숨겨진 열:
- `Inbox` (아이디어/초기 입력 — 기본값)
- `Backlog` (나중에 할 것)
- `Archive` (보관)
- `Blocked` (차단됨)

**뷰**:
1. **Planner** (Board 뷰, 기본): Status별 칸반. Inbox/Backlog/Archive는 숨김 처리. Do → 요일별 → Done 순서. 카드에 Priority, Time Allocation 표시.
2. **All Tasks** (Table 뷰): 전체 태스크 목록, Project별 그룹화
3. **By Project** (Board 뷰): Project별 칸반
4. **By Phase** (Board 뷰): Phase별 칸반
5. **Calendar** (Calendar 뷰): Due Date 기준
6. **My Tasks** (Table 뷰, 필터): Assignee = Me, Status ≠ Done/Archive

---

### 4. Gates DB

**이름**: Gates

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Gate | Title | 게이트 이름 (예: MVP Gate, pre-build) |
| Category | Select | 옵션: `Stage`, `Pipeline`, `Dev` |
| Project | Relation | → Projects DB |
| Status | Select | 옵션: `⬜ Not Checked`, `✅ Passed`, `❌ Failed`, `🚫 Blocked` |
| Checked At | Date | 검증 일시 |
| Passed At | Date | 통과 일시 |
| Blocker Count | Number | 미충족 필수 항목 수 |
| Warning Count | Number | 미충족 권장 항목 수 |

페이지 본문에는 Required 체크리스트와 Recommended 체크리스트를 토글 블록으로 넣어줘.

**뷰**:
1. **Board**: Status별 칸반
2. **Table**: 전체 목록, Category별 그룹화

---

### 5. Documents DB

**이름**: Documents

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Document | Title | 문서 이름 |
| Project | Relation | → Projects DB |
| Type | Select | 옵션: `PRD`, `TECH-SPEC`, `DISCOVERY`, `RUNBOOK`, `ADR`, `SLA`, `SECURITY`, `API-SPEC`, `ARCHITECTURE`, `NARRATIVE`, `STACK-PROFILE`, `DESIGN-PROFILE`, `SUMMARY`, `CHANGELOG`, `SPRINT-RETRO` |
| Status | Select | 옵션: `📝 Draft`, `👀 Review`, `✅ Final`, `📦 Archived` |
| Stage | Select | 옵션: `MVP`, `PoC`, `Production` |
| Version | Text | 예: v1.0, v1.1 |

**뷰**:
1. **Board**: Status별 칸반 (Draft | Review | Final | Archived)
2. **Table**: 전체 목록, Type별 그룹화
3. **By Project** (Board 뷰): Project별 보기

---

### 6. Sprints DB

**이름**: Sprints

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Sprint | Title | 예: Sprint 1, Sprint 2 |
| Project | Relation | → Projects DB |
| Status | Select | 옵션: `📋 Planning`, `🏃 Active`, `✅ Completed`, `❌ Cancelled` |
| Period | Date | 시작일 ~ 종료일 (Date range) |
| Goal | Text | Sprint 목표 |
| Planned Pts | Number | 계획 포인트 |
| Velocity | Number | 완료 포인트 |
| Tasks | Relation | → Tasks DB (양방향) |
| Progress | Formula | Velocity / Planned Pts × 100, 녹색 사각형 시각화 (Projects와 동일 패턴) |

페이지 본문: Sprint 목표 상세, Retrospective (Keep/Problem/Try) 템플릿

**뷰**:
1. **Active** (Gallery 뷰): Status = Active만 필터. 카드에 Sprint명, Progress, Period 표시.
2. **Table**: 전체 Sprint 목록

---

### 7. Tech Debt DB

**이름**: Tech Debt

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Item | Title | 부채 항목 |
| Project | Relation | → Projects DB |
| Severity | Select | 옵션: `🔴 Critical`, `🟠 High`, `🟡 Medium`, `🟢 Low` |
| Category | Select | 옵션: `Code`, `Architecture`, `Testing`, `Docs`, `Infrastructure`, `Security` |
| Status | Select | 옵션: `Open`, `In Progress`, `Resolved` |
| Effort | Select | 옵션: `S`, `M`, `L`, `XL` |
| Source | Text | 파일 경로 또는 영역 |
| Task | Relation | → Tasks DB |

**뷰**:
1. **Board**: Severity별 칸반
2. **Table**: 전체 목록, Category별 그룹화

---

### 8. Feedback DB

**이름**: Feedback

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Item | Title | 피드백 제목 |
| Project | Relation | → Projects DB |
| Type | Select | 옵션: `💡 Learning`, `📐 ADR`, `🔄 Retro`, `👤 User-Feedback` |
| Category | Multi-select | 옵션: `bugs`, `performance`, `security`, `architecture`, `tooling`, `process` |
| Source | Select | 옵션: `Fix Commit`, `Arch Change`, `Sprint End`, `User Report`, `Post-mortem` |
| Impact | Select | 옵션: `High`, `Medium`, `Low` |
| Action Taken | Checkbox | |

페이지 본문 템플릿:
- Learning: Problem → Root Cause → Learning → Application
- ADR: Context → Options → Decision → Consequences
- Retro: Keep → Problem → Try → Action Items

**뷰**:
1. **Board**: Type별 칸반
2. **Table**: 전체 목록

---

### 9. Activity Log DB

**이름**: Activity Log

**속성(Properties)**:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Activity | Title | 활동 요약 |
| Project | Relation | → Projects DB |
| Type | Select | 옵션: `Commit`, `PR`, `Deploy`, `Gate`, `Sprint`, `Incident`, `Release`, `StateTransition`, `QualityGate`, `PipelinePhase`, `CLIFallback` |
| Detail | Text | 상세 내용 |
| Link | URL | GitHub 링크 등 |
| Timestamp | Date | 발생 시각 |
| Actor | Text | 실행자 (사용자 이름 또는 "Claude") |

**뷰**:
1. **Recent** (Table 뷰, 기본): Timestamp 내림차순, 최근 20개
2. **By Type** (Board 뷰): Type별 그룹화

---

### DB 간 관계(Relation) 요약

모든 Relation을 양방향으로 설정해줘:

```
Projects DB (중심)
    ├──→ Tasks DB          (1:N)
    │       └──→ Sprints DB (N:N — Tasks에도 Sprint relation)
    ├──→ Gates DB          (1:N)
    ├──→ Documents DB      (1:N)
    ├──→ Sprints DB        (1:N)
    ├──→ Tech Debt DB      (1:N)
    │       └──→ Tasks DB  (1:1 — 해결 태스크 연결)
    ├──→ Feedback DB       (1:N)
    └──→ Activity Log DB   (1:N)
```

---

### 주의사항

1. **Progress Formula**: Projects DB와 Sprints DB의 Progress는 녹색 사각형(🟩) 시각화를 사용해. 10% 단위로 🟩 개수가 늘어나고 나머지는 ⬜로 채워. 끝에 퍼센트 숫자도 표시해줘.
2. **Tasks Status 순서**: 칸반 열 순서가 Do → Monday → Tuesday → ... → Sunday → Done 이어야 해. Inbox, Backlog, Archive, Blocked는 숨김 처리.
3. **Dashboard Linked DB**: Dashboard 페이지의 DB들은 모두 Linked Database(원본 참조)로 넣어. 원본 DB는 따로 존재하고, Dashboard에서는 특정 뷰만 보여주는 구조.
4. **모든 DB에 Created time, Last edited time 속성**을 자동으로 추가해줘.
5. **기본값**: Tasks의 Status 기본값은 `Inbox`, Projects의 Stage 기본값은 `MVP`.

# Role Map — Infrastructure by Job Function

> 모든 에이전트, 스킬, 커맨드, 훅을 직무/역할 기준으로 분류한 인덱스.
> 총 ~114개 항목 (open-pantheon + mvp-plan + global + Claude built-in)

---

## 1. Project Planning & Discovery

프로젝트 초기 기획, 요구사항 수집, 아이디어 발상

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `project-discovery` | open-pantheon | 대화 기반 요구사항 파악 → DISCOVERY.md |
| Agent | `prd-writer` | global | PRD(제품 요구사항 문서) 작성 |
| Agent | `project-analyzer` | global | 프로젝트 구조/기술스택/패턴 분석 |
| Agent | `experience-interviewer` | open-pantheon | 6블록 갭 분석 → 사용자 인터뷰 |
| Skill | `brainstorming` | open-pantheon | 아이디어 발상/정제/검증 |
| Skill | `init` | open-pantheon | 프로젝트 초기화 (6 modes) |
| Skill | `prompt-enhancer` | open-pantheon | 프로젝트 컨텍스트 기반 프롬프트 향상 |
| Skill | `doc-confirm` | open-pantheon | 문서 생성 확인 플로우 |

---

## 2. Architecture & Design

기술 설계, API 설계, DB 설계, 디자인 시스템

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `tech-spec-writer` | global | 기술 설계서, API 설계, 데이터 모델 |
| Agent | `design-agent` | open-pantheon | 디자인 프로파일 (팔레트, 타이포, 레이아웃) |
| Agent | `scaffolder` | mvp-plan | 프로젝트 구조 생성 (MVP/PoC/Prod) |
| Agent | `api-designer` | mvp-plan | API 엔드포인트 설계, OpenAPI spec |
| Agent | `db-architect` | mvp-plan | DB 스키마, 마이그레이션, ERD |
| Agent | `auth-builder` | mvp-plan | 인증/인가 시스템 구축 |
| Skill | `dev-doc-planner` | open-pantheon | PRD/TECH-SPEC/PROGRESS 템플릿 |

---

## 3. Code Development & Generation

코드 작성, 사이트 빌드, 포트폴리오 파이프라인

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `page-writer` | open-pantheon | 사이트 빌드 (content.json + tokens.css) |
| Agent | `figure-designer` | open-pantheon | Mermaid/SVG 시각화 |
| Agent | `code-analyst` | open-pantheon | 기술스택, 아키텍처, 코드 메트릭 분석 |
| Agent | `story-analyst` | open-pantheon | 내러티브, 마일스톤, 임팩트 추출 |
| Agent | `stack-detector` | open-pantheon | 프레임워크 감지, 템플릿 추천 |
| Command | `/craft` | open-pantheon | 전체 파이프라인 (Phase 1→4) |
| Command | `/craft-analyze` | open-pantheon | Phase 1 분석 |
| Command | `/craft-design` | open-pantheon | Phase 2 디자인 |
| Command | `/craft-preview` | open-pantheon | 로컬 빌드 + 서빙 |
| Command | `/craft-deploy` | open-pantheon | 배포 |
| Command | `/craft-sync` | open-pantheon | 포트폴리오 동기화 |
| Command | `/craft-state` | open-pantheon | 상태 조회/제어 |
| Command | `/craft-export` | open-pantheon | 내보내기 |

---

## 4. Code Quality & Review

코드 리뷰, 리팩토링, 린트, 테스트

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `code-reviewer` | global/open-pantheon | 코드 품질/보안/성능 리뷰 |
| Agent | `refactor-assistant` | global/open-pantheon | 코드 구조 개선, 디자인 패턴 |
| Agent | `test-helper` | global/open-pantheon | 단위/통합/E2E 테스트 작성 |
| Agent | `validation-agent` | open-pantheon | 빌드 검증 (Codex) |
| Agent | `lint-configurator` | mvp-plan | ESLint/Prettier/TypeScript 설정 |
| Agent | `test-strategist` | mvp-plan | 단계별 테스트 전략 수립 |
| Agent | `security-scanner` | mvp-plan | 보안 취약점 검사 및 자동 수정 |
| Skill | `quality-gate` | open-pantheon | 자동 품질 게이트 (commit/merge/release) |
| Skill | `codex-claude-loop` | open-pantheon | 듀얼 AI 루프 (Claude↔Codex) |
| Skill | `validate` | open-pantheon | 설정/구성 검증 |
| Skill | `repair` | open-pantheon | 자동 복구, 문제 해결 |
| Agent | `config-validator` | global | settings.json/hooks 검증 |

---

## 5. Documentation

문서 생성, 검증, 동기화, 관리

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `doc-generator` | global | README, API 문서, 사용자 가이드 생성 |
| Agent | `doc-validator` | global/open-pantheon | 문서 완성도 검증, 누락 확인 |
| Agent | `doc-splitter` | global/open-pantheon | Phase 폴더/문서 구조 생성 |
| Agent | `dev-docs-writer` | global/open-pantheon | PRD/TECH-SPEC/PROGRESS 생성 |
| Agent | `readme-helper` | open-pantheon | README 작성/개선, 배지 |
| Skill | `dev-doc-system` | open-pantheon | 개발 문서 통합 관리 |
| Skill | `readme-sync` | open-pantheon | README 자동 동기화 |
| Skill | `feedback-loop` | open-pantheon | 학습/ADR/회고 수집 |

---

## 6. Git & Release Management

브랜치, 커밋, PR, 릴리스, 배포

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `commit-helper` | global/open-pantheon | Conventional Commits 메시지 작성 |
| Agent | `pr-creator` | global/open-pantheon | PR 생성 및 설명 작성 |
| Agent | `branch-manager` | global/open-pantheon | GitHub Flow 브랜치/Remote 관리 |
| Agent | `git-troubleshooter` | global | Git 충돌 해결, 히스토리 복구 |
| Agent | `work-unit-manager` | global/open-pantheon | 세션 변경사항 추적, 커밋 단위 제안 |
| Agent | `github-manager` | open-pantheon | gh CLI 기반 이슈/PR/CI/CD 관리 |
| Skill | `git-workflow` | open-pantheon | 브랜치 전략, 커밋 컨벤션, PR 템플릿 |
| Skill | `gh` | open-pantheon | GitHub CLI 통합 |
| Command | `/feature` | open-pantheon | 기능 개발 워크플로우 |
| Command | `/bugfix` | open-pantheon | 버그 수정 워크플로우 |
| Command | `/release` | open-pantheon | 릴리스 관리 |
| Command | `/git-workflow` | open-pantheon | Git 워크플로우 |

---

## 7. Project Management & Tracking

Phase, Sprint, 진행률, 일정 관리

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `progress-tracker` | global/open-pantheon | Phase+Sprint 통합 진행률 추적 |
| Agent | `phase-tracker` | global/open-pantheon | Phase별 진행, 전환, 체크리스트 검증 |
| Skill | `sprint` | open-pantheon | Sprint 관리 (velocity, burndown, retro) |
| Skill | `agile-sync` | open-pantheon | Agile 산출물 동기화 |
| Skill | `phase` | open-pantheon | Phase 상태 확인/전환/진행률 |
| Skill | `sync-fix` | open-pantheon | Phase/Sprint/문서 동기화 복구 |
| Command | `/phase` | open-pantheon | Phase 관리 |

---

## 8. Infrastructure & CI/CD

Docker, CI/CD, 환경변수, 배포

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `container-builder` | mvp-plan | Docker/K8s 환경 구축 |
| Agent | `ci-generator` | mvp-plan | GitHub Actions CI/CD 파이프라인 |
| Agent | `env-manager` | mvp-plan | 환경변수/Secret 관리 |
| Skill | `ci-workflow` | open-pantheon | GitHub Actions 설정, 자동화 |

---

## 9. Lifecycle Gate & Migration

단계 전환 게이트, 마이그레이션 계획

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `lifecycle-gate` | mvp-plan | MVP→PoC→Prod 게이트 검증 |
| Agent | `migration-planner` | mvp-plan | 전환 시 기술 마이그레이션 계획 |

---

## 10. Multi-CLI Orchestration

Claude, Codex, Gemini CLI 연동 및 파이프라인

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Skill | `codex` | open-pantheon | Codex CLI 호출 (분석/검증) |
| Skill | `gemini` | open-pantheon | Gemini CLI 호출 (디자인/시각화) |
| Skill | `codex-claude-loop` | open-pantheon | 듀얼 AI 루프 |
| Skill | `consensus-engine` | open-pantheon | 멀티 LLM 합의 엔진 |
| Built-in | `/remote-env` | Claude Code | 원격 환경 설정 |
| Built-in | `/remote-control` | Claude Code | 원격 세션 제어 |

---

## 11. Analytics & Monitoring

사용 통계, 토큰 추적, 컨텍스트 최적화

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Agent | `analytics-reporter` | open-pantheon | Agent/Skill 사용 통계 CLI 시각화 |
| Skill | `analytics` | open-pantheon | 도구 사용 통계 시각화 |
| Skill | `ccusage` | open-pantheon | Claude/Codex 토큰 사용량 추적 |
| Skill | `context-optimizer` | open-pantheon | 토큰 최적화, 컨텍스트 관리 |

---

## 12. Meta / Tooling Creation

새로운 스킬, 에이전트, 훅, 커맨드 생성

| Type | Name | Source | Description |
|------|------|--------|-------------|
| Skill | `skill-creator` | open-pantheon | 새 Skill 생성 가이드 |
| Skill | `subagent-creator` | open-pantheon | 새 Agent 생성 가이드 |
| Skill | `hook-creator` | open-pantheon | 새 Hook 생성 가이드 |
| Skill | `slash-command-creator` | open-pantheon | 새 Command 생성 가이드 |
| Skill | `meta-prompt-generator` | open-pantheon | 구조화된 커스텀 슬래시 커맨드 자동 생성 |
| Skill | `skill-manager` | open-pantheon | 스킬 배포, 마켓플레이스, 버전 관리 |
| Skill | `code-changelog` | open-pantheon | 코드 변경사항 기록 + HTML 뷰어 |
| Agent | `agent-writer` | open-pantheon | Agent 작성, Frontmatter 검증 |
| Agent | `file-explorer` | global | 프로젝트 파일 분석, 불필요 파일 식별 |
| Agent | `google-searcher` | global | 웹 검색 및 기술 정보 수집 |

---

## 13. Automation Hooks

자동 실행되는 이벤트 기반 훅

### open-pantheon Hooks (7)

| Hook | Event | Role Group |
|------|-------|------------|
| `pre-tool-use-safety.sh` | PreToolUse | **Safety** — 위험 명령 차단 |
| `phase-progress.sh` | PostToolUse | **Tracking** — Phase 진행률 업데이트 |
| `auto-doc-sync.sh` | PostToolUse | **Documentation** — CHANGELOG+README 동기화 |
| `post-tool-use-tracker.sh` | PostToolUse | **Analytics** — 변경사항 로깅 |
| `notification-handler.sh` | Notification | **Communication** — 알림 처리 |
| `state-transition.sh` | PostToolUse | **Pipeline** — State Machine 브릿지 |
| `craft-progress.sh` | PostToolUse | **Pipeline** — Craft 진행률 동기화 |

### mvp-plan Hooks (2)

| Hook | Event | Role Group |
|------|-------|------------|
| `mvp-safety-guard.sh` | PreToolUse | **Safety** — 라이프사이클 단계 초과 경고 |
| `lifecycle-tracker.sh` | PostToolUse | **Analytics** — 도메인별 활동 추적 |

---

## Summary by Role

| # | Role | Agents | Skills | Commands | Hooks | Total |
|---|------|--------|--------|----------|-------|-------|
| 1 | Planning & Discovery | 4 | 4 | - | - | 8 |
| 2 | Architecture & Design | 6 | 1 | - | - | 7 |
| 3 | Code Development | 5 | - | 7 | - | 12 |
| 4 | Code Quality & Review | 7 | 4 | - | - | 11 |
| 5 | Documentation | 5 | 3 | - | - | 8 |
| 6 | Git & Release | 6 | 2 | 4 | - | 12 |
| 7 | Project Management | 2 | 4 | 1 | - | 7 |
| 8 | Infrastructure & CI/CD | 3 | 1 | - | - | 4 |
| 9 | Lifecycle Gate | 2 | - | - | - | 2 |
| 10 | Multi-CLI Orchestration | - | 4 | - | - | 4 |
| 11 | Analytics & Monitoring | 1 | 3 | - | - | 4 |
| 12 | Meta / Tooling | 4 | 6 | - | - | 10 |
| 13 | Automation Hooks | - | - | - | 9 | 9 |
| **Total** | | **45** | **32** | **12** | **9** | **98** |

---

## Cross-Reference: Overlap Areas

같은 역할에 중복 존재하는 항목 (통합 검토 대상)

| Area | Items | Status |
|------|-------|--------|
| Test | `test-helper` (global) + `test-strategist` (mvp-plan) | **역할 분리**: helper=작성, strategist=전략 |
| CI | `ci-workflow` (skill) + `ci-generator` (mvp-plan agent) | **역할 분리**: skill=GitHub Actions, agent=전체 파이프라인 |
| README | `readme-helper` (agent) + `readme-sync` (skill) | **통합 권장**: helper→sync로 병합 |
| Analytics | `analytics-reporter` + `analytics` + `ccusage` | **3-way 통합**: reporter가 나머지 호출 |
| Doc | `doc-generator` + `readme-helper` + `dev-docs-writer` | **역할 분리**: generator=기술문서, helper=README, writer=개발문서 |

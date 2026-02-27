# open-claude-office

> **상태: 개발 중** — 코어 에이전트 생태계는 완성. 대시보드, 크래프트 파이프라인, 멀티-CLI 오케스트레이션 활발히 구축 중.

Claude Code 에이전트 생태계 프레임워크입니다. `.claude/` 폴더를 아무 프로젝트에 복사하면 47개 에이전트, 34개 스킬, 15개 커맨드, 10개 훅이 네이티브 CLI에서 동작합니다.

---

## 빠른 시작

### 방법 A: `.claude/` 직접 복사 (권장)

의존성 없음. 빌드 없음. 복사만 하면 됩니다.

```bash
git clone https://github.com/tygwan/open-claude-office.git
cp -r open-claude-office/.claude /your/project/.claude
cd /your/project
claude
```

끝입니다. Claude Code가 `.claude/` 안의 에이전트, 스킬, 커맨드, 훅을 자동으로 인식합니다. 대시보드나 외부 도구 없이 네이티브 Claude Code CLI만으로 모든 기능이 동작합니다.

### 방법 B: `install.sh`로 모듈별 설치

선택적 모듈 설치, settings.json 병합, 깔끔한 제거를 원할 때 사용합니다. `jq` 필요.

```bash
cd open-claude-office

# 전체 설치 (기본)
./install.sh --target=/your/project

# 특정 모듈만
./install.sh --target=/your/project --modules=core,lifecycle,git

# 미리보기 (변경 없음)
./install.sh --target=/your/project --dry-run

# 제거
./install.sh --target=/your/project --uninstall
```

---

## 작동 방식

`.claude/`를 프로젝트에 복사하면 Claude Code에 47개 에이전트, 34개 스킬, 15개 커맨드, 10개 훅이 추가됩니다. 서버 없음, 대시보드 없음, 추가 런타임 없음.

```
your-project/
├── .claude/
│   ├── agents/         ← 47개 키워드 라우팅 에이전트 (MANIFEST.md)
│   ├── skills/         ← 34개 스킬 (/skill-name으로 호출)
│   ├── commands/       ← 15개 슬래시 커맨드 (/feature, /craft, /phase, ...)
│   ├── hooks/          ← 10개 자동화 훅 (안전, 진행률, 분석)
│   └── settings.json   ← 통합 설정 (라이프사이클, 품질 게이트, ...)
└── 여러분의 코드...
```

**`claude` CLI 안에서 모든 것이 실행됩니다.** 자연어로 요청하면 적절한 에이전트가 처리합니다:

```
> "이 코드 리뷰해줘"           → code-reviewer 에이전트
> "커밋 메시지 작성해줘"        → commit-helper 에이전트
> /feature                     → 기능 개발 워크플로우
> /craft                       → 포트폴리오 생성 파이프라인
> /phase                       → Phase 상태 및 전환
```

## 주요 기능

- **키워드 라우팅 에이전트** — `MANIFEST.md`가 프롬프트 키워드를 적절한 에이전트에 매칭. 수동 선택 불필요.
- **라이프사이클 관리** — MVP에서 PoC, Production까지 Phase 기반 개발. Sprint 추적, 품질 게이트, 자동 문서화 포함.
- **포트폴리오 생성 파이프라인** — Git 저장소(코드, 커밋, 스택)를 분석하여 고유한 디자인 토큰, 콘텐츠 구조, 배포가 포함된 포트폴리오 사이트 자동 생성.
- **멀티-CLI 오케스트레이션** — Claude Code가 리드하고, Codex CLI가 분석/검증, Gemini CLI가 디자인/시각화 담당. CLI가 없으면 자동 폴백.
- **품질 게이트** — 커밋, 머지, 빌드, 배포, 릴리스 각 단계에서 자동 검증.
- **컨텍스트 최적화** — 4단계 토큰 예산(2K/10K/30K/50K)으로 점진적 로딩 관리.
- **인터랙티브 대시보드** (선택) — 실시간 파이프라인 시각화, 프로젝트 파일 탐색, 세션 히스토리 채팅. [대시보드](#대시보드-선택) 섹션 참조.

---

<details>
<summary><strong>모듈</strong></summary>

| 모듈 | 설명 | 에이전트 | 스킬 | 커맨드 | 훅 | 필수 |
|------|------|---------|------|--------|-----|------|
| **core** | 안전, 라우팅, 프로젝트 초기화 | 5 | 4 | — | 1 | 예 |
| **craft** | Git 저장소 → 포트폴리오 사이트 파이프라인 | 8 | 2 | 8 | 2 | 아니오 |
| **lifecycle** | MVP/PoC/Prod 단계, Sprint 추적 | 17 | 8 | 5 | 3 | 아니오 |
| **git** | GitHub Flow, 커밋, PR, 브랜치 | 6 | 2 | 1 | 1 | 아니오 |
| **quality** | 코드 리뷰, 테스팅, 리팩토링, 문서 | 6 | 3 | — | — | 아니오 |
| **multi-cli** | Claude + Codex + Gemini 오케스트레이션 | — | 4 | — | — | 아니오 |
| **meta** | 새 에이전트, 스킬, 훅, 커맨드 생성 | 4 | 8 | — | — | 아니오 |
| **analytics** | 사용 통계, 토큰 추적, 비용 리포트 | 1 | 3 | — | 2 | 아니오 |
| **notion** | Notion 양방향 동기화 (8 DB, MCP 기반) | — | 1 | 1 | 1 | 아니오 |
| **external-skills** | stitch-skills, remotion, claude-office-skills | — | 3 | — | — | 아니오 |

모든 모듈은 **core**에 의존합니다. core를 먼저 설치하고 필요한 모듈을 추가하세요.

</details>

<details>
<summary><strong>아키텍처</strong></summary>

```
open-claude-office/
├── .claude/            ← 에이전트 생태계 (47 에이전트, 34 스킬, 15 커맨드, 10 훅)
│   ├── agents/         ← MANIFEST.md 키워드 라우팅
│   ├── skills/         ← /skill-name으로 호출
│   ├── commands/       ← 슬래시 커맨드
│   ├── hooks/          ← 자동화 훅
│   ├── docs/           ← ROLE-MAP.md, ARCHITECTURE.md
│   └── settings.json   ← 통합 설정 (라이프사이클, 품질 게이트, ...)
├── dashboard/          ← SvelteKit 멀티 프로젝트 대시보드 (localhost:4173)
├── modules/            ← 10개 설치 모듈 매니페스트
│   └── craft/assets/   ← 디자인 프리셋, 사이트 템플릿, 워크스페이스
├── docs/               ← 프로젝트 문서 + 파이프라인 계획
├── install.sh          ← 설치 스크립트
└── CLAUDE.md           ← AI 에이전트 시스템 프롬프트
```

### 핵심 파일

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | 마스터 시스템 프롬프트 — 매 세션마다 Claude Code가 로드 |
| `.claude/agents/MANIFEST.md` | 47개 에이전트의 키워드 라우팅 인덱스 |
| `.claude/settings.json` | `lifecycle.current_stage` 포함 통합 설정 |
| `.claude/docs/ROLE-MAP.md` | 모든 컴포넌트의 역할별 크로스 레퍼런스 |
| `dashboard/` | 멀티 프로젝트 인터랙티브 파이프라인 대시보드 |

</details>

<details>
<summary><strong>대시보드 (선택)</strong></summary>

VSCode 스타일 레이아웃의 멀티 프로젝트 인터랙티브 파이프라인 대시보드입니다. **필수가 아닙니다** — 모든 오케스트레이션 기능은 네이티브 Claude Code CLI로 동작합니다. 대시보드는 실시간 시각화를 추가합니다.

```
┌──────────────────────────────────────────────────────────────┐
│  open-claude-office    [project-A] [project-B]    MVP ▼      │
├─────────┬────────────────────────────────────────────────────┤
│  ~/dev/ │  파이프라인 플로우                                   │
│         │  ┌──────┐    ┌──────┐    ┌──────┐                 │
│  algo/  │  │ api  │───→│ code │───→│ test │                 │
│  bim/   │  │  ◉   │    │  ●   │    │  ○   │                 │
│  memo/  │  └──────┘    └──────┘    └──────┘                 │
│★ open/  │                                                    │
│  folio/ ├────────────────────────────────────────────────────┤
│         │  커맨드 히스토리                                    │
├─────────┴────────────────────────────────────────────────────┤
│  Claude 대기 │ Codex 대기 │ Gemini 대기 │ 토큰: 12.5k        │
└──────────────────────────────────────────────────────────────┘
```

- **왼쪽 사이드바**: `~/dev/` 프로젝트 폴더를 네스트된 파일 트리로 탐색. `.claude/` 설정이 있는 프로젝트 표시.
- **상단 바**: 프로젝트 탭 + 라이프사이클 스테이지 토글 (MVP / PoC / Production).
- **메인 영역**: CLI 이벤트별 애니메이션 SVG 노드로 실시간 인터랙티브 파이프라인 플로우.
- **하단 패널**: 탭 형식 커맨드 히스토리 + 세션 이어하기 가능한 채팅.

```bash
cd dashboard && npm run dev    # localhost:4173에서 시작
```

</details>

<details>
<summary><strong>멀티-CLI 오케스트레이션</strong></summary>

세 개의 CLI 도구가 협력하며, Claude Code가 리드 오케스트레이터입니다:

```
            Claude Code (리드)
            오케스트레이션 + 코드 생성
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  Codex CLI                Gemini CLI
  분석, 검증                디자인, 시각화
  --sandbox read-only      -y (자동 확인)
```

### Phase별 CLI 배분

| Phase | 작업 | 주 CLI | 폴백 |
|-------|------|--------|------|
| 1 — 분석 | 코드 분석, 스택 감지 | Codex | Claude |
| 2 — 디자인 | 디자인 프로파일 생성 | Gemini | Claude |
| 3 — 빌드 | 다이어그램, SVG 시각화 | Gemini | Claude |
| 3.5 — 검증 | 빌드 검증, 코드 리뷰 | Codex | Claude |
| 전체 | 오케스트레이션, 콘텐츠 생성 | Claude | — |

**폴백 동작**: 외부 CLI 실패 시 1회 재시도 후 Claude 내장 기능으로 대체. 모든 폴백 이벤트는 `.state.yaml`에 기록.

</details>

<details>
<summary><strong>역할 맵</strong></summary>

47개 에이전트, 34개 스킬, 15개 커맨드, 10개 훅을 13개 기능 그룹으로 분류:

| # | 역할 그룹 | 에이전트 | 스킬 | 커맨드 | 훅 | 합계 |
|---|----------|---------|------|--------|-----|------|
| 1 | 기획 및 디스커버리 | 4 | 4 | — | — | 8 |
| 2 | 아키텍처 및 디자인 | 6 | 1 | — | — | 7 |
| 3 | 코드 개발 | 5 | — | 7 | — | 12 |
| 4 | 코드 품질 및 리뷰 | 7 | 4 | — | — | 11 |
| 5 | 문서화 | 5 | 3 | — | — | 8 |
| 6 | Git 및 릴리스 관리 | 6 | 2 | 4 | — | 12 |
| 7 | 프로젝트 관리 | 2 | 4 | 1 | — | 7 |
| 8 | 인프라 및 CI/CD | 3 | 1 | — | — | 4 |
| 9 | 라이프사이클 게이트 | 2 | — | — | — | 2 |
| 10 | 멀티-CLI 오케스트레이션 | — | 4 | — | — | 4 |
| 11 | 분석 및 모니터링 | 1 | 3 | — | — | 4 |
| 12 | 메타 / 도구 생성 | 4 | 6 | — | — | 10 |
| 13 | 자동화 훅 | — | — | — | 10 | 10 |

상세 내용은 `.claude/docs/ROLE-MAP.md` 참조.

</details>

<details>
<summary><strong>크래프트 파이프라인</strong></summary>

크래프트 파이프라인은 Git 저장소를 4단계로 배포된 포트폴리오 사이트로 변환합니다:

```
Phase 1: 분석             Phase 2: 디자인          Phase 3: 빌드            Phase 4: 배포
───────────────────       ──────────────────       ──────────────────       ──────────────────
 code-analyst   ─┐                                  page-writer
 story-analyst  ─┼→ SUMMARY.md → design-profile  → content.json  → site/ → GitHub Pages
 stack-detector ─┘       │         tokens.css       figure-designer         Vercel / Netlify
                         │       (사람 검토/수정)     (Mermaid/SVG)
                         ▼
              experience-interviewer
              (갭 분석 → 사용자 인터뷰 → experience-blocks.md)
```

### Phase별 산출물

| Phase | 산출물 | 형식 | 이유 |
|-------|--------|------|------|
| 1 — 분석 | architecture.md, narrative.md, stack-profile.md | Markdown | 파일:라인 근거 포함, 사람이 검토 |
| 2 — 디자인 | design-profile.yaml | YAML | 주석 지원, 사람이 수정 가능 |
| 3 — 빌드 | content.json, tokens.css, site/ | JSON/CSS/HTML | 템플릿이 소비하는 기계 데이터 |
| 4 — 배포 | deploy.yaml | YAML | 라이브 URL 포함 배포 설정 |

### 상태 머신

각 프로젝트는 `workspace/{project}/.state.yaml`로 상태를 추적합니다:

```
init → analyzing → analyzed → designing → design_review → building → validating → build_review → deploying → done
                                  ↑              │                       ↑              │
                                  └── revision ──┘                       └── issues ────┘
```

특수 상태: `paused`, `failed`, `cancelled` (어떤 활성 상태에서든 도달 가능).

</details>

<details>
<summary><strong>라이프사이클 관리</strong></summary>

프로젝트는 세 가지 라이프사이클 스테이지를 거치며, 각 전환마다 품질 게이트가 있습니다:

```
  MVP                        PoC                       Production
  +-----------------------+  +-----------------------+  +-----------------------+
  | 핵심 기능만            |  | 사용자 검증 완료       |  | 확장 가능, 테스트됨,    |
  | 최소 실행 가능 범위    |  | 성능 베이스라인        |  | 문서화, 배포 완료       |
  | 기본 테스트            |  | 통합 테스트           |  | 전체 테스트 커버리지    |
  +-----------------------+  +-----------------------+  +-----------------------+
            │                          │                          │
            ▼                          ▼                          ▼
     [MVP 게이트]               [PoC 게이트]               [Prod 게이트]
     - 핵심 기능 동작            - 사용자 검증 완료          - 80%+ 테스트 커버리지
     - 기본 테스트 통과          - 성능 수용 가능            - 보안 스캔 통과
     - README 존재              - 통합 테스트 통과          - 전체 문서 완성
                                - 아키텍처 문서화           - CI/CD 파이프라인 가동
```

### 품질 게이트

| 게이트 | 시점 | 체크 항목 |
|--------|------|----------|
| pre-commit | 커밋 전 | lint, format, types, 시크릿 스캔 |
| pre-merge | 머지 전 | 80% 커버리지, 리뷰 필수, 변경로그 필수 |
| pre-build | Phase 3 → 3.5 | content.json 스키마, tokens.css 완성도, PLACEHOLDER 없음 |
| pre-deploy | Phase 3.5 → 4 | 전체 검증 통과, 사이트 빌드, 배포 설정 존재 |
| pre-release | 릴리스 전 | 80% 커버리지, 보안 스캔, 전체 문서화 |
| post-release | 릴리스 후 | Sprint 아카이브, 릴리스 노트, 회고 프롬프트 |

</details>

<details>
<summary><strong>슬래시 커맨드</strong></summary>

### 크래프트 파이프라인

| 커맨드 | 설명 |
|--------|------|
| `/craft` | 전체 파이프라인 실행 (Phase 1→4) |
| `/craft-analyze` | Phase 1만: 코드, 스토리, 스택 분석 |
| `/craft-design` | Phase 2만: 분석으로부터 디자인 프로파일 생성 |
| `/craft-preview` | 로컬 빌드 + 미리보기 서버 |
| `/craft-deploy` | GitHub Pages, Vercel, Netlify 배포 |
| `/craft-sync` | 메인 포트폴리오와 데이터 동기화 |
| `/craft-state` | 프로젝트 상태 조회/로그/리셋/재개/일시정지 |
| `/craft-export` | 프로젝트 데이터 내보내기 |

### 개발 라이프사이클

| 커맨드 | 설명 |
|--------|------|
| `/feature` | 기능 개발 워크플로우 (Phase + Sprint + Git + 문서) |
| `/bugfix` | 버그 수정 워크플로우 (이슈 분석 → 수정 → PR) |
| `/release` | 릴리스 관리 (버전 관리 + 문서 정리 + 배포) |
| `/phase` | Phase 상태 확인/전환/진행률 |
| `/dev-doc-planner` | 문서 계획 (PRD, TECH-SPEC, PROGRESS 템플릿) |
| `/git-workflow` | Git 워크플로우 관리 (브랜치 전략, 커밋 컨벤션) |
| `/notion` | Notion 양방향 동기화 (sync, push, pull, status, diff, init) |

</details>

<details>
<summary><strong>템플릿 스택</strong></summary>

포트폴리오 사이트는 프로젝트 특성에 따라 선택된 프레임워크별 템플릿으로 빌드됩니다:

| 템플릿 | 스택 | 적합한 프로젝트 |
|--------|------|----------------|
| sveltekit-dashboard | SvelteKit | 인터랙티브 대시보드, 워크플로우 시각화, 애니메이션 |
| astro-landing | Astro | 정적 제품 랜딩, 리서치 쇼케이스, 제로 JS 기본 |

템플릿 선택은 `stack-detector` 분석 결과로 자동 결정되며, `design-profile.yaml`에서 수동 오버라이드 가능.

</details>

---

## 요구사항

**`.claude/` 기능 사용 (복사 방식):**

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) — 이것만 있으면 됩니다

**`install.sh` 추가 요구:**

- `jq` — settings.json 병합을 위한 JSON 처리
- `bash` 4.0+ — 훅 실행

**선택 (확장 오케스트레이션):**

- [Codex CLI](https://github.com/openai/codex) — 코드 분석 및 검증 (Phase 1, 3.5)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) — 디자인 및 시각화 (Phase 2, 3)
- [GitHub CLI (gh)](https://cli.github.com/) — 이슈/PR/릴리스 관리
- Node.js 18+ — 대시보드 및 SvelteKit/Astro 템플릿 빌드

선택 CLI가 설치되지 않으면 모든 작업이 자동으로 Claude Code로 폴백됩니다.

---

## 라이선스

MIT

# Development Lifecycle: MVP → PoC → Production

프로덕션 레벨 소프트웨어 개발의 전주기를 3단계(MVP → PoC → Production)로 정의하고, 각 단계의 목표, 파이프라인, 품질 기준, 전환 조건을 명세합니다.

---

## Overview

```
MVP                           PoC                            Production
"이게 문제를 해결하나?"          "이게 실제로 동작하나?"            "이게 24/7 운영 가능한가?"
━━━━━━━━━━━━━━━━━━━━         ━━━━━━━━━━━━━━━━━━━━           ━━━━━━━━━━━━━━━━━━━━

속도 > 품질                    검증 > 속도                      안정성 > 모든 것
P0 기능만                      P0 + P1 기능                     P0 + P1 + P2
Happy path 테스트              통합 + 사용자 테스트               전체 테스트 스위트
로컬/dev 환경                  Staging 환경                     Dev/Staging/Prod
수동 배포 OK                   반자동 배포                       완전 자동 CI/CD
모니터링 없음                   기본 모니터링                     풀 Observability
문서 최소한                     문서 보강                        문서 완성

Gate ────────────────→ Gate ────────────────→ Gate
"핵심 기능이 동작하는가?"      "사용자가 쓸 수 있는가?"         "운영 준비 완료인가?"
```

---

## 10-Stage Production Development Lifecycle

실제 프로덕션 환경에서의 개발 전주기는 10단계로 구성됩니다. 각 단계는 MVP/PoC/Production 중 어느 시점에서 활성화되는지가 다릅니다.

```
Stage    이름                    MVP    PoC    Production
─────    ────                    ───    ───    ──────────
  1      Discovery & Validation   ●      ●        ●
  2      Product Planning          ●      ●        ●
  3      Architecture & Design     ◐      ●        ●
  4      Environment Setup         ○      ◐        ●
  5      Development (Iterative)   ●      ●        ●
  6      Testing (Multi-layer)     ◐      ◐        ●
  7      Deployment & Release      ◐      ◐        ●
  8      Monitoring & Operations   ○      ◐        ●
  9      Post-Launch Operations    ○      ○        ●
 10      Feedback & Evolution      ◐      ●        ●

● = 전체 수행  ◐ = 부분 수행  ○ = 해당 없음
```

---

## Stage 1: Discovery & Validation

### 목적
만들어야 하는지, 무엇을 만들어야 하는지 검증

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| 문제 정의 | ● | ● | ● |
| 사용자 인터뷰 / 대화 | ● | ● | ● |
| 시장 조사 / 경쟁사 분석 | ○ | ◐ | ● |
| 비즈니스 케이스 / ROI | ○ | ◐ | ● |
| 기존 시스템 분석 | ● | ● | ● |
| PoC / 프로토타입 검증 | ○ | ○ | ● |

### 산출물
- `DISCOVERY.md` — 프로젝트 개요, P0/P1/P2 요구사항, 기술스택, 복잡도 평가

### 다음 단계 연결
- DISCOVERY.md → Stage 2 (Product Planning)

---

## Stage 2: Product Planning

### 목적
무엇을 만들지 구체화하고 우선순위를 정함

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| PRD 작성 (P0 상세) | ● | ● | ● |
| PRD 보강 (P1/P2 상세) | ○ | ● | ● |
| 사용자 스토리 매핑 | ◐ | ● | ● |
| 우선순위 정의 (RICE/MoSCoW) | ◐ | ● | ● |
| 로드맵 작성 | ○ | ◐ | ● |
| 프로토타이핑 / 와이어프레임 | ○ | ◐ | ● |
| 스테이크홀더 리뷰 | ○ | ◐ | ● |

### 산출물
- `PRD.md` — 제품 요구사항 문서
- `PROGRESS.md` — Phase 마일스톤 테이블
- `CONTEXT.md` — 토큰 최적화 세션 스타터

### 다음 단계 연결
- PRD.md → Stage 3 (Architecture & Design)

---

## Stage 3: Architecture & Design

### 목적
어떻게 만들지 기술적으로 설계

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| 시스템 설계 (HLD) | ◐ | ● | ● |
| 상세 설계 (LLD) | ○ | ◐ | ● |
| API 설계 (OpenAPI Spec) | ○ | ● | ● |
| DB 스키마 설계 | ◐ | ● | ● |
| DB Migration 파일 생성 | ○ | ● | ● |
| 인프라 설계 (IaC) | ○ | ○ | ● |
| 보안 아키텍처 | ○ | ◐ | ● |
| 성능 SLA 정의 | ○ | ◐ | ● |
| ADR (아키텍처 결정 기록) | ○ | ● | ● |

### 산출물
- `TECH-SPEC.md` — 아키텍처, 컴포넌트, 데이터 모델
- `openapi.yaml` (PoC+) — API 명세
- `docs/adr/ADR-N-*.md` (PoC+) — 아키텍처 결정 기록

### 다음 단계 연결
- TECH-SPEC.md → Stage 4 (Environment Setup) + Stage 5 (Development)

---

## Stage 4: Environment Setup

### 목적
코드가 실행될 환경을 구축

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| 로컬 개발 환경 | ● | ● | ● |
| CI 파이프라인 (lint + test + build) | ○ | ● | ● |
| Staging 환경 | ○ | ● | ● |
| Production 환경 | ○ | ○ | ● |
| Docker / 컨테이너화 | ○ | ◐ | ● |
| K8s / 오케스트레이션 | ○ | ○ | ● |
| Secret 관리 (Vault 등) | ○ | ◐ | ● |
| 모니터링 스택 셋업 | ○ | ◐ | ● |
| Feature Flag 시스템 | ○ | ○ | ● |
| CD 파이프라인 (멀티 환경) | ○ | ○ | ● |

### 산출물
- `.github/workflows/ci.yml` (PoC+)
- `Dockerfile`, `docker-compose.yml` (PoC+)
- `infra/` — Terraform/Pulumi (Production)
- `.env.example` — 환경변수 템플릿

### 다음 단계 연결
- 환경 준비 완료 → Stage 5 (Development)

---

## Stage 5: Development (Iterative)

### 목적
실제 코드 구현

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| Sprint 계획 | ◐ | ● | ● |
| 코드 구현 | ● | ● | ● |
| 코드 리뷰 | ○ | ● | ● (2인+) |
| TDD/BDD | ○ | ◐ | ● |
| Pair Programming | ○ | ◐ | ◐ |
| CI 통합 | ○ | ● | ● |
| 기술 부채 추적 | ○ | ● | ● |

### 산출물
- 소스 코드
- 테스트 코드
- Conventional Commits 히스토리
- Sprint 백로그 / 번다운

### 다음 단계 연결
- 코드 완성 → Stage 6 (Testing) → Stage 7 (Deployment)

---

## Stage 6: Testing (Multi-layer)

### 목적
코드가 올바르게 동작하는지 다층 검증

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| Unit Test | ● | ● | ● |
| Integration Test | ○ | ● | ● |
| E2E Test | ○ | ◐ | ● |
| 성능 / 부하 테스트 | ○ | ◐ | ● |
| 보안 테스트 (SAST) | ○ | ● | ● |
| 보안 테스트 (DAST) | ○ | ○ | ● |
| 접근성 테스트 | ○ | ○ | ● |
| Chaos Engineering | ○ | ○ | ◐ |
| UAT (사용자 검증) | ○ | ● | ● |

### 커버리지 기준

| Stage | Unit | Integration | E2E | 전체 |
|-------|:----:|:-----------:|:---:|:----:|
| MVP | 30%+ | - | - | 30% |
| PoC | 50%+ | 40%+ | 주요 경로 | 60% |
| Production | 70%+ | 60%+ | 전체 경로 | 80% |

### 산출물
- 테스트 코드 (`tests/unit/`, `tests/integration/`, `tests/e2e/`)
- 커버리지 리포트
- 성능 기준선 문서 (PoC+)
- 보안 스캔 결과 (PoC+)

---

## Stage 7: Deployment & Release

### 목적
코드를 사용자가 접근할 수 있는 환경에 배포

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| 버전 관리 (semver) | ◐ | ● | ● |
| CHANGELOG 작성 | ○ | ● | ● |
| GitHub Release | ○ | ● | ● |
| 수동 배포 | ● | ○ | ○ |
| Staging 배포 | ○ | ● | ● |
| Production 배포 | ○ | ○ | ● |
| Blue/Green 또는 Canary | ○ | ○ | ● |
| DB Migration 실행 | ○ | ● | ● |
| Feature Flag 롤아웃 | ○ | ○ | ● |
| Rollback 계획 / 실행 | ○ | ◐ | ● |
| Smoke Test (배포 후) | ○ | ◐ | ● |

### 산출물
- Git Tag + GitHub Release
- CHANGELOG.md
- 배포 기록
- Rollback 계획서 (Production)

---

## Stage 8: Monitoring & Operations

### 목적
배포된 시스템이 정상 동작하는지 지속 확인

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| 에러 추적 (Sentry 등) | ○ | ● | ● |
| APM (Datadog 등) | ○ | ○ | ● |
| 로그 수집 (ELK 등) | ○ | ◐ | ● |
| 알림 시스템 (PagerDuty 등) | ○ | ○ | ● |
| SLA 모니터링 | ○ | ○ | ● |
| 대시보드 | ○ | ◐ | ● |
| 인시던트 대응 프로세스 | ○ | ○ | ● |
| On-call 로테이션 | ○ | ○ | ● |

### 산출물
- `RUNBOOK.md` — 운영 매뉴얼 (Production)
- `INCIDENT-RESPONSE.md` — 인시던트 대응 절차 (Production)
- `SLA.md` — SLA 정의 (Production)
- 알림 규칙 설정
- 모니터링 대시보드

---

## Stage 9: Post-Launch Operations

### 목적
출시 후 지속적인 개선과 유지보수

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| A/B 테스트 | ○ | ○ | ● |
| 사용자 분석 | ○ | ◐ | ● |
| 성능 최적화 | ○ | ◐ | ● |
| 기술 부채 관리 | ○ | ● | ● |
| 보안 패칭 | ○ | ◐ | ● |
| CVE 모니터링 | ○ | ○ | ● |
| 컴플라이언스 감사 | ○ | ○ | ● |
| 정기 점검 | ○ | ○ | ● |

### 산출물
- `TECH-DEBT.md` — 기술 부채 추적
- `SECURITY-AUDIT.md` — 보안 감사 결과 (Production)
- `MAINTENANCE-SCHEDULE.md` — 정기 점검 일정 (Production)

---

## Stage 10: Feedback & Evolution

### 목적
학습하고 다음 사이클에 반영

### 활동

| 활동 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| Sprint Retrospective | ○ | ● | ● |
| Post-mortem | ○ | ◐ | ● |
| 버그 Triage | ● | ● | ● |
| 사용자 피드백 수집 | ○ | ● | ● |
| 학습 기록 (LEARNINGS.md) | ◐ | ● | ● |
| ADR 작성 | ○ | ● | ● |
| 지식 → 행동 반영 | ○ | ◐ | ● |

### 산출물
- `docs/feedback/LEARNINGS.md`
- `docs/adr/ADR-N-*.md`
- `docs/retros/sprint-N-retro.md`
- 다음 Sprint 백로그 피드

---

## Stage Transition Gates

### MVP → PoC Gate

```yaml
mvp_gate:
  required:
    - core_feature_works: true        # P0 기능이 실제로 동작
    - can_demo: true                  # 시연 가능
    - no_critical_bugs: true          # Critical 버그 0개
    - basic_tests_pass: true          # Happy path 테스트 통과

  recommended:
    - tech_debt_documented: true      # 기술 부채 기록됨
    - user_feedback_plan: true        # 피드백 수집 계획 존재

  produces:
    - docs/gates/MVP-GATE-REPORT.md
    - docs/MVP-RETROSPECTIVE.md
    - docs/TECH-DEBT.md
```

### PoC → Production Gate

```yaml
poc_gate:
  required:
    - test_coverage_60: true          # 커버리지 60% 이상
    - no_critical_high_bugs: true     # Critical/High 버그 0개
    - security_scan_pass: true        # SAST 통과, 취약 dependency 0
    - staging_stable_72h: true        # Staging 72시간 안정 운영
    - user_validation_complete: true  # 사용자 검증 완료
    - api_spec_exists: true           # API 명세 존재
    - db_migration_exists: true       # DB 마이그레이션 파일 존재
    - ci_pipeline_green: true         # CI 전체 통과
    - performance_baseline_set: true  # 성능 기준선 측정 완료

  recommended:
    - load_test_done: true            # 부하 테스트 완료
    - rollback_plan_exists: true      # 롤백 계획 문서화
    - runbook_exists: true            # 운영 런북 존재
    - tech_debt_under_threshold: true # 기술 부채 임계값 이하

  produces:
    - docs/gates/POC-GATE-REPORT.md
    - docs/POC-RETROSPECTIVE.md
    - docs/PRODUCTION-READINESS.md
    - docs/RUNBOOK.md
```

---

## Stage별 Quality Gate 기준 요약

| 항목 | MVP | PoC | Production |
|------|:---:|:---:|:----------:|
| 테스트 커버리지 | 30% | 60% | 80% |
| 코드 리뷰 | 선택 | 필수 (1인) | 필수 (2인+) |
| CI 파이프라인 | 없거나 기본 | 필수 (lint+test+build) | 풀 (멀티 환경) |
| 보안 검사 | secrets 스캔 | SAST + dependency | SAST + DAST + 침투 |
| DB | 임시 (SQLite/JSON) | 확정 스키마 + migration | 백업 + 복구 테스트 |
| 인프라 | 로컬/Vercel | Staging | Dev + Staging + Prod |
| 모니터링 | console.log | 에러 추적 (Sentry) | APM + 로그 + 알림 |
| 문서 | PRD + TECH-SPEC (간략) | 상세화 + API spec | 전체 완성 + 런북 |
| 배포 | 수동 | 반자동 (CI → Staging) | 완전 자동 + 롤백 |

---

## Lifecycle Settings 구조

```jsonc
{
  "lifecycle": {
    "current_stage": "mvp",
    "stages": {
      "mvp": {
        "quality_gate": {
          "test_coverage": 30,
          "require_review": false,
          "security_checks": ["secrets"],
          "ci_required": false
        },
        "phases": [1],
        "priority_scope": ["P0"],
        "deploy_target": "local"
      },
      "poc": {
        "quality_gate": {
          "test_coverage": 60,
          "require_review": true,
          "security_checks": ["secrets", "sast", "dependencies"],
          "ci_required": true
        },
        "phases": [1, 2, 3],
        "priority_scope": ["P0", "P1"],
        "deploy_target": "staging"
      },
      "production": {
        "quality_gate": {
          "test_coverage": 80,
          "require_review": true,
          "min_reviewers": 2,
          "security_checks": ["secrets", "sast", "dast", "dependencies", "penetration"],
          "ci_required": true,
          "require_staging_pass": true
        },
        "phases": [1, 2, 3, 4, 5],
        "priority_scope": ["P0", "P1", "P2"],
        "deploy_target": "production"
      }
    }
  }
}
```

---

## Lifecycle 명령어

```bash
# 현재 상태 확인
/lifecycle status

# Stage 전환 (gate 자동 검증)
/lifecycle promote poc
/lifecycle promote production

# Gate 검증만 (전환하지 않음)
/lifecycle gate-check poc
/lifecycle gate-check production

# Gate 리포트 생성
/lifecycle report
```

### /lifecycle promote 실행 시 자동 동작

```
1. Gate 검증 (required 항목 전체 체크)
   ├── FAIL → 미충족 항목 리포트 + 중단
   └── PASS ↓

2. 문서 생성
   ├── docs/gates/{STAGE}-GATE-REPORT.md
   └── docs/{STAGE}-RETROSPECTIVE.md (템플릿)

3. settings.json 업데이트
   └── lifecycle.current_stage 변경

4. Quality Gate 기준 자동 상향
   ├── test_coverage 상향
   ├── security_checks 추가
   └── require_review 변경

5. 신규 Phase 생성 (필요 시)

6. 환경 구축 권장사항 출력
```

---

## 전체 파이프라인 흐름

```
/init --full
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  MVP Stage                                            │
│                                                       │
│  Stage 1: Discovery → DISCOVERY.md                    │
│  Stage 2: Planning → PRD(P0), TECH-SPEC(간략)         │
│  Stage 5: Development → Phase 1 구현                  │
│  Stage 6: Testing → Happy path (30%)                  │
│  Stage 7: Deployment → 수동 배포 / 시연                │
│                                                       │
└─────────────────────┬────────────────────────────────┘
                      │
              /lifecycle promote poc
              (MVP Gate 검증)
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│  PoC Stage                                            │
│                                                       │
│  Stage 2: Planning → PRD 보강(+P1), API Spec          │
│  Stage 3: Architecture → TECH-SPEC 상세, DB 스키마     │
│  Stage 4: Environment → CI 파이프라인, Staging         │
│  Stage 5: Development → Phase 2-3, Sprint 운영        │
│  Stage 6: Testing → 통합 테스트, SAST, UAT (60%)      │
│  Stage 7: Deployment → Staging 배포                   │
│  Stage 8: Monitoring → 에러 추적 (Sentry)              │
│  Stage 10: Feedback → 사용자 피드백, Retro, ADR        │
│                                                       │
└─────────────────────┬────────────────────────────────┘
                      │
              /lifecycle promote production
              (PoC Gate 검증 — 가장 엄격)
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│  Production Stage                                     │
│                                                       │
│  Stage 3: Architecture → IaC, 보안 아키텍처            │
│  Stage 4: Environment → Prod 환경, CD, K8s            │
│  Stage 5: Development → Phase 4+, P2 기능             │
│  Stage 6: Testing → E2E, 부하, DAST, 침투 (80%)       │
│  Stage 7: Deployment → Blue/Green, Feature Flag       │
│  Stage 8: Monitoring → APM, 로그, 알림, 대시보드       │
│  Stage 9: Post-Launch → A/B, 보안 패칭, 부채 관리     │
│  Stage 10: Feedback → Post-mortem, 학습 반영           │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  운영 루프 (반복)                                │   │
│  │  모니터링 → 인시던트 → 핫픽스 → 피드백 → Sprint  │   │
│  └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 문서 산출물 전체 맵

```
docs/
├── DISCOVERY.md                    ← Stage 1 (MVP~)
├── PRD.md                          ← Stage 2 (MVP~)
├── TECH-SPEC.md                    ← Stage 3 (MVP~)
├── PROGRESS.md                     ← Stage 2 (MVP~)
├── CONTEXT.md                      ← Stage 2 (MVP~)
├── TECH-DEBT.md                    ← MVP Gate 이후
├── API-SPEC.md / openapi.yaml      ← Stage 3 (PoC~)
├── SECURITY-BASELINE.md            ← Stage 6 (PoC~)
├── PERFORMANCE-BASELINE.md         ← Stage 6 (PoC~)
├── PRODUCTION-READINESS.md         ← PoC Gate 이후
├── RUNBOOK.md                      ← Stage 8 (Production)
├── INCIDENT-RESPONSE.md            ← Stage 8 (Production)
├── SLA.md                          ← Stage 8 (Production)
├── DISASTER-RECOVERY.md            ← Stage 8 (Production)
├── SECURITY-AUDIT.md               ← Stage 9 (Production)
├── MAINTENANCE-SCHEDULE.md         ← Stage 9 (Production)
│
├── gates/
│   ├── MVP-GATE-REPORT.md          ← MVP → PoC 전환 시
│   └── POC-GATE-REPORT.md          ← PoC → Production 전환 시
│
├── phases/
│   ├── phase-1-mvp/                ← MVP
│   │   ├── SPEC.md
│   │   ├── TASKS.md
│   │   └── CHECKLIST.md
│   ├── phase-2-features/           ← PoC
│   ├── phase-3-stabilization/      ← PoC
│   ├── phase-4-production/         ← Production
│   └── phase-5-operations/         ← Production
│
├── sprints/
│   └── sprint-N/
│       ├── SPRINT.md
│       ├── BACKLOG.md
│       ├── DAILY.md
│       └── RETRO.md
│
├── feedback/
│   ├── LEARNINGS.md
│   └── USER-FEEDBACK.md            ← PoC~
│
├── adr/
│   └── ADR-N-*.md                  ← PoC~
│
├── retros/
│   └── sprint-N-retro.md
│
└── releases/
    └── vX.Y.Z-checklist.md
```

# MVP → PoC → Production: 기술 분야별 단계 적용 가이드

각 기술 분야(Frontend, Backend, DB, Infra, Security, Observability)가 MVP/PoC/Production 단계에서 **구체적으로 무엇을 하고, 어떤 수준까지 하는지** 명세합니다.

> 참고: 프로세스/관리 관점은 `DEVELOPMENT-LIFECYCLE.md` 참조
> 참고: 기술 분야 전체 설명은 `개발전주기.md` 참조

---

## 핵심 원칙

```
MVP:  "돌아가게 만들어라"   — 최소한만, 나중에 바꿀 각오로
PoC:  "검증할 수 있게 만들어라" — 사용자가 쓸 수 있는 수준으로
Prod: "운영할 수 있게 만들어라" — 장애에도 견디는 수준으로
```

---

## 1. Frontend

### MVP

| 항목 | 수준 | 예시 |
|------|------|------|
| 프레임워크 | 가장 익숙한 것 | Next.js / Vite + React |
| 스타일링 | 유틸리티 CSS | Tailwind CSS |
| 상태 관리 | 로컬 상태면 충분 | useState, useReducer |
| 라우팅 | 기본 페이지만 | 3-5 페이지 |
| 반응형 | 데스크톱 우선 | 모바일은 나중에 |
| 테스트 | 없거나 스모크만 | 주요 페이지 렌더링 확인 |
| 빌드 | 기본 설정 | Vite 기본값 |
| 배포 | Vercel / Netlify | 클릭 한 번 배포 |

```
MVP Frontend 체크리스트:
□ 핵심 화면 동작 (P0 기능 UI)
□ 기본 라우팅
□ API 연동 (fetch/axios)
□ 에러 표시 (최소한의 에러 바운더리)
```

### PoC

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| 컴포넌트 | 공통 컴포넌트 분리 | Button, Input, Modal 등 ui/ 폴더 |
| 상태 관리 | 전역 상태 도입 | Zustand 또는 Jotai |
| Data Fetching | 캐싱 레이어 | TanStack Query / SWR |
| 폼 | 유효성 검증 | React Hook Form + Zod |
| 반응형 | 모바일 대응 | 브레이크포인트 설정 |
| 접근성 | 기본 a11y | 시맨틱 HTML, alt 속성, 키보드 네비게이션 |
| 테스트 | 컴포넌트 + E2E | Vitest + Playwright (주요 경로) |
| 성능 | 기본 측정 | Lighthouse 점수 확인 |
| 에러 처리 | 사용자 친화적 | 에러 페이지, 토스트 알림 |

```
PoC Frontend 체크리스트:
□ MVP 체크리스트 전부
□ 공통 UI 컴포넌트 분리
□ 전역 상태 관리 (서버 상태 분리)
□ 폼 유효성 검증
□ 모바일 반응형
□ 기본 접근성 (시맨틱 HTML)
□ 컴포넌트 테스트 (주요 UI)
□ E2E 테스트 (핵심 사용자 흐름)
□ Lighthouse 70+ 점
```

### Production

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| 디자인 시스템 | 토큰 기반 | CSS 변수, 테마 시스템 |
| Storybook | 컴포넌트 문서화 | 모든 공통 컴포넌트 문서화 |
| 접근성 | WCAG 2.1 AA | axe-core 자동 테스트 |
| 성능 | Core Web Vitals 최적화 | LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| 빌드 최적화 | 코드 스플릿, 트리쉐이킹 | 번들 분석 (bundle-analyzer) |
| 시각적 회귀 | 스크린샷 비교 | Chromatic / Percy |
| 국제화 | i18n (필요 시) | i18next |
| 에러 추적 | Sentry 연동 | 프론트엔드 에러 자동 수집 |
| SEO | 메타 태그, 구조화 데이터 | next-seo, sitemap |

```
Production Frontend 체크리스트:
□ PoC 체크리스트 전부
□ 디자인 시스템 / 토큰 완성
□ Storybook 문서화
□ WCAG 2.1 AA 준수
□ Core Web Vitals 기준 충족
□ 번들 사이즈 최적화
□ 시각적 회귀 테스트
□ Sentry 에러 추적 연동
□ SEO 최적화 (해당 시)
```

---

## 2. Backend

### MVP

| 항목 | 수준 | 예시 |
|------|------|------|
| 프레임워크 | 가장 빠르게 | Express / FastAPI / Next.js API Routes |
| 아키텍처 | 단일 파일도 OK | 라우트 → 로직 → DB 직접 |
| 인증 | 최소한 | JWT + 단순 미들웨어 또는 NextAuth |
| DB 접근 | ORM 기본 | Prisma / Drizzle 기본 쿼리 |
| 에러 처리 | 글로벌 핸들러 | try-catch + 500 응답 |
| API 문서 | 없음 | Postman 컬렉션이면 충분 |
| 로깅 | console.log | 구조화 불필요 |
| 환경 변수 | .env 파일 | dotenv |

```
MVP Backend 체크리스트:
□ P0 API 엔드포인트 동작
□ 기본 인증 (로그인/로그아웃)
□ DB CRUD 동작
□ 글로벌 에러 핸들러
□ .env 기반 설정
```

### PoC

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| 아키텍처 | 모듈 분리 | Controller / Service / Repository 레이어 |
| 인증 | OAuth2 / RBAC | Refresh token, 역할 기반 접근 |
| **API 문서** | **OpenAPI spec** | **Swagger UI 자동 생성** |
| 유효성 검증 | DTO + validation | class-validator / Zod |
| 에러 처리 | 커스텀 에러 클래스 | AppError, NotFoundError, AuthError |
| 로깅 | 구조화 로그 | Pino / Winston (JSON 포맷) |
| **Rate Limiting** | **기본 적용** | express-rate-limit |
| 캐싱 | 기본 캐시 | Redis (세션, 빈번 조회) |
| 테스트 | API 테스트 | Supertest + Jest (주요 엔드포인트) |
| Health Check | /health 엔드포인트 | DB 연결 상태 포함 |

```
PoC Backend 체크리스트:
□ MVP 체크리스트 전부
□ 모듈화된 아키텍처 (Controller/Service 분리)
□ OpenAPI spec 존재
□ OAuth2 / RBAC 인증/인가
□ DTO 유효성 검증
□ 커스텀 에러 클래스
□ 구조화된 로깅 (JSON)
□ Rate Limiting 적용
□ API 테스트 (주요 엔드포인트)
□ /health 엔드포인트
```

### Production

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| 아키텍처 | Clean / Hexagonal | 도메인 분리, 의존성 역전 |
| 인증 | MFA, API Key 관리 | 세분화된 권한 (ABAC) |
| API 버저닝 | /v1/, /v2/ | 하위 호환성 보장 |
| 메시지 큐 | 비동기 처리 | BullMQ / SQS (이메일, 알림 등) |
| 캐싱 | 다계층 캐시 | Redis + HTTP Cache + CDN |
| 로깅 | 감사 로그 | 보안 이벤트, 데이터 변경 추적 |
| 에러 추적 | Sentry 연동 | 자동 에러 수집 + 알림 |
| Graceful Shutdown | 프로세스 관리 | SIGTERM 핸들링, 진행 중 요청 완료 |
| 부하 테스트 | 성능 검증 | k6 / Artillery |

```
Production Backend 체크리스트:
□ PoC 체크리스트 전부
□ Clean Architecture 적용
□ API 버저닝
□ MFA 지원
□ 비동기 처리 (메시지 큐)
□ 다계층 캐싱 전략
□ 감사 로그
□ Sentry 에러 추적
□ Graceful Shutdown
□ 부하 테스트 통과 (목표 TPS)
```

---

## 3. Database

### MVP

| 항목 | 수준 | 예시 |
|------|------|------|
| DB 선택 | 가장 간단한 것 | SQLite / Supabase (PostgreSQL) |
| 스키마 | 최소한 | 핵심 테이블 3-5개 |
| ORM | 기본 사용 | Prisma |
| Migration | 자동 (push) | `prisma db push` (PoC에서 migrate로 전환) |
| 인덱스 | PK/FK만 | 자동 생성된 것만 |
| 백업 | 없음 | 데이터 손실 감수 |
| Seed | 수동 | 테스트 데이터 직접 입력 |

```
MVP Database 체크리스트:
□ 핵심 테이블 정의
□ ORM 연결 동작
□ 기본 CRUD 동작
```

### PoC

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| DB 선택 | **Production과 동일 엔진** | PostgreSQL (SQLite 졸업) |
| 스키마 | **확정 + 정규화** | ERD 작성, 관계 명확화 |
| **Migration** | **버전 관리** | `prisma migrate dev` (되돌리기 가능) |
| 인덱스 | **쿼리 기반 추가** | 빈번 조회 컬럼에 인덱스 |
| **Seed** | **자동화** | seed 스크립트 (개발/테스트 데이터) |
| 백업 | **기본** | 일일 자동 백업 |
| 연결 관리 | Connection Pool | ORM 기본 Pool 설정 확인 |
| 테스트 | 테스트 DB 분리 | docker로 테스트 DB 자동 생성 |

```
PoC Database 체크리스트:
□ MVP 체크리스트 전부
□ PostgreSQL로 전환 (또는 Production 엔진)
□ ERD 문서 존재
□ Migration 버전 관리 (migrate, 되돌리기)
□ 쿼리 기반 인덱스 추가
□ Seed 스크립트 자동화
□ 일일 자동 백업
□ 테스트 DB 분리 (docker-based)
```

### Production

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| 고가용성 | Primary-Replica | 읽기 분산, 페일오버 |
| 백업 | PITR + 복구 테스트 | 복구 시간 SLA 정의 |
| 모니터링 | Slow query 추적 | pg_stat_statements, 알림 |
| 연결 관리 | PgBouncer | Connection Pool 최적화 |
| 보안 | 암호화, 접근 제어 | SSL 연결, 최소 권한 DB 유저 |
| 파티셔닝 | 대용량 테이블 | 날짜 기반 파티셔닝 (로그 등) |
| 마이그레이션 전략 | 무중단 | 점진적 스키마 변경 (expand-contract) |

```
Production Database 체크리스트:
□ PoC 체크리스트 전부
□ Primary-Replica 구성
□ PITR 백업 + 복구 테스트 완료
□ Slow query 모니터링 + 알림
□ PgBouncer / Connection Pool 최적화
□ DB 접근 SSL + 최소 권한 유저
□ 무중단 마이그레이션 전략 수립
□ 디스크/메모리/연결 수 모니터링
```

---

## 4. Infrastructure

### MVP

| 항목 | 수준 | 예시 |
|------|------|------|
| 호스팅 | PaaS | Vercel, Railway, Supabase |
| CI | 없음 | 로컬에서 직접 배포 |
| Docker | 없음 | 로컬 직접 실행 |
| 환경 | Dev만 | 로컬 = 프로덕션 |
| SSL | 자동 | Vercel/Railway가 제공 |
| 도메인 | 서브도메인 | app-name.vercel.app |

```
MVP Infrastructure 체크리스트:
□ PaaS에 배포 가능
□ HTTPS 동작
□ .env 기반 설정
```

### PoC

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| **CI** | **GitHub Actions** | lint → test → build 자동화 |
| **Docker** | **개발 환경** | docker-compose (app + DB + Redis) |
| 환경 | **Dev + Staging** | Staging 환경 분리 |
| 도메인 | 커스텀 도메인 | staging.example.com |
| SSL | Let's Encrypt | 커스텀 도메인용 |
| **Secret** | **환경변수 분리** | GitHub Secrets / .env.staging |
| CD | **반자동** | CI 통과 → Staging 자동 배포 |

```
PoC Infrastructure 체크리스트:
□ MVP 체크리스트 전부
□ CI 파이프라인 (lint + test + build)
□ docker-compose 개발 환경
□ Staging 환경 존재
□ 커스텀 도메인 + SSL
□ Secret 관리 (환경변수 분리)
□ Staging 자동 배포 (CD)
```

### Production

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| 환경 | Dev + Staging + Prod | 3-tier |
| **IaC** | **Terraform / Pulumi** | 인프라 코드 관리 |
| **K8s / ECS** | **컨테이너 오케스트레이션** | Auto-scaling, Rolling update |
| CD | **완전 자동** | approval gate → production 배포 |
| **Blue/Green** | **무중단 배포** | 또는 Canary |
| **Rollback** | **자동화** | 실패 시 이전 버전 복원 |
| CDN | 정적 자산 캐싱 | Cloudflare / CloudFront |
| 로드 밸런서 | 트래픽 분산 | ALB + health check |
| Secret | Vault / KMS | 중앙 집중 관리 |
| 비용 관리 | 모니터링 | AWS Cost Explorer, 예산 알림 |

```
Production Infrastructure 체크리스트:
□ PoC 체크리스트 전부
□ 3-tier 환경 (Dev + Staging + Prod)
□ IaC (Terraform/Pulumi)로 인프라 관리
□ 컨테이너 오케스트레이션 (K8s/ECS)
□ 완전 자동 CD (approval gate 포함)
□ 무중단 배포 (Blue/Green 또는 Canary)
□ 자동 Rollback
□ CDN + 로드 밸런서
□ 중앙 집중 Secret 관리
□ 비용 모니터링 + 예산 알림
```

---

## 5. Security

### MVP

| 항목 | 수준 | 예시 |
|------|------|------|
| 인증 | 기본 JWT | 또는 NextAuth 등 라이브러리 |
| 비밀번호 | bcrypt 해싱 | 평문 저장 절대 금지 |
| HTTPS | 필수 | PaaS가 자동 제공 |
| Secret | .env + .gitignore | 코드에 하드코딩 금지 |
| 입력 검증 | 기본 | SQL Injection 방지 (ORM 사용) |
| CORS | 설정 | 허용 도메인 제한 |

```
MVP Security 체크리스트:
□ 비밀번호 해싱 (bcrypt/argon2)
□ HTTPS 강제
□ .env가 .gitignore에 포함
□ ORM 사용 (SQL Injection 방지)
□ CORS 설정
□ 코드에 하드코딩된 Secret 없음
```

### PoC

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| 인증 | OAuth2 + Refresh token | 토큰 갱신, 세션 관리 |
| 인가 | RBAC | 역할별 접근 제어 |
| **SAST** | **자동 스캔** | Snyk / CodeQL (CI 연동) |
| **의존성 스캔** | **자동** | npm audit / Dependabot |
| **Secret 스캔** | **pre-commit hook** | gitleaks |
| CSP | 설정 | Content-Security-Policy 헤더 |
| Rate Limiting | 적용 | 로그인 + API 전체 |
| 보안 헤더 | Helmet | X-Frame-Options, X-Content-Type 등 |

```
PoC Security 체크리스트:
□ MVP 체크리스트 전부
□ OAuth2 + Refresh token
□ RBAC 인가
□ SAST 자동 스캔 (CI 연동)
□ 의존성 자동 스캔 (Dependabot)
□ gitleaks pre-commit hook
□ CSP 헤더 설정
□ Rate Limiting (로그인 + API)
□ 보안 헤더 (Helmet)
```

### Production

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| MFA | 선택적 또는 필수 | TOTP / WebAuthn |
| **DAST** | **런타임 스캔** | OWASP ZAP (CI 연동) |
| 침투 테스트 | 정기 실행 | 전문 업체 또는 자체 |
| WAF | 적용 | Cloudflare WAF / AWS WAF |
| 감사 로그 | 전체 기록 | 인증, 데이터 변경, 관리자 행위 |
| 암호화 | at-rest + in-transit | DB 암호화, TLS 1.3 |
| 컨테이너 보안 | 이미지 스캔 | Trivy (CI 연동) |
| 컴플라이언스 | 해당 규정 | SOC2 / GDPR / HIPAA |
| 보안 교육 | 팀 전체 | OWASP 교육, 피싱 훈련 |
| 인시던트 대응 | 보안 인시던트 플레이북 | 침해 대응 절차 |

```
Production Security 체크리스트:
□ PoC 체크리스트 전부
□ MFA 지원
□ DAST 자동 스캔 (CI 연동)
□ 정기 침투 테스트
□ WAF 적용
□ 감사 로그 (인증 + 데이터 변경)
□ DB 암호화 (at-rest)
□ TLS 1.3
□ 컨테이너 이미지 스캔 (Trivy)
□ 컴플라이언스 준수 (해당 시)
□ 보안 인시던트 대응 절차
```

---

## 6. Observability

### MVP

```
MVP에서는 Observability가 거의 없음.
console.log로 디버깅하고, 에러가 나면 직접 확인.
이것은 의도된 것임 — MVP에서 모니터링 인프라를 구축하는 것은 과도함.
```

### PoC

| 항목 | 수준 | 예시 |
|------|------|------|
| **에러 추적** | **Sentry** | 프론트 + 백엔드 연동 |
| 로깅 | 구조화 로그 | JSON 포맷, 요청 ID 포함 |
| Health Check | /health 엔드포인트 | DB + Redis 연결 상태 |
| 기본 알림 | 에러율 급증 | Sentry alert → Slack/Email |
| 기본 대시보드 | 에러 현황 | Sentry Dashboard |
| Uptime | 기본 모니터링 | UptimeRobot (무료) |

```
PoC Observability 체크리스트:
□ Sentry 연동 (Frontend + Backend)
□ 구조화된 로깅 (JSON, 요청 ID)
□ /health 엔드포인트
□ 에러 알림 → Slack/Email
□ Uptime 모니터링
```

### Production

| 항목 | 수준 변경 | 추가 사항 |
|------|---------|----------|
| **APM** | **Datadog / New Relic** | 응답 시간, 처리량, 에러율 |
| **로그 수집** | **중앙화** | ELK / Loki + Grafana |
| **메트릭** | **Prometheus + Grafana** | 커스텀 비즈니스 메트릭 포함 |
| **트레이싱** | **OpenTelemetry** | 분산 추적 (마이크로서비스 시) |
| **알림** | **다계층** | SEV1 → PagerDuty, SEV2 → Slack |
| **대시보드** | **운영 대시보드** | SLA, 에러율, 응답시간, 처리량 |
| **상태 페이지** | **외부 공개** | Statuspage / Upptime |
| **인시던트 대응** | **프로세스 확립** | On-call, Runbook, Post-mortem |
| **SLO/SLA** | **정의 + 모니터링** | 가용성 99.9%, p99 < 500ms |
| **합성 모니터링** | **외부 체크** | Checkly (주요 흐름 정기 테스트) |

```
Production Observability 체크리스트:
□ PoC 체크리스트 전부
□ APM 연동
□ 중앙화된 로그 수집
□ Prometheus + Grafana 메트릭
□ 분산 추적 (해당 시)
□ 다계층 알림 (SEV1/2/3)
□ 운영 대시보드
□ 외부 상태 페이지
□ On-call 로테이션
□ Runbook 존재
□ SLO/SLA 정의 + 모니터링
□ 합성 모니터링 (주요 흐름)
□ 인시던트 대응 프로세스 + Post-mortem 템플릿
```

---

## 7. Testing (단계별 전략)

### MVP

```
테스트 전략: "핵심 경로만 확인"
커버리지 목표: 30%

├── Unit Test: 핵심 비즈니스 로직 함수만 (5-10개)
├── Integration: 없음
├── E2E: 없음
└── 수동 테스트: 주요 시나리오 수동 확인
```

### PoC

```
테스트 전략: "사용자 경로 보장"
커버리지 목표: 60%

├── Unit Test: 서비스 레이어 전체 + 주요 유틸리티 (50%+)
├── Integration: API 엔드포인트 (주요 CRUD) (40%+)
├── E2E: 핵심 사용자 흐름 3-5개 (Playwright)
├── 보안: SAST (CI 자동)
├── 성능: 기본 부하 테스트 (k6, 100 VU)
└── UAT: 실사용자 3-5명 검증
```

### Production

```
테스트 전략: "전체 신뢰도 보장"
커버리지 목표: 80%

├── Unit Test: 전체 비즈니스 로직 (70%+)
├── Integration: 모든 API + 외부 서비스 연동 (60%+)
├── E2E: 전체 사용자 흐름 (Playwright)
├── 시각적 회귀: 스크린샷 비교 (Chromatic)
├── 보안: SAST + DAST + 의존성 + 침투
├── 성능: 목표 TPS 검증 (k6, 1000+ VU)
├── 접근성: WCAG 2.1 AA 자동 테스트 (axe)
├── Chaos: 장애 주입 테스트 (선택적)
└── 합성 모니터링: 프로덕션 정기 테스트 (Checkly)
```

---

## 단계별 비용/복잡도 증가

```
                    MVP         PoC          Production
                    ────        ────         ──────────
인프라 비용          $0-20/월    $50-200/월   $200-2000+/월
관리 도구           0-1개       3-5개        10-15개
CI/CD 시간          없음        5-10분       15-30분
환경 수             1 (로컬)    2 (Dev+Stg)  3 (Dev+Stg+Prod)
팀 크기             1명         1-3명        3-10명
설정 파일 수        ~5개        ~15개        ~30개+
문서 페이지         3-5장       10-15장      20-30장+
```

---

## Stage 전환 시 기술 마이그레이션

### MVP → PoC 마이그레이션

```
필수 마이그레이션:
├── DB: SQLite → PostgreSQL (스키마 재생성)
├── 인증: 기본 JWT → OAuth2 + Refresh token
├── 테스트: 없음 → Unit + Integration + E2E 기본
├── CI: 없음 → GitHub Actions (lint + test + build)
├── Secret: .env → GitHub Secrets + .env.staging
├── 로깅: console.log → 구조화 로그 (Pino/Winston)
├── 에러: try-catch → 커스텀 에러 + Sentry
└── 보안: 없음 → SAST + Dependabot + gitleaks

권장 마이그레이션:
├── Docker: 로컬 직접 → docker-compose 개발 환경
├── API 문서: 없음 → OpenAPI spec
├── 캐싱: 없음 → Redis (세션, 빈번 조회)
└── 상태 관리: useState → Zustand/Jotai
```

### PoC → Production 마이그레이션

```
필수 마이그레이션:
├── 인프라: PaaS/Staging → IaC + K8s/ECS + Production
├── CD: 반자동 → 완전 자동 (approval gate)
├── 배포: 직접 → Blue/Green + 자동 Rollback
├── 보안: SAST → + DAST + 침투 + WAF + 감사 로그
├── 모니터링: Sentry → + APM + 로그 중앙화 + 알림
├── DB: 단일 → Primary-Replica + 백업/복구 테스트
├── 테스트: 60% → 80% (+ 부하 + 접근성 + 시각적 회귀)
└── 문서: 부분 → 완성 (Runbook, SLA, 인시던트 대응)

권장 마이그레이션:
├── 아키텍처: 모듈 분리 → Clean Architecture
├── 메시지 큐: 없음 → BullMQ/SQS
├── Feature Flag: 없음 → 점진적 롤아웃
├── CDN: 없음 → Cloudflare/CloudFront
└── 상태 페이지: 없음 → Statuspage/Upptime
```

---

## 전체 체크리스트 요약

### MVP (총 ~15항목)

```
□ Frontend: P0 화면 동작, 기본 라우팅, API 연동
□ Backend: P0 API, 기본 인증, CRUD, 에러 핸들러
□ Database: 핵심 테이블, ORM 연결, 기본 CRUD
□ Infra: PaaS 배포, HTTPS
□ Security: 비밀번호 해싱, .gitignore, ORM, CORS
□ Observability: (없음 — 의도적)
□ Testing: 핵심 로직 unit test (30%)
```

### PoC (총 ~50항목)

```
□ Frontend: + 컴포넌트 분리, 전역 상태, 반응형, a11y, E2E
□ Backend: + 모듈화, OpenAPI, OAuth2, Rate Limiting, 구조화 로그
□ Database: + PostgreSQL, ERD, Migration 버전관리, Seed, 백업
□ Infra: + CI, docker-compose, Staging, CD(반자동)
□ Security: + SAST, Dependabot, gitleaks, CSP, Helmet
□ Observability: + Sentry, 구조화 로그, /health, 에러 알림
□ Testing: Unit + Integration + E2E + SAST (60%)
```

### Production (총 ~100항목)

```
□ Frontend: + 디자인 시스템, Storybook, WCAG AA, CWV, 시각적 회귀
□ Backend: + Clean Arch, MFA, API 버저닝, 메시지 큐, 감사 로그, 부하 테스트
□ Database: + Replica, PITR, Slow query 모니터링, PgBouncer, 무중단 migration
□ Infra: + IaC, K8s/ECS, Blue/Green, 자동 Rollback, CDN, 비용 관리
□ Security: + DAST, 침투 테스트, WAF, 컨테이너 스캔, 컴플라이언스
□ Observability: + APM, 로그 중앙화, 메트릭, 알림, 대시보드, On-call, Runbook, SLA
□ Testing: 전체 80% + 부하 + 접근성 + 시각적 회귀 + 합성 모니터링
```

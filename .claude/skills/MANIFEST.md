# Skill Manifest

> Compact routing index for 32 skills. Load individual SKILL.md files only when matched.

## Internal Skills (28)

| Skill | Category | Keywords (KO) | Keywords (EN) | Purpose |
|-------|----------|--------------|---------------|---------|
| init | Project Setup | 초기화, 새 프로젝트, 시작 | init, initialize, new project, setup | 프로젝트 초기화 (6 modes) |
| brainstorming | Project Setup | 브레인스토밍, 아이디어, 발상 | brainstorm, idea, explore | 아이디어 발상/정제/검증 |
| prompt-enhancer | Project Setup | 프롬프트 향상, 컨텍스트 | prompt, enhance, context | 프로젝트 컨텍스트 기반 프롬프트 향상 |
| doc-confirm | Project Setup | 문서 확인, 생성 확인 | doc confirm, preview, generate docs | 문서 생성 확인 플로우 |
| sprint | Agile | 스프린트, 번다운, 속도 | sprint, velocity, burndown, retro | Sprint 관리 (velocity, burndown, retro) |
| agile-sync | Agile | 애자일, 동기화, 변경로그 | agile, sync, changelog, readme stats | Agile 산출물 동기화 |
| quality-gate | Quality | 품질, 게이트, 검증 | quality, gate, pre-commit, pre-merge | 자동 품질 게이트 (commit/merge/release) |
| validate | Quality | 검증, 설정 확인 | validate, check, config verify | 설정/구성 검증 |
| repair | Quality | 복구, 수리, 에러 | repair, fix, recover, error | 자동 복구, 문제 해결 |
| sync-fix | Quality | 동기화 복구, 불일치 | sync fix, inconsistency, mismatch | Phase/Sprint/문서 동기화 복구 |
| feedback-loop | Documentation | 피드백, 학습, ADR, 회고 | feedback, learning, ADR, retro | 학습/ADR/회고 수집 |
| dev-doc-system | Documentation | 문서 시스템, 개발 기록 | doc system, dev records, direction | 개발 문서 통합 관리 |
| readme-sync | Documentation | README 동기화 | readme sync, auto readme | README 자동 동기화 |
| context-optimizer | Performance | 컨텍스트, 토큰, 최적화 | context, token, optimize, budget | 토큰 최적화, 컨텍스트 관리 |
| analytics | Monitoring | 통계, 사용량, 메트릭 | analytics, metrics, statistics | 도구 사용 통계 시각화 |
| ccusage | Monitoring | 토큰 사용량, 비용 | ccusage, token usage, cost, billing | Claude/Codex 토큰 사용량 추적 |
| gh | Git/GitHub | 깃허브, 이슈, CI | gh, github, issue, CI, workflow | GitHub CLI 통합 |
| codex | Multi-CLI | 코덱스, 코드 검증 | codex, code review, validation | Codex CLI 호출 (분석/검증) |
| gemini | Multi-CLI | 제미나이, 디자인, UI | gemini, design, UI, visual | Gemini CLI 호출 (디자인/시각화) |
| codex-claude-loop | Multi-CLI | 듀얼 AI, 교차 검증 | dual AI, cross review, codex loop | 듀얼 AI 루프 (Claude + Codex) |
| consensus-engine | Multi-CLI | 합의, 멀티 LLM | consensus, multi-LLM, voting | 멀티 LLM 합의 엔진 |
| notion | Integration | 노션, 동기화 | notion, sync, push, pull | Notion 양방향 동기화 |
| skill-creator | Meta | 스킬 생성, 새 스킬 | create skill, new skill | 새 Skill 생성 가이드 |
| subagent-creator | Meta | 에이전트 생성, 서브에이전트 | create agent, sub-agent | 새 Agent 생성 가이드 |
| hook-creator | Meta | 훅 생성, 새 훅 | create hook, new hook | 새 Hook 생성 가이드 |
| slash-command-creator | Meta | 커맨드 생성, 슬래시 | create command, slash command | 새 Command 생성 가이드 |
| meta-prompt-generator | Meta | 프롬프트 생성, 워크플로우 | meta prompt, generate prompt, workflow | 구조화된 슬래시 커맨드 자동 생성 |
| skill-manager | Meta | 스킬 관리, 배포, 마켓 | skill manage, deploy, marketplace | 스킬 배포, 마켓플레이스, 버전 관리 |
| code-changelog | Meta | 코드 변경, 리뷰 기록 | code changelog, change log, review | 코드 변경사항 기록 + HTML 뷰어 |

## External Skills (4)

| Skill | Source | Keywords (KO) | Keywords (EN) | Purpose |
|-------|--------|--------------|---------------|---------|
| stitch-skills | google-labs-code | 스티치, 디자인 시스템 | stitch, design system, react components | Google Labs UI/디자인 자동화 6종 |
| remotion | remotion-dev | 비디오, 영상, MP4 | remotion, video, MP4, animation | React 기반 프로그래매틱 비디오 생성 |
| claude-office | tfriedel | 오피스, PPTX, DOCX | office, pptx, docx, xlsx, pdf | Office 문서 자동화 (PPTX/DOCX/XLSX/PDF) |

## Category Index

| Category | Skills | Count |
|----------|--------|-------|
| Project Setup | init, brainstorming, prompt-enhancer, doc-confirm | 4 |
| Agile | sprint, agile-sync | 2 |
| Quality | quality-gate, validate, repair, sync-fix | 4 |
| Documentation | feedback-loop, dev-doc-system, readme-sync | 3 |
| Performance | context-optimizer | 1 |
| Monitoring | analytics, ccusage | 2 |
| Git/GitHub | gh | 1 |
| Multi-CLI | codex, gemini, codex-claude-loop, consensus-engine | 4 |
| Integration | notion | 1 |
| Meta | skill-creator, subagent-creator, hook-creator, slash-command-creator, meta-prompt-generator, skill-manager, code-changelog | 7 |
| External | stitch-skills, remotion, claude-office | 3 |
| **Total** | | **32** |

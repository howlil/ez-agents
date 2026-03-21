# Roadmap: EZ Agents Multi-Model

## Overview

EZ Agents is a meta-prompting, context engineering, and spec-driven development system for AI coding assistants. The project provides structured context management, multi-agent orchestration, and atomic git workflows to prevent context rot in AI-assisted development.

## Milestones

- ✅ **v1.0 EZ Multi-Model** — Phases 1–8 (shipped 2026-03-18)
- ✅ **v1.1 Gap Closure Sprint** — Phases 9–14 (shipped 2026-03-18)
- ✅ **v2.0 Full SDLC Coverage** — Phases 15–29 (shipped 2026-03-20)
- ◆ **v2.1 Gap Closure** — Phases 30–33 (started 2026-03-20)
- ○ **v3.0 AI App Builder** — Phases 34–41 (deferred until v2.1 complete)

See `.planning/milestones/` for full archives.

## Phases

<details>
<summary>✅ v1.0 EZ Multi-Model (Phases 1–8) — SHIPPED 2026-03-18</summary>

- [x] Phase 1: Foundation & Safety Nets (4/4 plans) — completed 2026-03-17
- [x] Phase 2: Security Hardening (4/4 plans) — completed 2026-03-17
- [x] Phase 3: Git Workflow & Pre-commit Automation (6/6 plans) — completed 2026-03-17
- [x] Phase 4: Cross-Platform Compatibility (4/4 plans) — completed 2026-03-17
- [x] Phase 5: Multi-Model Support (4/4 plans) — completed 2026-03-17
- [x] Phase 6: Error Handling & Retry Logic (4/4 plans) — completed 2026-03-17
- [x] Phase 7: Decoupling & Modularity (4/4 plans) — completed 2026-03-17
- [x] Phase 8: Gap Closure — Foundation & Safety Nets (6/6 plans) — completed 2026-03-18

</details>

<details>
<summary>✅ v1.1 Gap Closure Sprint (Phases 9–14) — SHIPPED 2026-03-18</summary>

- [x] Phase 9: Gap Closure — Security Hardening (4/4 plans) — completed 2026-03-18
- [x] Phase 10: Gap Closure — Git Workflow & Hooks (4/4 plans) — completed 2026-03-18
- [x] Phase 11: Gap Closure — Cross-Platform Compatibility (4/4 plans) — completed 2026-03-18
- [x] Phase 12: Gap Closure — Multi-Model Runtime Wiring (4/4 plans) — completed 2026-03-18
- [x] Phase 13: Gap Closure — Retry, Circuit Breaker & Error UX (4/4 plans) — completed 2026-03-18
- [x] Phase 14: Gap Closure — Decoupling, Plugins & Config Paths (4/4 plans) — completed 2026-03-18

</details>

<details>
<summary>✅ v2.0 Full SDLC Coverage (Phases 15–29) — SHIPPED 2026-03-20</summary>

- [x] Phase 15: Phase-Based Git Workflow — completed 2026-03-19
- [x] Phase 16: Context & File Access — completed 2026-03-19
- [x] Phase 17: Package Manager Flexibility — completed 2026-03-19
- [x] Phase 18: Session Memory & Model Continuity — completed 2026-03-20
- [x] Phase 19: Deployment & Operations — completed 2026-03-20 ⚠️ known gaps (DEPLOY-01 to DEPLOY-10)
- [x] Phase 20: CI/CD Pipeline Automation — completed 2026-03-20 (CICD-06 deferred)
- [x] Phase 21: Observability & Monitoring — completed 2026-03-20
- [x] Phase 22: Disaster Recovery & Business Continuity — completed 2026-03-20
- [x] Phase 23: Security Operations — completed 2026-03-20
- [x] Phase 24: Infrastructure as Code — completed 2026-03-20
- [x] Phase 25: Performance Engineering — completed 2026-03-20 ⚠️ PERF-05 to PERF-08 deferred
- [x] Phase 26: Documentation Automation — completed 2026-03-20
- [x] Phase 27: Product Analytics & Feedback — completed 2026-03-20 ⚠️ ANALYTICS-02 to ANALYTICS-06 deferred
- [x] Phase 28: Cost Optimization / FinOps — completed 2026-03-20 ⚠️ COST-02 to COST-06 deferred
- [x] Phase 29: GSD-2 Reliability Patterns — completed 2026-03-20 ⚠️ GSD-01 to GSD-16 CLI wiring deferred

</details>

### 📋 v2.1 Gap Closure — "Close the Gaps" (Active)

**Started:** 2026-03-20 | **Phases:** 30–33, 40 | **Requirements:** 36+

- [~] Phase 30: GSD Gap Closure — wire crash-recovery.cjs + cost-tracker.cjs, real CLI data (3/4 plans complete)
- [ ] Phase 31: Deploy Operations — one-command deploy (detect, run, rollback, status, audit, health check)
- [ ] Phase 32: Performance Tooling — perf-analyzer, db-optimizer, frontend-perf, api-monitor, regression-detector
- [ ] Phase 33: Analytics & FinOps — usage collection, NPS, funnels, cohorts, budget alerts, rightsizing, cost reports
- [~] Phase 40: Quality Gates Completion — 7-gate enforcement (GATE-05 testing, GATE-06 docs, GATE-07 release) (2/5 plans complete)

**Phase Details:**

**Phase 30: GSD Gap Closure**
Goal: Wire crash recovery and cost tracking to CLI with real data (replace all mock stubs)
Requirements: GSD-01–06
**Plans:** 4 plans

Plans:
- [x] 30-01-PLAN.md — Test scaffolds (Wave 0 failing tests for all 5 test files) — completed 2026-03-20
- [x] 30-02-PLAN.md — Create crash-recovery.cjs (PID lock files, heartbeat, orphan detection) — completed 2026-03-20
- [x] 30-03-PLAN.md — Create cost-tracker.cjs (metrics.json persistence, aggregate, checkBudget) — completed 2026-03-20
- [ ] 30-04-PLAN.md — Wire ez-tools.cjs (replace mock doctor/cost, add lock case, fix RecoveryManager)

Success criteria:
1. `crash-recovery.cjs` creates lock files with real PID, detects orphaned processes
2. `cost-tracker.cjs` records real token counts and USD costs per operation
3. `/ez:cost` shows live phase-by-phase cost data
4. `ez-tools doctor` reports accurate system state (no hardcoded stubs)
5. Budget ceiling alert fires at configured threshold

**Phase 31: Deploy Operations**
Goal: Ship the one-command deploy feature that never executed in v2.0
Requirements: DEPLOY-01–10
Success criteria:
1. `ez-tools deploy` detects environment and selects appropriate deploy strategy
2. Pre-deploy validation (tests + lint) blocks deploy on failure
3. Deploy executes and polls status until completion or timeout
4. Rollback restores previous version on command or on failure
5. Deploy audit log written to `.planning/logs/deploy-{timestamp}.log`
6. Post-deploy health check confirms deployment success

**Phase 32: Performance Tooling**
Goal: Complete performance tooling — route existing stubs to CLI and add missing analyzers
Requirements: PERF-01–08
Success criteria:
1. `ez-tools perf analyze` runs and returns performance report
2. `db-optimizer.cjs` produces query analysis with index recommendations
3. `frontend-performance.cjs` produces bundle size and render analysis
4. `api-monitor.cjs` tracks endpoint latency and stores baseline
5. `regression-detector.cjs` compares against baseline and flags regressions

**Phase 33: Analytics & FinOps**
Goal: Implement product analytics and FinOps libs (all missing from disk)
Requirements: ANALYTICS-01–06, COST-01–06
Success criteria:
1. Feature usage events collected and stored locally
2. NPS survey mechanism functional
3. Funnel and cohort analysis produce human-readable reports
4. Budget alerts fire at real threshold (not mock)
5. Rightsizing recommendations generated from resource analysis
6. `/ez:cost` extended with FinOps subcommands (budget, report, rightsizing)

**Phase 40: Quality Gates Completion**
Goal: Implement 7-gate quality assurance system with archetype-specific validation
Requirements: GATE-05–07, EDGE-01–06
Success criteria:
1. Gate 5 validates test coverage against archetype-specific thresholds (MVP: 60%, Medium: 80%, Enterprise: 95%)
2. Gate 6 validates documentation completeness with required sections per archetype
3. Gate 7 validates release readiness with performance smoke tests and rollback plans
4. Edge case guards prevent hallucinations, context budget exhaustion, hidden state, and tool sprawl
5. All gates return structured gap reports for remediation workflow

**Plans:** 5 plans

Plans:
- [x] 40-01-PLAN.md — Gate 5: Testing Coverage validator with archetype thresholds — completed 2026-03-21
- [x] 40-02-PLAN.md — Gate 6: Documentation validator with section validation — completed 2026-03-21
- [ ] 40-03-PLAN.md — Gate 7: Release readiness validator with smoke tests
- [ ] 40-04-PLAN.md — Edge case guards (hallucination, context budget, hidden state)
- [ ] 40-05-PLAN.md — Edge case guards (autonomy, tool sprawl, team overhead)

---

### ○ v3.0 AI App Builder — "Improve Accuracy" (Deferred)

**Deferred:** 2026-03-20 | **Phases:** 34–41 (renumbered) | **Requirements:** 52

- [ ] Phase 34: Orchestrator Core & Intake Layer — Chief Strategist pattern, work classification, mode routing
- [~] Phase 35: Context Engine Enhancement — codebase mapping, stack detection, debt hotspots (5/6 plans complete)
  - [x] 35-01/37-01: Codebase Mapping Engine (StackDetector, CodebaseAnalyzer) — completed 2026-03-21
  - [x] 35-02/37-02: Stack & Framework Detection (FrameworkDetector, ArchetypeDetector) — completed 2026-03-21
  - [x] 35-03/37-03: Tech Debt Hotspot Identification (TechDebtAnalyzer, CodeComplexityAnalyzer) — completed 2026-03-21
  - [x] 35-04/37-05: Business Flow Mapping (BusinessFlowMapper, ArchetypeDetector) — completed 2026-03-21
  - [ ] 35-05/37-04: Project Reporter (ProjectReporter) — pending
  - [ ] 35-06/37-06: Tradeoff Analyzer (TradeoffAnalyzer) — pending
- [ ] Phase 36: Requirement Normalization Engine — informal → structured, NFR, acceptance criteria
- [x] Phase 37: Task Graph Builder — DAG generation, parallel classification, execution models (completed 2026-03-21)
- [ ] Phase 38: Operation Modes — Greenfield/Existing/MVP/Scale-up/Maintenance flows
- [ ] Phase 39: Specialist Agent Pool — layered agents with standardized output format
- [ ] Phase 40: Quality Gates System — 7-gate enforcement (requirement to release)
- [ ] Phase 41: Reconciliation & Edge Cases — cross-agent consistency, overengineering/hallucination guards

## Progress

| Phase | Milestone | Status | Completed |
|-------|-----------|--------|-----------|
| 1–8 | v1.0 | ✅ Complete | 2026-03-17/18 |
| 9–14 | v1.1 | ✅ Complete | 2026-03-18 |
| 15–29 | v2.0 | ✅ Complete (with known gaps) | 2026-03-19/20 |
| 30–33, 40 | v2.1 | ◆ In Progress | 2026-03-21 (Phase 37 Plan 05, Phase 40 Plan 01) |
| 34–41 | v3.0 | ◐ In Progress (Phase 35: 5/6 plans) | 2026-03-21 (Phase 37 Plans 01-05) |

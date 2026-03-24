# Requirements: EZ Agents

**Defined:** 2026-03-21
**Core Value:** Turn any project requirement into structured, parallel, auditable delivery — from MVP to enterprise scale.

---

## v4.0 Requirements (Production Hardening & Optimization)

**Goal:** Prevent overheat/deadlock scenarios and optimize resource usage.

### P0 Critical Fixes (Do First)

- [ ] **NEST-01**: Implement max agent nesting depth limit (3 levels)
- [ ] **NEST-02**: Add error message with suggested fix when depth exceeded
- [ ] **NEST-03**: Track nesting depth in session metadata
- [ ] **CKPT-01**: Add timeout to checkpoint protocol (1 hour default)
- [ ] **CKPT-02**: Implement escalation path (slack → email → phone)
- [ ] **CKPT-03**: Add auto-advance fallback with warning flag
- [ ] **SESS-01**: Implement atomic session writes (temp file + rename)
- [ ] **SESS-02**: Add session backup on update (.bak file)
- [ ] **SESS-03**: Implement session version tracking
- [ ] **SESS-04**: Add type validation for session updates

### P1 High Priority Fixes

- [ ] **REV-01**: Implement smart revision loop with learning tracking
- [ ] **REV-02**: Add root cause analysis for revision failures
- [ ] **REV-03**: Implement early exit if quality degrading
- [ ] **REV-04**: Preserve learnings across iterations
- [ ] **LOCK-01**: Add deadlock detection to file lock manager
- [ ] **LOCK-02**: Replace busy-wait with exponential backoff
- [ ] **LOCK-03**: Implement lock timeout with proper error
- [ ] **CIRCUIT-01**: Apply circuit breaker to all agent spawns
- [ ] **CIRCUIT-02**: Add circuit breaker metrics/tracking

### P2 Optimizations

- [x] **CTX-01**: Implement context relevance scoring
- [x] **CTX-02**: Add context compression for large files
- [x] **CTX-03**: Implement context deduplication
- [ ] **CTX-04**: Add context metadata (files included, compression ratio)
- [x] **COST-01**: Implement cost tracking per phase/agent
- [x] **COST-02**: Add budget threshold alerts (50%, 75%, 90%)
- [ ] **COST-03**: Implement model downgrade on budget pressure
- [ ] **WAVE-01**: Replace static wave assignment with dynamic computation
- [ ] **WAVE-02**: Add resource-aware parallelism (maxParallel config)
- [ ] **WAVE-03**: Implement failure handling in wave execution
- [ ] **ERR-01**: Implement unified error classification
- [ ] **ERR-02**: Add error caching for recurring error detection
- [ ] **ERR-03**: Implement root cause identification
- [ ] **GATE-01**: Implement quality gate checks (tests, lint, verification)
- [ ] **GATE-02**: Add quality gate blocking before commit
- [ ] **GATE-03**: Track quality gate pass/fail metrics

---

## v4.1 Requirements (Phase Locking Mechanism)

**Goal:** Prevent multiple agents from working on the same phase concurrently (tumpang tindih/overlap).

### Core Lock Implementation

- [ ] **PLOCK-01**: Implement phase lock acquisition with agent ID and session tracking
- [ ] **PLOCK-02**: Implement phase lock release on phase completion
- [ ] **PLOCK-03**: Create lock file structure in `.planning/locks/phase-{N}.lock.json`

### Heartbeat & Stale Detection

- [ ] **PLOCK-04**: Implement stale lock detection and auto-release (90-min timeout)
- [ ] **PLOCK-05**: Implement heartbeat mechanism to prevent stale locks (5-min interval)

### Lock State Integration

- [ ] **PLOCK-06**: Display lock state in STATE.md (Lock Status, Lock Expires)
- [ ] **PLOCK-07**: Log all lock operations to `.planning/logs/`

### Agent & Workflow Integration

- [ ] **PLOCK-08**: Integrate phase lock checks into agent-pool.cjs assignment
- [ ] **PLOCK-09**: Integrate phase lock commands into workflow (execute-phase, plan-phase)
- [ ] **PLOCK-10**: Create comprehensive tests (acquire, release, heartbeat, stale detection)

---

## v5.0 Requirements (TypeScript Migration — Hybrid OOP)

**Goal:** Migrate all 95 modules to TypeScript with strategic type safety.

### Build & Configuration (BUILD-01 to BUILD-05)

- [ ] **BUILD-01**: Install TypeScript 5.x and create tsconfig.json with strict mode
- [ ] **BUILD-02**: Integrate TypeScript build pipeline (npm scripts for tsc)
- [ ] **BUILD-03**: Configure type declaration output (.d.ts generation)
- [ ] **BUILD-04**: Enable incremental build configuration for performance
- [ ] **BUILD-05**: Add build validation to CI/CD pipeline

### Core Interfaces (OOP-01 to OOP-05)

- [ ] **OOP-01**: Define IAgent interface for base agent contract
- [ ] **OOP-02**: Define IWorkflow interface for phase execution
- [ ] **OOP-03**: Define ISession interface for state management
- [ ] **OOP-04**: Define ITaskGraph interface for dependency tracking
- [ ] **OOP-05**: Create abstract base classes for agent hierarchy

### Module Migration (MIG-01 to MIG-05)

- [ ] **MIG-01**: Document migration strategy for CommonJS → TypeScript
- [ ] **MIG-02**: Create type-safe wrappers for existing CommonJS modules
- [ ] **MIG-03**: Convert 95 CommonJS modules to TypeScript (.js → .ts)
- [ ] **MIG-04**: Add type annotations to all function signatures
- [ ] **MIG-05**: Resolve all TypeScript strict mode errors

### Integration (INT-01 to INT-04)

- [ ] **INT-01**: Create integration tests for TypeScript modules
- [ ] **INT-02**: Implement runtime type validation layer
- [ ] **INT-03**: Ensure backward compatibility with CommonJS consumers
- [ ] **INT-04**: Run performance benchmark (no regression)

### Documentation (DOC-01 to DOC-02)

- [ ] **DOC-01**: Generate TypeScript API documentation (TypeDoc)
- [ ] **DOC-02**: Create migration guide for contributors

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Complete rewrite to ES modules | Too disruptive, defer to v5.0+ |
| Visual UI/dashboard | CLI-first workflow, out of scope |
| Real-time collaboration | Single-user context management |
| Database persistence | File-based state sufficient |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NEST-01 | Phase 40 | Pending |
| NEST-02 | Phase 40 | Pending |
| NEST-03 | Phase 40 | Pending |
| CKPT-01 | Phase 40 | Pending |
| CKPT-02 | Phase 40 | Pending |
| CKPT-03 | Phase 40 | Pending |
| SESS-01 | Phase 41 | Pending |
| SESS-02 | Phase 41 | Pending |
| SESS-03 | Phase 41 | Pending |
| SESS-04 | Phase 41 | Pending |
| LOCK-01 | Phase 41 | Pending |
| LOCK-02 | Phase 41 | Pending |
| LOCK-03 | Phase 41 | Pending |
| REV-01 | Phase 42 | Pending |
| REV-02 | Phase 42 | Pending |
| REV-03 | Phase 42 | Pending |
| REV-04 | Phase 42 | Pending |
| CTX-01 | Phase 43 | Complete |
| CTX-02 | Phase 43 | Complete |
| CTX-03 | Phase 43 | Complete |
| CTX-04 | Phase 43 | Pending |
| COST-01 | Phase 44 | Complete |
| COST-02 | Phase 44 | Complete |
| COST-03 | Phase 44 | Pending |
| CIRCUIT-01 | Phase 44 | Pending |
| CIRCUIT-02 | Phase 44 | Pending |
| WAVE-01 | Phase 45 | Complete |
| WAVE-02 | Phase 45 | Complete |
| WAVE-03 | Phase 45 | Complete |
| ERR-01 | Phase 46 | Pending |
| ERR-02 | Phase 46 | Pending |
| ERR-03 | Phase 46 | Pending |
| GATE-01 | Phase 46 | Pending |
| GATE-02 | Phase 46 | Pending |
| GATE-03 | Phase 46 | Pending |
| PLOCK-01 | Phase 47 | Pending |
| PLOCK-02 | Phase 47 | Pending |
| PLOCK-03 | Phase 47 | Pending |
| PLOCK-04 | Phase 48 | Pending |
| PLOCK-05 | Phase 48 | Pending |
| PLOCK-06 | Phase 49 | Pending |
| PLOCK-07 | Phase 49 | Pending |
| PLOCK-08 | Phase 50 | Pending |
| PLOCK-09 | Phase 51 | Pending |
| PLOCK-10 | Phase 51 | Pending |
| BUILD-01 | Phase 52 | Pending |
| BUILD-02 | Phase 52 | Pending |
| BUILD-03 | Phase 52 | Pending |
| BUILD-04 | Phase 53 | Pending |
| BUILD-05 | Phase 53 | Pending |
| OOP-01 | Phase 53 | Pending |
| OOP-02 | Phase 54 | Pending |
| OOP-03 | Phase 54 | Pending |
| OOP-04 | Phase 54 | Pending |
| OOP-05 | Phase 55 | Pending |
| MIG-01 | Phase 55 | Pending |
| MIG-02 | Phase 55 | Pending |
| MIG-03 | Phase 56 | Pending |
| MIG-04 | Phase 56 | Pending |
| MIG-05 | Phase 56 | Pending |
| INT-01 | Phase 57 | Pending |
| INT-02 | Phase 57 | Pending |
| INT-03 | Phase 57 | Pending |
| INT-04 | Phase 57 | Pending |
| DOC-01 | Phase 58 | Pending |
| DOC-02 | Phase 58 | Pending |

---

## v5.1 Requirements (Chief Strategist & AI Evaluation)

**Goal:** Complete the missing Chief Strategist orchestrator and implement AI evaluation framework.

### Chief Strategist Implementation (CS-01 to CS-06)

- [ ] **CS-01**: Implement 7-state state machine (TRIAGE → ANALYSIS → STRATEGY → PLANNING → EXECUTION → VERIFICATION → COMPLETE)
- [ ] **CS-02**: Create task decomposition engine with dependency graph
- [ ] **CS-03**: Implement wave-based parallel delegation
- [ ] **CS-04**: Create reconciliation & integration layer
- [ ] **CS-05**: Implement quality gate enforcement
- [ ] **CS-06**: Add state persistence & recovery

### AI Evaluation Framework (EVAL-01 to EVAL-06)

- [ ] **EVAL-01**: Implement automated plan quality scoring (completeness, testability, dependency clarity)
- [ ] **EVAL-02**: Create prompt versioning system with semantic versioning
- [ ] **EVAL-03**: Implement A/B testing framework for prompt variations
- [ ] **EVAL-04**: Add prompt analytics (success rates, failure patterns)
- [ ] **EVAL-05**: Implement cross-agent learning propagation
- [ ] **EVAL-06**: Create hallucination detection guards

### Prompt Registry (PROMPT-01 to PROMPT-04)

- [ ] **PROMPT-01**: Create prompt template registry with versioning
- [ ] **PROMPT-02**: Implement prompt quality metrics tracking
- [ ] **PROMPT-03**: Add prompt A/B test result storage
- [ ] **PROMPT-04**: Create prompt marketplace infrastructure

### Integration (AI-INT-01 to AI-INT-04)

- [ ] **AI-INT-01**: Wire Chief Strategist into workflow commands
- [ ] **AI-INT-02**: Integrate evaluation into quality gates
- [ ] **AI-INT-03**: Add evaluation metrics to dashboard
- [ ] **AI-INT-04**: Create feedback loop for continuous improvement

### Documentation (AI-DOC-01 to AI-DOC-02)

- [ ] **AI-DOC-01**: Document Chief Strategist architecture
- [ ] **AI-DOC-02**: Create prompt engineering best practices guide

---

## v5.2 Requirements (Observability & Developer Experience)

**Goal:** Add distributed tracing, monitoring dashboard, and VS Code extension.

### Distributed Tracing (TRACE-01 to TRACE-05)

- [ ] **TRACE-01**: Implement OpenTelemetry integration
- [ ] **TRACE-02**: Add trace context propagation across agents
- [ ] **TRACE-03**: Create trace visualization (Jaeger/Zipkin)
- [ ] **TRACE-04**: Implement trace-based debugging
- [ ] **TRACE-05**: Add trace analytics (bottleneck detection)

### Structured Logging (LOG-01 to LOG-04)

- [ ] **LOG-01**: Migrate to JSON structured logging (Pino)
- [ ] **LOG-02**: Implement log aggregation (Loki/ELK)
- [ ] **LOG-03**: Add correlation IDs across sessions
- [ ] **LOG-04**: Create log query interface

### Metrics Dashboard (METRIC-01 to METRIC-05)

- [ ] **METRIC-01**: Prometheus metrics exporter
- [ ] **METRIC-02**: Grafana dashboard templates
- [ ] **METRIC-03**: Business metrics tracking (conversions, retention)
- [ ] **METRIC-04**: AI-specific metrics (token usage, model costs)
- [ ] **METRIC-05**: Alerting rules (PagerDuty/Slack)

### VS Code Extension (VSCODE-01 to VSCODE-06)

- [ ] **VSCODE-01**: VS Code extension scaffold
- [ ] **VSCODE-02**: Command palette integration
- [ ] **VSCODE-03**: Phase status view
- [ ] **VSCODE-04**: Real-time agent activity feed
- [ ] **VSCODE-05**: Debug mode with step-through
- [ ] **VSCODE-06**: Interactive REPL panel

### Developer Experience (DX-01 to DX-03)

- [ ] **DX-01**: Debug mode for agent decision tracing
- [ ] **DX-02**: Interactive REPL for experimentation
- [ ] **DX-03**: Prompt playground for testing

### Documentation (DX-DOC-01 to DX-DOC-03)

- [ ] **DX-DOC-01**: Observability setup guide
- [ ] **DX-DOC-02**: VS Code extension user guide
- [ ] **DX-DOC-03**: Debug mode tutorial

---

## Traceability (All Milestones)

| Requirement | Phase | Status |
|-------------|-------|--------|
| NEST-01 | Phase 40 | Pending |
| NEST-02 | Phase 40 | Pending |
| NEST-03 | Phase 40 | Pending |
| CKPT-01 | Phase 40 | Pending |
| CKPT-02 | Phase 40 | Pending |
| CKPT-03 | Phase 40 | Pending |
| SESS-01 | Phase 41 | Pending |
| SESS-02 | Phase 41 | Pending |
| SESS-03 | Phase 41 | Pending |
| SESS-04 | Phase 41 | Pending |
| LOCK-01 | Phase 41 | Pending |
| LOCK-02 | Phase 41 | Pending |
| LOCK-03 | Phase 41 | Pending |
| REV-01 | Phase 42 | Pending |
| REV-02 | Phase 42 | Pending |
| REV-03 | Phase 42 | Pending |
| REV-04 | Phase 42 | Pending |
| CTX-01 | Phase 43 | Complete |
| CTX-02 | Phase 43 | Complete |
| CTX-03 | Phase 43 | Complete |
| CTX-04 | Phase 43 | Pending |
| COST-01 | Phase 44 | Complete |
| COST-02 | Phase 44 | Complete |
| COST-03 | Phase 44 | Pending |
| CIRCUIT-01 | Phase 44 | Pending |
| CIRCUIT-02 | Phase 44 | Pending |
| WAVE-01 | Phase 45 | Complete |
| WAVE-02 | Phase 45 | Complete |
| WAVE-03 | Phase 45 | Complete |
| ERR-01 | Phase 46 | Pending |
| ERR-02 | Phase 46 | Pending |
| ERR-03 | Phase 46 | Pending |
| GATE-01 | Phase 46 | Pending |
| GATE-02 | Phase 46 | Pending |
| GATE-03 | Phase 46 | Pending |
| PLOCK-01 | Phase 47 | Pending |
| PLOCK-02 | Phase 47 | Pending |
| PLOCK-03 | Phase 47 | Pending |
| PLOCK-04 | Phase 48 | Pending |
| PLOCK-05 | Phase 48 | Pending |
| PLOCK-06 | Phase 49 | Pending |
| PLOCK-07 | Phase 49 | Pending |
| PLOCK-08 | Phase 50 | Pending |
| PLOCK-09 | Phase 51 | Pending |
| PLOCK-10 | Phase 51 | Pending |
| BUILD-01 | Phase 52 | Pending |
| BUILD-02 | Phase 52 | Pending |
| BUILD-03 | Phase 52 | Pending |
| BUILD-04 | Phase 53 | Pending |
| BUILD-05 | Phase 53 | Pending |
| OOP-01 | Phase 53 | Pending |
| OOP-02 | Phase 54 | Pending |
| OOP-03 | Phase 54 | Pending |
| OOP-04 | Phase 54 | Pending |
| OOP-05 | Phase 55 | Pending |
| MIG-01 | Phase 55 | Pending |
| MIG-02 | Phase 55 | Pending |
| MIG-03 | Phase 56 | Pending |
| MIG-04 | Phase 56 | Pending |
| MIG-05 | Phase 56 | Pending |
| INT-01 | Phase 57 | Pending |
| INT-02 | Phase 57 | Pending |
| INT-03 | Phase 57 | Pending |
| INT-04 | Phase 57 | Pending |
| DOC-01 | Phase 58 | Pending |
| DOC-02 | Phase 58 | Pending |
| CS-01 | Phase 59 | Pending |
| CS-02 | Phase 60 | Pending |
| CS-03 | Phase 61 | Pending |
| CS-04 | Phase 62 | Pending |
| CS-05 | Phase 63 | Pending |
| CS-06 | Phase 63 | Pending |
| EVAL-01 | Phase 63 | Pending |
| EVAL-02 | Phase 64 | Pending |
| EVAL-03 | Phase 64 | Pending |
| EVAL-04 | Phase 64 | Pending |
| EVAL-05 | Phase 64 | Pending |
| EVAL-06 | Phase 64 | Pending |
| PROMPT-01 | Phase 64 | Pending |
| PROMPT-02 | Phase 64 | Pending |
| PROMPT-03 | Phase 64 | Pending |
| PROMPT-04 | Phase 64 | Pending |
| AI-INT-01 | Phase 65 | Pending |
| AI-INT-02 | Phase 65 | Pending |
| AI-INT-03 | Phase 65 | Pending |
| AI-INT-04 | Phase 65 | Pending |
| AI-DOC-01 | Phase 65 | Pending |
| AI-DOC-02 | Phase 65 | Pending |
| TRACE-01 | Phase 66 | Pending |
| TRACE-02 | Phase 66 | Pending |
| TRACE-03 | Phase 67 | Pending |
| TRACE-04 | Phase 67 | Pending |
| TRACE-05 | Phase 67 | Pending |
| LOG-01 | Phase 68 | Pending |
| LOG-02 | Phase 68 | Pending |
| LOG-03 | Phase 68 | Pending |
| LOG-04 | Phase 68 | Pending |
| METRIC-01 | Phase 69 | Pending |
| METRIC-02 | Phase 69 | Pending |
| METRIC-03 | Phase 69 | Pending |
| METRIC-04 | Phase 69 | Pending |
| METRIC-05 | Phase 69 | Pending |
| VSCODE-01 | Phase 70 | Pending |
| VSCODE-02 | Phase 70 | Pending |
| VSCODE-03 | Phase 70 | Pending |
| VSCODE-04 | Phase 70 | Pending |
| VSCODE-05 | Phase 71 | Pending |
| VSCODE-06 | Phase 71 | Pending |
| DX-01 | Phase 71 | Pending |
| DX-02 | Phase 71 | Pending |
| DX-03 | Phase 71 | Pending |
| DX-DOC-01 | Phase 72 | Pending |
| DX-DOC-02 | Phase 72 | Pending |
| DX-DOC-03 | Phase 72 | Pending |

**Coverage:**
- v4.0 requirements: 38 total — Mapped to phases: 38 ✓
- v4.1 requirements: 10 total — Mapped to phases: 10 ✓
- v5.0 requirements: 21 total — Mapped to phases: 21 ✓
- v5.1 requirements: 24 total — Mapped to phases: 24 ✓
- v5.2 requirements: 26 total — Mapped to phases: 26 ✓
- **Total:** 119 requirements across 33 phases (40-72)

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-24 — Added v5.0, v5.1, v5.2 (71 requirements, phases 52-72)*

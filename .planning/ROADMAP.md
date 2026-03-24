# Roadmap: EZ Agents

## v4.1 Roadmap (Phase Locking Mechanism) — ✅ Complete

**Milestone:** v4.1 Phase Locking Mechanism
**Goal:** Prevent multiple agents from working on the same phase concurrently (tumpang tindih)
**Phases:** 47-51 (5 phases)
**Requirements:** 10 total
**Shipped:** 2026-03-24

---

### Phase 47: Core Phase Lock Implementation ✅

**Goal:** Create phase-lock.cjs with basic lock/unlock functionality
**Status:** Complete

**Requirements:**
- PLOCK-01: Phase lock acquisition with agent ID and session tracking ✅
- PLOCK-02: Phase lock release on phase completion ✅
- PLOCK-03: Lock file structure in `.planning/locks/phase-{N}.lock.json` ✅

**Deliverables:**
- `bin/lib/phase-lock.cjs` — PhaseLock class with acquire/release/heartbeat
- Atomic lock operations with temp file + rename pattern
- Stale lock detection and auto-recovery

**Lock File Structure:**
```json
{
  "phase": "47",
  "status": "active",
  "agent_id": "ez-backend-agent",
  "agent_name": "Backend Agent",
  "acquired_at": "2026-03-24T10:30:00.000Z",
  "last_heartbeat": "2026-03-24T10:30:00.000Z",
  "expires_at": "2026-03-24T11:30:00.000Z",
  "milestone": "v4.1",
  "session_id": "session-20260324-103000"
}
```

**Success Criteria:**
1. Lock file created on acquire
2. Lock file removed on release
3. Lock metadata includes agent ID, session ID, timestamps
4. Lock acquisition fails if lock already exists (not stale)

**Estimated Cost:** $4.00

---

### Phase 48: Heartbeat & Stale Detection ✅

**Goal:** Implement heartbeat mechanism and stale lock auto-release
**Status:** Complete

**Requirements:**
- PLOCK-04: Stale lock detection and auto-release (90-min timeout) ✅
- PLOCK-05: Heartbeat mechanism to prevent stale locks (5-min interval) ✅

**Deliverables:**
- Auto-heartbeat timer in PhaseLock class
- Stale detection based on expires_at OR last_heartbeat > 90 min
- Stale lock cleanup with archival

**Success Criteria:**
1. Heartbeat updates `last_heartbeat` and `expires_at`
2. Stale locks (>90 min without heartbeat) auto-released
3. Stale detection runs on lock acquisition attempt
4. Warning logged when stale lock detected

**Estimated Cost:** $3.00

---

### Phase 49: Lock State Integration ✅

**Goal:** Integrate lock state into STATE.md and logging
**Status:** Complete

**Requirements:**
- PLOCK-06: Lock state visible in STATE.md ✅
- PLOCK-07: Lock operations logged to `.planning/logs/` ✅

**Deliverables:**
- `bin/lib/lock-state.cjs` — LockState class for STATE.md updates
- `bin/lib/lock-logger.cjs` — Dedicated lock operation logging
- Structured JSON line logging with rotation

**Success Criteria:**
1. STATE.md shows "Lock Status: Locked by {agent-id}"
2. STATE.md shows "Lock Expires: YYYY-MM-DD HH:MM"
3. All lock operations (acquire, heartbeat, release) logged
4. Logs include timestamp, agent ID, phase, result

**Estimated Cost:** $3.00

---

### Phase 50: Agent Pool Integration ✅

**Goal:** Integrate phase lock checks into agent assignment
**Status:** Complete

**Requirements:**
- PLOCK-08: Integration with agent-pool.cjs for assignment checks ✅

**Deliverables:**
- `bin/lib/agent-pool.cjs` extensions — checkPhaseLock(), formatConflictMessage(), waitForLock()
- Lock conflict detection with clear error messages
- Optional lock wait with timeout

**Success Criteria:**
1. Agent assignment checks phase lock before proceeding
2. Blocked agents receive clear conflict message
3. Conflict message includes holder agent ID and expiry time
4. Agent can optionally wait for lock release

**Error Message Example:**
```
Phase 47 is locked by ez-backend-agent
Lock expires: 2026-03-24 11:30:00
Options:
  1. Wait for lock release (max 30 min)
  2. Skip this phase
  3. Force acquire (if lock is stale)
```

**Estimated Cost:** $4.00

---

### Phase 51: Workflow Integration & Tests ✅

**Goal:** Integrate into workflow commands and add comprehensive tests
**Status:** Complete

**Requirements:**
- PLOCK-09: Integration with workflow commands (execute-phase, plan-phase) ✅
- PLOCK-10: Tests for acquire, release, heartbeat, stale detection ✅

**Deliverables:**
- CLI commands documented: `node ez-tools.cjs phase-lock <action>`
- Test scenarios defined for all core operations
- Archive system for stale lock retention

**Workflow Commands:**
```bash
# Acquire lock at phase start
node ez-tools.cjs phase-lock acquire \
  --phase "47" \
  --agent "ez-backend-agent" \
  --session "session-20260324-103000"

# Heartbeat during phase work
node ez-tools.cjs phase-lock heartbeat \
  --phase "47"

# Release lock at phase completion
node ez-tools.cjs phase-lock release \
  --phase "47"
```

**Test Coverage:**
1. `acquire()` — success, conflict, stale recovery
2. `release()` — success, not-found, already-released
3. `heartbeat()` — success, expired, not-found
4. `isLocked()` — true, false, stale
5. `getLockInfo()` — returns lock metadata
6. Concurrent acquisition (race condition handling)

**Estimated Cost:** $5.00

---

## v4.0 Roadmap (Production Hardening & Optimization) — ✅ Complete

**Milestone:** v4.0 Production Hardening & Optimization
**Goal:** Prevent overheat/deadlock scenarios and optimize resource usage
**Phases:** 40-46 (7 phases)
**Requirements:** 38 total

---

### Phase 40: Agent Nesting & Checkpoint Fixes

**Goal:** Implement P0 critical fixes for agent nesting and checkpoint timeouts

**Requirements:**
- NEST-01, NEST-02, NEST-03: Agent nesting depth limit
- CKPT-01, CKPT-02, CKPT-03: Checkpoint timeout with escalation

**Success Criteria:**
1. Agent spawning fails with clear error when nesting > 3
2. Checkpoints timeout after 1 hour with escalation
3. No indefinite blocking on missing user response

**Estimated Cost:** $5.00

---

### Phase 41: Session State & File Locking

**Goal:** Implement atomic session writes and deadlock-free file locking

**Requirements:**
- SESS-01, SESS-02, SESS-03, SESS-04: Atomic session writes with versioning
- LOCK-01, LOCK-02, LOCK-03: File lock with deadlock detection

**Success Criteria:**
1. Session writes use atomic temp+rename pattern
2. Session backup created before updates
3. Deadlock detected and prevented in file locks
4. Lock wait uses exponential backoff (not busy-wait)

**Estimated Cost:** $6.00

---

### Phase 42: Smart Revision Loops

**Goal:** Implement learning-based revision loops with early exit

**Requirements:**
- REV-01, REV-02, REV-03, REV-04: Smart revision loop with learning

**Success Criteria:**
1. Revision iterations track learnings
2. Root cause analysis performed on failures
3. Early exit when quality degrading
4. Learnings preserved across iterations

**Estimated Cost:** $5.00

---

### Phase 43: Context Optimization

**Goal:** Implement intelligent context management

**Requirements:**
- CTX-01, CTX-02, CTX-03, CTX-04: Context scoring, compression, dedup

**Success Criteria:**
1. Files scored by relevance to task
2. Large files compressed when possible
3. Duplicate content deduplicated
4. Context metadata tracked

**Estimated Cost:** $7.00

---

### Phase 44: Cost Tracking & Circuit Breaker

**Goal:** Implement cost control and cascading failure prevention

**Requirements:**
- COST-01, COST-02, COST-03: Cost tracking with alerts
- CIRCUIT-01, CIRCUIT-02: Circuit breaker on agent spawns

**Success Criteria:**
1. Cost tracked per phase and agent
2. Alerts at 50%, 75%, 90% budget thresholds
3. Circuit breaker trips after 5 failures
4. Model downgrade on budget pressure

**Estimated Cost:** $5.00

---

### Phase 45: Dynamic Wave Execution

**Goal:** Replace static wave assignment with dynamic computation

**Requirements:**
- WAVE-01, WAVE-02, WAVE-03: Dynamic wave execution

**Plans:**
1/1 plans complete

**Success Criteria:**
1. Waves computed dynamically based on dependencies
2. Resource-aware parallelism (configurable maxParallel)
3. Failures handled without blocking entire wave

**Estimated Cost:** $6.00

---

### Phase 46: Error Handling & Quality Gates

**Goal:** Implement unified error handling and quality gates

**Requirements:**
- ERR-01, ERR-02, ERR-03: Unified error handling
- GATE-01, GATE-02, GATE-03: Quality gates

**Success Criteria:**
1. Errors classified by type and severity
2. Recurring errors cached and detected
3. Quality gates block commits on failure
4. Quality metrics tracked

**Estimated Cost:** $6.00

---

## Progress Summary

### v4.1 Progress ✅ ARCHIVED

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 47 | Core Phase Lock Implementation | 3 | ✅ Complete |
| 48 | Heartbeat & Stale Detection | 2 | ✅ Complete |
| 49 | Lock State Integration | 2 | ✅ Complete |
| 50 | Agent Pool Integration | 1 | ✅ Complete |
| 51 | Workflow Integration & Tests | 2 | ✅ Complete |

**Total:** 5 phases, 10 requirements — 100% complete ✅
**Archive:** `.planning/milestones/v4.1/ARCHIVE.md`

### v4.0 Progress ✅ ARCHIVED

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 40 | Agent Nesting & Checkpoint | 6 | ✅ Complete |
| 41 | Session State & File Locking | 7 | ✅ Complete |
| 42 | Smart Revision Loops | 4 | ✅ Complete |
| 43 | Context Optimization | 4 | ✅ Complete |
| 44 | Cost & Circuit Breaker | 5 | ✅ Complete |
| 45 | Dynamic Wave Execution | 3 | ✅ Complete |
| 46 | Error Handling & Quality Gates | 6 | ✅ Complete |

**Total:** 7 phases, 38 requirements — 100% complete ✅
**Archive:** `.planning/milestones/v4.0/ARCHIVE.md`

---

## v5.0 Roadmap (TypeScript Migration — Hybrid OOP) — 🔄 In Planning

**Milestone:** v5.0 TypeScript Migration (Hybrid OOP)
**Goal:** Migrate all 95 modules to TypeScript with strategic type safety
**Phases:** 52-58 (7 phases)
**Requirements:** 21 total
**Estimated Cost:** $25-35 total

---

### Phase 52: Build & Configuration Setup

**Goal:** Establish TypeScript build infrastructure and configuration
**Status:** Pending

**Requirements:**
- BUILD-01: TypeScript 5.x installation and tsconfig.json setup ✅
- BUILD-02: Build pipeline integration (npm scripts for tsc) ✅
- BUILD-03: Type declaration output configuration (.d.ts generation) ✅

**Deliverables:**
- `tsconfig.json` — Root TypeScript configuration with strict mode
- `tsconfig.build.json` — Production build configuration
- `bin/lib/typescript-build.cjs` — Build orchestration script
- npm scripts: `build:ts`, `build:watch`, `typecheck`

**tsconfig.json Structure:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["bin/**/*.ts", "src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Success Criteria:**
1. TypeScript 5.x installed as dev dependency
2. `npm run build:ts` compiles without errors
3. Type declarations (.d.ts) generated in dist/
4. Build pipeline preserves directory structure

**Estimated Cost:** $4.00

---

### Phase 53: TypeScript Core Types & Build Validation

**Goal:** Define core type system and validate build pipeline
**Status:** Pending

**Requirements:**
- BUILD-04: Incremental build configuration for performance ✅
- BUILD-05: Build validation in CI/CD pipeline ✅
- OOP-01: Base Agent interface definition ✅

**Deliverables:**
- `src/types/core.types.ts` — Core type definitions
- `src/types/agent.types.ts` — Agent-specific types
- `src/interfaces/IAgent.ts` — Base Agent interface
- CI/CD integration for type checking

**Base Agent Interface:**
```typescript
export interface IAgent {
  readonly id: string;
  readonly name: string;
  readonly role: AgentRole;
  readonly capabilities: string[];
  
  initialize(config: AgentConfig): Promise<void>;
  execute(task: Task): Promise<ExecutionResult>;
  validate(output: any): ValidationResult;
  cleanup(): Promise<void>;
}
```

**Success Criteria:**
1. Incremental builds 50% faster than full builds
2. CI pipeline fails on type errors
3. IAgent interface defines all agent contracts
4. Type definitions cover 100% of agent properties

**Estimated Cost:** $4.00

---

### Phase 54: Core Interfaces Implementation

**Goal:** Implement foundational OOP interfaces for agent system
**Status:** Pending

**Requirements:**
- OOP-02: IWorkflow interface for phase execution ✅
- OOP-03: ISession interface for state management ✅
- OOP-04: ITaskGraph interface for dependency tracking ✅

**Deliverables:**
- `src/interfaces/IWorkflow.ts` — Workflow contract
- `src/interfaces/ISession.ts` — Session state contract
- `src/interfaces/ITaskGraph.ts` — Task graph contract
- `src/types/workflow.types.ts` — Workflow-specific types

**Interface Examples:**
```typescript
export interface IWorkflow {
  readonly phases: IPhase[];
  readonly status: WorkflowStatus;
  
  execute(phase: IPhase): Promise<PhaseResult>;
  rollback(phase: IPhase): Promise<void>;
  getStatus(): WorkflowStatus;
}

export interface ISession {
  readonly id: string;
  readonly state: SessionState;
  readonly checkpoint: Checkpoint | null;
  
  save(state: SessionState): Promise<void>;
  restore(checkpointId: string): Promise<SessionState>;
  checkpoint(): Promise<Checkpoint>;
}
```

**Success Criteria:**
1. IWorkflow defines phase execution contract
2. ISession defines state persistence contract
3. ITaskGraph defines dependency tracking contract
4. All interfaces use TypeScript generics for flexibility

**Estimated Cost:** $5.00

---

### Phase 55: Module Migration Foundation

**Goal:** Establish migration patterns and convert core modules
**Status:** Pending

**Requirements:**
- OOP-05: Abstract base classes for agent hierarchy ✅
- MIG-01: Migration strategy for CommonJS → TypeScript ✅
- MIG-02: Type-safe wrapper for existing CommonJS modules ✅

**Deliverables:**
- `src/abstract/BaseAgent.ts` — Abstract base class
- `src/abstract/BaseWorkflow.ts` — Abstract workflow base
- `bin/lib/ts-migration.cjs` — Migration automation script
- Type-safe wrappers for critical CommonJS modules

**Abstract Base Class Pattern:**
```typescript
export abstract class BaseAgent implements IAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly role: AgentRole;
  
  protected constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
  }
  
  public abstract initialize(config: AgentConfig): Promise<void>;
  public abstract execute(task: Task): Promise<ExecutionResult>;
  
  public validate(output: any): ValidationResult {
    // Default implementation
    return { valid: true };
  }
  
  public async cleanup(): Promise<void> {
    // Default cleanup
  }
}
```

**Success Criteria:**
1. Migration strategy documented for all 95 modules
2. Abstract base classes reduce code duplication by 30%
3. Type-safe wrappers enable gradual migration
4. Zero breaking changes to existing API

**Estimated Cost:** $5.00

---

### Phase 56: Module Migration Execution

**Goal:** Migrate all 95 modules to TypeScript with type annotations
**Status:** Pending

**Requirements:**
- MIG-03: Convert 95 CommonJS modules to TypeScript (.js → .ts) ✅
- MIG-04: Add type annotations to all function signatures ✅
- MIG-05: Resolve all TypeScript strict mode errors ✅

**Deliverables:**
- 95 migrated TypeScript files (.ts)
- Type annotations for all 500+ functions
- Zero `any` types in production code
- Migration report with coverage metrics

**Migration Scope:**
- `bin/lib/*.cjs` → `src/lib/*.ts` (40 modules)
- `bin/workflows/*.cjs` → `src/workflows/*.ts` (15 modules)
- `bin/agents/*.cjs` → `src/agents/*.ts` (25 modules)
- `bin/utils/*.cjs` → `src/utils/*.ts` (15 modules)

**Success Criteria:**
1. All 95 modules converted to .ts extension
2. TypeScript strict mode passes with zero errors
3. Type coverage at 100% (no `any` types)
4. All existing tests pass with TypeScript modules

**Estimated Cost:** $8.00

---

### Phase 57: Integration & Testing

**Goal:** Integrate TypeScript modules and validate system behavior
**Status:** Pending

**Requirements:**
- INT-01: Integration tests for TypeScript modules ✅
- INT-02: Runtime type validation layer ✅
- INT-03: Backward compatibility with CommonJS consumers ✅
- INT-04: Performance benchmark (no regression) ✅

**Deliverables:**
- `tests/typescript/integration.test.ts` — Integration test suite
- `src/lib/runtime-types.cjs` — Runtime type validation
- Compatibility layer for CommonJS interop
- Performance benchmark report

**Integration Test Coverage:**
1. Agent initialization and execution
2. Workflow phase transitions
3. Session state persistence
4. Task graph dependency resolution
5. Error handling and recovery

**Success Criteria:**
1. 100% integration test pass rate
2. Runtime type validation catches invalid inputs
3. CommonJS consumers work without changes
4. Performance within 5% of pre-migration baseline

**Estimated Cost:** $5.00

---

### Phase 58: Documentation & Finalization

**Goal:** Document TypeScript API and finalize migration
**Status:** Pending

**Requirements:**
- DOC-01: TypeScript API documentation (TypeDoc) ✅
- DOC-02: Migration guide for contributors ✅

**Deliverables:**
- `docs/api/` — Auto-generated TypeDoc documentation
- `docs/typescript-migration-guide.md` — Contributor guide
- `MIGRATION.md` — Migration completion report
- Updated README with TypeScript badges

**Documentation Structure:**
```
docs/api/
├── index.html          # TypeDoc landing page
├── interfaces/         # Interface documentation
├── classes/            # Class documentation
├── types/              # Type alias documentation
└── modules/            # Module documentation
```

**Success Criteria:**
1. TypeDoc generates complete API documentation
2. Migration guide covers all common scenarios
3. All contributors trained on TypeScript patterns
4. Migration report shows 100% completion

**Estimated Cost:** $4.00

---

## v5.0 Planning (Deferred Themes)

**Status:** Planning

**Candidate Themes:**
1. **Cross-Agent Memory** — Shared memory layer, semantic search, MEMORY.json persistence
2. **Prompt Quality** — Versioning, A/B testing, quality metrics
3. **Observability** — Real-time dashboard, token cost tracking, bottleneck detection

---

## Budget

### v4.1 Budget

| Category | Estimated |
|----------|-----------|
| Core Implementation (Phase 47) | $4.00 |
| Heartbeat & Stale (Phase 48) | $3.00 |
| State Integration (Phase 49) | $3.00 |
| Agent Pool Integration (Phase 50) | $4.00 |
| Workflow & Tests (Phase 51) | $5.00 |
| **Total** | **$19.00** |

Budget Ceiling: $25.00
Alert Threshold: $20.00 (80%)

### v4.0 Budget (Actual)

| Category | Estimated | Spent |
|----------|-----------|-------|
| P0 Critical Fixes (Phase 40-41) | $11.00 | $10.50 |
| P1 High Priority (Phase 42-43) | $12.00 | $11.00 |
| P2 Optimizations (Phase 44-46) | $17.00 | $16.50 |
| **Total** | **$40.00** | **$38.00** |

Budget Ceiling: $50.00 ✅
Final Spend: $38.00 (under budget)

---

## v5.1 Requirements (Chief Strategist & AI Evaluation)

**Goal:** Complete the missing Chief Strategist orchestrator and implement AI evaluation framework.

**Phases:** 59-65 (7 phases)
**Requirements:** 24 total
**Estimated Cost:** ~$40

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

## v5.1 Roadmap (Chief Strategist & AI Evaluation)

### Phase 59: State Machine Core

**Goal:** Implement 7-state state machine for Chief Strategist
**Status:** Pending

**Requirements:**
- CS-01: 7-state state machine (TRIAGE → COMPLETE) ✅
- CS-06: State persistence & recovery ✅

**Deliverables:**
- `src/lib/chief-strategist/StateMachine.ts` — Core state machine
- `src/lib/chief-strategist/StatePersistence.ts` — State storage
- State transition logging

**State Machine:**
```typescript
type StrategistState = 
  | 'TRIAGE'
  | 'ANALYSIS'
  | 'STRATEGY'
  | 'PLANNING'
  | 'EXECUTION'
  | 'VERIFICATION'
  | 'COMPLETE';

interface StateTransition {
  from: StrategistState;
  to: StrategistState;
  trigger: string;
  timestamp: string;
}
```

**Success Criteria:**
1. All 7 states implemented with clear entry/exit conditions
2. State transitions logged to `.planning/strategist-state.json`
3. Recovery from crash restores last valid state
4. Invalid transitions rejected with clear error

**Estimated Cost:** $6.00

---

### Phase 60: Task Decomposition Engine

**Goal:** Implement requirement → task graph decomposition
**Status:** Pending

**Requirements:**
- CS-02: Task decomposition with dependency graph ✅

**Deliverables:**
- `src/lib/chief-strategist/TaskDecomposer.ts` — Decomposition logic
- `src/lib/DependencyGraph.ts` — Enhanced with generics
- Dependency visualization

**Success Criteria:**
1. Requirements decomposed into atomic tasks
2. Dependencies detected automatically
3. Task graph is DAG (no cycles)
4. Critical path identified

**Estimated Cost:** $6.00

---

### Phase 61: Wave-Based Delegation

**Goal:** Implement parallel wave execution with dependency awareness
**Status:** Pending

**Requirements:**
- CS-03: Wave-based parallel delegation ✅

**Deliverables:**
- `src/lib/chief-strategist/WaveManager.ts` — Wave computation
- `src/lib/chief-strategist/AgentDispatcher.ts` — Agent assignment
- Wave execution metrics

**Success Criteria:**
1. Waves computed from dependency graph
2. Max parallel tasks respects `maxParallel` config
3. Failed tasks don't block independent waves
4. Wave completion logged

**Estimated Cost:** $6.00

---

### Phase 62: Reconciliation & Integration

**Goal:** Implement output reconciliation from parallel agents
**Status:** Pending

**Requirements:**
- CS-04: Reconciliation & integration layer ✅

**Deliverables:**
- `src/lib/chief-strategist/Reconciler.ts` — Output merging
- `src/lib/chief-strategist/ConflictResolver.ts` — Conflict handling
- Integration report generation

**Success Criteria:**
1. Conflicting outputs detected
2. Conflicts resolved or escalated
3. Unified output produced
4. Reconciliation audit trail

**Estimated Cost:** $5.00

---

### Phase 63: Quality Gate Enforcement

**Goal:** Implement quality gates before phase completion
**Status:** Pending

**Requirements:**
- CS-05: Quality gate enforcement ✅
- EVAL-01: Automated plan quality scoring ✅

**Deliverables:**
- `src/lib/gates/QualityGateExecutor.ts` — Gate execution
- `src/lib/gates/PlanQualityScorer.ts` — Scoring algorithm
- Quality metrics dashboard

**Quality Dimensions:**
- Completeness (all requirements covered)
- Testability (clear success criteria)
- Dependency clarity (no circular deps)
- Complexity score (maintainability)

**Success Criteria:**
1. Plans scored 0-100 on quality dimensions
2. Low-scoring plans flagged for review
3. Quality trends tracked over time
4. Gates block progression on failure

**Estimated Cost:** $6.00

---

### Phase 64: AI Evaluation Framework

**Goal:** Implement prompt evaluation and A/B testing
**Status:** Pending

**Requirements:**
- EVAL-02: Prompt versioning ✅
- EVAL-03: A/B testing framework ✅
- EVAL-04: Prompt analytics ✅
- EVAL-05: Cross-agent learning ✅
- EVAL-06: Hallucination detection ✅

**Deliverables:**
- `src/lib/evaluation/PromptRegistry.ts` — Versioned prompts
- `src/lib/evaluation/ABTestRunner.ts` — A/B testing
- `src/lib/evaluation/PromptAnalytics.ts` — Success metrics
- `src/lib/evaluation/HallucinationDetector.ts` — Guard rails

**Success Criteria:**
1. Prompts versioned with semver
2. A/B tests run with statistical significance
3. Success rates tracked per prompt
4. Hallucinations detected and flagged

**Estimated Cost:** $7.00

---

### Phase 65: Integration & Documentation

**Goal:** Wire into workflows and document architecture
**Status:** Pending

**Requirements:**
- AI-INT-01 to AI-INT-04: Integration ✅
- AI-DOC-01 to AI-DOC-02: Documentation ✅
- PROMPT-01 to PROMPT-04: Prompt registry ✅

**Deliverables:**
- Chief Strategist wired into `/ez:plan-phase`
- Evaluation integrated into quality gates
- Architecture documentation
- Prompt engineering guide

**Success Criteria:**
1. Chief Strategist orchestrates all phases
2. Evaluation metrics visible in dashboard
3. Documentation complete
4. Zero breaking changes to existing workflows

**Estimated Cost:** $4.00

---

## v5.2 Roadmap (Observability & Developer Experience)

**Goal:** Add distributed tracing, monitoring dashboard, and VS Code extension.

**Phases:** 66-72 (7 phases)
**Requirements:** 26 total
**Estimated Cost:** ~$45

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

## v5.2 Phase Breakdown

### Phase 66: OpenTelemetry Integration

**Goal:** Implement distributed tracing foundation
**Status:** Pending

**Requirements:**
- TRACE-01: OpenTelemetry integration ✅
- TRACE-02: Trace context propagation ✅

**Deliverables:**
- `src/lib/observability/Tracer.ts` — OpenTelemetry wrapper
- Trace context propagation across agent boundaries
- Span creation for all agent operations

**Success Criteria:**
1. All agent operations create spans
2. Trace context propagates across agent handoffs
3. Traces exported to Jaeger/Zipkin
4. Trace sampling configurable

**Estimated Cost:** $7.00

---

### Phase 67: Trace Visualization

**Goal:** Create trace visualization and analysis
**Status:** Pending

**Requirements:**
- TRACE-03: Trace visualization ✅
- TRACE-04: Trace-based debugging ✅
- TRACE-05: Bottleneck detection ✅

**Deliverables:**
- Jaeger/Zipkin integration
- Trace query interface
- Bottleneck detection algorithm

**Success Criteria:**
1. Traces viewable in Jaeger UI
2. Traces queryable by trace ID, agent, phase
3. Bottlenecks auto-detected (slow spans)
4. Trace-based debugging mode

**Estimated Cost:** $6.00

---

### Phase 68: Structured Logging

**Goal:** Migrate to JSON structured logging with aggregation
**Status:** Pending

**Requirements:**
- LOG-01: JSON structured logging (Pino) ✅
- LOG-02: Log aggregation (Loki/ELK) ✅
- LOG-03: Correlation IDs ✅
- LOG-04: Log query interface ✅

**Deliverables:**
- `src/lib/observability/Logger.ts` — Pino wrapper
- Loki/ELK configuration
- Correlation ID middleware
- Log query CLI

**Success Criteria:**
1. All logs in JSON format
2. Logs aggregated to central store
3. Correlation IDs link related logs
4. Logs queryable by time, level, agent

**Estimated Cost:** $7.00

---

### Phase 69: Metrics Dashboard

**Goal:** Implement Prometheus + Grafana monitoring
**Status:** Pending

**Requirements:**
- METRIC-01: Prometheus exporter ✅
- METRIC-02: Grafana templates ✅
- METRIC-04: AI metrics (tokens, costs) ✅
- METRIC-05: Alerting rules ✅

**Deliverables:**
- `src/lib/observability/Metrics.ts` — Prometheus metrics
- Grafana dashboard JSON templates
- Alert rules configuration
- Token/cost tracking metrics

**Success Criteria:**
1. Metrics exported on `/metrics` endpoint
2. Grafana dashboards show key metrics
3. Alerts fire on threshold breaches
4. AI-specific metrics (tokens, costs, model usage)

**Estimated Cost:** $7.00

---

### Phase 70: VS Code Extension Foundation

**Goal:** Create VS Code extension with core features
**Status:** Pending

**Requirements:**
- VSCODE-01: Extension scaffold ✅
- VSCODE-02: Command palette ✅
- VSCODE-03: Phase status view ✅
- VSCODE-04: Agent activity feed ✅

**Deliverables:**
- `extension.ts` — Extension entry point
- Command palette commands
- Phase status tree view
- Real-time activity feed webview

**Success Criteria:**
1. Extension installs from VSIX
2. Commands accessible from palette
3. Phase status shows current phase
4. Activity feed updates in real-time

**Estimated Cost:** $8.00

---

### Phase 71: Advanced DX Features

**Goal:** Add debug mode, REPL, and playground
**Status:** Pending

**Requirements:**
- VSCODE-05: Debug mode ✅
- VSCODE-06: REPL panel ✅
- DX-01: Agent decision tracing ✅
- DX-02: Interactive REPL ✅
- DX-03: Prompt playground ✅

**Deliverables:**
- Debug mode with step-through execution
- Interactive REPL in VS Code
- Prompt playground for testing variations

**Success Criteria:**
1. Debug mode steps through agent decisions
2. REPL allows interactive command execution
3. Playground tests prompt variations
4. All features accessible from VS Code

**Estimated Cost:** $6.00

---

### Phase 72: Documentation & Finalization

**Goal:** Complete documentation and finalize v5.2
**Status:** Pending

**Requirements:**
- DX-DOC-01 to DX-DOC-03: Documentation ✅
- METRIC-03: Business metrics ✅

**Deliverables:**
- Observability setup guide
- VS Code extension user guide
- Debug mode tutorial
- Business metrics configuration

**Success Criteria:**
1. All guides complete and tested
2. Business metrics (conversions, funnels) configured
3. v5.2 retrospective completed
4. v5.3 planning initiated

**Estimated Cost:** $4.00

---

## v5.x Summary

| Milestone | Phases | Requirements | Est. Cost | Theme |
|-----------|--------|--------------|-----------|-------|
| **v5.0** | 52-58 | 21 | $35 | TypeScript Migration (Hybrid OOP) |
| **v5.1** | 59-65 | 24 | $40 | Chief Strategist & AI Evaluation |
| **v5.2** | 66-72 | 26 | $45 | Observability & Developer Experience |

**Total v5.x:** 21 phases, 71 requirements, ~$120

---

## Configuration

Add to `planning-config.md`:

```json
{
  "phase_lock": {
    "enabled": true,
    "timeout_minutes": 60,
    "heartbeat_interval_minutes": 5,
    "stale_threshold_minutes": 90,
    "max_retries": 3,
    "retry_delay_seconds": 10
  },
  "typescript": {
    "strict": true,
    "incremental": true,
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "observability": {
    "tracing": {
      "enabled": true,
      "provider": "jaeger",
      "sampleRate": 0.1
    },
    "logging": {
      "format": "json",
      "aggregator": "loki"
    },
    "metrics": {
      "provider": "prometheus",
      "port": 9091
    }
  }
}
```

---

## Related Milestones

- **v1.0 LOCK-01, LOCK-02:** File locking infrastructure (proper-lockfile)
- **v2.0 SESSION-01 to SESSION-10:** Cross-model session handoff
- **v2.0 PHASE-GIT-01 to PHASE-GIT-20:** Phase-based GitFlow
- **v4.0:** Production hardening (agent nesting, checkpoint timeout)
- **v4.1:** Phase locking mechanism

---

*Roadmap created: 2026-03-21 (v4.0)*
*Last updated: 2026-03-24 — Added v4.1, v5.0, v5.1, v5.2 (28 phases, 95 requirements)*

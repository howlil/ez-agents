# Phase 10: Foundation & Core Library Refactoring (Part 1) - Context

**Gathered:** 2026-03-25
**Status:** Ready for research and planning

<domain>
## Phase Boundary

**What this phase delivers:** Design pattern implementation for core library modules — Factory, Strategy, Observer, Adapter, Decorator, and Facade patterns applied to establish class-based architecture foundation.

**What this phase does NOT deliver:**
- Clean code principles (DRY, KISS, YAGNI) — that's Phase 11
- Entry points refactoring — that's Phase 12
- Test files refactoring — that's Phase 13
- New features or capabilities — this is pure refactoring

**Scope anchor:** CORE-01 to CORE-07 (7 requirements from REQUIREMENTS.md)

</domain>

<decisions>
## Implementation Decisions

### Design Pattern Scope

**Factory Pattern (CORE-02):**
- Factory creates **agents only** (ez-planner, ez-roadmapper, ez-executor, etc.)
- Use **Factory with registry** pattern: `registerAgent(type, factory)`, `createAgent(type, config)`
- Enables extensibility: new agent types can be registered dynamically
- Skills and other objects use direct instantiation (not Factory)

**Strategy Pattern (CORE-03):**
- Apply to **context compression algorithms** (recommended for token optimization)
- Strategies: summarize, truncate, rank-by-relevance, hybrid approaches
- Context compression is the highest-impact area for interchangeable algorithms
- Model selection uses configuration-based approach (not Strategy pattern)

**Observer Pattern (CORE-04):**
- Observe **both session state changes AND phase transitions**
- Use **EventEmitter-style API**: `on(event, handler)`, `off(event, handler)`, `emit(event, data)`
- Events: session start/stop, phase start/complete/skip, plan transitions
- Enables logging, analytics, crash recovery, and audit trails

**Adapter Pattern (CORE-05):**
- Adapt **both model providers AND skill interfaces**
- Model providers: Claude, OpenAI, Kimi, Qwen → common interface
- Skill interfaces: external tools/APIs → internal skill contract
- Keeps core logic decoupled from provider-specific implementations

**Decorator Pattern (CORE-06):**
- Use **hybrid approach**: TypeScript decorators for classes, higher-order functions for pure functions
- Cross-cutting concerns: **@LogExecution, @CacheResult, @ValidateInput** (all three)
- Apply to **all service classes** (managers, resolvers, detectors) — consistent logging/caching/validation
- Requires `experimentalDecorators: true` in tsconfig.json

**Facade Pattern (CORE-07):**
- Create facades for **both Context management AND Skill resolution**
- **ContextManagerFacade**: Full API — compress(), dedupe(), score(), getCached(), setCached(), metadata tracking, relevance scoring, compression strategies
- **SkillResolverFacade**: Full API — resolveSkill(), matchSkill(), validateSkill(), getSkillContext(), trigger registration
- Simplifies complex subsystem interfaces for consumers

### Class Conversion Criteria

**Which modules become classes:**
- **Stateful modules + service layer** become classes
- Stateful: SessionManager, ErrorCache, CircuitBreaker, LockState (modules with internal state)
- Service layer: managers, resolvers, detectors, executors (business logic)
- Pure utilities remain functional (file ops, path helpers, basic validators)

**FP utilities (bin/lib/fp/):**
- **Convert to static class methods** (e.g., `FP.pipe()`, `FP.map()`, `FP.memoize()`)
- Wraps existing pure functions in namespace class
- Maintains functional behavior, adds organization

### Decorator Implementation

**TypeScript configuration:**
- Enable `experimentalDecorators: true` in tsconfig.json
- Enable `useDefineForClassFields: true` for proper decorator behavior

**Decorator catalog:**
- `@LogExecution(methodName, options)` — logs method entry/exit, duration
- `@CacheResult(cacheKey, ttl)` — caches method results, returns cached value on hit
- `@ValidateInput(validatorFn)` — validates parameters before method execution

**Application scope:**
- Apply to all public methods in service classes
- Skip private methods (internal implementation details)
- Skip getters/setters unless they have side effects

### Facade Boundaries

**ContextManagerFacade responsibilities:**
- Single entry point for all context operations
- Manages context lifecycle: create → compress → dedupe → score → cache
- Exposes compression strategy selection
- Handles metadata tracking automatically
- Consumers call facade instead of individual context modules

**SkillResolverFacade responsibilities:**
- Single entry point for all skill operations
- Orchestrates skill matching, trigger evaluation, context resolution
- Validates skill prerequisites before execution
- Consumers call facade instead of individual skill modules

### Architecture Principles

**OOP + FP Hybrid (preserved from v5.0.0):**
- Classes for stateful entities and service layers
- Functions (static methods) for pure transformations
- Immutable data patterns for state management
- Dependency injection for loose coupling

**Token Optimization (high priority):**
- All decisions should consider token consumption
- Strategy pattern for context compression directly targets token reduction
- Caching decorator reduces redundant API calls
- Facade pattern reduces context needed per operation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Patterns
- `.planning/research/FEATURES.md` — Design patterns table stakes and recommendations
- `.planning/research/ARCHITECTURE.md` — Existing OOP+FP architecture patterns
- `.planning/research/PITFALLS.md` — Common OOP refactoring pitfalls to avoid

### Requirements
- `.planning/REQUIREMENTS.md` — CORE-01 to CORE-07 (Phase 10 requirements)
- `.planning/ROADMAP.md` — Phase 10 goal and success criteria

### Existing Code
- `bin/lib/core.ts` — Core utilities (existing patterns)
- `bin/lib/session-manager.ts` — Existing class pattern example
- `bin/lib/fp/` — Existing FP utilities (to be converted to static)

### TypeScript Configuration
- `tsconfig.json` — Will need `experimentalDecorators: true` added

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SessionManager class** — Existing class pattern to follow/extend
- **CircuitBreaker class** — State machine pattern already in use
- **FP utilities (bin/lib/fp/)** — pipe, transform, memoize, immutable (convert to static)
- **Logger** — Already class-based, can be used in decorators
- **ErrorCache** — Existing cache pattern for @CacheResult decorator

### Established Patterns
- **Hybrid OOP+FP** — Classes for state, functions for transformations (preserve this)
- **ESM imports** — All imports use `.js` extension (TypeScript ESM output)
- **TypeScript strict mode** — Already enabled, maintain type safety
- **TSDoc comments** — Already in use, extend to all new classes/methods

### Integration Points
- **bin/lib/index.ts** — Main barrel export, needs to re-export new classes/facades
- **bin/install.ts** — Entry point that uses core modules (test target for refactoring)
- **bin/lib/observer/** — Directory exists, may contain Observer infrastructure
- **bin/lib/services/** — Directory exists, service layer organization

</code_context>

<specifics>
## Specific Ideas

**Token consumption is a key metric:**
- User prioritized "minimum token consume but high quality output"
- Context compression Strategy pattern directly addresses this
- Caching decorator reduces redundant API calls
- All design pattern decisions should consider token efficiency

**Extensibility matters:**
- Factory with registry pattern chosen for agents
- Observer pattern with EventEmitter for multiple event types
- Facades expose full APIs to avoid future refactoring

**Consistency across service layer:**
- All service classes get decorators (logging, caching, validation)
- Uniform error handling and observability
- No scattered concern logic

</specifics>

---
*Context gathered: 2026-03-25*
*Next: Research design patterns → Planning implementation*

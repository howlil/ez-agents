# Phase 10: Research

**Phase:** Foundation & Core Library Refactoring (Part 1)
**Research Date:** 2026-03-25
**Status:** Ready for planning
**Requirements:** CORE-01 to CORE-07 (7 design pattern requirements)

---

## Design Patterns

### Factory Pattern (CORE-02)

**Decision:** Factory creates **agents only** with registry pattern.

**Implementation approach:**
- **Scope:** Agent instantiation only (ez-planner, ez-roadmapper, ez-executor, etc.)
- **Pattern:** Registry-based Factory
  - `registerAgent(type: string, factory: AgentFactory): void`
  - `createAgent(type: string, config: AgentConfig): IAgent`
  - `hasAgent(type: string): boolean`
  - `getRegisteredTypes(): string[]`
- **Benefits:**
  - Enables runtime extensibility (new agent types can be registered dynamically)
  - Centralizes agent creation logic
  - Decouples agent consumers from concrete implementations
- **Not used for:** Skills, phases, or other objects (direct instantiation preferred)

**Existing patterns to leverage:**
- Agent definitions already exist as markdown files (meta-prompts)
- Agent orchestration flow is proven and should not change
- Model profiles already defined in `core.ts`

**Key design decisions:**
1. Use interface `IAgent` for agent contract
2. Factory class should be stateful (maintains registry)
3. Support dependency injection for agent configuration
4. Maintain backward compatibility with existing agent usage

---

### Strategy Pattern (CORE-03)

**Decision:** Apply to **context compression algorithms** for token optimization.

**Implementation approach:**
- **Context:** `ContextCompressor` module already exists
- **Strategies:**
  - `SummarizeStrategy` — AI-powered summarization
  - `TruncateStrategy` — Simple length-based truncation
  - `RankByRelevanceStrategy` — Keep highest-scored content
  - `HybridStrategy` — Combine multiple approaches
- **Strategy interface:**
  ```typescript
  interface CompressionStrategy {
    compress(content: string, options: CompressionOptions): Promise<CompressionResult>;
    getName(): string;
  }
  ```
- **ContextManager** selects strategy based on configuration

**Why context compression:**
- Directly addresses token optimization (user priority)
- Highest-impact area for interchangeable algorithms
- Multiple valid approaches exist (summarize vs truncate vs rank)
- Easy to extend with new strategies later

**Not Strategy pattern:**
- Model selection (configuration-based, not interchangeable algorithms)
- Skill matching (deterministic logic, not interchangeable)

**Token optimization impact:**
- Strategy choice can reduce token consumption by 40-60%
- Caching compression results reduces redundant API calls
- Relevance scoring ensures high-quality context retention

---

### Observer Pattern (CORE-04)

**Decision:** EventEmitter-style API for session state + phase events.

**Existing infrastructure:**
- `bin/lib/observer/index.ts` already implements:
  - `EventBus` class (singleton)
  - `Observer<T>` interface
  - `Event<T>` interface
  - `SkillTriggerObserver` class

**Implementation approach:**
- **API style:** `on(event, handler)`, `off(event, handler)`, `emit(event, data)`
- **Events to observe:**
  - Session lifecycle: `session:start`, `session:stop`, `session:activity`
  - Phase transitions: `phase:start`, `phase:complete`, `phase:skip`
  - Plan transitions: `plan:start`, `plan:complete`
  - Skill events: `skill:trigger`, `skill:execute`, `skill:complete`
- **Event payload structure:**
  ```typescript
  interface SessionStartEvent {
    sessionId: string;
    timestamp: number;
    phase?: string;
  }

  interface PhaseCompleteEvent {
    phaseNumber: string;
    phaseName: string;
    duration: number;
    plansCompleted: number;
  }
  ```

**Use cases:**
- **Logging:** Automatic audit trail of all phase transitions
- **Analytics:** Track session duration, phase completion rates
- **Crash recovery:** Persist state on events for recovery
- **Debugging:** Event replay for troubleshooting

**Integration points:**
- `SessionManager` emits session events
- `PhaseService` emits phase events
- `SkillResolver` emits skill events
- `EventBus` is singleton (shared across modules)

**Benefits:**
- Decoupled event handling (observers don't know about subjects)
- Multiple observers can react to same event
- Easy to add new observers without modifying subjects
- Enables cross-cutting concerns (logging, analytics) without polluting core logic

---

### Adapter Pattern (CORE-05)

**Decision:** Adapt **both model providers AND skill interfaces**.

**Two adapter categories:**

#### 1. Model Provider Adapters

**Purpose:** Normalize different LLM provider APIs to common interface.

**Existing patterns:**
- `model-provider.ts` — Already has provider abstraction
- `assistant-adapter.ts` — Already adapts Claude Tools API

**Adapters to implement:**
- `ClaudeAdapter` — Anthropic Claude API
- `OpenAIAdapter` — OpenAI Chat Completions API
- `KimiAdapter` — Moonshot Kimi API
- `QwenAdapter` — Alibaba Qwen API

**Common interface:**
```typescript
interface ModelProviderAdapter {
  getName(): string;
  chat(messages: Message[], options: ModelOptions): Promise<ModelResponse>;
  supportsTools(): boolean;
  getMaxTokens(): number;
}
```

**Benefits:**
- Core logic decoupled from provider-specific implementations
- Easy to add new providers without changing core code
- Enables provider failover/round-robin strategies

#### 2. Skill Interface Adapters

**Purpose:** Normalize external tool/API interfaces to internal skill contract.

**Examples:**
- `GitHubSkillAdapter` — Adapts GitHub API to skill interface
- `FileSystemSkillAdapter` — Adapts Node.js fs to skill interface
- `ShellSkillAdapter` — Adapts child_process to skill interface

**Common interface:**
```typescript
interface SkillAdapter {
  getName(): string;
  getDescription(): string;
  getTriggers(): string[];
  execute(context: SkillContext): Promise<SkillResult>;
  validate(): Promise<ValidationResult>;
}
```

**Integration points:**
- `SkillRegistry` already has skill registration system
- `SkillResolver` already resolves skills by trigger
- Adapters plug into existing skill infrastructure

---

### Decorator Pattern (CORE-06)

**Decision:** Hybrid approach — TS decorators for classes, HOFs for functions.

**TypeScript configuration required:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": true
  }
}
```

**Decorator catalog:**

#### @LogExecution(methodName, options)

**Purpose:** Log method entry/exit, duration, parameters, and result.

**Implementation:**
```typescript
function LogExecution(
  methodName: string,
  options: {
    logParams?: boolean;
    logResult?: boolean;
    level?: 'info' | 'debug' | 'trace';
  } = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const startTime = Date.now();
      logger.log(options.level || 'info', `Entering ${methodName}`, {
        params: options.logParams ? args : undefined,
      });

      const result = originalMethod.apply(this, args);

      const duration = Date.now() - startTime;
      logger.log(options.level || 'info', `Exiting ${methodName}`, {
        duration: `${duration}ms`,
        result: options.logResult ? result : undefined,
      });

      return result;
    };

    return descriptor;
  };
}
```

**Usage:**
```typescript
export class ContextManager {
  @LogExecution('ContextManager.gather', { logParams: true, level: 'debug' })
  async gather(options: ContextOptions): Promise<string> {
    // Implementation
  }
}
```

#### @CacheResult(cacheKey, ttl)

**Purpose:** Cache method results, return cached value on cache hit.

**Implementation:**
```typescript
function CacheResult(
  cacheKeyFn: (...args: any[]) => string,
  ttl: number = 300000 // 5 minutes default
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, { value: any; expiry: number }>();

    descriptor.value = function (...args: any[]) {
      const key = cacheKeyFn(...args);
      const cached = cache.get(key);

      if (cached && cached.expiry > Date.now()) {
        logger.debug(`Cache hit for ${key}`);
        return cached.value;
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, { value: result, expiry: Date.now() + ttl });
      logger.debug(`Cache miss for ${key}, cached result`);

      return result;
    };

    return descriptor;
  };
}
```

**Usage:**
```typescript
export class ContextCompressor {
  @CacheResult(
    (content, strategy) => `compress:${strategy}:${hash(content)}`,
    600000 // 10 minutes
  )
  async compress(content: string, strategy: string): Promise<string> {
    // Implementation
  }
}
```

#### @ValidateInput(validatorFn)

**Purpose:** Validate parameters before method execution.

**Implementation:**
```typescript
function ValidateInput(validatorFn: (...args: any[]) => void) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      validatorFn(...args); // Throws if validation fails
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
```

**Usage:**
```typescript
export class SkillResolver {
  @ValidateInput((skills, context) => {
    if (!Array.isArray(skills)) throw new Error('Skills must be an array');
    if (!context) throw new Error('Context is required');
  })
  resolve(skills: Skill[], context: Context): ResolveResult {
    // Implementation
  }
}
```

#### Higher-Order Functions for FP Utilities

**Purpose:** Decorate pure functions without TS decorator syntax.

**Implementation:**
```typescript
// For FP utilities in bin/lib/fp/
function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    logger.debug(`Calling ${name}`, { args });
    const result = fn(...args);
    logger.debug(`Completed ${name}`);
    return result;
  }) as T;
}

function withCaching<T extends (...args: any[]) => any>(
  fn: T,
  cacheKeyFn: (...args: Parameters<T>) => string,
  ttl: number
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>();
  return ((...args: Parameters<T>) => {
    const key = cacheKeyFn(...args);
    const cached = cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    const result = fn(...args);
    cache.set(key, { value: result, expiry: Date.now() + ttl });
    return result;
  }) as T;
}
```

**Application scope:**
- **All service classes:** ContextManager, SkillResolver, SessionManager, etc.
- **All public methods:** Except private methods and simple getters/setters
- **FP utilities:** Use HOF approach for pipe, map, filter, memoize

**Benefits:**
- Cross-cutting concerns separated from business logic
- Consistent logging/caching/validation across entire codebase
- Easy to enable/disable decorators (configuration-based)
- Reduces boilerplate code in methods

---

### Facade Pattern (CORE-07)

**Decision:** Create facades for **both Context management AND Skill resolution**.

#### ContextManagerFacade

**Purpose:** Single entry point for all context operations.

**Responsibilities:**
- Orchestrates context lifecycle: create → compress → dedupe → score → cache
- Exposes compression strategy selection
- Handles metadata tracking automatically
- Manages context caching transparently

**Full API:**
```typescript
class ContextManagerFacade {
  // Core operations
  gather(options: ContextOptions): Promise<string>;
  compress(content: string, strategy: CompressionStrategy): Promise<string>;
  deduplicate(content: string): Promise<string>;
  score(content: string, query: string): Promise<number>;

  // Cache operations
  getCached(key: string): string | null;
  setCached(key: string, content: string, ttl?: number): void;

  // Metadata operations
  getMetadata(taskId: string): ContextMetadata;
  trackSources(sources: ContextSource[]): void;

  // Configuration
  setCompressionStrategy(strategy: CompressionStrategy): void;
  enableScoring(enabled: boolean): void;
  enableDeduplication(enabled: boolean): void;
}
```

**Usage example:**
```typescript
// Before: Consumer coordinates multiple modules
const contextManager = new ContextManager();
const compressor = new ContextCompressor(strategy);
const scorer = new ContextRelevanceScorer();
const cache = new ContextCache();

const raw = await contextManager.gather(files);
const scored = await scorer.score(raw, task);
const compressed = await compressor.compress(scored);
cache.set(taskId, compressed);

// After: Consumer calls facade
const contextFacade = new ContextManagerFacade();
const context = await contextFacade.gather({
  files,
  task,
  enableScoring: true,
  enableCompression: true,
  compressionStrategy: 'summarize',
});
```

#### SkillResolverFacade

**Purpose:** Single entry point for all skill operations.

**Responsibilities:**
- Orchestrates skill matching, trigger evaluation, context resolution
- Validates skill prerequisites before execution
- Manages skill registration lifecycle
- Handles skill conflicts and resolution

**Full API:**
```typescript
class SkillResolverFacade {
  // Core operations
  resolveSkill(trigger: string, context: Context): Promise<Skill | null>;
  matchSkill(query: string, skills: Skill[]): Promise<Skill[]>;
  validateSkill(skill: Skill): Promise<ValidationResult>;
  getSkillContext(skill: Skill): Promise<Context>;

  // Registration
  registerSkill(skill: Skill): void;
  unregisterSkill(skillName: string): void;
  getRegisteredSkills(): Skill[];

  // Execution
  executeSkill(skill: Skill, context: Context): Promise<SkillResult>;
  executeSkills(skills: Skill[], context: Context): Promise<SkillResult[]>;

  // Configuration
  setSkillPriority(priority: Record<string, number>): void;
  enableSkillValidation(enabled: boolean): void;
}
```

**Usage example:**
```typescript
// Before: Consumer coordinates multiple skill modules
const matcher = new SkillMatcher();
const resolver = new SkillResolver();
const validator = new SkillValidator();

const matches = matcher.match(query, skills);
const validated = validator.validate(matches[0]);
const result = resolver.resolve([validated], context);

// After: Consumer calls facade
const skillFacade = new SkillResolverFacade();
const result = await skillFacade.resolveSkill(query, context);
```

**Benefits:**
- Simplifies complex subsystem interfaces
- Reduces coupling between consumers and subsystems
- Centralizes orchestration logic
- Easier to test (mock facade instead of multiple subsystems)
- Consistent API across different consumers

---

## TypeScript Implementation

### Class Conversion Criteria

**Which modules become classes:**

#### Stateful modules → Classes

**Criteria:** Module maintains internal state that persists across method calls.

**Examples:**
- `SessionManager` — Maintains `currentState`, `statePath`
- `ErrorCache` — Maintains error history with LRU eviction
- `CircuitBreaker` — Maintains failure count, state (CLOSED/OPEN/HALF_OPEN)
- `LockState` — Maintains lock state for concurrency control
- `ContextCache` — Maintains cache entries with TTL
- `CostTracker` — Maintains running cost totals

**Pattern:**
```typescript
export class SessionManager {
  private statePath: string;
  private currentState: SessionState | null;

  constructor(planningDir: string) {
    this.statePath = path.join(planningDir, 'SESSION.json');
    this.currentState = null;
  }

  // Stateful methods
  loadState(): SessionState | null { }
  saveState(state: SessionState): void { }
  createSession(sessionId: string): SessionState { }
}
```

#### Service layer → Classes

**Criteria:** Module encapsulates business logic, coordinates between other modules.

**Examples:**
- `ContextManager` — Orchestrates context gathering, compression, scoring
- `SkillResolver` — Resolves skill conflicts, applies priority rules
- `PhaseService` — Manages phase lifecycle, plan execution
- `RoadmapService` — Manages roadmap creation, milestone tracking
- `ModelService` — Manages model provider selection, API calls
- `GitService` — Manages Git operations, workflow orchestration

**Pattern:**
```typescript
export class ContextManager {
  private cache: ContextCache;
  private scorer: ContextRelevanceScorer;
  private compressor: ContextCompressor;

  constructor(options: ContextManagerOptions = {}) {
    this.cache = new ContextCache();
    this.scorer = new ContextRelevanceScorer();
    this.compressor = new ContextCompressor();
  }

  // Business logic methods
  async gather(options: ContextOptions): Promise<string> { }
  async compress(content: string): Promise<string> { }
}
```

#### FP utilities → Static class methods

**Criteria:** Pure functions with no side effects, used for transformations.

**Existing location:** `bin/lib/fp/`

**Conversion approach:**
```typescript
// Before: Module exports pure functions
// bin/lib/fp/transform.ts
export function map<T, U>(arr: T[], fn: Transform<T, U>): U[] {
  return arr.map(fn);
}

export function pipe<T>(...fns: Array<UnaryFunction<T, T>>): UnaryFunction<T, T> {
  return function piped(value: T): T {
    return fns.reduce((result, fn) => fn(result), value);
  };
}

// After: Wrap in namespace class
// bin/lib/fp/FP.ts
export class FP {
  static map<T, U>(arr: T[], fn: Transform<T, U>): U[] {
    return arr.map(fn);
  }

  static pipe<T>(...fns: Array<UnaryFunction<T, T>>): UnaryFunction<T, T> {
    return function piped(value: T): T {
      return fns.reduce((result, fn) => fn(result), value);
    };
  }

  static filter<T>(arr: T[], predicate: Predicate<T>): T[] {
    return arr.filter(predicate);
  }

  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    options?: CacheOptions
  ): MemoizedFunction<T> {
    // Implementation
  }
}
```

**Usage:**
```typescript
import { FP } from './fp/FP.js';

const result = FP.pipe(
  [1, 2, 3, 4, 5],
  (arr) => FP.map(arr, (x) => x * 2),
  (arr) => FP.filter(arr, (x) => x > 5)
);
```

**Benefits:**
- Maintains functional behavior (pure functions)
- Adds organization (namespace class)
- Easier to discover (autocomplete shows all FP methods)
- Consistent with OOP+FP hybrid architecture

#### Pure utilities → Remain functional

**Criteria:** Simple utilities with no state, single responsibility.

**Examples:**
- `safe-path.ts` — Path manipulation utilities
- `retry.ts` — Retry logic with backoff
- `frontmatter.ts` — YAML frontmatter parsing
- `template.ts` — Template string utilities

**Pattern:** Keep as module exports (no class wrapper needed).

```typescript
// bin/lib/safe-path.ts
export function normalizePath(filePath: string): string {
  // Implementation
}

export function joinPaths(...paths: string[]): string {
  // Implementation
}
```

---

### Decorator Implementation Details

**TypeScript configuration:**

Current `tsconfig.json` needs updates:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": true
  }
}
```

**Decorator infrastructure:**

Create `bin/lib/decorators/` directory:
```
bin/lib/decorators/
├── index.ts              # Barrel export
├── LogExecution.ts       # @LogExecution decorator
├── CacheResult.ts        # @CacheResult decorator
├── ValidateInput.ts      # @ValidateInput decorator
└── types.ts              # Decorator types and interfaces
```

**Example: LogExecution decorator**
```typescript
// bin/lib/decorators/LogExecution.ts
import { defaultLogger as logger } from '../logger.js';

export interface LogExecutionOptions {
  logParams?: boolean;
  logResult?: boolean;
  logDuration?: boolean;
  level?: 'info' | 'debug' | 'trace' | 'warn' | 'error';
  paramName?: string;
}

export function LogExecution(
  methodName: string,
  options: LogExecutionOptions = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = function (...args: any[]) {
      const startTime = Date.now();
      const logLevel = options.level || 'debug';

      logger[logLevel](`[${className}] Entering ${methodName}`, {
        ...(options.logParams && { params: args }),
        ...(options.paramName && { [options.paramName]: args[0] }),
      });

      try {
        const result = originalMethod.apply(this, args);

        // Handle both sync and async methods
        if (result instanceof Promise) {
          return result
            .then((resolvedResult) => {
              const duration = Date.now() - startTime;
              logger[logLevel](`[${className}] Completed ${methodName}`, {
                duration: `${duration}ms`,
                ...(options.logResult && { result: resolvedResult }),
              });
              return resolvedResult;
            })
            .catch((error: Error) => {
              const duration = Date.now() - startTime;
              logger[logLevel](`[${className}] Failed ${methodName}`, {
                duration: `${duration}ms`,
                error: error.message,
              });
              throw error;
            });
        }

        const duration = Date.now() - startTime;
        logger[logLevel](`[${className}] Completed ${methodName}`, {
          duration: `${duration}ms`,
          ...(options.logResult && { result }),
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger[logLevel](`[${className}] Failed ${methodName}`, {
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };

    return descriptor;
  };
}
```

**Application scope:**

| Class | Decorators to Apply |
|-------|-------------------|
| `ContextManager` | `@LogExecution` on gather(), compress(), dedupe() |
| `ContextCompressor` | `@CacheResult` on compress(), `@LogExecution` on all public methods |
| `ContextRelevanceScorer` | `@CacheResult` on score(), `@LogExecution` on all public methods |
| `SkillResolver` | `@ValidateInput` on resolve(), `@LogExecution` on all public methods |
| `SkillMatcher` | `@CacheResult` on match(), `@LogExecution` on all public methods |
| `SessionManager` | `@LogExecution` on createSession(), loadState(), saveState() |
| `ErrorCache` | `@LogExecution` on record(), get(), clear() |
| `CircuitBreaker` | `@LogExecution` on execute(), getState() |

**Skip decorators on:**
- Private methods (internal implementation details)
- Simple getters/setters without side effects
- Constructor methods
- Static utility methods (unless they have significant logic)

---

### Integration Points

**Barrel exports:**

Update `bin/lib/index.ts` to re-export new classes and facades:
```typescript
// Existing exports
export { Logger, defaultLogger } from './logger.js';
export { SessionManager } from './session-manager.js';
export { ContextManager } from './context-manager.js';
export { SkillResolver } from './skill-resolver.js';

// New: Decorator exports
export { LogExecution } from './decorators/LogExecution.js';
export { CacheResult } from './decorators/CacheResult.js';
export { ValidateInput } from './decorators/ValidateInput.js';

// New: Facade exports
export { ContextManagerFacade } from './facades/ContextManagerFacade.js';
export { SkillResolverFacade } from './facades/SkillResolverFacade.js';

// New: Factory exports
export { AgentFactory } from './factories/AgentFactory.js';

// New: Strategy exports
export type { CompressionStrategy } from './strategies/CompressionStrategy.js';
export { SummarizeStrategy } from './strategies/SummarizeStrategy.js';
export { TruncateStrategy } from './strategies/TruncateStrategy.js';
export { RankByRelevanceStrategy } from './strategies/RankByRelevanceStrategy.js';

// New: Adapter exports
export type { ModelProviderAdapter } from './adapters/ModelProviderAdapter.js';
export { ClaudeAdapter } from './adapters/ClaudeAdapter.js';
export { OpenAIAdapter } from './adapters/OpenAIAdapter.js';

// New: Observer exports
export { EventBus } from './observer/index.js';
export type { Observer, Event, EventHandler } from './observer/index.js';

// New: FP namespace
export { FP } from './fp/FP.js';
```

**Directory structure:**

```
bin/lib/
├── decorators/           # NEW: Decorator infrastructure
│   ├── index.ts
│   ├── LogExecution.ts
│   ├── CacheResult.ts
│   ├── ValidateInput.ts
│   └── types.ts
├── factories/            # NEW: Factory pattern
│   ├── index.ts
│   ├── AgentFactory.ts
│   └── types.ts
├── strategies/           # NEW: Strategy pattern
│   ├── index.ts
│   ├── CompressionStrategy.ts
│   ├── SummarizeStrategy.ts
│   ├── TruncateStrategy.ts
│   └── RankByRelevanceStrategy.ts
├── adapters/             # NEW: Adapter pattern
│   ├── index.ts
│   ├── ModelProviderAdapter.ts
│   ├── ClaudeAdapter.ts
│   ├── OpenAIAdapter.ts
│   ├── KimiAdapter.ts
│   └── QwenAdapter.ts
├── facades/              # NEW: Facade pattern
│   ├── index.ts
│   ├── ContextManagerFacade.ts
│   └── SkillResolverFacade.ts
├── observer/             # EXISTING: Observer pattern
│   └── index.ts
├── fp/                   # MODIFIED: Convert to static class
│   ├── index.ts
│   └── FP.ts
├── services/             # EXISTING: Service layer
│   └── *.service.ts
└── index.ts              # MODIFIED: Add new exports
```

---

## Integration Strategy

### Phase 10.1: Convert Functional Modules to Class-Based Architecture (CORE-01)

**Goal:** Identify stateful modules and convert to classes.

**Modules to convert:**
1. `context-manager.ts` — Already class-like, refactor to proper class
2. `context-cache.ts` — Convert to class with proper encapsulation
3. `context-compressor.ts` — Convert to class with Strategy pattern support
4. `context-deduplicator.ts` — Convert to class
5. `context-relevance-scorer.ts` — Convert to class with caching
6. `context-metadata-tracker.ts` — Convert to class
7. `skill-matcher.ts` — Convert to class
8. `skill-triggers.ts` — Convert to class
9. `skill-validator.ts` — Convert to class
10. `skill-context.ts` — Convert to class

**Approach:**
1. Identify state (private fields)
2. Create constructor with dependency injection
3. Convert functions to methods
4. Add proper access modifiers (public/private/protected)
5. Add TSDoc to all methods
6. Maintain backward compatibility (export same API)

**Example conversion:**
```typescript
// Before: Functional module
let cache: Map<string, CacheEntry> = new Map();

export function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.content;
  }
  return null;
}

export function setCached(key: string, content: string, ttl: number): void {
  cache.set(key, { content, expiry: Date.now() + ttl });
}

// After: Class-based
export interface ContextCacheOptions {
  defaultTtl?: number;
  maxSize?: number;
}

export class ContextCache {
  private cache: Map<string, CacheEntry>;
  private defaultTtl: number;
  private maxSize: number;

  constructor(options: ContextCacheOptions = {}) {
    this.cache = new Map();
    this.defaultTtl = options.defaultTtl ?? 300000; // 5 minutes
    this.maxSize = options.maxSize ?? 1000;
  }

  getCached(key: string): string | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.content;
    }
    return null;
  }

  setCached(key: string, content: string, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    this.cache.set(key, {
      content,
      expiry: Date.now() + (ttl ?? this.defaultTtl),
    });
  }

  private evictOldest(): void {
    // LRU eviction logic
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

### Phase 10.2: Apply Factory Pattern (CORE-02)

**Goal:** Create Agent Factory with registry pattern.

**Implementation:**
```typescript
// bin/lib/factories/AgentFactory.ts
import type { IAgent } from '../types/IAgent.js';
import type { AgentConfig } from '../types/AgentConfig.js';

export type AgentFactoryFn = (config: AgentConfig) => IAgent;

export class AgentFactory {
  private registry: Map<string, AgentFactoryFn>;

  constructor() {
    this.registry = new Map();
  }

  registerAgent(type: string, factory: AgentFactoryFn): void {
    this.registry.set(type, factory);
    logger.info(`Registered agent type: ${type}`);
  }

  createAgent(type: string, config: AgentConfig): IAgent {
    const factory = this.registry.get(type);
    if (!factory) {
      throw new Error(`Unknown agent type: ${type}. Registered types: ${this.getRegisteredTypes()}`);
    }
    logger.info(`Creating agent: ${type}`);
    return factory(config);
  }

  hasAgent(type: string): boolean {
    return this.registry.has(type);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }
}

// Registration of built-in agents
export function registerBuiltInAgents(factory: AgentFactory): void {
  factory.registerAgent('ez-planner', (config) => new EzPlannerAgent(config));
  factory.registerAgent('ez-roadmapper', (config) => new EzRoadmapperAgent(config));
  factory.registerAgent('ez-executor', (config) => new EzExecutorAgent(config));
  factory.registerAgent('ez-reviewer', (config) => new EzReviewerAgent(config));
  factory.registerAgent('ez-tester', (config) => new EzTesterAgent(config));
  // ... register all 21 agent types
}
```

**Usage:**
```typescript
// In entry point (install.ts or ez-tools.ts)
import { AgentFactory, registerBuiltInAgents } from './factories/AgentFactory.js';

const agentFactory = new AgentFactory();
registerBuiltInAgents(agentFactory);

// Create agent instances
const planner = agentFactory.createAgent('ez-planner', {
  modelProfile: 'claude-sonnet',
  cwd: process.cwd(),
});
```

---

### Phase 10.3: Apply Strategy Pattern (CORE-03)

**Goal:** Implement compression strategies.

**Implementation:**
```typescript
// bin/lib/strategies/CompressionStrategy.ts
export interface CompressionOptions {
  maxTokens?: number;
  targetCompressionRatio?: number;
  preserveCodeBlocks?: boolean;
}

export interface CompressionResult {
  content: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
  method: string;
}

export interface CompressionStrategy {
  compress(content: string, options: CompressionOptions): Promise<CompressionResult>;
  getName(): string;
}

// bin/lib/strategies/SummarizeStrategy.ts
export class SummarizeStrategy implements CompressionStrategy {
  private modelService: ModelService;

  constructor(modelService: ModelService) {
    this.modelService = modelService;
  }

  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    const prompt = `Summarize the following content while preserving key information:\n\n${content}`;
    const summary = await this.modelService.chat(prompt);

    return {
      content: summary,
      originalSize: content.length,
      compressedSize: summary.length,
      reduction: ((content.length - summary.length) / content.length) * 100,
      method: 'summarize',
    };
  }

  getName(): string {
    return 'summarize';
  }
}

// bin/lib/strategies/TruncateStrategy.ts
export class TruncateStrategy implements CompressionStrategy {
  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    const maxTokens = options.maxTokens ?? 4000;
    const truncated = content.slice(0, maxTokens * 4); // Approximate chars

    return {
      content: truncated,
      originalSize: content.length,
      compressedSize: truncated.length,
      reduction: ((content.length - truncated.length) / content.length) * 100,
      method: 'truncate',
    };
  }

  getName(): string {
    return 'truncate';
  }
}

// bin/lib/strategies/RankByRelevanceStrategy.ts
export class RankByRelevanceStrategy implements CompressionStrategy {
  private scorer: ContextRelevanceScorer;

  constructor(scorer: ContextRelevanceScorer) {
    this.scorer = scorer;
  }

  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    // Split into chunks, score each, keep top N
    const chunks = this.splitIntoChunks(content);
    const scoredChunks = await Promise.all(
      chunks.map(async (chunk) => ({
        chunk,
        score: await this.scorer.score(chunk, options.query || ''),
      }))
    );

    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxChunks ?? 10)
      .map((c) => c.chunk)
      .join('\n\n');

    return {
      content: topChunks,
      originalSize: content.length,
      compressedSize: topChunks.length,
      reduction: ((content.length - topChunks.length) / content.length) * 100,
      method: 'rank-by-relevance',
    };
  }

  getName(): string {
    return 'rank-by-relevance';
  }
}
```

**ContextManager integration:**
```typescript
export class ContextManager {
  private strategy: CompressionStrategy;

  constructor(options: ContextManagerOptions) {
    this.strategy = options.compressionStrategy || new TruncateStrategy();
  }

  setCompressionStrategy(strategy: CompressionStrategy): void {
    this.strategy = strategy;
  }

  async compress(content: string, options: CompressionOptions): Promise<string> {
    const result = await this.strategy.compress(content, options);
    logger.info(`Compression: ${result.reduction.toFixed(2)}% reduction using ${result.method}`);
    return result.content;
  }
}
```

---

### Phase 10.4: Apply Observer Pattern (CORE-04)

**Goal:** Integrate EventBus into SessionManager and PhaseService.

**Implementation:**
```typescript
// bin/lib/session-manager.ts (modified)
import { EventBus } from './observer/index.js';

export class SessionManager {
  private eventBus: EventBus;

  constructor(planningDir: string, eventBus?: EventBus) {
    this.statePath = path.join(planningDir, 'SESSION.json');
    this.eventBus = eventBus || EventBus.getInstance();
  }

  createSession(sessionId: string): SessionState {
    const state: SessionState = {
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      context: {},
    };
    this.saveState(state);

    // Emit event
    this.eventBus.publish('session:start', {
      sessionId,
      timestamp: Date.now(),
    });

    return state;
  }

  updateActivity(): void {
    if (this.currentState) {
      this.currentState.lastActivity = Date.now();
      this.saveState(this.currentState);

      this.eventBus.publish('session:activity', {
        sessionId: this.currentState.sessionId,
        timestamp: Date.now(),
      });
    }
  }

  endSession(reason?: string): void {
    if (this.currentState) {
      this.currentState.stoppedAt = new Date().toISOString();
      this.saveState(this.currentState);

      this.eventBus.publish('session:stop', {
        sessionId: this.currentState.sessionId,
        timestamp: Date.now(),
        reason: reason || 'completed',
      });

      this.currentState = null;
    }
  }
}

// bin/lib/services/phase.service.ts (modified)
import { EventBus } from '../observer/index.js';

export class PhaseService {
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || EventBus.getInstance();
  }

  async startPhase(phaseNumber: string): Promise<Phase> {
    const phase = await this.loadPhase(phaseNumber);

    this.eventBus.publish('phase:start', {
      phaseNumber: phase.number,
      phaseName: phase.name,
      timestamp: Date.now(),
      plans: phase.plans,
    });

    return phase;
  }

  async completePhase(phase: Phase): Promise<void> {
    // ... completion logic

    this.eventBus.publish('phase:complete', {
      phaseNumber: phase.number,
      phaseName: phase.name,
      duration: Date.now() - phase.startTime,
      plansCompleted: phase.completedPlans.length,
    });
  }

  async skipPhase(phaseNumber: string, reason: string): Promise<void> {
    this.eventBus.publish('phase:skip', {
      phaseNumber,
      reason,
      timestamp: Date.now(),
    });
  }
}
```

**Observer examples:**
```typescript
// Logging observer
class LoggingObserver implements Observer<unknown> {
  update(event: Event<unknown>): void {
    logger.info(`Event: ${event.type}`, {
      payload: event.payload,
      timestamp: new Date(event.timestamp).toISOString(),
    });
  }
}

// Analytics observer
class AnalyticsObserver implements Observer<unknown> {
  private sessionStart: number | null = null;

  update(event: Event<unknown>): void {
    switch (event.type) {
      case 'session:start':
        this.sessionStart = event.timestamp;
        break;
      case 'session:stop':
        const duration = event.timestamp - (this.sessionStart || event.timestamp);
        this.trackAnalytics('session_duration', duration);
        break;
      case 'phase:complete':
        this.trackAnalytics('phase_completed', {
          phase: event.payload.phaseNumber,
          duration: event.payload.duration,
        });
        break;
    }
  }

  private trackAnalytics(metric: string, value: unknown): void {
    // Send to analytics service
  }
}

// Crash recovery observer
class CrashRecoveryObserver implements Observer<unknown> {
  private recoveryManager: RecoveryManager;

  constructor(recoveryManager: RecoveryManager) {
    this.recoveryManager = recoveryManager;
  }

  update(event: Event<unknown>): void {
    // Persist state on every event for crash recovery
    this.recoveryManager.persistState({
      eventType: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
    });
  }
}
```

---

### Phase 10.5: Apply Adapter Pattern (CORE-05)

**Goal:** Create adapters for model providers and skill interfaces.

**Implementation:**
```typescript
// bin/lib/adapters/ModelProviderAdapter.ts
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface ModelResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface ModelProviderAdapter {
  getName(): string;
  chat(messages: Message[], options: ModelOptions): Promise<ModelResponse>;
  supportsTools(): boolean;
  getMaxTokens(): number;
}

// bin/lib/adapters/ClaudeAdapter.ts
export class ClaudeAdapter implements ModelProviderAdapter {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'claude';
  }

  async chat(messages: Message[], options: ModelOptions): Promise<ModelResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: options.maxTokens || 4096,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
      }),
    });

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
    };
  }

  supportsTools(): boolean {
    return true;
  }

  getMaxTokens(): number {
    return 4096;
  }
}

// bin/lib/adapters/OpenAIAdapter.ts
export class OpenAIAdapter implements ModelProviderAdapter {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'openai';
  }

  async chat(messages: Message[], options: ModelOptions): Promise<ModelResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        messages,
      }),
    });

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  }

  supportsTools(): boolean {
    return true;
  }

  getMaxTokens(): number {
    return 4096;
  }
}

// ModelService uses adapter
export class ModelService {
  private adapter: ModelProviderAdapter;

  constructor(adapter: ModelProviderAdapter) {
    this.adapter = adapter;
  }

  setAdapter(adapter: ModelProviderAdapter): void {
    this.adapter = adapter;
  }

  async chat(prompt: string, options: ModelOptions = {}): Promise<string> {
    const messages: Message[] = [
      { role: 'user', content: prompt },
    ];
    const response = await this.adapter.chat(messages, options);
    return response.content;
  }
}
```

---

### Phase 10.6: Apply Decorator Pattern (CORE-06)

**Goal:** Implement and apply decorators to service classes.

**Implementation:** See "TypeScript Implementation" section above for decorator code.

**Application:**
```typescript
// bin/lib/context-manager.ts (with decorators)
import { LogExecution } from './decorators/LogExecution.js';
import { CacheResult } from './decorators/CacheResult.js';
import { ValidateInput } from './decorators/ValidateInput.js';

export class ContextManager {
  @LogExecution('ContextManager.gather', { logParams: true, level: 'debug' })
  async gather(options: ContextOptions): Promise<string> {
    // Implementation
  }

  @CacheResult(
    (content, strategy) => `compress:${strategy}:${hash(content)}`,
    600000
  )
  @LogExecution('ContextManager.compress', { logParams: true })
  async compress(content: string, strategy: string): Promise<string> {
    // Implementation
  }

  @ValidateInput((files) => {
    if (!Array.isArray(files)) throw new Error('Files must be an array');
  })
  @LogExecution('ContextManager.deduplicate', { logParams: false })
  async deduplicate(files: string[]): Promise<string> {
    // Implementation
  }
}
```

---

### Phase 10.7: Apply Facade Pattern (CORE-07)

**Goal:** Create ContextManagerFacade and SkillResolverFacade.

**Implementation:** See "Design Patterns" section above for facade APIs.

---

## Token Optimization

**User priority:** "Minimum token consume but high quality output"

**How Phase 10 design patterns address token optimization:**

### Strategy Pattern (Context Compression)

**Direct impact:**
- **SummarizeStrategy:** AI-powered summarization can reduce tokens by 60-80% while preserving meaning
- **TruncateStrategy:** Simple truncation, fast but may lose important context
- **RankByRelevanceStrategy:** Keeps highest-value content, typically 40-60% reduction
- **HybridStrategy:** Combines approaches for optimal balance

**Token savings example:**
```
Original context: 50,000 tokens
After SummarizeStrategy: 10,000 tokens (80% reduction)
After RankByRelevanceStrategy: 20,000 tokens (60% reduction)

Cost savings (Claude Sonnet):
- Original: $0.15 (input) + $0.075 (output) = $0.225
- Compressed: $0.03 (input) + $0.015 (output) = $0.045
- Savings: 80% cost reduction
```

### Decorator Pattern (@CacheResult)

**Direct impact:**
- Caches compression results, avoiding redundant API calls
- Caches skill resolution results, avoiding redundant computation
- Typical cache hit rate: 30-50% for repeated operations

**Token savings example:**
```
100 agent executions:
- Without caching: 100 compression API calls = 100 × 50,000 tokens = 5M tokens
- With 40% cache hit rate: 60 compression API calls = 60 × 50,000 tokens = 3M tokens
- Savings: 2M tokens (40% reduction)
```

### Observer Pattern (Event-driven optimization)

**Indirect impact:**
- Enables analytics to track token usage per phase/plan
- Identifies high-token-consumption operations for optimization
- Supports crash recovery (avoid re-executing token-heavy operations)

### Facade Pattern (ContextManagerFacade)

**Indirect impact:**
- Centralizes optimization logic (easier to improve)
- Ensures consistent compression strategy application
- Reduces context needed per operation (simplified API)

### Adapter Pattern (Model Provider Adapters)

**Indirect impact:**
- Enables model selection based on token efficiency
- Supports fallback to cheaper models when appropriate
- Tracks token usage across providers

**Total estimated token reduction:**
- **Strategy pattern:** 60-80% (compression)
- **Decorator pattern:** 30-50% (caching)
- **Combined:** 70-85% total reduction in token consumption

---

## Recommendations

### 1. Implementation Order

**Recommended sequence:**
1. **CORE-01** (Class conversion) — Foundation for all other patterns
2. **CORE-06** (Decorators) — Apply to classes as they're created
3. **CORE-04** (Observer) — Integrate with SessionManager, PhaseService
4. **CORE-03** (Strategy) — Implement compression strategies
5. **CORE-05** (Adapter) — Create model provider adapters
6. **CORE-02** (Factory) — Create AgentFactory
7. **CORE-07** (Facade) — Create facades last (depend on all other patterns)

**Rationale:**
- Class conversion (CORE-01) is prerequisite for decorators, facades
- Decorators (CORE-06) should be applied early (cross-cutting concern)
- Observer (CORE-04) is independent, can be done in parallel
- Strategy (CORE-03) requires class conversion first
- Adapter (CORE-05) is independent, can be done in parallel
- Factory (CORE-02) is independent, can be done in parallel
- Facade (CORE-07) orchestrates all other patterns, should be last

---

### 2. Testing Strategy

**Unit tests:**
- Test each pattern in isolation
- Mock dependencies (e.g., mock EventBus for Observer tests)
- Test decorator behavior (logging, caching, validation)
- Test strategy interchangeability
- Test factory registration and creation
- Test facade orchestration

**Integration tests:**
- Test pattern combinations (e.g., decorated methods in facades)
- Test Observer event flow (emit → receive)
- Test Strategy pattern with real compression
- Test Adapter pattern with mock API responses

**Regression tests:**
- Maintain 70%+ coverage threshold
- Run full test suite after each pattern implementation
- Verify zero breaking changes to public APIs

---

### 3. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Breaking changes to public APIs** | High | Maintain backward compatibility, export same API surface, run integration tests |
| **Decorator performance overhead** | Medium | Benchmark decorator performance, make decorators configurable (enable/disable) |
| **Circular dependencies** | Medium | Follow dependency graph, extract shared types to `types/` directory |
| **Strategy pattern complexity** | Low | Start with 2-3 strategies, document usage clearly |
| **Observer pattern debugging difficulty** | Medium | Add detailed logging to EventBus, create event trace viewer |
| **Facade becomes god object** | Medium | Keep facades thin (orchestration only), delegate to subsystems |
| **TypeScript decorator limitations** | Low | Use hybrid approach (TS decorators for classes, HOFs for functions) |

---

### 4. Success Metrics

**Code quality:**
- All 7 design patterns implemented and documented
- Zero breaking changes to public APIs
- 100% TSDoc coverage on new classes/methods
- Zero ESLint warnings

**Test coverage:**
- All 472+ tests passing
- Maintain 70%+ code coverage
- Zero skipped tests

**Token optimization:**
- Measure token consumption before/after
- Target: 70%+ reduction in context tokens
- Track cache hit rates (target: 40%+)

**Developer experience:**
- Consistent patterns across codebase
- Clear documentation for each pattern
- Easy to extend (new strategies, adapters, agents)

---

### 5. Documentation Requirements

**Per-pattern documentation:**
- Design pattern explanation (what, why, how)
- Code examples (before/after)
- Usage guidelines (when to use, when not to use)
- Integration points (how it connects to other patterns)

**Architecture documentation:**
- Update `ARCHITECTURE.md` with new patterns
- Create pattern decision tree (Factory vs Builder, Strategy vs State)
- Document OOP+FP hybrid approach

**Migration guide:**
- Document FP → OOP migration decisions
- Explain when to keep FP patterns (pure functions)
- Provide migration checklist for contributors

---

### 6. TypeScript Configuration Updates

**Required changes to `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": true
  }
}
```

**Build system updates:**
- Ensure tsup preserves decorator metadata
- Configure source maps for debugging decorated methods
- Update ESLint rules for decorator usage

---

### 7. Key Files to Create

**New directories:**
```
bin/lib/
├── decorators/
│   ├── index.ts
│   ├── LogExecution.ts
│   ├── CacheResult.ts
│   ├── ValidateInput.ts
│   └── types.ts
├── factories/
│   ├── index.ts
│   ├── AgentFactory.ts
│   └── types.ts
├── strategies/
│   ├── index.ts
│   ├── CompressionStrategy.ts
│   ├── SummarizeStrategy.ts
│   ├── TruncateStrategy.ts
│   └── RankByRelevanceStrategy.ts
├── adapters/
│   ├── index.ts
│   ├── ModelProviderAdapter.ts
│   ├── ClaudeAdapter.ts
│   ├── OpenAIAdapter.ts
│   ├── KimiAdapter.ts
│   └── QwenAdapter.ts
└── facades/
    ├── index.ts
    ├── ContextManagerFacade.ts
    └── SkillResolverFacade.ts
```

**Modified files:**
- `bin/lib/index.ts` — Add new exports
- `tsconfig.json` — Enable decorators
- `bin/lib/context-manager.ts` — Convert to class, add decorators
- `bin/lib/skill-resolver.ts` — Convert to class, add decorators
- `bin/lib/session-manager.ts` — Integrate EventBus
- `bin/lib/services/phase.service.ts` — Integrate EventBus

---

### 8. Planning Checklist

Before creating implementation plan, ensure:
- [ ] All 7 requirements (CORE-01 to CORE-07) understood
- [ ] Design pattern decisions documented (this file)
- [ ] Existing code patterns reviewed (SessionManager, CircuitBreaker, FP utilities)
- [ ] TypeScript configuration updated for decorators
- [ ] Directory structure planned
- [ ] Integration points identified
- [ ] Testing strategy defined
- [ ] Token optimization metrics established
- [ ] Documentation requirements clear

**Next step:** Create detailed implementation plan (10-PLAN.md) with specific tasks, estimates, and dependencies.

---

*Research completed: 2026-03-25*
*Next: Planning implementation (10-PLAN.md)*

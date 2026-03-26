# TypeScript Contributor Guide

## Architecture: OOP + FP Hybrid

EZ Agents uses a hybrid architecture combining Object-Oriented Programming (OOP) for stateful entities and Functional Programming (FP) for pure transformations. Understanding when to use classes vs functions is crucial.

### OOP Patterns in ez-agents

The codebase uses six key design patterns (v6.0.0):

1. **Factory Pattern** - Agent creation with runtime extensibility ([ADR-001](../docs/patterns/ADR-001-factory-pattern.md))
2. **Strategy Pattern** - Interchangeable compression algorithms ([ADR-002](../docs/patterns/ADR-002-strategy-pattern.md))
3. **Observer Pattern** - Event-driven architecture for lifecycle tracking ([ADR-003](../docs/patterns/ADR-003-observer-pattern.md))
4. **Adapter Pattern** - Unified interface for multiple model providers ([ADR-004](../docs/patterns/ADR-004-adapter-pattern.md))
5. **Decorator Pattern** - Cross-cutting concerns (logging, caching, validation) ([ADR-005](../docs/patterns/ADR-005-decorator-pattern.md))
6. **Facade Pattern** - Simplified interfaces for complex subsystems ([ADR-006](../docs/patterns/ADR-006-facade-pattern.md))

See [Design Patterns](../docs/patterns/README.md) for detailed documentation and [Migration Guide](../docs/migration/FP-TO-OOP.md) for why OOP was chosen.

### Use Classes (OOP) For:

1. **Stateful entities** — Objects that maintain internal state
2. **Lifecycle management** — Objects with initialization/cleanup
3. **Encapsulation** — Hiding implementation details

Example:
```typescript
export class SessionManager {
  private statePath: string;
  private currentState: SessionState | null;

  constructor(planningDir: string) {
    this.statePath = path.join(planningDir, 'STATE.json');
    this.currentState = null;
  }

  loadState(): SessionState | null {
    if (fs.existsSync(this.statePath)) {
      const content = fs.readFileSync(this.statePath, 'utf-8');
      this.currentState = JSON.parse(content);
      return this.currentState;
    }
    return null;
  }

  saveState(state: SessionState): void {
    fs.writeFileSync(this.statePath, JSON.stringify(state, null, 2));
    this.currentState = state;
  }
}
```

### Use Functions (FP) For:

1. **Pure transformations** — Input → Output with no side effects
2. **Utility operations** — Helper functions
3. **Data pipelines** — map, filter, reduce operations

Example:
```typescript
export function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

export async function safeExec(
  cmd: string,
  args: string[] = [],
  options?: ExecOptions
): Promise<string> {
  // Implementation
}
```

### Integration Pattern

Classes use functional utilities internally:
```typescript
export class ContextManager {
  trackUsage(tokens: number): void {
    this.history = append(this.history, { tokens, timestamp: Date.now() });
  }
}
```

## Type Annotation Standards

### Function Parameters and Returns

Always annotate both parameters and return types:

```typescript
// ✅ CORRECT
export function calculateTotal(
  items: CartItem[],
  taxRate: number = 0.1
): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}

// ❌ WRONG
export function calculateTotal(items, taxRate = 0.1) {
  // Implicit any - not allowed
}
```

### Generic Types

Use generics for reusable utilities:

```typescript
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<T>(error: string): Result<T> {
  return { success: false, error };
}
```

### Error Handling

Use `unknown` for caught errors, then narrow with type guards:

```typescript
try {
  await riskyOperation();
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error(`Operation failed: ${error.message}`);
  } else {
    logger.error(`Unknown error: ${String(error)}`);
  }
}
```

### Index Signatures

Use `unknown` instead of `any` for dynamic object properties:

```typescript
// ✅ CORRECT
export interface Config {
  [key: string]: unknown;
  model_profile: string;
  commit_docs: boolean;
}

// ❌ WRONG
export interface Config {
  [key: string]: any;
}
```

## TSDoc Standards

### Required Tags

- `@param` — Document all parameters
- `@returns` — Document return values
- `@throws` — Document exceptions
- `@example` — Provide usage examples for complex APIs

### Example

```typescript
/**
 * Creates a new agent instance with the specified configuration.
 *
 * @param config - Agent configuration options
 * @param config.name - Unique agent identifier
 * @param config.model - AI model profile to use
 * @param config.skills - Optional skills to equip
 * @returns Configured agent instance
 * @throws {AgentError} If configuration is invalid
 *
 * @example
 * ```ts
 * const agent = createAgent({
 *   name: 'code-reviewer',
 *   model: 'qwen',
 *   skills: ['code-review', 'testing']
 * });
 * ```
 */
export function createAgent(config: AgentConfig): Agent {
  // Implementation
}
```

### Class Documentation

```typescript
/**
 * Manages agent session state and persistence.
 *
 * @class SessionManager
 * @example
 * ```ts
 * const manager = new SessionManager('/path/to/planning');
 * const state = manager.loadState();
 * ```
 */
export class SessionManager {
  /**
   * Creates a new session manager instance.
   *
   * @param planningDir - Directory path for planning artifacts
   */
  constructor(planningDir: string) { /* ... */ }

  /**
   * Loads the current session state from disk.
   *
   * @returns The loaded session state, or null if not found
   */
  loadState(): SessionState | null { /* ... */ }
}
```

## Writing TSDoc Comments

All public APIs must have TSDoc comments. This ensures 80%+ documentation coverage.

### Required Tags

- `@param` - Document all parameters
- `@returns` - Document return value
- `@throws` - Document exceptions
- `@example` - Provide usage example

### Example

```typescript
/**
 * Compresses content using the configured strategy.
 *
 * @param content - The content to compress
 * @param options - Compression options (maxTokens, preserveCodeBlocks)
 * @returns Compression result with compressed content and statistics
 * @throws Error if compression strategy is not configured
 *
 * @example
 * ```ts
 * const facade = new ContextManagerFacade();
 * const result = await facade.compress(largeContent, { maxTokens: 4000 });
 * console.log(`Reduced to ${result.compressedTokens} tokens`);
 * ```
 */
async compress(content: string, options?: CompressionOptions): Promise<CompressionResult> {
  // Implementation
}
```

## Code Quality Requirements

### Cyclomatic Complexity

- **Threshold:** < 10 per function
- **Check:** `npm run check:complexity`
- **CI Gate:** Fails build if any function exceeds threshold

**Tip:** Refactor large functions into smaller, focused methods.

### Duplicate Code

- **Threshold:** No blocks > 10 lines
- **Check:** `npm run check:duplicates`
- **CI Gate:** Fails build if duplicates found

**Tip:** Extract common logic into shared utilities or base classes.

### TSDoc Coverage

- **Threshold:** 80% (warning only)
- **Check:** `npm run check:tsdoc`
- **CI Gate:** Warns but doesn't fail build

**Tip:** Document all public exports with JSDoc comments.

## Adding New Classes

When adding new classes, follow this structure:

```typescript
/**
 * Brief description of what the class does.
 *
 * @class ClassName
 * @description Longer description explaining purpose and usage.
 *
 * @example
 * ```ts
 * const instance = new ClassName(options);
 * await instance.doSomething();
 * ```
 */
export class ClassName {
  /**
   * Creates a new instance.
   *
   * @param options - Configuration options
   */
  constructor(private options?: ClassNameOptions) {}

  /**
   * Public method with TSDoc.
   *
   * @param param - Parameter description
   * @returns Return value description
   */
  async doSomething(param: string): Promise<void> {
    // Implementation
  }
}
```

### Export from Barrel File

Add your class to `bin/lib/index.ts`:

```typescript
// bin/lib/index.ts
export { ClassName } from './path/to/class.js';
export type { ClassNameOptions } from './path/to/class.js';
```

### Apply Decorators

Use decorators for cross-cutting concerns:

```typescript
export class ClassName {
  @LogExecution()
  @CacheResult()
  async doSomething(param: string): Promise<void> {
    // Implementation
  }
}
```

See [DECORATORS.md](../bin/lib/decorators/DECORATORS.md) for decorator usage.

## Build and Test Workflow

### Development

```bash
# Run with auto-reload
npm run dev

# Type checking
npm run typecheck        # Basic check
npm run typecheck:strict # Strict check

# Linting
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix issues
```

### Before Submitting

```bash
# Full build
npm run build

# Run all tests
npm test

# Verify type coverage
npx tsc --noEmit --strict
```

## Common Type Patterns

### Options Objects

```typescript
export interface ExecOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  maxBuffer?: number;
}

export async function exec(
  cmd: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  // Implementation
}
```

### Discriminated Unions

```typescript
export type PhaseStatus =
  | { status: 'pending' }
  | { status: 'in_progress'; startedAt: number }
  | { status: 'completed'; completedAt: number }
  | { status: 'failed'; error: string };

export function getPhaseLabel(phase: Phase): string {
  switch (phase.status.status) {
    case 'pending':
      return '⏳ Pending';
    case 'in_progress':
      return '🔄 In Progress';
    // ...
  }
}
```

### Type Guards

```typescript
export function isError(result: Result<unknown>): result is ErrorResult {
  return !result.success;
}

// Usage
const result = await operation();
if (isError(result)) {
  console.error(result.error); // TypeScript knows this is ErrorResult
}
```

### Record Types

For dynamic key-value collections:

```typescript
export interface Metrics {
  [key: string]: number;
}

export function aggregateMetrics(metrics: Metrics): number {
  return Object.values(metrics).reduce((sum, val) => sum + val, 0);
}
```

## Code Review Checklist

Before submitting code, ensure:

- [ ] All functions have explicit return types
- [ ] All parameters are annotated
- [ ] No `any` types (use `unknown` with guards if needed)
- [ ] TSDoc comments on all exports
- [ ] Generic types used where appropriate
- [ ] Error handling uses `unknown` and type guards
- [ ] Follows OOP+FP architecture patterns
- [ ] Tests include type annotations
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes

## Testing with TypeScript

Test files should also include type annotations:

```typescript
import { describe, it, expect } from 'vitest';
import { SessionManager } from '../bin/lib/session-manager.js';

describe('SessionManager', () => {
  it('loads state from disk', () => {
    const tmpDir: string = createTempDir();
    const manager = new SessionManager(tmpDir);
    
    // Test implementation
  });
});
```

### Test Helper Functions

Type test helper functions explicitly:

```typescript
function writePlanWithArtifacts(tmpDir: string, artifactsYaml: string[]): void {
  const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
  fs.mkdirSync(phaseDir, { recursive: true });
  
  const planContent = `---
artifacts:
${artifactsYaml.join('\n')}
---`;
  
  fs.writeFileSync(path.join(phaseDir, '01-01-PLAN.md'), planContent);
}
```

## Migration Tips

### From JavaScript to TypeScript

1. **Start with types** — Define interfaces for your data structures
2. **Add return types** — Annotate function returns first
3. **Fix parameters** — Add parameter types
4. **Handle errors** — Use `unknown` for caught errors
5. **Add TSDoc** — Document all exports

### Common Patterns

```typescript
// Instead of:
function process(data) {
  return data.map(x => x * 2);
}

// Use:
function process(data: number[]): number[] {
  return data.map(x => x * 2);
}

// Or with generics:
function process<T>(data: T[], fn: (item: T) => T): T[] {
  return data.map(fn);
}
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TSDoc Specification](https://tsdoc.org/)
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)

---

*Last updated: 2026-03-25*

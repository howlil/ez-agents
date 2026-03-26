# From Functional to Object-Oriented Programming

**Version:** 6.0.0  
**Last Updated:** 2026-03-26

This guide explains the migration from functional programming (FP) to object-oriented programming (OOP) patterns in ez-agents v6.0.0.

## Why OOP for ez-agents?

The decision to adopt OOP patterns was driven by specific requirements of the ez-agents architecture:

### 1. Encapsulation

**Before (FP):**
```typescript
// State and functions separate
const state = { cache: new Map(), stats: { hits: 0, misses: 0 } };

function getCache(key: string) {
  const value = state.cache.get(key);
  state.stats.hits++;
  return value;
}

function setCache(key: string, value: any) {
  state.cache.set(key, value);
  state.stats.misses++;
}
```

**After (OOP):**
```typescript
// State and behavior bundled together
class ContextCache {
  private cache = new Map<string, any>();
  private stats = { hits: 0, misses: 0 };
  
  get(key: string) {
    this.stats.hits++;
    return this.cache.get(key);
  }
  
  set(key: string, value: any) {
    this.cache.set(key, value);
    this.stats.misses++;
  }
  
  getStats() {
    return { ...this.stats };
  }
}
```

**Benefit:** State is protected; can only be modified through defined methods.

### 2. Inheritance

**Before (FP):**
```typescript
// Duplicate code across similar functions
function createPlannerAgent() { /* ... */ }
function createRoadmapperAgent() { /* ... */ }
function createExecutorAgent() { /* ... */ }
// Each has getName, getDescription, execute, validate
```

**After (OOP):**
```typescript
// Shared interface, common base
interface IAgent {
  getName(): string;
  getDescription(): string;
  execute(context: AgentContext): Promise<AgentResult>;
  validate?(result: AgentResult): Promise<boolean>;
}

class EzPlannerAgent implements IAgent { /* ... */ }
class EzRoadmapperAgent implements IAgent { /* ... */ }
```

**Benefit:** Common interface ensures consistency; shared base classes reduce duplication.

### 3. Polymorphism

**Before (FP):**
```typescript
// Conditional logic for different algorithms
function compress(content: string, strategy: string) {
  if (strategy === 'summarize') { /* ... */ }
  else if (strategy === 'truncate') { /* ... */ }
  else if (strategy === 'rank') { /* ... */ }
}
```

**After (OOP):**
```typescript
// Interchangeable implementations
interface CompressionStrategy {
  compress(content: string): Promise<CompressionResult>;
}

class SummarizeStrategy implements CompressionStrategy { /* ... */ }
class TruncateStrategy implements CompressionStrategy { /* ... */ }

// Runtime interchangeability
compressor.setStrategy(new SummarizeStrategy());
await compressor.compress(content);

compressor.setStrategy(new TruncateStrategy());
await compressor.compress(content);
```

**Benefit:** Algorithms can be swapped at runtime without changing client code.

### 4. Extensibility

**Before (FP):**
```typescript
// Must modify existing code to add new agent types
function createAgent(type: string) {
  if (type === 'planner') return createPlannerAgent();
  if (type === 'roadmapper') return createRoadmapperAgent();
  // Need to add new if-branch for each type
}
```

**After (OOP):**
```typescript
// Runtime registration
AgentFactoryRegistry.registerAgent('ez-planner', () => new EzPlannerAgent());
AgentFactoryRegistry.registerAgent('ez-roadmapper', () => new EzRoadmapperAgent());

// New types can be registered without modifying core code
AgentFactoryRegistry.registerAgent('ez-custom', () => new EzCustomAgent());
```

**Benefit:** Open for extension, closed for modification (Open/Closed Principle).

## Benefits of OOP Approach

### 1. Better Code Organization

- **Classes** group related data and behavior
- **Interfaces** define clear contracts
- **Inheritance** shares common functionality
- **Encapsulation** protects internal state

### 2. Improved Testability

```typescript
// Easy to mock dependencies
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  getStats: vi.fn()
};

const facade = new ContextManagerFacade(mockCache as any);
```

### 3. Runtime Flexibility

```typescript
// Swap strategies at runtime
facade.setCompressionStrategy('hybrid');
const result1 = await facade.compress(content);

facade.setCompressionStrategy('truncate');
const result2 = await facade.compress(content);
```

### 4. Type Safety

```typescript
// TypeScript enforces interface contracts
class EzPlannerAgent implements IAgent {
  // Error if methods are missing or have wrong signatures
}
```

## Trade-offs

### 1. Increased Complexity

**FP:** Simple functions, easy to understand  
**OOP:** Classes, inheritance, interfaces - more concepts to learn

**Mitigation:** Clear documentation, consistent patterns, code reviews

### 2. More Boilerplate

**FP:**
```typescript
const compress = (content) => content.slice(0, 1000);
```

**OOP:**
```typescript
class TruncateStrategy implements CompressionStrategy {
  getName(): string { return 'truncate'; }
  async compress(content: string): Promise<CompressionResult> {
    return { content: content.slice(0, 1000), tokens: 1000, reduction: 0.5 };
  }
}
```

**Mitigation:** Use code generators, templates, consistent structure

### 3. Performance Overhead

- Class instantiation has small overhead
- Method calls slightly slower than function calls
- Inheritance chains add indirection

**Mitigation:** Profile before optimizing; overhead is negligible for most use cases

## What Stayed Functional?

Not everything was converted to OOP. Pure transformations and utilities remain functional:

### 1. Path Utilities

```typescript
// Pure function - no state, no side effects
export function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}
```

### 2. Configuration Loading

```typescript
// Simple data transformation
export function loadConfig(path: string): Config {
  const content = fs.readFileSync(path, 'utf-8');
  return JSON.parse(content);
}
```

### 3. Git Helpers

```typescript
// Stateless utility functions
export function execGit(args: string[]): string {
  return execSync(`git ${args.join(' ')}`, { encoding: 'utf-8' });
}
```

### 4. Frontmatter Parsing

```typescript
// Pure transformation
export function extractFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return yaml.parse(match?.[1] ?? '');
}
```

**Guideline:** Use FP for pure transformations; use OOP for stateful components.

## Migration Checklist

When migrating from FP to OOP:

- [ ] **Identify State:** What data needs to be encapsulated?
- [ ] **Define Interface:** What methods should be public?
- [ ] **Create Class:** Move functions to class methods
- [ ] **Add Decorators:** Apply @LogExecution, @CacheResult, @ValidateInput
- [ ] **Write Tests:** Test class in isolation with mocked dependencies
- [ ] **Update Exports:** Add class to barrel export (bin/lib/index.ts)
- [ ] **Add TSDoc:** Document public API with JSDoc comments

## Common Pitfalls

### 1. God Objects

**Problem:** One class that does everything

```typescript
// ❌ Too many responsibilities
class AgentManager {
  createAgent() { /* ... */ }
  executeAgent() { /* ... */ }
  validateAgent() { /* ... */ }
  cacheAgent() { /* ... */ }
  logAgent() { /* ... */ }
}
```

**Solution:** Single Responsibility Principle

```typescript
// ✅ Focused classes
class AgentFactory { createAgent() { /* ... */ } }
class AgentExecutor { execute() { /* ... */ } }
class AgentValidator { validate() { /* ... */ } }
```

### 2. Deep Inheritance Chains

**Problem:** Too many levels of inheritance

```typescript
// ❌ Hard to understand
class Agent { /* ... */ }
class BaseAgent extends Agent { /* ... */ }
class EzAgent extends BaseAgent { /* ... */ }
class EzPlannerAgent extends EzAgent { /* ... */ }
```

**Solution:** Prefer composition over inheritance

```typescript
// ✅ Composition
class EzPlannerAgent implements IAgent {
  private logger: Logger;
  private cache: ContextCache;
  
  constructor(logger: Logger, cache: ContextCache) {
    this.logger = logger;
    this.cache = cache;
  }
}
```

### 3. Mutable State

**Problem:** State changes that are hard to track

```typescript
// ❌ Mutable state
class Counter {
  count = 0;
  increment() { this.count++; }
}
```

**Solution:** Immutable patterns where possible

```typescript
// ✅ Immutable
class Counter {
  constructor(public readonly count: number) {}
  increment(): Counter {
    return new Counter(this.count + 1);
  }
}
```

## Conclusion

The OOP migration in ez-agents v6.0.0 provides:

- **Better organization** through classes and interfaces
- **Runtime flexibility** through polymorphism
- **Extensibility** through factory patterns
- **Testability** through dependency injection

But remember: **use the right tool for the job**. FP is still valuable for pure transformations; OOP excels for stateful components.

## Related Documentation

- [Pattern Decision Tree](./PATTERN-DECISION-TREE.md) - When to use each pattern
- [Class vs Function](./CLASS-VS-FUNCTION.md) - Choosing the right approach
- [Design Patterns](../patterns/README.md) - ADR-style pattern documentation

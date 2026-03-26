# Class vs Function: When to Use Each

This guide helps you decide when to use classes versus functions in ez-agents.

## Decision Criteria

| Criteria | Use Class | Use Function |
|----------|-----------|--------------|
| **State needed?** | ✅ Yes - encapsulated state | ❌ No - stateless |
| **Inheritance?** | ✅ Yes - extend base class | ❌ No - composition instead |
| **Polymorphism?** | ✅ Yes - interface implementation | ❌ No - different approach |
| **Identity?** | ✅ Yes - object identity matters | ❌ No - pure transformation |
| **Side effects?** | ✅ Yes - managed state changes | ❌ No - pure function |
| **Complexity?** | ✅ High - multiple operations | ✅ Low - single operation |

## When to Use Classes

### 1. Stateful Components

**Use class when:** You need to maintain state between operations

```typescript
// ✅ Class - maintains cache state
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

**Why class:** State (cache, stats) persists across method calls.

### 2. Objects with Identity

**Use class when:** Each instance has unique identity

```typescript
// ✅ Class - each agent has unique identity
class EzPlannerAgent implements IAgent {
  private name = 'ez-planner';
  private description = 'Plans phase execution';
  
  getName(): string {
    return this.name;
  }
  
  async execute(context: AgentContext): Promise<AgentResult> {
    // Agent-specific logic
  }
}
```

**Why class:** Each agent instance has distinct identity and behavior.

### 3. Polymorphic Behavior

**Use class when:** You need interchangeable implementations

```typescript
// ✅ Class - polymorphic strategies
interface CompressionStrategy {
  compress(content: string): Promise<CompressionResult>;
}

class SummarizeStrategy implements CompressionStrategy {
  async compress(content: string): Promise<CompressionResult> {
    // AI summarization
  }
}

class TruncateStrategy implements CompressionStrategy {
  async compress(content: string): Promise<CompressionResult> {
    // Fast truncation
  }
}
```

**Why class:** Strategies implement same interface, can be swapped at runtime.

### 4. Complex Orchestration

**Use class when:** Multiple operations need coordination

```typescript
// ✅ Class - orchestrates multiple components
class ContextManagerFacade {
  constructor(
    private cache: ContextCache,
    private compressor: ContextCompressor,
    private scorer: ContextRelevanceScorer
  ) {}
  
  async gather(sources: string[]): Promise<ContextResult> {
    // Coordinate multiple operations
    const content = await this.readSources(sources);
    const cached = await this.cache.get(this.getCacheKey(sources));
    const compressed = await this.compressor.compress(content);
    const scored = await this.scorer.score(compressed);
    
    return { content: scored, sources };
  }
}
```

**Why class:** Coordinates multiple dependencies, maintains configuration.

## When to Use Functions

### 1. Pure Transformations

**Use function when:** No state, just transformation

```typescript
// ✅ Function - pure transformation
export function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function normalizePhaseName(phase: string): string {
  return phase.toLowerCase().replace(/\s+/g, '-');
}
```

**Why function:** No state, deterministic output, easy to test.

### 2. Utility Operations

**Use function when:** Simple, reusable operation

```typescript
// ✅ Function - utility operation
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
```

**Why function:** Single responsibility, no dependencies, composable.

### 3. Data Loading

**Use function when:** Load and return data

```typescript
// ✅ Function - data loading
export function loadConfig(path: string): Config {
  const content = fs.readFileSync(path, 'utf-8');
  return JSON.parse(content);
}

export function safeReadFile(path: string): string | null {
  try {
    return fs.readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}
```

**Why function:** Simple I/O operation, no state to maintain.

### 4. Callbacks and Handlers

**Use function when:** Short-lived operation

```typescript
// ✅ Function - event handler
eventBus.on('session:start', (data) => {
  console.log(`Session started: ${data.sessionId}`);
});

// ✅ Function - array transformation
const files = sources.map(source => ({
  path: source,
  content: fs.readFileSync(source, 'utf-8')
}));
```

**Why function:** Concise, focused on single operation.

## Code Examples: Same Problem, Different Approaches

### Example 1: Counter

**Class Approach:**
```typescript
// ✅ Use class when state matters
class Counter {
  private count = 0;
  
  increment(): void {
    this.count++;
  }
  
  getCount(): number {
    return this.count;
  }
  
  reset(): void {
    this.count = 0;
  }
}

const counter = new Counter();
counter.increment();
console.log(counter.getCount()); // 1
```

**Function Approach:**
```typescript
// ✅ Use function for simple transformation
function increment(count: number): number {
  return count + 1;
}

let count = 0;
count = increment(count);
console.log(count); // 1
```

**When to use each:**
- **Class:** When counter needs to persist state, have multiple methods
- **Function:** When counter is simple, state managed externally

### Example 2: Logger

**Class Approach:**
```typescript
// ✅ Use class for stateful logger
class Logger {
  constructor(private prefix: string, private minLevel: number) {}
  
  log(level: number, message: string): void {
    if (level >= this.minLevel) {
      console.log(`[${this.prefix}] ${message}`);
    }
  }
  
  error(message: string): void {
    this.log(0, message);
  }
  
  info(message: string): void {
    this.log(1, message);
  }
  
  debug(message: string): void {
    this.log(2, message);
  }
}

const logger = new Logger('ContextManager', 1);
logger.info('Starting context gathering');
```

**Function Approach:**
```typescript
// ✅ Use function for simple logging
function log(prefix: string, level: string, message: string): void {
  console.log(`[${prefix}] ${level}: ${message}`);
}

log('ContextManager', 'INFO', 'Starting context gathering');
```

**When to use each:**
- **Class:** When logger has configuration, multiple methods, state
- **Function:** When logging is simple, one-off operation

### Example 3: Data Processor

**Class Approach:**
```typescript
// ✅ Use class for complex processing
class DataProcessor {
  constructor(
    private validator: DataValidator,
    private transformer: DataTransformer,
    private cache: DataCache
  ) {}
  
  async process(data: any[]): Promise<any[]> {
    const cached = await this.cache.get(data);
    if (cached) return cached;
    
    const validated = await this.validator.validate(data);
    const transformed = await this.transformer.transform(validated);
    await this.cache.set(data, transformed);
    
    return transformed;
  }
}
```

**Function Approach:**
```typescript
// ✅ Use function for simple processing
async function processData(data: any[]): Promise<any[]> {
  return data
    .filter(item => item != null)
    .map(item => ({ ...item, processed: true }));
}
```

**When to use each:**
- **Class:** When processing has multiple steps, dependencies, caching
- **Function:** When processing is straightforward transformation

## Guidelines for ez-agents

### Use Classes For:

1. **Core Components**
   - ContextCache, ContextCompressor, ContextRelevanceScorer
   - SessionManager, StateData
   - SkillMatcher, SkillValidator, SkillResolver

2. **Design Pattern Implementations**
   - All strategies (SummarizeStrategy, TruncateStrategy, etc.)
   - All adapters (ClaudeAdapter, OpenAIAdapter, etc.)
   - All observers (SessionObserver, PhaseObserver)
   - All facades (ContextManagerFacade, SkillResolverFacade)

3. **Agents**
   - EzPlannerAgent, EzRoadmapperAgent, EzExecutorAgent, etc.

4. **Error Handling**
   - ErrorCache, CrashRecovery, RecoveryManager

### Use Functions For:

1. **Path Utilities**
   - toPosixPath, normalizePath, isPathSafe

2. **Configuration**
   - loadConfig, ensureConfigSection, configGet, configSet

3. **Git Operations**
   - execGit, getGitStatus, getGitDiff

4. **Frontmatter**
   - extractFrontmatter, reconstructFrontmatter

5. **Planning Utilities**
   - safePlanningWrite, normalizePhaseName, comparePhaseNum

## Decision Flowchart

```
         ┌─────────────────┐
         │  Need to solve  │
         │     a problem   │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Need to maintain│
         │     state?      │
         └────────┬────────┘
             Yes  │  No
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌─────────┐             ┌─────────────────┐
│  CLASS  │             │ Need inheritance│
│         │             │  or polymorphism│
└─────────┘             └────────┬────────┘
                                 │
                            Yes  │  No
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
                   ▼                           ▼
               ┌─────────┐             ┌──────────────┐
               │  CLASS  │             │   FUNCTION   │
               └─────────┘             └──────────────┘
```

## Related Documentation

- [FP to OOP Migration](./FP-TO-OOP.md) - Why and how to migrate
- [Pattern Decision Tree](./PATTERN-DECISION-TREE.md) - Choosing design patterns
- [Contributing Guide](../CONTRIBUTING-TYPESCRIPT.md) - Code style guidelines

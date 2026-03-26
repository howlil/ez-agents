# ADR-002: Strategy Pattern for Compression Algorithms

**Status:** Accepted  
**Date:** 2026-03-26  
**Milestone:** v6.0.0 OOP Refactoring

## Context

Context compression is a critical operation in ez-agents, reducing large codebases to fit within model token limits. We needed to support multiple compression algorithms:

1. AI-powered summarization (preserves meaning)
2. Fast truncation (deterministic)
3. Relevance-based filtering (keyword scoring)
4. Hybrid approach (combines all strategies)

### Problem Statement

Having multiple algorithms in a single class creates complex conditional logic:

```typescript
// Before: Monolithic compression with conditionals
function compress(content: string, strategy: string): string {
  if (strategy === 'summarize') {
    // AI summarization logic
  } else if (strategy === 'truncate') {
    // Truncation logic
  } else if (strategy === 'rank') {
    // Ranking logic
  }
  // ... more conditionals
}
```

This approach violates the Open/Closed Principle and makes testing difficult.

## Decision

We adopted the **Strategy Pattern** to encapsulate each compression algorithm:

```typescript
// After: Strategy-based compression
import { createStrategy } from './strategies/index.js';

const strategy = createStrategy('hybrid');
const result = await strategy.compress(content, { maxTokens: 4000 });
```

### Implementation

**CompressionStrategy Interface:**
```typescript
interface CompressionStrategy {
  getName(): string;
  compress(content: string, options: CompressionOptions): Promise<CompressionResult>;
}
```

**Concrete Strategies:**

```typescript
class SummarizeStrategy implements CompressionStrategy {
  getName(): string { return 'summarize'; }
  
  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    // AI-powered summarization with code block preservation
    // Uses model to generate concise summary
    return { content: summarized, tokens: count, reduction: percent };
  }
}

class TruncateStrategy implements CompressionStrategy {
  getName(): string { return 'truncate'; }
  
  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    // Fast truncation at word boundaries
    // Deterministic, no AI required
    return { content: truncated, tokens: count, reduction: percent };
  }
}

class RankByRelevanceStrategy implements CompressionStrategy {
  getName(): string { return 'rank'; }
  
  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    // Keyword-based relevance scoring
    // Filters low-relevance content
    return { content: filtered, tokens: count, reduction: percent };
  }
}

class HybridStrategy implements CompressionStrategy {
  getName(): string { return 'hybrid'; }
  
  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    // Combines strategies: rank → summarize → truncate
    // Maximum compression with quality preservation
    return { content: compressed, tokens: count, reduction: percent };
  }
}
```

**Strategy Factory:**
```typescript
export function createStrategy(type: StrategyType): CompressionStrategy {
  switch (type) {
    case 'summarize':
      return new SummarizeStrategy();
    case 'truncate':
      return new TruncateStrategy();
    case 'rank':
      return new RankByRelevanceStrategy();
    case 'hybrid':
      return new HybridStrategy();
    default:
      throw new Error(`Unknown strategy: ${type}`);
  }
}
```

**Context Compressor (uses Strategy):**
```typescript
class ContextCompressor {
  private strategy: CompressionStrategy;
  
  setStrategy(strategy: CompressionStrategy): void {
    this.strategy = strategy;
  }
  
  async compress(content: string, options: CompressionOptions): Promise<CompressionResult> {
    return await this.strategy.compress(content, options);
  }
}
```

## Consequences

### Benefits

1. **Interchangeability:** Strategies can be swapped at runtime without changing client code
2. **Single Responsibility:** Each strategy focuses on one algorithm
3. **Testability:** Strategies can be tested in isolation
4. **Extensibility:** New strategies can be added without modifying existing code
5. **Open/Closed Principle:** Open for extension, closed for modification

### Trade-offs

1. **Interface Overhead:** Each strategy must implement the same interface
2. **Strategy Selection:** Client must know which strategy to use
3. **Multiple Classes:** More files to maintain than a single monolithic class

### When NOT to Use

- Only one algorithm is needed
- Algorithms share significant implementation details
- Performance overhead of indirection is unacceptable

## Alternatives Considered

### Configuration-Based Switching
```typescript
function compress(content: string, config: CompressionConfig): string {
  if (config.useAI) { /* ... */ }
  if (config.filterKeywords) { /* ... */ }
  // ... configuration options
}
```
**Rejected because:** Still creates complex conditional logic; hard to test

### Template Method Pattern
```typescript
abstract class BaseCompressor {
  compress(content: string): string {
    this.preProcess();
    const result = this.doCompress();
    this.postProcess();
    return result;
  }
  protected abstract doCompress(): string;
}
```
**Rejected because:** Less flexible than strategy pattern; inheritance over composition

## Implementation Details

### Token Reduction Comparison

| Strategy | Reduction | Speed | Quality |
|----------|-----------|-------|---------|
| Summarize | 40-60% | Slow | High |
| Truncate | 50-80% | Fast | Low |
| Rank | 30-50% | Medium | Medium |
| Hybrid | 50-80% | Medium | High |

### Usage Example

```typescript
import { ContextManagerFacade } from './facades/index.js';

const facade = new ContextManagerFacade();

// Use hybrid strategy for maximum compression
facade.setCompressionStrategy('hybrid');

const result = await facade.compress(largeCodebase, {
  maxTokens: 4000,
  preserveCodeBlocks: true
});

console.log(`Reduced from ${result.originalTokens} to ${result.compressedTokens} tokens`);
```

## Related Patterns

- **Factory Pattern:** Strategy factory creates strategy instances (ADR-001)
- **Facade Pattern:** ContextManagerFacade uses strategies internally (ADR-006)

## References

- [Strategy Pattern - Wikipedia](https://en.wikipedia.org/wiki/Strategy_pattern)
- Internal: [bin/lib/strategies/CompressionStrategy.ts](../../bin/lib/strategies/CompressionStrategy.ts)

# Component Architecture

This document describes how components interact within the ez-agents system.

## Component Overview

The ez-agents architecture is built around two main facades that orchestrate complex subsystems:

1. **ContextManagerFacade** - Context gathering and optimization
2. **SkillResolverFacade** - Skill matching and execution

## ContextManagerFacade Orchestration

The `ContextManagerFacade` provides a unified interface for context operations:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ContextManagerFacade                         │
├─────────────────────────────────────────────────────────────────┤
│  + gather(sources, options): ContextResult                      │
│  + compress(content, strategy?): CompressionResult              │
│  + deduplicate(content): string[]                               │
│  + score(content, query): ScoredFile[]                          │
│  + getCached(key): string | null                                │
│  + setCached(key, content): void                                │
│  + setCompressionStrategy(strategy): void                       │
│  + enableScoring(enable): void                                  │
│  + enableDeduplication(enable): void                            │
│  + getCompressionStats(): CompressionStats                      │
│  + getCacheStats(): CacheStats                                  │
│  + getDedupStats(): DedupStats                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  ContextCache    │ │ContextCompressor │ │ContextRelevance  │
│                  │ │                  │ │Scorer            │
│  + get(key)      │ │  + compress()    │ │                  │
│  + set(key,val)  │ │  + setStrategy() │ │  + score()       │
│  + clear()       │ │  + register()    │ │  + enable()      │
│  + stats()       │ │  + getStrategy() │ │  + stats()       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │CompressionStrategy│ (interface)
                    ├──────────────────┤
                    │ + getName()      │
                    │ + compress()     │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│SummarizeStrategy │ │TruncateStrategy  │ │RankByRelevance   │
│                  │ │                  │ │Strategy          │
│  AI-powered      │ │  Fast truncation │ │  Keyword scoring │
│  summarization   │ │  at boundaries   │ │  and filtering   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ HybridStrategy   │
                    │                  │
                    │  Combines all    │
                    │  strategies      │
                    └──────────────────┘
```

### Component Interaction Flow

1. **Gather Context:**
   ```
   Client → ContextManagerFacade.gather()
          → ContextCache.check()
          → FileAccessService.read()
          → ContextCache.set()
   ```

2. **Compress Context:**
   ```
   Client → ContextManagerFacade.compress()
          → CompressionStrategy.compress()
          → ContextCache.set()
   ```

3. **Score Context:**
   ```
   Client → ContextManagerFacade.score()
          → ContextRelevanceScorer.score()
          → Keyword matching
          → Relevance scores
   ```

## SkillResolverFacade Orchestration

The `SkillResolverFacade` provides unified skill operations:

```
┌─────────────────────────────────────────────────────────────────┐
│                   SkillResolverFacade                           │
├─────────────────────────────────────────────────────────────────┤
│  + resolveSkill(trigger): SkillResolutionResult                 │
│  + matchSkill(query): MatchResult[]                             │
│  + validateSkill(skill): ValidationResult                       │
│  + getSkillContext(skillName): ContextSchema                    │
│  + registerSkill(skill): void                                   │
│  + unregisterSkill(name): void                                  │
│  + executeSkill(name, input): any                               │
│  + executeSkills(names, input): any[]                           │
│  + getRegisteredSkills(): string[]                              │
│  + setSkillPriority(names): void                                │
│  + enableSkillValidation(enable): void                          │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  SkillMatcher    │ │ SkillValidator   │ │SkillContext      │
│                  │ │                  │ │Resolver          │
│  + match()       │ │  + validate()    │ │                  │
│  + score()       │ │  + checkSchema() │ │  + resolve()     │
│  + rank()        │ │  + report()      │ │  + validate()    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SkillRegistry   │
                    │                  │
                    │  + register()    │
                    │  + get()         │
                    │  + list()        │
                    └──────────────────┘
```

### Component Interaction Flow

1. **Resolve Skill:**
   ```
   Client → SkillResolverFacade.resolveSkill()
          → SkillMatcher.match()
          → SkillRegistry.get()
          → SkillContextResolver.resolve()
   ```

2. **Validate Skill:**
   ```
   Client → SkillResolverFacade.validateSkill()
          → SkillValidator.validate()
          → Schema check
          → ValidationResult
   ```

3. **Execute Skill:**
   ```
   Client → SkillResolverFacade.executeSkill()
          → SkillRegistry.get()
          → Skill.execute()
          → Result
   ```

## Dependency Injection Pattern

Components use dependency injection for testability:

```typescript
// Facade receives dependencies via constructor
class ContextManagerFacade {
  constructor(
    private cache: ContextCache,
    private compressor: ContextCompressor,
    private scorer: ContextRelevanceScorer,
    private deduplicator: ContextDeduplicator
  ) {}
}

// Factory function creates configured instances
function createContextManagerFacade(options?: ContextManagerFacadeOptions) {
  const cache = new ContextCache();
  const compressor = new ContextCompressor();
  const scorer = new ContextRelevanceScorer();
  const deduplicator = new ContextDeduplicator();
  
  return new ContextManagerFacade(cache, compressor, scorer, deduplicator);
}
```

## Event Integration

All components emit events through the EventBus:

```
Component Action
      │
      ▼
EventBus.emit(eventType, data)
      │
      ├─→ SessionObserver (session events)
      ├─→ PhaseObserver (phase events)
      └─→ SkillTriggerObserver (skill events)
```

### Event Flow Example

```typescript
// ContextManagerFacade.gather() emits events
async gather(sources, options) {
  this.eventBus.emit('context:gather', { sources, timestamp: Date.now() });
  
  // ... gathering logic
  
  this.eventBus.emit('context:compress', { 
    originalSize, 
    compressedSize,
    strategy: this.strategy.getName()
  });
  
  return result;
}
```

## Testing Strategy

Components are tested in isolation using mocks:

```typescript
// Mock dependencies for testing
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn(),
  stats: vi.fn()
};

const mockStrategy = {
  getName: () => 'test-strategy',
  compress: vi.fn()
};

// Test facade with mocked dependencies
const facade = new ContextManagerFacade(
  mockCache as any,
  { getStrategy: () => mockStrategy } as any,
  mockScorer as any,
  mockDeduplicator as any
);
```

## Related Documentation

- [Architecture Overview](./OVERVIEW.md) - High-level system architecture
- [Class Hierarchy](./CLASS-HIERARCHY.md) - Detailed class relationships
- [Events](./EVENTS.md) - Event system reference
- [Design Patterns](../patterns/README.md) - ADR-style pattern documentation

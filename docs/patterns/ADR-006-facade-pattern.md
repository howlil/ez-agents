# ADR-006: Facade Pattern for Complex Subsystems

**Status:** Accepted  
**Date:** 2026-03-26  
**Milestone:** v6.0.0 OOP Refactoring

## Context

The ez-agents system has two complex subsystems:

1. **Context Management** - Gathering, compression, scoring, deduplication
2. **Skill Resolution** - Matching, validation, context resolution, execution

### Problem Statement

Direct access to subsystem components creates complex client code:

```typescript
// Before: Client must orchestrate multiple components
class Agent {
  async execute(query: string) {
    // Context gathering
    const cache = new ContextCache();
    const compressor = new ContextCompressor();
    const scorer = new ContextRelevanceScorer();
    const deduplicator = new ContextDeduplicator();
    
    // Orchestrate manually
    let context = await cache.get(query);
    if (!context) {
      context = await gatherContext(query);
      await cache.set(query, context);
    }
    
    context = await compressor.compress(context, { maxTokens: 4000 });
    context = await deduplicator.deduplicate(context);
    const scores = await scorer.score(context, query);
    
    // Skill resolution
    const matcher = new SkillMatcher();
    const validator = new SkillValidator();
    const resolver = new SkillContextResolver();
    const registry = SkillRegistry.getInstance();
    
    const matches = await matcher.match(query);
    const validated = await validator.validate(matches[0]);
    const skillContext = await resolver.resolve(validated.skill);
    const skill = registry.get(validated.skill.name);
    
    // Execute skill
    const result = await skill.execute(skillContext);
    
    return result;
  }
}
```

This approach creates tight coupling and duplication across all agents.

## Decision

We adopted the **Facade Pattern** to provide simplified interfaces:

```typescript
// After: Facade provides unified interface
class Agent {
  async execute(query: string) {
    const contextFacade = new ContextManagerFacade();
    const skillFacade = new SkillResolverFacade();
    
    // Simplified context operations
    const context = await contextFacade.gather([query]);
    const compressed = await contextFacade.compress(context);
    
    // Simplified skill operations
    const skill = await skillFacade.resolveSkill(query);
    const result = await skillFacade.executeSkill(skill.name, { context });
    
    return result;
  }
}
```

### Implementation

**ContextManagerFacade:**
```typescript
class ContextManagerFacade {
  private cache: ContextCache;
  private compressor: ContextCompressor;
  private scorer: ContextRelevanceScorer;
  private deduplicator: ContextDeduplicator;
  private eventBus: EventBus;
  
  constructor(options?: ContextManagerFacadeOptions) {
    this.cache = new ContextCache();
    this.compressor = new ContextCompressor();
    this.scorer = new ContextRelevanceScorer();
    this.deduplicator = new ContextDeduplicator();
    this.eventBus = EventBus.getInstance();
  }
  
  @LogExecution()
  @CacheResult()
  async gather(
    sources: string[],
    options?: ContextOptions
  ): Promise<ContextResult> {
    this.eventBus.emit('context:gather', { 
      sources, 
      count: sources.length, 
      timestamp: Date.now() 
    });
    
    // Orchestrate gathering
    const content = await this.readSources(sources);
    const cached = await this.cache.get(this.getCacheKey(sources));
    
    return {
      content,
      sources,
      timestamp: Date.now(),
      stats: { filesRead: sources.length }
    };
  }
  
  @LogExecution()
  @CacheResult()
  async compress(
    content: string,
    options?: CompressionOptions
  ): Promise<CompressionResult> {
    return await this.compressor.compress(content, options);
  }
  
  async deduplicate(content: string[]): Promise<string[]> {
    return await this.deduplicator.deduplicate(content);
  }
  
  async score(content: string, query: string): Promise<ScoredFile[]> {
    return await this.scorer.score(content, query);
  }
  
  setCompressionStrategy(strategy: CompressionStrategy): void {
    this.compressor.setStrategy(strategy);
  }
  
  enableScoring(enable: boolean): void {
    // Enable/disable scoring
  }
  
  enableDeduplication(enable: boolean): void {
    // Enable/disable deduplication
  }
  
  getCompressionStats(): CompressionStats {
    return this.compressor.getStats();
  }
  
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }
  
  getDedupStats(): DedupStats {
    return this.deduplicator.getStats();
  }
}
```

**SkillResolverFacade:**
```typescript
class SkillResolverFacade {
  private matcher: SkillMatcher;
  private validator: SkillValidator;
  private resolver: SkillContextResolver;
  private registry: SkillRegistry;
  private eventBus: EventBus;
  
  constructor(options?: SkillResolverFacadeOptions) {
    this.matcher = new SkillMatcher();
    this.validator = new SkillValidator();
    this.resolver = new SkillContextResolver();
    this.registry = SkillRegistry.getInstance();
    this.eventBus = EventBus.getInstance();
  }
  
  @LogExecution()
  @CacheResult()
  async resolveSkill(trigger: string): Promise<SkillResolutionResult> {
    const match = await this.matcher.match(trigger);
    const validated = await this.validator.validate(match[0]);
    const context = await this.resolver.resolve(validated.skill);
    
    return {
      skill: validated.skill,
      context,
      confidence: match[0].score
    };
  }
  
  @LogExecution()
  async matchSkill(query: string): Promise<MatchResult[]> {
    return await this.matcher.match(query);
  }
  
  @LogExecution()
  @ValidateInput({ required: ['skill'] })
  async validateSkill(skill: Skill): Promise<ValidationResult> {
    return await this.validator.validate(skill);
  }
  
  @LogExecution()
  @CacheResult()
  async getSkillContext(skillName: string): Promise<ContextSchema> {
    const skill = this.registry.get(skillName);
    return await this.resolver.resolve(skill);
  }
  
  async registerSkill(skill: Skill): void {
    this.registry.register(skill);
  }
  
  async unregisterSkill(name: string): void {
    this.registry.unregister(name);
  }
  
  async executeSkill(name: string, input: unknown): Promise<any> {
    const skill = this.registry.get(name);
    this.eventBus.emit('skill:execute', {
      skillName: name,
      input,
      timestamp: Date.now()
    });
    return await skill.execute(input);
  }
  
  async executeSkills(names: string[], input: unknown): Promise<any[]> {
    return await Promise.all(
      names.map(name => this.executeSkill(name, input))
    );
  }
  
  getRegisteredSkills(): string[] {
    return this.registry.list();
  }
  
  setSkillPriority(names: string[]): void {
    this.matcher.setPriority(names);
  }
  
  enableSkillValidation(enable: boolean): void {
    // Enable/disable validation
  }
}
```

## Consequences

### Benefits

1. **Simplified Interface:** Single entry point for complex operations
2. **Reduced Coupling:** Clients depend on facade, not subsystems
3. **Centralized Orchestration:** Logic in one place, not duplicated
4. **Easier Testing:** Mock facade instead of multiple subsystems
5. **Consistent API:** All clients use the same interface

### Trade-offs

1. **Facade Maintenance:** Facade must be updated when subsystems change
2. **Potential Bottleneck:** All requests go through facade
3. **Abstraction Leakage:** Some subsystem complexity may leak through

### When NOT to Use

- Simple subsystems with few components
- When you need fine-grained control over subsystems
- Performance-critical code where direct access is needed

## Alternatives Considered

### Service Layer
```typescript
class ContextService {
  constructor(
    private cache: ContextCache,
    private compressor: ContextCompressor
  ) {}
  
  async processContext(query: string) { /* ... */ }
}
```
**Rejected because:** Similar pattern; facade is more focused on simplification

### Dependency Injection
```typescript
class Agent {
  constructor(
    @inject('ContextCache') private cache: ContextCache,
    @inject('ContextCompressor') private compressor: ContextCompressor
  ) {}
}
```
**Rejected because:** Adds external dependency; facade is simpler

### Direct Subsystem Access
```typescript
// Keep current approach with multiple components
const cache = new ContextCache();
const compressor = new ContextCompressor();
```
**Rejected because:** Creates duplication and tight coupling

## Implementation Details

### Facade Orchestration Flow

```
Client Request
     │
     ▼
┌─────────────────┐
│  ContextManager │
│     Facade      │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│ Cache  │ │Compressor│ │ Scorer  │ │Deduplicat│
│        │ │Strategy  │ │         │ │   or     │
└────────┘ └──────────┘ └─────────┘ └──────────┘
```

### Decorator Usage

All facade methods use decorators for cross-cutting concerns:

```typescript
class ContextManagerFacade {
  @LogExecution()           // Log all method calls
  @CacheResult()            // Cache results where applicable
  @ValidateInput({...})     // Validate inputs
  async gather(...) { }
}
```

### Statistics and Monitoring

```typescript
const facade = new ContextManagerFacade();

// Get compression stats
const compressionStats = facade.getCompressionStats();
console.log(`Compressed ${compressionStats.totalCompressions} times`);

// Get cache stats
const cacheStats = facade.getCacheStats();
console.log(`Cache hit rate: ${cacheStats.hitRate}%`);

// Get dedup stats
const dedupStats = facade.getDedupStats();
console.log(`Removed ${dedupStats.duplicatesRemoved} duplicates`);
```

## Related Patterns

- **Decorator Pattern:** Facades use decorators on all methods (ADR-005)
- **Observer Pattern:** Facades emit events during operations (ADR-003)
- **Strategy Pattern:** Facades use strategies for compression (ADR-002)

## References

- [Facade Pattern - Wikipedia](https://en.wikipedia.org/wiki/Facade_pattern)
- Internal: [bin/lib/facades/ContextManagerFacade.ts](../../bin/lib/facades/ContextManagerFacade.ts)
- Internal: [bin/lib/facades/SkillResolverFacade.ts](../../bin/lib/facades/SkillResolverFacade.ts)

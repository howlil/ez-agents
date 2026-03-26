# Pattern Decision Tree

Use this decision tree to choose the right design pattern for your use case.

## Decision Tree

```
                                    ┌─────────────────┐
                                    │  What do you    │
                                    │  need to do?    │
                                    └────────┬────────┘
                                             │
         ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
         │                   │               │               │                   │
         ▼                   ▼               ▼               ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Create objects  │ │ Need different  │ │ Need to │ │ Need to add     │ │ Need simplified │
│ without knowing │ │ algorithms for  │ │ track   │ │ behavior to     │ │ interface for   │
│ concrete types  │ │ the same task   │ │ events  │ │ existing code   │ │ complex system  │
└────────┬────────┘ └────────┬────────┘ └────┬────┘ └────────┬────────┘ └────────┬────────┘
         │                   │               │               │                   │
         ▼                   ▼               ▼               ▼                   ▼
    ┌────────────┐      ┌────────────┐ ┌──────────┐   ┌────────────┐      ┌────────────┐
    │   FACTORY  │      │  STRATEGY  │ │ OBSERVER │   │ DECORATOR  │      │   FACADE   │
    │  PATTERN   │      │  PATTERN   │ │ PATTERN  │   │  PATTERN   │      │  PATTERN   │
    └────────────┘      └────────────┘ └──────────┘   └────────────┘      └────────────┘
```

## Pattern Selection Guide

### Factory Pattern

**Use when:**
- [ ] You need to create objects without specifying their concrete classes
- [ ] You want runtime extensibility (new types can be registered dynamically)
- [ ] Object creation logic is complex and should be centralized
- [ ] You need to decouple object creation from object usage

**Example in ez-agents:**
```typescript
// Agent creation without knowing concrete types
const agent = AgentFactoryRegistry.createAgent('ez-planner');
```

**Don't use when:**
- You only have one type of object
- Object creation is trivial (no dependencies)
- You need fine-grained control over object lifecycle

---

### Strategy Pattern

**Use when:**
- [ ] You have multiple algorithms for the same task
- [ ] Algorithms should be interchangeable at runtime
- [ ] You want to avoid conditional logic for algorithm selection
- [ ] Different variants of an algorithm are needed

**Example in ez-agents:**
```typescript
// Interchangeable compression strategies
compressor.setStrategy(new SummarizeStrategy());
await compressor.compress(content);

compressor.setStrategy(new TruncateStrategy());
await compressor.compress(content);
```

**Don't use when:**
- You only have one algorithm
- Algorithms share significant implementation details
- Performance overhead of indirection is unacceptable

---

### Observer Pattern

**Use when:**
- [ ] You need loose coupling between event producers and consumers
- [ ] Multiple objects need to react to state changes
- [ ] You want to track lifecycle events without modifying core logic
- [ ] You need to broadcast events to unknown recipients

**Example in ez-agents:**
```typescript
// Event-driven architecture
eventBus.on('session:start', (data) => {
  logger.log(`Session started: ${data.sessionId}`);
});

eventBus.emit('session:start', { sessionId: 'abc123' });
```

**Don't use when:**
- Simple applications with no event tracking needs
- Event order is critical (observers execute in undefined order)
- You need guaranteed delivery (observers may fail silently)

---

### Adapter Pattern

**Use when:**
- [ ] You need to integrate with incompatible interfaces
- [ ] You want to swap implementations without changing client code
- [ ] Multiple providers have different APIs but similar functionality
- [ ] You need to wrap legacy code

**Example in ez-agents:**
```typescript
// Unified interface for multiple model providers
const adapter = createModelAdapter('claude');
const response = await adapter.chat(messages, { maxTokens: 4000 });
```

**Don't use when:**
- Only one provider is needed
- Provider-specific features are required
- Performance overhead of abstraction is unacceptable

---

### Decorator Pattern

**Use when:**
- [ ] You have cross-cutting concerns (logging, caching, validation)
- [ ] You want to add behavior without modifying existing code
- [ ] Concerns should be composable and reusable
- [ ] You need to follow Open/Closed Principle

**Example in ez-agents:**
```typescript
// Cross-cutting concerns as decorators
class ContextManager {
  @LogExecution()
  @CacheResult()
  @ValidateInput({ required: ['sources'] })
  async gather(sources: string[]) {
    // Only business logic
  }
}
```

**Don't use when:**
- Simple applications without cross-cutting concerns
- When decorators add more complexity than they solve
- Performance-critical code where overhead matters

---

### Facade Pattern

**Use when:**
- [ ] You have complex subsystems with many dependencies
- [ ] You want to provide a simplified interface for consumers
- [ ] You need to orchestrate multiple components
- [ ] You want to reduce coupling between clients and subsystems

**Example in ez-agents:**
```typescript
// Simplified interface for complex subsystem
const facade = new ContextManagerFacade();
const context = await facade.gather(['file1.ts']);
const compressed = await facade.compress(context);
```

**Don't use when:**
- Simple subsystems with few components
- When you need fine-grained control over subsystems
- Performance-critical code where direct access is needed

---

## Pattern Combinations

Patterns often work together:

### Factory + Strategy
```typescript
// Factory creates strategy instances
const strategy = createStrategy('hybrid');
await strategy.compress(content);
```

### Facade + Observer
```typescript
// Facade emits events during operations
class ContextManagerFacade {
  async gather(sources: string[]) {
    this.eventBus.emit('context:gather', { sources });
    // ... gathering logic
  }
}
```

### Facade + Decorator
```typescript
// All facade methods use decorators
class SkillResolverFacade {
  @LogExecution()
  @CacheResult()
  async resolveSkill(trigger: string) {
    // ... resolution logic
  }
}
```

### Adapter + Strategy
```typescript
// Adapters can be used as strategies
const adapter = createModelAdapter('claude');
const response = await adapter.chat(messages); // Strategy-like usage
```

## Quick Reference

| Problem | Pattern | Solution |
|---------|---------|----------|
| Object creation | Factory | Centralize creation logic |
| Algorithm selection | Strategy | Interchangeable implementations |
| Event handling | Observer | Publish-subscribe model |
| Interface mismatch | Adapter | Unified interface |
| Cross-cutting concerns | Decorator | Composable behavior |
| Complex subsystem | Facade | Simplified interface |

## Related Documentation

- [FP to OOP Migration](./FP-TO-OOP.md) - Why and how to migrate
- [Class vs Function](./CLASS-VS-FUNCTION.md) - When to use each approach
- [Design Patterns](../patterns/README.md) - Detailed ADR documentation

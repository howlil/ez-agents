# Design Patterns in ez-agents

This directory contains Architecture Decision Records (ADRs) documenting the design patterns used in ez-agents v6.0.0.

## Pattern Index

| Pattern | ADR | Status | Description |
|---------|-----|--------|-------------|
| Factory | [ADR-001](./ADR-001-factory-pattern.md) | Accepted | Agent creation with runtime extensibility |
| Strategy | [ADR-002](./ADR-002-strategy-pattern.md) | Accepted | Interchangeable compression algorithms |
| Observer | [ADR-003](./ADR-003-observer-pattern.md) | Accepted | Event-driven architecture for lifecycle tracking |
| Adapter | [ADR-004](./ADR-004-adapter-pattern.md) | Accepted | Unified interface for multiple model providers |
| Decorator | [ADR-005](./ADR-005-decorator-pattern.md) | Accepted | Cross-cutting concerns (logging, caching, validation) |
| Facade | [ADR-006](./ADR-006-facade-pattern.md) | Accepted | Simplified interfaces for complex subsystems |

## When to Use Each Pattern

### Factory Pattern
**Use when:**
- You need to create objects without specifying their concrete classes
- You want runtime extensibility (new types can be registered dynamically)
- Object creation logic is complex and should be centralized

**Example in ez-agents:** `AgentFactoryRegistry` creates agent instances by name

### Strategy Pattern
**Use when:**
- You have multiple algorithms for the same task
- Algorithms should be interchangeable at runtime
- You want to avoid conditional logic for algorithm selection

**Example in ez-agents:** `CompressionStrategy` interface with 4 implementations

### Observer Pattern
**Use when:**
- You need loose coupling between event producers and consumers
- Multiple objects need to react to state changes
- You want to track lifecycle events without modifying core logic

**Example in ez-agents:** `EventBus` for session/phase/skill events

### Adapter Pattern
**Use when:**
- You need to integrate with incompatible interfaces
- You want to swap implementations without changing client code
- Multiple providers have different APIs but similar functionality

**Example in ez-agents:** `ModelProviderAdapter` for Claude, OpenAI, Kimi, Qwen

### Decorator Pattern
**Use when:**
- You have cross-cutting concerns (logging, caching, validation)
- You want to add behavior without modifying existing code
- Concerns should be composable and reusable

**Example in ez-agents:** `@LogExecution`, `@CacheResult`, `@ValidateInput`

### Facade Pattern
**Use when:**
- You have complex subsystems with many dependencies
- You want to provide a simplified interface for consumers
- You need to orchestrate multiple components

**Example in ez-agents:** `ContextManagerFacade`, `SkillResolverFacade`

## Pattern Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        Facade Pattern                        │
│              (simplifies complex subsystems)                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Factory    │      │   Strategy   │      │   Observer   │
│  (creation)  │      │ (algorithms) │      │   (events)   │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │   Adapter    │
                    │ (interfaces) │
                    └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │  Decorator   │
                    │(cross-cutting)│
                    └──────────────┘
```

## Related Documentation

- [Architecture Overview](../architecture/OVERVIEW.md) - High-level system architecture
- [Class Hierarchy](../architecture/CLASS-HIERARCHY.md) - Detailed class relationships
- [Components](../architecture/COMPONENTS.md) - Component interaction details
- [Migration Guide](../migration/FP-TO-OOP.md) - FP to OOP migration reference

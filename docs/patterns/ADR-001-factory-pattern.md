# ADR-001: Factory Pattern for Agent Creation

**Status:** Accepted  
**Date:** 2026-03-26  
**Milestone:** v6.0.0 OOP Refactoring

## Context

The ez-agents system requires multiple agent types (planner, roadmapper, executor, researcher, verifier) that share a common interface but have different implementations. We needed a way to:

1. Create agents without coupling client code to concrete implementations
2. Enable runtime registration of new agent types
3. Centralize agent creation logic
4. Support dependency injection for testability

### Problem Statement

Direct instantiation of agent classes creates tight coupling:

```typescript
// Before: Tight coupling to concrete classes
const agent = new EzPlannerAgent();
const verifier = new EzVerifierAgent();
```

This approach makes it difficult to:
- Add new agent types without modifying existing code
- Mock agents for testing
- Configure agents with different dependencies

## Decision

We adopted the **Factory Pattern** with a registry-based approach:

```typescript
// After: Factory-based creation
import { AgentFactoryRegistry } from './factories/index.js';

const agent = AgentFactoryRegistry.createAgent('ez-planner');
const verifier = AgentFactoryRegistry.createAgent('ez-verifier');
```

### Implementation

**IAgent Interface:**
```typescript
interface IAgent {
  getName(): string;
  getDescription(): string;
  execute(context: AgentContext): Promise<AgentResult>;
  validate?(result: AgentResult): Promise<boolean>;
}
```

**AgentFactoryRegistry Singleton:**
```typescript
class AgentFactoryRegistry {
  private static instance: AgentFactoryRegistry;
  private factories: Map<string, () => IAgent>;
  
  static getInstance(): AgentFactoryRegistry;
  registerAgent(name: string, factory: () => IAgent): void;
  createAgent(name: string): IAgent;
  hasAgent(name: string): boolean;
  getRegisteredTypes(): string[];
}
```

**Agent Implementations:**
```typescript
class EzPlannerAgent implements IAgent {
  getName(): string { return 'ez-planner'; }
  getDescription(): string { return 'Plans phase execution'; }
  async execute(context: AgentContext): Promise<AgentResult> { /* ... */ }
  async validate(result: AgentResult): Promise<boolean> { /* ... */ }
}
```

**Registration Function:**
```typescript
export function registerDefaultAgents(): void {
  const registry = AgentFactoryRegistry.getInstance();
  
  registry.registerAgent('ez-planner', () => new EzPlannerAgent());
  registry.registerAgent('ez-roadmapper', () => new EzRoadmapperAgent());
  registry.registerAgent('ez-executor', () => new EzExecutorAgent());
  registry.registerAgent('ez-phase-researcher', () => new EzPhaseResearcherAgent());
  registry.registerAgent('ez-project-researcher', () => new EzProjectResearcherAgent());
  registry.registerAgent('ez-verifier', () => new EzVerifierAgent());
}
```

## Consequences

### Benefits

1. **Runtime Extensibility:** New agent types can be registered dynamically without modifying core code
2. **Decoupling:** Client code depends on interface, not concrete implementations
3. **Testability:** Factories can be mocked for unit testing
4. **Centralization:** Agent creation logic is in one place
5. **Type Safety:** TypeScript ensures all agents implement IAgent interface

### Trade-offs

1. **Complexity:** Additional abstraction layer compared to direct instantiation
2. **Indirection:** Harder to trace agent creation in debugger
3. **Registry Management:** Must ensure agents are registered before use

### When NOT to Use

- Simple applications with only one type of object
- When object creation is trivial (no dependencies)
- When you need fine-grained control over object lifecycle

## Alternatives Considered

### Direct Instantiation
```typescript
const agent = new EzPlannerAgent();
```
**Rejected because:** Tight coupling, no runtime extensibility

### Builder Pattern
```typescript
const agent = new AgentBuilder()
  .setType('planner')
  .withDependencies(deps)
  .build();
```
**Rejected because:** Overkill for our use case; we don't need step-by-step construction

### Dependency Injection Container
```typescript
const agent = container.resolve<IAgent>('agent.planner');
```
**Rejected because:** Adds external dependency; factory pattern is simpler and sufficient

## Related Patterns

- **Strategy Pattern:** Agents use strategies for compression (ADR-002)
- **Facade Pattern:** Facades orchestrate agent execution (ADR-006)
- **Decorator Pattern:** Agents use decorators for logging (ADR-005)

## References

- [Factory Pattern - Wikipedia](https://en.wikipedia.org/wiki/Factory_method_pattern)
- [TypeScript Factory Pattern Examples](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- Internal: [bin/lib/factories/AgentFactory.ts](../../bin/lib/factories/AgentFactory.ts)

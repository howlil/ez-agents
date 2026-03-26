# ADR-003: Observer Pattern for Event-Driven Architecture

**Status:** Accepted  
**Date:** 2026-03-26  
**Milestone:** v6.0.0 OOP Refactoring

## Context

The ez-agents system needs to track lifecycle events across multiple subsystems:

1. Session lifecycle (start, activity, stop)
2. Phase lifecycle (start, complete, skip)
3. Skill execution (trigger, match, execute)
4. Context operations (gather, compress, score)

### Problem Statement

Direct coupling between event producers and consumers creates tight dependencies:

```typescript
// Before: Direct coupling
class SessionManager {
  constructor(private logger: Logger, private metrics: MetricsService) {}
  
  async createSession() {
    await this.logger.log('session:start');
    await this.metrics.record('session_created');
    // ... session logic
  }
}
```

This approach makes it difficult to:
- Add new event consumers without modifying producers
- Track events for debugging/auditing
- Enable/disable event handling at runtime

## Decision

We adopted the **Observer Pattern** with a singleton EventBus:

```typescript
// After: Observer-based event handling
import { EventBus } from './observer/index.js';

class SessionManager {
  async createSession() {
    const eventBus = EventBus.getInstance();
    eventBus.emit('session:start', { sessionId, timestamp: Date.now() });
    // ... session logic
  }
}

// Consumers subscribe to events
eventBus.on('session:start', (data) => {
  logger.log(`Session started: ${data.sessionId}`);
});

eventBus.on('session:start', (data) => {
  metrics.record('session_created', data);
});
```

### Implementation

**EventBus Singleton:**
```typescript
class EventBus {
  private static instance: EventBus;
  private handlers: Map<keyof EventMap, Set<EventHandler<any>>>;
  
  static getInstance(): EventBus;
  
  on<T extends keyof EventMap>(event: T, handler: EventHandler<T>): void;
  off<T extends keyof EventMap>(event: T, handler: EventHandler<T>): void;
  emit<T extends keyof EventMap>(event: T, data: EventMap[T]): void;
  once<T extends keyof EventMap>(event: T, handler: EventHandler<T>): void;
  clear(event?: keyof EventMap): void;
}
```

**Type-Safe EventMap:**
```typescript
interface EventMap {
  // Session events
  'session:start': { sessionId: string; timestamp: number; runtime: string };
  'session:stop': { sessionId: string; timestamp: number; duration: number };
  'session:activity': { sessionId: string; timestamp: number; activity: string };
  
  // Phase events
  'phase:start': { phase: string; phaseNum: number; timestamp: number };
  'phase:complete': { phase: string; phaseNum: number; timestamp: number };
  'phase:skip': { phase: string; phaseNum: number; reason: string };
  
  // Skill events
  'skill:trigger': { trigger: string; matched: boolean; timestamp: number };
  'skill:match': { skillName: string; query: string; score: number };
  'skill:execute': { skillName: string; input: unknown; output: unknown };
  
  // Context events
  'context:gather': { sources: string[]; count: number; timestamp: number };
  'context:compress': { originalSize: number; compressedSize: number; strategy: string };
  'context:score': { query: string; filesScored: number; avgScore: number };
}
```

**Observer Classes:**

```typescript
class SessionObserver {
  private activeSessions: Map<string, SessionData>;
  private sessionHistory: SessionData[];
  
  constructor(eventBus: EventBus) {
    eventBus.on('session:start', (data) => this.onSessionStart(data));
    eventBus.on('session:stop', (data) => this.onSessionStop(data));
    eventBus.on('session:activity', (data) => this.onSessionActivity(data));
  }
  
  onSessionStart(data: SessionStartEvent): void {
    this.activeSessions.set(data.sessionId, data);
    this.sessionHistory.push(data);
  }
  
  getActiveSessions(): SessionData[] {
    return Array.from(this.activeSessions.values());
  }
}

class PhaseObserver {
  private phaseStats: Map<string, PhaseStats>;
  private phaseHistory: PhaseEvent[];
  
  constructor(eventBus: EventBus) {
    eventBus.on('phase:start', (data) => this.onPhaseStart(data));
    eventBus.on('phase:complete', (data) => this.onPhaseComplete(data));
    eventBus.on('phase:skip', (data) => this.onPhaseSkip(data));
  }
  
  getPhaseStats(): Map<string, PhaseStats> {
    return this.phaseStats;
  }
}
```

## Consequences

### Benefits

1. **Loose Coupling:** Event producers don't know about consumers
2. **Extensibility:** New observers can be added without modifying existing code
3. **Single Responsibility:** Each observer focuses on one concern
4. **Runtime Flexibility:** Observers can be enabled/disabled at runtime
5. **Debugging:** Central event log for troubleshooting

### Trade-offs

1. **Global State:** EventBus is a singleton (global state)
2. **Hidden Dependencies:** Event subscriptions may not be obvious from code
3. **Error Handling:** Errors in observers must be caught to prevent breaking event flow
4. **Memory Management:** Must unsubscribe to prevent memory leaks

### When NOT to Use

- Simple applications with no event tracking needs
- When event order is critical (observers execute in undefined order)
- When you need guaranteed delivery (observers may fail silently)

## Alternatives Considered

### EventEmitter (Node.js built-in)
```typescript
import { EventEmitter } from 'events';
const emitter = new EventEmitter();
```
**Rejected because:** Not type-safe; no compile-time checking of event names/payloads

### Callback-Based
```typescript
class SessionManager {
  constructor(private onSessionStart: (data) => void) {}
}
```
**Rejected because:** Only supports one callback; doesn't scale to multiple consumers

### RxJS Observables
```typescript
import { Subject } from 'rxjs';
const sessionStart$ = new Subject<SessionStartEvent>();
```
**Rejected because:** Adds external dependency; overkill for our use case

## Implementation Details

### Event Handler Execution

```typescript
emit<T extends keyof EventMap>(event: T, data: EventMap[T]): void {
  const handlers = this.handlers.get(event);
  if (!handlers) return;
  
  for (const handler of handlers) {
    try {
      handler(data);
    } catch (error) {
      console.error(`Error in event handler for ${event}:`, error);
      // Continue to next handler
    }
  }
}
```

### Async Handler Support

```typescript
async emit<T extends keyof EventMap>(event: T, data: EventMap[T]): Promise<void> {
  const handlers = this.handlers.get(event);
  if (!handlers) return;
  
  await Promise.all(
    Array.from(handlers).map(async (handler) => {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Error in async handler for ${event}:`, error);
      }
    })
  );
}
```

## Related Patterns

- **Facade Pattern:** Facades emit events during operations (ADR-006)
- **Decorator Pattern:** @LogExecution decorator emits events (ADR-005)

## References

- [Observer Pattern - Wikipedia](https://en.wikipedia.org/wiki/Observer_pattern)
- Internal: [bin/lib/observer/EventBus.ts](../../bin/lib/observer/EventBus.ts)

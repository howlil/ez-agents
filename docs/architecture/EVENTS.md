# Event-Driven Architecture

This document describes the event system in ez-agents, which uses the Observer pattern for decoupled lifecycle tracking.

## EventBus (Singleton)

The central event bus is a singleton that handles all event publishing and subscription:

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

### Usage Example

```typescript
import { EventBus } from './observer/index.js';

const eventBus = EventBus.getInstance();

// Subscribe to event
eventBus.on('session:start', (data) => {
  console.log(`Session started: ${data.sessionId}`);
});

// Emit event
eventBus.emit('session:start', {
  sessionId: 'abc123',
  timestamp: Date.now(),
  runtime: 'claude'
});

// Unsubscribe
eventBus.off('session:start', handler);
```

## Event Types (EventMap)

The system defines 12 event types across 4 categories:

### Session Events (3)

**session:start**
```typescript
{
  sessionId: string;
  timestamp: number;
  runtime: string;
  isGlobal: boolean;
}
```

**session:stop**
```typescript
{
  sessionId: string;
  timestamp: number;
  duration: number;
  reason: 'complete' | 'error' | 'user';
}
```

**session:activity**
```typescript
{
  sessionId: string;
  timestamp: number;
  activity: string;
  metadata?: Record<string, unknown>;
}
```

### Phase Events (3)

**phase:start**
```typescript
{
  phase: string;
  phaseNum: number;
  timestamp: number;
  requirements: string[];
}
```

**phase:complete**
```typescript
{
  phase: string;
  phaseNum: number;
  timestamp: number;
  completedRequirements: string[];
  duration: number;
}
```

**phase:skip**
```typescript
{
  phase: string;
  phaseNum: number;
  timestamp: number;
  reason: string;
}
```

### Skill Events (3)

**skill:trigger**
```typescript
{
  trigger: string;
  matched: boolean;
  timestamp: number;
  context: TriggerContext;
}
```

**skill:match**
```typescript
{
  skillName: string;
  query: string;
  score: number;
  timestamp: number;
}
```

**skill:execute**
```typescript
{
  skillName: string;
  input: unknown;
  output: unknown;
  duration: number;
  timestamp: number;
}
```

### Context Events (3)

**context:gather**
```typescript
{
  sources: string[];
  count: number;
  timestamp: number;
}
```

**context:compress**
```typescript
{
  originalSize: number;
  compressedSize: number;
  strategy: string;
  reduction: number;
  timestamp: number;
}
```

**context:score**
```typescript
{
  query: string;
  filesScored: number;
  avgScore: number;
  timestamp: number;
}
```

## Observer Classes

### SessionObserver

Tracks session lifecycle and maintains session history:

```typescript
class SessionObserver {
  private activeSessions: Map<string, SessionData>;
  private sessionHistory: SessionData[];
  
  onSessionStart(data: SessionStartEvent): void;
  onSessionStop(data: SessionStopEvent): void;
  onSessionActivity(data: SessionActivityEvent): void;
  getActiveSessions(): SessionData[];
  getSessionHistory(limit?: number): SessionData[];
}
```

### PhaseObserver

Tracks phase lifecycle and maintains phase statistics:

```typescript
class PhaseObserver {
  private phaseStats: Map<string, PhaseStats>;
  private phaseHistory: PhaseEvent[];
  
  onPhaseStart(data: PhaseStartEvent): void;
  onPhaseComplete(data: PhaseCompleteEvent): void;
  onPhaseSkip(data: PhaseSkipEvent): void;
  getPhaseStats(): Map<string, PhaseStats>;
  getPhaseHistory(limit?: number): PhaseEvent[];
}
```

### SkillTriggerObserver

Legacy observer for skill trigger evaluation (maintained for backward compatibility):

```typescript
class SkillTriggerObserver {
  onSkillTrigger(data: SkillTriggerEvent): void;
  onSkillMatch(data: SkillMatchEvent): void;
  onSkillExecute(data: SkillExecuteEvent): void;
}
```

## Event Flow Diagram

```
┌─────────────────┐
│  Component      │
│  (Action)       │
└────────┬────────┘
         │
         │ emit(event, data)
         ▼
┌─────────────────┐
│    EventBus     │
│   (Singleton)   │
└────────┬────────┘
         │
         │ notify handlers
         ▼
┌─────────────────────────────────────────┐
│           Registered Observers          │
├─────────────────┼───────────────────────┤
│  SessionObserver│  PhaseObserver        │
│                 │                       │
│  - onSession... │  - onPhase...         │
│  - getHistory() │  - getStats()         │
└─────────────────┴───────────────────────┘
```

## Event Handler Types

### Synchronous Handlers

```typescript
eventBus.on('session:start', (data) => {
  console.log('Session started:', data.sessionId);
});
```

### Asynchronous Handlers

```typescript
eventBus.on('phase:complete', async (data) => {
  await savePhaseStats(data);
});
```

### Error Handling

Handler errors are caught and logged without breaking the event flow:

```typescript
try {
  await handler(data);
} catch (error) {
  console.error(`Error in event handler for ${event}:`, error);
}
```

## Event Subscription Lifecycle

### Subscribe

```typescript
// Subscribe to single event
eventBus.on('session:start', handler);

// Subscribe to multiple events
eventBus.on('session:start', startHandler);
eventBus.on('session:stop', stopHandler);
eventBus.on('session:activity', activityHandler);
```

### Unsubscribe

```typescript
// Remove specific handler
eventBus.off('session:start', handler);

// Remove all handlers for event
eventBus.clear('session:start');

// Remove all handlers
eventBus.clear();
```

### One-Time Subscription

```typescript
// Handler called only once
eventBus.once('phase:complete', (data) => {
  console.log('Phase completed:', data.phase);
});
```

## Integration Points

### SessionManager Integration

```typescript
class SessionManager {
  @LogExecution()
  async createSession(runtime: string): Promise<string> {
    const sessionId = generateId();
    
    this.eventBus.emit('session:start', {
      sessionId,
      timestamp: Date.now(),
      runtime,
      isGlobal: this.isGlobal
    });
    
    return sessionId;
  }
}
```

### ContextManager Integration

```typescript
class ContextManagerFacade {
  async gather(sources: string[], options: ContextOptions) {
    this.eventBus.emit('context:gather', {
      sources,
      count: sources.length,
      timestamp: Date.now()
    });
    
    // ... gathering logic
    
    this.eventBus.emit('context:compress', {
      originalSize,
      compressedSize,
      strategy: this.strategy.getName(),
      reduction: ((originalSize - compressedSize) / originalSize) * 100
    });
    
    return result;
  }
}
```

## Testing Events

### Mock EventBus for Testing

```typescript
const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
  clear: vi.fn()
};

// Test that component emits correct events
const facade = new ContextManagerFacade(mockEventBus as any);
await facade.gather(['file1.ts'], {});

expect(mockEventBus.emit).toHaveBeenCalledWith(
  'context:gather',
  expect.objectContaining({
    sources: ['file1.ts'],
    count: 1
  })
);
```

### Testing Event Handlers

```typescript
test('SessionObserver tracks session history', () => {
  const observer = new SessionObserver(eventBus);
  
  observer.onSessionStart({
    sessionId: 'test-123',
    timestamp: Date.now(),
    runtime: 'claude'
  });
  
  expect(observer.getActiveSessions()).toHaveLength(1);
});
```

## Related Documentation

- [Architecture Overview](./OVERVIEW.md) - High-level system architecture
- [Class Hierarchy](./CLASS-HIERARCHY.md) - Detailed class relationships
- [Components](./COMPONENTS.md) - Component interaction details
- [Observer Pattern ADR](../patterns/ADR-003-observer-pattern.md) - Design decision documentation

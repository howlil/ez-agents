---
name: Event-Driven Architecture Pattern
description: Components communicate via events - real-time systems, async workflows
version: 1.0.0
tags: [event-driven, architecture, async, real-time]
category: architecture
triggers:
  keywords: [event-driven, real-time, async, event-sourcing, event-streaming]
  projectArchetypes: [real-time-platform, notification-system, data-pipeline]
  constraints: [eventual-consistency-ok, high-throughput, decoupling-needed]
prerequisites:
  - pub_sub_pattern
  - message_queue_basics
  - eventual_consistency_basics
recommended_structure:
  directories:
    - src/Events
    - src/EventHandlers
    - src/EventPublishers
    - src/EventStore
    - src/Projections
    - infrastructure/event-bus
    - infrastructure/message-broker
workflow:
  setup:
    - Identify domain events from business processes
    - Design event schema and versioning strategy
    - Set up event bus/message broker
  generate:
    - Create event classes with schema validation
    - Implement event handlers and publishers
    - Add event store for audit-critical systems
  test:
    - Unit test event handlers
    - Integration test event flow
    - Test event versioning and migration
best_practices:
  - Use schema registry for event contracts
  - Implement idempotent event handlers
  - Design for eventual consistency
  - Event sourcing for audit-critical systems
  - Use correlation IDs for event tracing
anti_patterns:
  - Event Storming - too many events without clear ownership
  - Cascading Events - events triggering events triggering events
  - No Event Versioning - breaking changes without migration
  - Synchronous Event Processing - blocking event handlers
scaling_notes: |
  Event bus becomes bottleneck at scale:

  1. **Event Bus Scaling**:
     - Use partitioned topics (Kafka partitions)
     - Separate event stores per bounded context
     - Consider event streaming platforms (Kafka, Pulsar)

  2. **Event Store Optimization**:
     - Snapshot aggregates periodically
     - Use CQRS for read-heavy workloads
     - Archive old events to cold storage

  3. **Consumer Scaling**:
     - Multiple consumer groups for parallel processing
     - Consumer lag monitoring
     - Backpressure handling

  4. **When to Consider Alternatives**:
     - Simple CRUD → Direct database operations
     - Strong consistency required → Synchronous calls
     - Low event volume → Queue-based async
when_not_to_use: |
  Event-driven architecture may not be suitable for:

  1. **Simple CRUD Applications**:
     - Direct database operations simpler
     - Event overhead not justified

  2. **Systems Requiring Strong Consistency**:
     - Financial transactions needing ACID guarantees
     - Eventual consistency causes business issues

  3. **Teams Unfamiliar with Eventual Consistency**:
     - Debugging distributed event flows is complex
     - Requires mental model shift

  4. **Low Event Volume Systems**:
     - Queue-based async sufficient
     - Event sourcing overhead not needed

  5. **Real-Time User Interactions**:
     - User expects immediate response
     - Async processing adds latency
output_template: |
  ## Event-Driven Architecture Decision

  **Pattern:** Event-Driven Architecture
  **Version:** 1.0.0
  **Rationale:** [Why event-driven was chosen]

  **Event Categories:**
  - Domain Events: [Business-level events]
  - Integration Events: [Cross-service events]
  - System Events: [Technical events]

  **Event Bus:**
  - Technology: [Kafka, RabbitMQ, SNS/SQS, etc.]
  - Topics: [List of event topics]
  - Partitions: [Partitioning strategy]

  **Event Schema:**
  - Format: [JSON, Avro, Protobuf]
  - Registry: [Schema registry URL]
  - Versioning: [Versioning strategy]

  **Event Handlers:**
  - Handler 1: [Event → Action]
  - Handler 2: [Event → Action]

  **Consistency Model:**
  - Delivery: [At-least-once, Exactly-once]
  - Ordering: [Per-partition, Global]
  - Idempotency: [Strategy for duplicate handling]
dependencies:
  - pub_sub_pattern
  - message_queue_basics
  - eventual_consistency_basics
  - cqrs_basics
---

<role>
You are an expert in event-driven architecture with deep experience in real-time systems, event sourcing, and distributed event processing.
You help teams design event schemas, implement idempotent handlers, and manage eventual consistency.
</role>

<execution_flow>
## Step 1: Event Discovery
- Identify domain events from business processes
- Classify events (domain, integration, system)
- Define event ownership and boundaries
- Document event producers and consumers

## Step 2: Event Schema Design
- Design event payload structure
- Choose serialization format (JSON, Avro, Protobuf)
- Set up schema registry
- Define versioning strategy

## Step 3: Event Bus Setup
- Select message broker (Kafka, RabbitMQ, etc.)
- Configure topics and partitions
- Set up consumer groups
- Implement dead letter queues

## Step 4: Event Handler Implementation
- Create idempotent event handlers
- Implement event correlation and tracing
- Add error handling and retry logic
- Configure consumer scaling

## Step 5: Event Store (if using Event Sourcing)
- Design event store schema
- Implement aggregate snapshots
- Set up projections for reads
- Configure event retention policies

## Step 6: Monitoring and Operations
- Monitor event throughput and lag
- Set up alerts for failed events
- Implement event replay capabilities
- Document event flow diagrams
</execution_flow>

<best_practices_detail>
### Event Schema Design

```php
// Event structure with metadata
class OrderCreated implements DomainEvent
{
    public function __construct(
        public readonly string $eventId,
        public readonly string $aggregateId,
        public readonly int $version,
        public readonly string $timestamp,
        public readonly string $correlationId,
        public readonly array $payload,
        public readonly string $eventType,
        public readonly string $aggregateType
    ) {}
    
    // Payload specific to this event
    public static function create(
        int $orderId,
        int $userId,
        array $items,
        float $total
    ): self {
        return new self(
            eventId: Str::uuid()->toString(),
            aggregateId: (string) $orderId,
            version: 1,
            timestamp: now()->toIso8601String(),
            correlationId: app('correlation_id'),
            payload: [
                'order_id' => $orderId,
                'user_id' => $userId,
                'items' => $items,
                'total' => $total
            ],
            eventType: 'order.created',
            aggregateType: 'order'
        );
    }
}
```

### Idempotent Event Handlers

```php
class PaymentProcessedHandler
{
    public function __construct(
        private OrderRepository $orderRepo,
        private ProcessedEvents $processedEvents
    ) {}

    public function handle(PaymentProcessed $event): void
    {
        // Check if already processed (idempotency)
        if ($this->processedEvents->exists($event->eventId)) {
            Log::info('Event already processed', ['event_id' => $event->eventId]);
            return;
        }

        // Process event
        $order = $this->orderRepo->find($event->payload['order_id']);
        $order->markAsPaid();
        $this->orderRepo->save($order);

        // Mark as processed (in same transaction)
        $this->processedEvents->record($event->eventId);
    }
}
```

### Event Versioning Strategy

```php
// Event schema evolution
class OrderCreatedV1 { /* original schema */ }
class OrderCreatedV2 { /* added discount field */ }
class OrderCreatedV3 { /* added tax breakdown */ }

// Handler supports multiple versions
class OrderCreatedHandler
{
    public function handle(OrderCreated $event): void
    {
        match ($event->version) {
            1 => $this->handleV1($event),
            2 => $this->handleV2($event),
            3 => $this->handleV3($event),
            default => throw new UnsupportedEventVersion($event->version)
        };
    }

    private function handleV1(OrderCreatedV1 $event): void
    {
        // Migrate V1 to current format
        $currentFormat = $this->migrateV1ToV3($event);
        $this->process($currentFormat);
    }
}
```

### Correlation ID for Tracing

```php
// Add correlation ID to all events
class EventPublisher
{
    public function publish(DomainEvent $event): void
    {
        // Ensure correlation ID is set
        if (!app()->has('correlation_id')) {
            app()->instance('correlation_id', Str::uuid()->toString());
        }
        
        $event->correlationId = app('correlation_id');
        
        // Publish to event bus
        $this->bus->publish($event);
        
        Log::info('Event published', [
            'event_id' => $event->eventId,
            'correlation_id' => $event->correlationId,
            'event_type' => $event->eventType
        ]);
    }
}

// Trace event flow across services
// Service A: User Registered (correlation_id: abc123)
// Service B: Welcome Email Sent (correlation_id: abc123)
// Service C: Analytics Tracked (correlation_id: abc123)
```
</best_practices_detail>

<anti_patterns_detail>
### Event Storming

**Problem:** Too many events without clear ownership

```
BAD: Events for everything
- UserEmailChanged
- UserEmailUpdated
- UserEmailAddressModified
- EmailAddressChangedForUser
→ Multiple events for same business concept

GOOD: Clear event ownership
- UserEmailChanged (owned by User context)
→ One event, clear owner
```

### Cascading Events

**Problem:** Events triggering events triggering events

```
BAD: Event chain reaction
OrderCreated → InventoryReserved → PaymentProcessed → OrderConfirmed 
                                           ↓
                                    NotificationSent → EmailSent → SMSSent
                                           ↓
                                    AnalyticsTracked → DataWarehouseSynced
→ Hard to trace, debug, and maintain

GOOD: Process manager/orchestrator
class OrderProcessManager
{
    public function handle(OrderCreated $event): void
    {
        // Coordinate all actions in one place
        $this->inventory->reserve($event->orderId);
        $this->payment->process($event->orderId);
        $this->notifications->sendConfirmation($event->orderId);
        $this->analytics->trackOrder($event->orderId);
    }
}
```

### No Event Versioning

**Problem:** Breaking changes without migration

```php
// BAD: Breaking change without versioning
class OrderCreated
{
    // V1: total was float
    public float $total;
    
    // V2: Changed to string without versioning (BREAKS existing handlers)
    public string $total;
}

// GOOD: Versioned schema
class OrderCreatedV1 { public float $total; }
class OrderCreatedV2 { public string $total; public array $taxBreakdown; }

// Handler supports both
class OrderCreatedHandler
{
    public function handle(OrderCreated $event): void
    {
        if ($event instanceof OrderCreatedV1) {
            $event = $this->upgradeToV2($event);
        }
        $this->process($event);
    }
}
```

### Synchronous Event Processing

**Problem:** Blocking event handlers

```php
// BAD: Synchronous processing (defeats purpose of events)
class EventDispatcher
{
    public function dispatch(DomainEvent $event): void
    {
        foreach ($this->handlers as $handler) {
            $handler->handle($event); // Blocking!
        }
    }
}

// GOOD: Async processing
class EventDispatcher
{
    public function dispatch(DomainEvent $event): void
    {
        // Publish to message broker (non-blocking)
        $this->bus->publish($event);
        
        // Or queue for async processing
        ProcessEventJob::dispatch($event);
    }
}
```
</anti_patterns_detail>

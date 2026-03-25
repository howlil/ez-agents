---
name: cqrs_pattern_skill_v1
description: Command Query Responsibility Segregation (CQRS) pattern, event sourcing, read/write model separation, and scalable architecture patterns
version: 1.0.0
tags: [cqrs, event-sourcing, architecture, event-driven, scalability, ddd]
stack: architecture/cqrs
category: architecture
triggers:
  keywords: [cqrs, command query, event sourcing, read model, write model, event store]
  filePatterns: [*.ts, commands/*.ts, queries/*.ts, events/*.ts]
  commands: [event-store, event-sourcing]
  stack: architecture/cqrs
  projectArchetypes: [high-scale, event-driven, financial, audit-heavy]
  modes: [greenfield, migration, scaling]
prerequisites:
  - ddd_basics
  - event_driven_basics
  - database_basics
recommended_structure:
  directories:
    - src/commands/
    - src/queries/
    - src/events/
    - src/read-models/
    - src/write-models/
    - src/event-store/
workflow:
  setup:
    - Design aggregate boundaries
    - Define commands and events
    - Choose event store
    - Design read models
  implement:
    - Implement command handlers
    - Implement query handlers
    - Set up event store
    - Build projections
  operate:
    - Monitor event flow
    - Manage projections
    - Handle event versioning
    - Scale read/write separately
best_practices:
  - Start simple, add CQRS when needed
  - Keep commands and queries separate
  - Use events for communication
  - Design for eventual consistency
  - Implement idempotent commands
  - Version events from day one
  - Build robust projections
  - Monitor event lag
  - Implement event replay
  - Document event schemas
anti_patterns:
  - Never use CQRS for simple CRUD
  - Don't skip event versioning
  - Avoid complex event schemas
  - Don't ignore eventual consistency
  - Never skip event validation
  - Don't mix read/write models
  - Avoid synchronous event handling
  - Don't skip event store backups
  - Never ignore projection failures
  - Don't forget about event migration
scaling_notes: |
  For CQRS at scale:

  **Read Side:**
  - Scale read databases independently
  - Use read replicas
  - Implement caching
  - Denormalize for queries

  **Write Side:**
  - Optimize for writes
  - Use event streaming
  - Implement sagas
  - Handle concurrency

  **Event Store:**
  - Use specialized event stores
  - Implement snapshots
  - Archive old events
  - Scale event processing

when_not_to_use: |
  CQRS may not be suitable for:

  **Simple CRUD Applications:**
  - Basic create/read/update/delete
  - Use traditional architecture

  **Strong Consistency Required:**
  - Real-time consistency needs
  - Consider traditional ACID

  **Small Teams:**
  - Limited architecture expertise
  - Start with simpler patterns

output_template: |
  ## CQRS Architecture Strategy

  **Pattern:** CQRS + Event Sourcing
  **Event Store:** EventStoreDB
  **Read Models:** PostgreSQL + Redis
  **Messaging:** Kafka

  ### Key Decisions
  - **Commands:** Validated, idempotent
  - **Events:** Immutable, versioned
  - **Read Models:** Denormalized per query
  - **Consistency:** Eventual

  ### Next Steps
  1. Define aggregates
  2. Design events
  3. Implement command handlers
  4. Build projections
  5. Set up monitoring
dependencies:
  event_stores:
    - EventStoreDB (specialized)
    - Kafka (streaming)
    - DynamoDB (AWS)
  frameworks:
    - Axon (Java)
    - NEventStore (.NET)
    - EventStore (Node.js)
  messaging:
    - Kafka (event streaming)
    - RabbitMQ (messaging)
    - AWS SNS/SQS
---

<role>
You are a CQRS specialist with deep expertise in Command Query Responsibility Segregation, event sourcing, and scalable architecture patterns. You provide structured guidance on implementing CQRS for high-scale systems.
</role>

<cqrs_example>
**CQRS Implementation:**

```typescript
// src/commands/CreateOrderCommand.ts
export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address
  ) {}
}

// src/commands/CreateOrderHandler.ts
export class CreateOrderHandler {
  constructor(
    private eventStore: EventStore,
    private commandBus: CommandBus
  ) {}

  async handle(command: CreateOrderCommand): Promise<void> {
    const order = Order.create({
      userId: command.userId,
      items: command.items,
      shippingAddress: command.shippingAddress
    });

    // Get uncommitted events
    const events = order.getUncommittedEvents();
    
    // Append to event store
    await this.eventStore.append('order', order.id, events);
    
    // Commit events
    order.commit();
  }
}

// src/events/OrderCreated.ts
export class OrderCreated {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: OrderItem[],
    public readonly total: number,
    public readonly timestamp: Date
  ) {}
}

// src/read-models/OrderSummary.ts
export class OrderSummary {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly status: string,
    public readonly total: number,
    public readonly createdAt: Date
  ) {}
}

// src/projections/OrderSummaryProjection.ts
export class OrderSummaryProjection {
  constructor(private db: Database) {}

  async on(event: OrderCreated): Promise<void> {
    await this.db.query(`
      INSERT INTO order_summaries 
      (order_id, user_id, status, total, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [event.orderId, event.userId, 'created', event.total, event.timestamp]);
  }

  async on(event: OrderShipped): Promise<void> {
    await this.db.query(`
      UPDATE order_summaries 
      SET status = 'shipped', shipped_at = $2
      WHERE order_id = $1
    `, [event.orderId, event.timestamp]);
  }
}

// src/queries/GetOrderSummaryQuery.ts
export class GetOrderSummaryQuery {
  constructor(public readonly orderId: string) {}
}

// src/queries/GetOrderSummaryHandler.ts
export class GetOrderSummaryHandler {
  constructor(private db: Database) {}

  async handle(query: GetOrderSummaryQuery): Promise<OrderSummary> {
    const result = await this.db.query(`
      SELECT * FROM order_summaries 
      WHERE order_id = $1
    `, [query.orderId]);

    if (result.rows.length === 0) {
      throw new OrderNotFoundError(query.orderId);
    }

    return new OrderSummary(
      result.rows[0].order_id,
      result.rows[0].user_id,
      result.rows[0].status,
      result.rows[0].total,
      result.rows[0].created_at
    );
  }
}
```
</cqrs_example>

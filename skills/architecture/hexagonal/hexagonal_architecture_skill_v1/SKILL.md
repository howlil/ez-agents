---
name: hexagonal_architecture_skill_v1
description: Hexagonal (Ports & Adapters) architecture, dependency inversion, testable design, and clean architecture patterns for maintainable applications
version: 1.0.0
tags: [hexagonal, ports-adapters, clean-architecture, dependency-inversion, architecture, ddd]
stack: architecture/hexagonal
category: architecture
triggers:
  keywords: [hexagonal, ports adapters, clean architecture, dependency inversion, architecture]
  filePatterns: [*.ts, domain/*.ts, application/*.ts, infrastructure/*.ts]
  commands: [architecture-lint]
  stack: architecture/hexagonal
  projectArchetypes: [enterprise, maintainable, testable, long-term]
  modes: [greenfield, migration, refactoring]
prerequisites:
  - solid_principles
  - ddd_basics
  - testing_fundamentals
recommended_structure:
  directories:
    - src/domain/
    - src/application/
    - src/infrastructure/
    - src/adapters/
    - tests/unit/
    - tests/integration/
workflow:
  setup:
    - Define domain boundaries
    - Identify ports
    - Design adapters
    - Set up project structure
  implement:
    - Implement domain logic
    - Create application services
    - Build adapters
    - Wire dependencies
  test:
    - Unit test domain
    - Integration test adapters
    - Test use cases
    - Verify boundaries
best_practices:
  - Keep domain pure (no dependencies)
  - Define ports as interfaces
  - Implement adapters separately
  - Inject dependencies
  - Test domain in isolation
  - Keep use cases focused
  - Document port contracts
  - Use dependency injection
  - Avoid framework coupling
  - Maintain clear boundaries
anti_patterns:
  - Never leak infrastructure to domain
  - Don't skip interface definitions
  - Avoid anemic domain models
  - Don't mix adapter logic
  - Never skip unit tests
  - Don't create god services
  - Avoid circular dependencies
  - Don't ignore boundary violations
  - Never couple to frameworks
  - Don't forget about mapping
scaling_notes: |
  For hexagonal at scale:

  **Modularity:**
  - Split by bounded contexts
  - Use module boundaries
  - Implement facade patterns
  - Document dependencies

  **Testing:**
  - Mock external services
  - Use test adapters
  - Implement contract tests
  - Automate boundary tests

  **Evolution:**
  - Version port interfaces
  - Support multiple adapters
  - Plan for migration
  - Document changes

when_not_to_use: |
  Hexagonal may not be suitable for:

  **Simple Applications:**
  - CRUD-only apps
  - Consider layered architecture

  **Rapid Prototypes:**
  - Quick MVP needed
  - Add architecture later

  **Small Teams:**
  - Limited architecture experience
  - Start simpler

output_template: |
  ## Hexagonal Architecture Strategy

  **Pattern:** Ports & Adapters
  **Domain:** Rich domain models
  **DI:** Constructor injection
  **Testing:** Domain isolated

  ### Key Decisions
  - **Domain:** Pure, no dependencies
  - **Ports:** Interface definitions
  - **Adapters:** Framework-specific
  - **Testing:** Mock adapters

  ### Next Steps
  1. Define domain model
  2. Create port interfaces
  3. Implement adapters
  4. Wire dependencies
  5. Test boundaries
dependencies:
  di_containers:
    - InversifyJS (TypeScript)
    - Tsyringe (Microsoft)
    - Awilix (simple)
  testing:
    - Jest (unit testing)
    - Testcontainers (integration)
    - MSW (API mocking)
  frameworks:
    - Express/Fastify (HTTP)
    - TypeORM/Prisma (Database)
    - NestJS (optional framework)
---

<role>
You are a hexagonal architecture specialist with deep expertise in Ports & Adapters, dependency inversion, and clean architecture patterns. You provide structured guidance on building maintainable, testable applications.
</role>

<hexagonal_structure>
**Hexagonal Architecture Structure:**

```
src/
├── domain/                    # Core business logic (no dependencies)
│   ├── entities/
│   │   ├── Order.ts
│   │   ├── User.ts
│   │   └── Product.ts
│   ├── value-objects/
│   │   ├── Money.ts
│   │   ├── Address.ts
│   │   └── Email.ts
│   ├── repositories/          # Repository interfaces (ports)
│   │   ├── OrderRepository.ts
│   │   └── UserRepository.ts
│   └── services/
│       └── DomainService.ts
│
├── application/               # Application business logic
│   ├── commands/
│   │   ├── CreateOrderCommand.ts
│   │   └── CreateUserCommand.ts
│   ├── queries/
│   │   ├── GetOrderQuery.ts
│   │   └── GetUserQuery.ts
│   ├── handlers/
│   │   ├── CreateOrderHandler.ts
│   │   └── CreateUserHandler.ts
│   └── ports/                 # Secondary ports
│       ├── EmailPort.ts
│       └── PaymentPort.ts
│
├── infrastructure/            # External concerns
│   ├── database/
│   │   ├── repositories/      # Repository implementations
│   │   │   ├── PostgresOrderRepository.ts
│   │   │   └── PostgresUserRepository.ts
│   │   └── migrations/
│   ├── messaging/
│   │   ├── KafkaEmailAdapter.ts
│   │   └── StripePaymentAdapter.ts
│   └── config/
│       └── dependency-injection.ts
│
└── adapters/                  # Primary adapters (driving)
    ├── http/
    │   ├── controllers/
    │   │   ├── OrderController.ts
    │   │   └── UserController.ts
    │   ├── middleware/
    │   └── dto/
    │       ├── CreateOrderDTO.ts
    │       └── UserDTO.ts
    └── cli/
        └── commands/
```
</hexagonal_structure>

<domain_example>
**Domain Implementation:**

```typescript
// src/domain/entities/Order.ts
export class Order {
  constructor(
    public readonly id: OrderId,
    public readonly userId: UserId,
    private items: OrderItem[],
    public status: OrderStatus,
    public readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  // Business logic methods
  addItem(product: Product, quantity: number): void {
    if (this.status !== OrderStatus.DRAFT) {
      throw new InvalidOrderStatusError(this.status);
    }

    const existingItem = this.items.find(
      item => item.productId.equals(product.id)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push(new OrderItem(product.id, quantity, product.price));
    }

    this.updatedAt = new Date();
  }

  confirm(): void {
    if (this.items.length === 0) {
      throw new EmptyOrderError();
    }

    if (this.status !== OrderStatus.DRAFT) {
      throw new InvalidOrderStatusError(this.status);
    }

    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  // Getters (no setters for immutability)
  getTotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getTotal()),
      Money.zero()
    );
  }

  getItems(): ReadonlyArray<OrderItem> {
    return [...this.items];
  }
}

// src/domain/value-objects/Money.ts
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {}

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount;
  }

  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }
}

// src/domain/repositories/OrderRepository.ts (Port)
export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findByUser(userId: UserId): Promise<Order[]>;
}

// src/infrastructure/database/repositories/PostgresOrderRepository.ts (Adapter)
export class PostgresOrderRepository implements OrderRepository {
  constructor(private db: Database) {}

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id.value]
    );

    if (result.rows.length === 0) return null;

    return this.mapToDomain(result.rows[0]);
  }

  async save(order: Order): Promise<void> {
    await this.db.query(
      `INSERT INTO orders (id, user_id, status, total, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         status = $3,
         total = $4,
         updated_at = $6`,
      [order.id.value, order.userId.value, order.status, order.getTotal().toString(), order.createdAt, order.updatedAt]
    );
  }

  private mapToDomain(row: any): Order {
    return new Order(
      new OrderId(row.id),
      new UserId(row.user_id),
      [], // Load items separately
      OrderStatus[row.status],
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
```
</domain_example>

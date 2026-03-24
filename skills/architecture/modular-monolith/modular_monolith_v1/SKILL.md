---
name: Modular Monolith Architecture Pattern
description: Single deployable unit with clear module boundaries - growing teams, complex domains
version: 1.0.0
tags: [modular-monolith, architecture, scalable, ddd]
category: architecture
triggers:
  keywords: [modular, growing-team, complex-domain, ddd, bounded-context]
  projectArchetypes: [enterprise-app, multi-team-project, complex-business-logic]
  constraints: [team-growth, multiple-deployments, domain-complexity]
prerequisites:
  - monolith_pattern_basics
  - dependency_injection
  - domain_driven_design_basics
recommended_structure:
  directories:
    - src/Modules/User
    - src/Modules/Order
    - src/Modules/Payment
    - src/Modules/Inventory
    - src/Shared/Kernel
    - src/Infrastructure
    - tests/Modules
workflow:
  setup:
    - Identify bounded contexts from domain analysis
    - Define module boundaries and interfaces
    - Set up dependency enforcement rules
  generate:
    - Create module structure with clear interfaces
    - Implement cross-module communication via events
    - Add dependency validation
  test:
    - Unit test each module in isolation
    - Integration test module interactions
    - Validate no circular dependencies
best_practices:
  - Define clear module boundaries with interfaces
  - Enforce dependencies between modules (no cycles)
  - Use events for cross-module communication
  - Deploy as single unit but structure for extraction
  - Implement module-level tests
anti_patterns:
  - Distributed Monolith - microservice structure without benefits
  - Module Leakage - direct database access across modules
  - Implicit Dependencies - modules assume other module state
  - Circular Dependencies - modules depending on each other
scaling_notes: |
  Extract modules to microservices when:

  1. **Team Size Exceeds 12 Developers**:
     - Multiple teams need autonomous deployment
     - Coordination overhead exceeds microservice benefits

  2. **Specific Modules Need Independent Scaling**:
     - Order module handles 10x more traffic than User module
     - Different resource requirements per module

  3. **Different Deployment Frequencies**:
     - Payment module deploys weekly (regulated)
     - UI module deploys daily (rapid iteration)

  4. **Extraction Strategy**:
     - Start with least coupled module
     - Extract database first (if separate)
     - Implement API gateway for extracted module
     - Maintain event contracts during extraction
when_not_to_use: |
  Modular monolith may not be suitable for:

  1. **Small Teams (<5 Developers)**:
     - Overhead of module boundaries slows development
     - Simple monolith is more productive

  2. **Simple Domains**:
     - CRUD applications without complex business logic
     - No clear bounded contexts

  3. **Projects with Tight Deadlines**:
     - Module boundaries add upfront design time
     - Simple monolith allows faster iteration

  4. **Proof of Concept / MVP**:
     - Validation more important than structure
     - Can refactor after product-market fit
output_template: |
  ## Modular Monolith Architecture Decision

  **Pattern:** Modular Monolith
  **Version:** 1.0.0
  **Rationale:** [Why modular monolith was chosen]

  **Modules Identified:**
  - Module 1: [Name, responsibility, interfaces]
  - Module 2: [Name, responsibility, interfaces]
  - Shared Kernel: [Common types, utilities]

  **Module Boundaries:**
  - Communication: [Events, interfaces, or direct calls]
  - Database: [Shared or per-module]
  - Dependencies: [Dependency rules]

  **Enforcement:**
  - Tool: [Architecture testing tool]
  - Rules: [Key dependency rules]

  **Extraction Candidates:**
  - Module X: [Criteria for extraction]
  - Module Y: [Criteria for extraction]
dependencies:
  - monolith_pattern_basics
  - domain_driven_design_basics
  - event_driven_basics
---

<role>
You are an expert in modular monolith architecture with deep experience in Domain-Driven Design and growing team dynamics.
You help teams structure complex domains for maintainability while keeping deployment simplicity.
</role>

<execution_flow>
## Step 1: Domain Analysis
- Identify bounded contexts from business domain
- Map module responsibilities
- Define module interfaces and contracts
- Document allowed dependencies

## Step 2: Module Structure Design
- Create module directory structure
- Define public interfaces for each module
- Identify shared kernel (common types, utilities)
- Plan cross-module communication (events vs direct calls)

## Step 3: Dependency Enforcement
- Set up architecture testing (e.g., PHPStan rules, ArchUnit)
- Define dependency rules (Module A can depend on Module B)
- Prevent circular dependencies
- Validate database access patterns

## Step 4: Implementation
- Implement modules with clear interfaces
- Use dependency injection for module wiring
- Implement event handlers for cross-module communication
- Add module-level tests

## Step 5: Monitoring and Evolution
- Monitor module coupling metrics
- Track module extraction candidates
- Document extraction criteria
- Plan gradual extraction if needed
</execution_flow>

<best_practices_detail>
### Module Structure

```
src/
├── Modules/
│   ├── User/
│   │   ├── Application/
│   │   │   ├── UserService.php
│   │   │   └── DTOs/
│   │   ├── Domain/
│   │   │   ├── Entities/
│   │   │   ├── ValueObjects/
│   │   │   └── Events/
│   │   ├── Infrastructure/
│   │   │   ├── UserRepository.php
│   │   │   └── UserModuleServiceProvider.php
│   │   └── Interfaces/
│   │       └── UserModuleInterface.php
│   ├── Order/
│   │   └── [same structure]
│   └── Payment/
│       └── [same structure]
├── Shared/
│   └── Kernel/
│       ├── BaseDomainEntity.php
│       └── DomainEvent.php
└── Infrastructure/
    ├── Database/
    └── EventDispatcher/
```

### Module Interfaces

```php
// Public interface for User module
interface UserModuleInterface
{
    public function getUser(int $id): ?User;
    public function createUser(CreateUserDTO $dto): User;
    public function getUserByEmail(string $email): ?User;
}

// Other modules interact through interface only
class OrderService
{
    public function __construct(
        private UserModuleInterface $userModule
    ) {}

    public function createOrder(int $userId, array $items): Order
    {
        $user = $this->userModule->getUser($userId);
        if (!$user) {
            throw new UserNotFoundException($userId);
        }
        // ... create order
    }
}
```

### Cross-Module Communication via Events

```php
// Order module publishes event
class OrderCreated extends DomainEvent
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $userId,
        public readonly array $items
    ) {}
}

// Payment module subscribes
class OrderCreatedHandler
{
    public function __construct(
        private PaymentModuleInterface $paymentModule
    ) {}

    public function handle(OrderCreated $event): void
    {
        $this->paymentModule->initiatePayment(
            $event->orderId,
            $event->userId
        );
    }
}
```

### Dependency Enforcement (PHPStan Rules)

```neon
# phpstan.neon
services:
    - class: Phpstan\Rules\ForbiddenDirectModuleAccess
      tags: [phpstan.rules.rule]
      arguments:
          allowedDependencies:
              Order: [User, Shared]
              Payment: [Order, User, Shared]
              User: [Shared]
```
</best_practices_detail>

<anti_patterns_detail>
### Distributed Monolith

**Problem:** Microservice structure without benefits

```php
// BAD: Microservice patterns in monolith (worst of both worlds)
class OrderModule
{
    // HTTP client to call another module in same process
    public function getUser(int $userId): User
    {
        $response = Http::get('http://localhost:8000/api/users/' . $userId);
        return User::fromArray($response->json());
    }
}

// GOOD: Direct interface call
class OrderModule
{
    public function __construct(
        private UserModuleInterface $userModule
    ) {}

    public function getUser(int $userId): User
    {
        return $this->userModule->getUser($userId);
    }
}
```

### Module Leakage

**Problem:** Direct database access across modules

```php
// BAD: Order module directly accessing User table
class OrderService
{
    public function createOrder(int $userId, array $items): Order
    {
        // Directly querying User table (bypasses User module)
        $user = DB::table('users')->find($userId);
        // ...
    }
}

// GOOD: Access through module interface
class OrderService
{
    public function __construct(
        private UserModuleInterface $userModule
    ) {}

    public function createOrder(int $userId, array $items): Order
    {
        $user = $this->userModule->getUser($userId);
        // ...
    }
}
```

### Circular Dependencies

**Problem:** Modules depending on each other

```
User Module → Order Module → Payment Module → User Module
```

**Solution:** Introduce Shared Kernel or use events

```
User Module → Shared Kernel ← Order Module
                    ↑
              Payment Module
```

Or use events for loose coupling:

```php
// User module publishes event
class UserRegistered extends DomainEvent {}

// Order module listens without direct dependency
class UserRegisteredHandler
{
    public function handle(UserRegistered $event): void
    {
        // Create welcome order or perform action
    }
}
```
</anti_patterns_detail>

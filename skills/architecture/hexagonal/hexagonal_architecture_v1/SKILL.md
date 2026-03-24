---
name: hexagonal_architecture_v1
description: Hexagonal (Ports & Adapters) architecture for testable, maintainable, framework-agnostic applications
version: 1.0.0
tags: [hexagonal, ports-adapters, architecture, clean-architecture, testability]
category: architecture
triggers:
  keywords: [hexagonal, ports adapters, clean architecture, testable, framework-agnostic]
  projectArchetypes: [enterprise, long-term-project, high-testability-required]
prerequisites:
  - dependency_injection_basics
  - interface_segregation
  - unit_testing_fundamentals
workflow:
  setup:
    - Define domain core
    - Identify ports (interfaces)
    - Design adapters
    - Setup dependency injection
  build:
    - Implement domain logic
    - Create primary adapters
    - Create secondary adapters
    - Wire dependencies
  test:
    - Unit test domain (no mocks)
    - Integration test adapters
    - End-to-end tests
best_practices:
  - Keep domain layer pure (no framework dependencies)
  - Define ports as interfaces
  - Implement adapters for external concerns
  - Use dependency injection consistently
  - Test domain logic in isolation
  - Keep adapters thin (translation layer only)
  - Document port contracts clearly
  - Use value objects at boundaries
  - Implement in-memory adapters for testing
  - Separate read and write ports (CQRS optional)
anti_patterns:
  - Never put framework code in domain layer
  - Don't leak infrastructure concerns to domain
  - Avoid anemic domain models
  - Don't skip interface definitions
  - Never test through UI only
  - Don't create god adapters
  - Avoid circular dependencies
  - Don't ignore performance overhead
scaling_notes: |
  Hexagonal Scaling:
  - Start simple (few ports)
  - Add ports as needed
  - Group related adapters
  - Consider module boundaries
when_not_to_use: |
  Not for: Simple CRUD apps, prototypes, small scripts, performance-critical systems
output_template: |
  ## Hexagonal Architecture Decision
  **Domain Core:** {entities, value objects, domain services}
  **Ports:** {input ports, output ports}
  **Adapters:** {web, CLI, database, external APIs}
  **DI Container:** {manual, inversify, etc.}
dependencies:
  - di_framework: "Inversify, TSyringe, or manual"
  - testing_framework: "For isolation testing"
---

<role>
Software Architect specializing in clean architecture patterns and testability.
You have architected systems with 10+ year lifespans.
Focus on maintainability, testability, and separation of concerns.
</role>

<workflow>
## Hexagonal Implementation

### Phase 1: Domain Core (Week 1-2)
1. Define Entities
   - Business objects
   - Identity
   - Business rules

2. Value Objects
   - Immutable concepts
   - Validation logic
   - Operations

### Phase 2: Ports (Week 3)
3. Input Ports
   - Use case interfaces
   - Command/Query definitions
   - DTOs

4. Output Ports
   - Repository interfaces
   - Service interfaces
   - Event ports

### Phase 3: Adapters (Week 4-6)
5. Primary Adapters (Driving)
   - Web controllers
   - CLI handlers
   - Message consumers

6. Secondary Adapters (Driven)
   - Database repositories
   - External API clients
   - Message producers

### Phase 4: Wiring (Week 7)
7. Dependency Injection
   - Container setup
   - Binding configurations
   - Composition root
</workflow>

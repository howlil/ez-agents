---
name: Microservices Architecture Pattern
description: Independently deployable services - large teams, multiple products, scaling needs
version: 1.0.0
tags: [microservices, architecture, distributed, scalable]
category: architecture
triggers:
  keywords: [microservices, distributed, large-team, scaling, independent-deployment]
  projectArchetypes: [enterprise-platform, multi-product, high-scale-system]
  constraints: [team-autonomy, independent-scaling, polyglot-needs]
prerequisites:
  - modular_monolith_pattern
  - distributed_systems_basics
  - api_gateway_pattern
  - containerization_basics
recommended_structure:
  directories:
    - services/user-service
    - services/order-service
    - services/payment-service
    - services/inventory-service
    - api-gateway/
    - shared/libs
    - infrastructure/docker
    - infrastructure/k8s
workflow:
  setup:
    - Define service boundaries (DDD bounded contexts)
    - Design inter-service communication (sync/async)
    - Set up API gateway and service discovery
  generate:
    - Scaffold each service with independent database
    - Implement circuit breakers and retries
    - Add distributed tracing and centralized logging
  test:
    - Unit test each service independently
    - Contract test service interfaces
    - Integration test with service mesh
best_practices:
  - Design around business capabilities (DDD bounded contexts)
  - Implement circuit breakers and retries
  - Use API gateway for client-facing APIs
  - Centralized logging and distributed tracing
  - Database per service (no shared databases)
  - Implement health checks and readiness probes
anti_patterns:
  - Nano-services - services too small, overhead exceeds value
  - Shared Database - multiple services writing to same tables
  - Distributed Monolith - tight coupling between services
  - Ignoring Network Latency - assuming local calls
  - Synchronous chaining - services calling services calling services
scaling_notes: |
  Microservices require mature DevOps and operational practices:

  1. **Service Mesh**:
     - Istio, Linkerd for service-to-service communication
     - Automatic retries, circuit breakers, mTLS
     - Traffic management and observability

  2. **Distributed Tracing**:
     - Jaeger, Zipkin for request tracing
     - Correlation IDs across service boundaries
     - Performance bottleneck identification

  3. **Operational Complexity**:
     - Each service needs monitoring, alerting, logging
     - Database backups per service
     - Deployment orchestration (Kubernetes, Nomad)

  4. **When to Adopt**:
     - Team size > 10 developers (2+ pizza teams)
     - Multiple products sharing backend services
     - Proven scaling needs (100K+ concurrent users)
     - Mature DevOps practices in place
when_not_to_use: |
  Microservices may not be suitable for:

  1. **Small Teams (<10 Developers)**:
     - Operational overhead exceeds benefits
     - Coordination easier in monolith

  2. **Simple Domains**:
     - CRUD applications without complex business logic
     - No clear bounded contexts

  3. **Projects Without Dedicated DevOps**:
     - Each service needs deployment, monitoring, alerting
     - Requires container orchestration expertise

  4. **Tight Deadlines**:
     - Distributed system complexity slows initial development
     - Network failures, eventual consistency add complexity

  5. **Strong Consistency Requirements**:
     - Distributed transactions are complex (Saga pattern needed)
     - Monolith easier for ACID transactions
output_template: |
  ## Microservices Architecture Decision

  **Pattern:** Microservices
  **Version:** 1.0.0
  **Rationale:** [Why microservices was chosen]

  **Service Boundaries:**
  - Service 1: [Name, responsibility, database]
  - Service 2: [Name, responsibility, database]
  - Service 3: [Name, responsibility, database]

  **Communication Patterns:**
  - Synchronous: [REST/gRPC for request-response]
  - Asynchronous: [Message broker for events]
  - Service Discovery: [Consul, Eureka, K8s]

  **Infrastructure:**
  - Container Orchestration: [Kubernetes, ECS, Nomad]
  - API Gateway: [Kong, Traefik, custom]
  - Observability: [Tracing, logging, monitoring]

  **Data Management:**
  - Database per service: [Yes/No]
  - Event sourcing: [Yes/No for specific services]
  - Saga orchestration: [Choreography/Orchestration]

  **Operational Readiness:**
  - CI/CD: [Pipeline per service]
  - Monitoring: [Dashboards, alerts]
  - Runbooks: [Incident procedures]
dependencies:
  - modular_monolith_pattern
  - api_gateway_pattern
  - event_driven_basics
  - containerization_basics
  - kubernetes_basics
---

<role>
You are an expert in microservices architecture with deep experience in distributed systems, service mesh, and large-scale platform engineering.
You help teams design service boundaries, implement resilience patterns, and manage operational complexity.
</role>

<execution_flow>
## Step 1: Service Boundary Design
- Identify bounded contexts from domain analysis
- Define service responsibilities and data ownership
- Design service interfaces (APIs, events)
- Document service dependencies

## Step 2: Infrastructure Setup
- Set up container orchestration (Kubernetes)
- Configure service mesh (Istio, Linkerd)
- Implement API gateway for external access
- Set up service discovery

## Step 3: Resilience Patterns
- Implement circuit breakers for all external calls
- Add retry logic with exponential backoff
- Configure bulkheads for fault isolation
- Implement health checks and readiness probes

## Step 4: Observability
- Set up distributed tracing (Jaeger, Zipkin)
- Implement centralized logging (ELK, Loki)
- Configure monitoring and alerting (Prometheus, Grafana)
- Add correlation IDs for request tracing

## Step 5: Data Management
- Design database per service
- Implement Saga pattern for distributed transactions
- Set up event sourcing for audit-critical services
- Configure CDC (Change Data Capture) for data sync

## Step 6: Deployment Strategy
- Implement CI/CD pipeline per service
- Configure blue-green or canary deployments
- Set up automated rollback on failures
- Document deployment runbooks
</execution_flow>

<best_practices_detail>
### Service Boundary Design (DDD)

```
E-Commerce Platform Services:

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Product        │  │  Order          │  │  Payment        │
│  Service        │  │  Service        │  │  Service        │
│  ────────────   │  │  ────────────   │  │  ────────────   │
│  - Catalog      │  │  - Order mgmt   │  │  - Processing   │
│  - Inventory    │  │  - Fulfillment  │  │  - Refunds      │
│  - Pricing      │  │  - Returns      │  │  - Invoicing    │
│                 │  │                 │  │                 │
│  DB: products   │  │  DB: orders     │  │  DB: payments   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Circuit Breaker Pattern

```php
// Circuit breaker for service-to-service calls
class OrderService
{
    public function __construct(
        private CircuitBreaker $paymentCircuitBreaker
    ) {}

    public function processPayment(int $orderId, float $amount): PaymentResult
    {
        return $this->paymentCircuitBreaker->call(
            fn() => $this->paymentClient->charge($orderId, $amount),
            fallback: fn() => PaymentResult::queuedForRetry($orderId)
        );
    }
}

// Circuit breaker states:
// - CLOSED: Normal operation, requests flow through
// - OPEN: Failure threshold exceeded, requests fail fast
// - HALF_OPEN: Testing if service recovered
```

### Distributed Tracing

```php
// Add correlation ID to all requests
class TracingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = $request->header('X-Correlation-ID') 
            ?? Str::uuid()->toString();
        
        // Add to outgoing requests
        app()->instance('correlation_id', $correlationId);
        
        $response = $next($request);
        $response->headers->set('X-Correlation-ID', $correlationId);
        
        return $response;
    }
}

// Log with correlation ID
Log::channel('distributed')->info('Order created', [
    'correlation_id' => $correlationId,
    'order_id' => $order->id,
    'service' => 'order-service'
]);
```

### Database per Service

```
┌─────────────────┐     ┌─────────────────┐
│ Order Service   │     │ Payment Service │
│                 │     │                 │
│ ┌───────────┐   │     │ ┌───────────┐   │
│ │ orders    │   │     │ │ payments  │   │
│ │ order_id  │   │     │ │ payment_id│   │
│ │ user_id   │   │     │ │ order_id  │   │ ← Reference only
│ │ total     │   │     │ │ amount    │   │
│ └───────────┘   │     │ │ status    │   │
│                 │     │ └───────────┘   │
│ NO DIRECT ACCESS│     │ NO DIRECT ACCESS│
│ TO OTHER DBs    │     │ TO OTHER DBs    │
└─────────────────┘     └─────────────────┘

Communication via APIs only, never direct database access
```

### Saga Pattern for Distributed Transactions

```php
// Order creation saga (orchestration style)
class OrderCreationSaga
{
    public function execute(CreateOrderCommand $command): Order
    {
        try {
            // Step 1: Create order (PENDING)
            $order = $this->orderService->create($command);
            
            // Step 2: Reserve inventory
            $this->inventoryService->reserve($order->id, $command->items);
            
            // Step 3: Process payment
            $payment = $this->paymentService->charge($order->id, $command->total);
            
            // Step 4: Confirm order
            $this->orderService->confirm($order->id);
            
            return $order;
        } catch (Exception $e) {
            // Compensating transactions (rollback)
            $this->compensate($order->id);
            throw $e;
        }
    }
    
    private function compensate(int $orderId): void
    {
        $this->paymentService->refund($orderId);
        $this->inventoryService->release($orderId);
        $this->orderService->cancel($orderId);
    }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Nano-services

**Problem:** Services too small, overhead exceeds value

```
BAD: One entity per service
- UserService (only manages users)
- ProductService (only manages products)
- OrderService (only manages orders)
- PaymentService (only manages payments)
→ 20+ services for simple e-commerce

GOOD: Business capability services
- CatalogService (products, categories, inventory, pricing)
- OrderService (orders, fulfillment, returns)
- PaymentService (payments, refunds, invoicing)
→ 3-5 services for simple e-commerce
```

### Shared Database

**Problem:** Multiple services writing to same tables

```php
// BAD: Services sharing database
class OrderService {
    // Directly writes to 'users' table
    DB::table('users')->update([...]);
}

class UserService {
    // Also writes to 'users' table
    DB::table('users')->update([...]);
}
// Race conditions, no clear ownership

// GOOD: Database per service
class OrderService {
    // Only writes to order_service.orders
    // Calls UserService API for user operations
    $this->userService->updateUser($userId, $data);
}
```

### Distributed Monolith

**Problem:** Tight coupling between services

```
BAD: Services tightly coupled
OrderService → PaymentService → UserService → NotificationService
     ↓              ↓              ↓
  Direct DB    Direct DB      Direct DB
    Access       Access         Access

All services must deploy together, share database schema

GOOD: Loosely coupled
OrderService → [Events] → PaymentService
     ↓                        ↓
  Own DB                   Own DB
  
Services communicate via APIs/events, independent deployment
```

### Synchronous Chaining

**Problem:** Services calling services calling services

```
BAD: Long synchronous call chain
User Request → API Gateway → Order Service → Payment Service → Inventory Service → Notification Service
                   ↓              ↓              ↓                ↓                   ↓
                200ms         150ms          300ms            100ms               50ms
                Total latency: 800ms+ (too slow)

GOOD: Async processing
User Request → API Gateway → Order Service → 200 OK
                                   ↓
                              [Event: Order Created]
                                   ↓
                    ┌──────────────┼──────────────┐
                    ↓              ↓              ↓
              Payment        Inventory     Notification
              Service        Service        Service
              (async)        (async)        (async)
```
</anti_patterns_detail>

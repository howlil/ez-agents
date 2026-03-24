---
name: API Gateway Pattern
description: Single entry point for all clients - microservices, mobile backends
version: 1.0.0
tags: [api-gateway, architecture, microservices, routing]
category: architecture
triggers:
  keywords: [api-gateway, microservices, routing, rate-limiting, bff, backend-for-frontend]
  projectArchetypes: [microservices-platform, mobile-backend, multi-client-api]
  constraints: [multiple-clients, service-consolidation, centralized-auth]
prerequisites:
  - http_basics
  - reverse_proxy_basics
  - authentication_basics
recommended_structure:
  directories:
    - api-gateway/
    - api-gateway/src/routes
    - api-gateway/src/middleware
    - api-gateway/src/handlers
    - api-gateway/src/plugins
    - infrastructure/gateway
workflow:
  setup:
    - Identify client types and their needs
    - Map routes to backend services
    - Design authentication strategy
  generate:
    - Configure route definitions
    - Implement middleware (auth, rate limiting, logging)
    - Set up health checks and monitoring
  test:
    - Integration test route mappings
    - Load test gateway throughput
    - Test circuit breaker behavior
best_practices:
  - Single entry point for all client requests
  - Authentication and authorization at gateway
  - Rate limiting per client/API key
  - Request/response transformation
  - Implement circuit breakers for downstream services
  - Use gateway for API versioning
anti_patterns:
  - Gateway as Bottleneck - all logic in gateway
  - No Circuit Breaker - downstream failures cascade
  - Thick Gateway - business logic leaking into gateway
  - Single Point of Failure - no gateway redundancy
scaling_notes: |
  Horizontal scaling with load balancer:

  1. **Gateway Scaling**:
     - Multiple gateway instances behind load balancer
     - Sticky sessions for authenticated requests
     - Connection pooling to downstream services

  2. **Gateway Sharding**:
     - Shard by route (public API vs internal API)
     - Shard by client type (mobile vs web)
     - Shard by geography (regional gateways)

  3. **Performance Optimization**:
     - Response caching at gateway
     - Request/response compression
     - Connection keep-alive

  4. **When to Consider Alternatives**:
     - Monolithic applications → Direct routing
     - Single client type → Simple reverse proxy
     - Simple applications → No gateway needed
when_not_to_use: |
  API Gateway may not be suitable for:

  1. **Monolithic Applications**:
     - Single backend service
     - Direct client-to-server communication sufficient

  2. **Single Client Type**:
     - Only web frontend
     - Simple reverse proxy (nginx) sufficient

  3. **Simple Applications Without Microservices**:
     - Gateway adds unnecessary complexity
     - Direct API calls simpler

  4. **Low Latency Requirements**:
     - Gateway adds hop (10-50ms overhead)
     - Direct service communication for ultra-low latency

  5. **Internal Services Only**:
     - Service mesh handles internal routing
     - Gateway only for external traffic
output_template: |
  ## API Gateway Architecture Decision

  **Pattern:** API Gateway
  **Version:** 1.0.0
  **Rationale:** [Why API gateway was chosen]

  **Gateway Configuration:**
  - Technology: [Kong, Traefik, APISIX, Custom]
  - Deployment: [Container, VM, Managed]
  - High Availability: [Active-active, Active-passive]

  **Routes Defined:**
  - Route 1: [Path → Backend Service]
  - Route 2: [Path → Backend Service]
  - Route 3: [Path → Backend Service]

  **Middleware:**
  - Authentication: [JWT, OAuth2, API Key]
  - Rate Limiting: [Requests per minute/hour]
  - Logging: [Request/response logging]
  - Transformation: [Request/response mapping]

  **Circuit Breaker:**
  - Failure Threshold: [Number of failures]
  - Timeout: [Request timeout]
  - Retry Policy: [Retry count, backoff]

  **Monitoring:**
  - Metrics: [Request rate, latency, errors]
  - Alerts: [Error rate, latency thresholds]
  - Tracing: [Distributed tracing integration]
dependencies:
  - http_basics
  - reverse_proxy_basics
  - authentication_basics
  - rate_limiting_basics
---

<role>
You are an expert in API gateway patterns with deep experience in microservices architecture, rate limiting, and request routing.
You help teams design gateway configurations, implement authentication at the edge, and manage API versioning.
</role>

<execution_flow>
## Step 1: Gateway Requirements
- Identify client types (web, mobile, third-party)
- Map API routes to backend services
- Define authentication requirements
- Plan rate limiting strategy

## Step 2: Gateway Selection
- Evaluate gateway technologies (Kong, Traefik, APISIX, custom)
- Consider managed options (AWS API Gateway, Azure APIM)
- Assess plugin ecosystem
- Plan deployment architecture

## Step 3: Route Configuration
- Define route mappings
- Configure request/response transformation
- Set up path-based and host-based routing
- Implement API versioning strategy

## Step 4: Middleware Implementation
- Add authentication middleware
- Configure rate limiting
- Implement request/response logging
- Add CORS and security headers

## Step 5: Resilience Patterns
- Implement circuit breakers for downstream services
- Configure retry policies
- Add timeout handling
- Set up fallback responses

## Step 6: Monitoring and Operations
- Configure metrics collection
- Set up distributed tracing
- Implement health checks
- Document API at gateway level
</execution_flow>

<best_practices_detail>
### Gateway Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Clients                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Web    │  │  Mobile  │  │  Third   │              │
│  │   App    │  │   App    │  │  Party   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │    Load Balancer        │
        │   (nginx, ALB, HAProxy) │
        └───────────┬─────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│  Gateway  │ │  Gateway  │ │  Gateway  │
│   Node 1  │ │   Node 2  │ │   Node 3  │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘
      │             │             │
      └─────────────┼─────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ User Service │ │ Order Service│ │Product Service│
└──────────────┘ └──────────────┘ └──────────────┘
```

### Route Configuration (Kong Example)

```yaml
# kong.yml - Route definitions
services:
  - name: user-service
    url: http://user-service:3000
    routes:
      - name: users-route
        paths:
          - /api/v1/users
        methods:
          - GET
          - POST
          - PUT
          - DELETE
        strip_path: false

  - name: order-service
    url: http://order-service:3000
    routes:
      - name: orders-route
        paths:
          - /api/v1/orders
        methods:
          - GET
          - POST

  - name: product-service
    url: http://product-service:3000
    routes:
      - name: products-route
        paths:
          - /api/v1/products
        methods:
          - GET

plugins:
  - name: jwt
    config:
      key_claim_name: api_key
      secret_is_base64: false

  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
      policy: redis
      fault_tolerant: true

  - name: cors
    config:
      origins:
        - https://app.example.com
        - https://admin.example.com
      methods:
        - GET
        - POST
        - PUT
        - DELETE
      credentials: true
```

### Authentication at Gateway

```php
// JWT validation middleware
class JwtAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractToken($request);
        
        if (!$token) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        try {
            $payload = JWT::decode($token, $this->publicKey);
            
            // Add user info to request headers for downstream services
            $request->headers->set('X-User-ID', $payload->sub);
            $request->headers->set('X-User-Roles', implode(',', $payload->roles));
            
            return $next($request);
        } catch (Exception $e) {
            return response()->json(['error' => 'Invalid token'], 401);
        }
    }
    
    private function extractToken(Request $request): ?string
    {
        $header = $request->header('Authorization');
        if ($header && str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }
        return null;
    }
}
```

### Rate Limiting

```php
// Rate limiting with Redis
class RateLimitMiddleware
{
    public function __construct(
        private Redis $redis
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $clientId = $this->getClientId($request);
        $limit = $this->getLimitForClient($clientId);
        $window = 60; // 1 minute
        
        $key = "rate_limit:{$clientId}:" . time() . ':' . floor(time() / $window);
        
        $current = $this->redis->incr($key);
        if ($current === 1) {
            $this->redis->expire($key, $window);
        }
        
        if ($current > $limit) {
            return response()->json([
                'error' => 'Rate limit exceeded',
                'retry_after' => $window - (time() % $window)
            ], 429);
        }
        
        $response = $next($request);
        $response->headers->set('X-RateLimit-Limit', $limit);
        $response->headers->set('X-RateLimit-Remaining', max(0, $limit - $current));
        
        return $response;
    }
    
    private function getLimitForClient(string $clientId): int
    {
        // Different limits for different client tiers
        return match ($this->getClientTier($clientId)) {
            'enterprise' => 1000,
            'premium' => 500,
            'free' => 100,
            default => 60
        };
    }
}
```

### Circuit Breaker for Downstream Services

```php
class CircuitBreakerMiddleware
{
    private array $circuits = [];
    
    public function handle(Request $request, Closure $next, string $service): Response
    {
        $circuit = $this->getCircuit($service);
        
        if ($circuit->state === 'OPEN') {
            // Check if we should try half-open
            if (time() > $circuit->retryAfter) {
                $circuit->state = 'HALF_OPEN';
            } else {
                return $this->fallbackResponse($service);
            }
        }
        
        try {
            $response = $next($request);
            
            if ($circuit->state === 'HALF_OPEN') {
                $circuit->state = 'CLOSED';
                $circuit->failures = 0;
            }
            
            return $response;
        } catch (Exception $e) {
            $circuit->failures++;
            
            if ($circuit->failures >= $circuit->threshold) {
                $circuit->state = 'OPEN';
                $circuit->retryAfter = time() + $circuit->timeout;
            }
            
            throw $e;
        }
    }
    
    private function fallbackResponse(string $service): Response
    {
        return response()->json([
            'error' => 'Service temporarily unavailable',
            'service' => $service,
            'retry_after' => $this->getCircuit($service)->retryAfter - time()
        ], 503);
    }
}
```

### API Versioning

```php
// Version routing at gateway
class ApiVersioningMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $version = $this->extractVersion($request);
        
        // Route to appropriate backend version
        if ($version === 'v1') {
            $request->headers->set('X-Backend-Version', 'v1');
        } elseif ($version === 'v2') {
            $request->headers->set('X-Backend-Version', 'v2');
        } else {
            // Default to latest
            $request->headers->set('X-Backend-Version', 'v2');
        }
        
        $response = $next($request);
        $response->headers->set('X-API-Version', $version);
        
        return $response;
    }
    
    private function extractVersion(Request $request): string
    {
        // Check URL path
        if (preg_match('#/api/v(\d+)/#', $request->path, $matches)) {
            return 'v' . $matches[1];
        }
        
        // Check Accept header
        $accept = $request->header('Accept');
        if ($accept && preg_match('/application\/vnd\.api\+json;version=(\d+)/', $accept, $matches)) {
            return 'v' . $matches[1];
        }
        
        return 'v1'; // Default
    }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Gateway as Bottleneck

**Problem:** All logic in gateway

```
BAD: Gateway doing too much
- Authentication ✓
- Authorization ✓
- Request validation ✓
- Business logic ✓
- Data aggregation ✓
- Response transformation ✓
→ Gateway becomes slow, hard to maintain

GOOD: Gateway as router
- Authentication ✓
- Rate limiting ✓
- Request routing ✓
- Logging ✓
→ Business logic in services
```

### No Circuit Breaker

**Problem:** Downstream failures cascade

```
BAD: No circuit breaker
Gateway → Service A (down) → Request hangs for 30s
        → Service B (down) → Request hangs for 30s
        → Service C (down) → Request hangs for 30s
→ All requests timeout, gateway overwhelmed

GOOD: Circuit breaker
Gateway → Service A (down) → Fast fail after 3 failures
        → Returns fallback response in 10ms
→ Graceful degradation
```

### Thick Gateway

**Problem:** Business logic leaking into gateway

```php
// BAD: Business logic in gateway
class GatewayController
{
    public function createOrder(Request $request): Response
    {
        // Gateway shouldn't do this!
        $inventory = $this->checkInventory($request->items);
        $price = $this->calculatePrice($request->items, $request->userId);
        $discount = $this->applyDiscount($price, $request->coupon);
        $tax = $this->calculateTax($discount, $request->shippingAddress);
        
        // Gateway should just route!
        return $this->orderService->create([...]);
    }
}

// GOOD: Gateway routes, services handle logic
class GatewayController
{
    public function createOrder(Request $request): Response
    {
        // Just route to order service
        return $this->proxyToService('order-service', $request);
    }
}
```

### Single Point of Failure

**Problem:** No gateway redundancy

```
BAD: Single gateway instance
                    ┌──────────┐
Clients ───────────>│ Gateway  │
                    │   Node 1 │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ Services │
                    └──────────┘

Gateway goes down → All requests fail

GOOD: Multiple gateway instances
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
      │ Gateway │    │ Gateway │    │ Gateway │
      │ Node 1  │    │ Node 2  │    │ Node 3  │
      └────┬────┘    └────┬────┘    └────┬────┘
           └───────────────┼───────────────┘
                           │
                      ┌────▼────┐
                      │ Services│
                      └─────────┘

One gateway fails → Others handle traffic
```
</anti_patterns_detail>

---
name: performance_testing_skill_v1
description: Performance testing with k6, JMeter, and load testing strategies for validating system performance under load
version: 1.0.0
tags: [performance-testing, load-testing, k6, jmeter, stress-testing, benchmarking]
stack: testing/performance
category: testing
triggers:
  keywords: [performance test, load test, stress test, k6, jmeter, benchmarking, latency]
  filePatterns: [*.test.js, *.jmx, performance/*.js, load/*.yaml]
  commands: [k6, jmeter, artillery]
  stack: testing/performance
  projectArchetypes: [saas, ecommerce, api-backend, high-traffic]
  modes: [greenfield, validation, optimization]
prerequisites:
  - testing_fundamentals
  - api_basics
  - metrics_basics
recommended_structure:
  directories:
    - tests/performance/
    - tests/load/
    - tests/stress/
    - tests/benchmark/
workflow:
  setup:
    - Install k6/JMeter
    - Configure test environments
    - Set up monitoring
    - Define performance budgets
  implement:
    - Write load test scripts
    - Configure scenarios
    - Set up assertions
    - Create dashboards
  analyze:
    - Review metrics
    - Identify bottlenecks
    - Generate reports
    - Recommend optimizations
best_practices:
  - Define clear performance goals
  - Test in production-like environment
  - Start with baseline tests
  - Gradually increase load
  - Monitor system metrics during tests
  - Identify breaking points
  - Document test results
  - Automate performance regression
  - Test third-party dependencies
  - Include think time in scenarios
anti_patterns:
  - Never test without monitoring
  - Don't skip warm-up period
  - Avoid unrealistic load patterns
  - Don't ignore error rates
  - Never test only happy path
  - Don't skip network simulation
  - Avoid testing in dev environment
  - Don't ignore percentiles (p95, p99)
  - Never skip baseline tests
  - Don't test without clear goals
scaling_notes: |
  For performance testing at scale:

  **Distributed Testing:**
  - Use k6 Cloud or Grafana Cloud
  - Distribute load generators
  - Synchronize test start
  - Aggregate results

  **Continuous Testing:**
  - Integrate in CI/CD
  - Run smoke tests on each PR
  - Full load tests nightly
  - Track trends over time

  **Production Testing:**
  - Use canary deployments
  - Implement chaos engineering
  - Run game days
  - Monitor real user metrics

when_not_to_use: |
  Performance testing may not be suitable for:

  **Early Development:**
  - Focus on functionality first
  - Add tests before production

  **Limited Resources:**
  - Start with simple tests
  - Use managed services

output_template: |
  ## Performance Testing Strategy

  **Tool:** k6
  **Scenarios:** Load, Stress, Spike
  **Metrics:** p95, p99, error rate
  **Budget:** p95 < 200ms, errors < 0.1%

  ### Key Decisions
  - **Tool:** k6 for developer experience
  - **Scenarios:** Based on real traffic
  - **Environment:** Staging mirror
  - **Monitoring:** Full observability

  ### Trade-offs Considered
  - k6 vs JMeter: k6 for code-based
  - Self-hosted vs Cloud: Based on scale
  - Synthetic vs RUM: Both for coverage

  ### Next Steps
  1. Define performance budgets
  2. Write test scripts
  3. Configure scenarios
  4. Set up dashboards
  5. Automate in CI/CD
dependencies:
  tools:
    - k6 (load testing)
    - JMeter (traditional load testing)
    - Artillery (modern load testing)
    - Grafana (visualization)
    - Prometheus (metrics)
  integrations:
    - GitHub Actions (CI/CD)
    - Grafana Cloud (managed)
    - Datadog (APM)
---

<role>
You are a performance testing specialist with deep expertise in k6, JMeter, and load testing strategies. You provide structured guidance on validating system performance and identifying bottlenecks.
</role>

<k6_test>
**k6 Load Test Script:**

```javascript
// tests/performance/api-load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const latencyP95 = new Trend('latency_p95');
const requestsPerSecond = new Counter('requests');

// Test configuration
export const options = {
  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
  
  // Load scenarios
  scenarios: {
    // Ramp-up phase
    ramp_up: {
      executor: 'ramping-vu',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 100 },
        { duration: '5m', target: 200 },
      ],
      gracefulRampDown: '30s',
      exec: 'apiTests',
    },
    
    // Sustained load
    sustained: {
      executor: 'constant-vus',
      vus: 200,
      duration: '10m',
      gracefulStop: '30s',
      exec: 'apiTests',
      startTime: '10m',
    },
    
    // Spike test
    spike: {
      executor: 'ramping-vu',
      startVUs: 200,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 200 },
      ],
      exec: 'apiTests',
      startTime: '20m',
    },
    
    // Stress test
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 1000,
      stages: [
        { duration: '5m', target: 500 },
        { duration: '5m', target: 1000 },
        { duration: '5m', target: 2000 },
      ],
      exec: 'stressTest',
      startTime: '30m',
    },
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://api.staging.example.com';
const API_KEY = __ENV.API_KEY;

// Shared state
let testUsers = [];

// Setup - run once before all VUs
export function setup() {
  // Create test users
  const createResponse = http.post(
    `${BASE_URL}/api/users`,
    JSON.stringify({
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  check(createResponse, {
    'setup: user created': (r) => r.status === 201,
  });
  
  return { userId: createResponse.json('id') };
}

// Main test function
export function apiTests(data) {
  const startTime = Date.now();
  
  // Get products
  const productsRes = http.get(`${BASE_URL}/api/products`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
    },
    tags: { name: 'GetProducts' },
  });
  
  check(productsRes, {
    'get products: status 200': (r) => r.status === 200,
    'get products: latency < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(productsRes.status >= 400);
  requestsPerSecond.add(1);
  
  sleep(1); // Think time
  
  // Get product detail
  const productId = productsRes.json('data[0].id');
  const productRes = http.get(`${BASE_URL}/api/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    tags: { name: 'GetProduct' },
  });
  
  check(productRes, {
    'get product: status 200': (r) => r.status === 200,
    'get product: has name': (r) => JSON.parse(r.body).name !== undefined,
  });
  
  sleep(0.5);
  
  // Create order
  const orderPayload = {
    userId: data.userId,
    items: [
      { productId, quantity: 1 },
    ],
  };
  
  const orderRes = http.post(
    `${BASE_URL}/api/orders`,
    JSON.stringify(orderPayload),
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'CreateOrder' },
    }
  );
  
  check(orderRes, {
    'create order: status 201': (r) => r.status === 201,
    'create order: has order id': (r) => JSON.parse(r.body).id !== undefined,
  });
  
  errorRate.add(orderRes.status >= 400);
  
  sleep(1);
}

// Stress test function
export function stressTest(data) {
  // Higher load, simpler checks
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'HealthCheck' },
  });
  
  check(res, {
    'health: status 200': (r) => r.status === 200,
  });
  
  requestsPerSecond.add(1);
}

// Teardown - run once after all VUs
export function teardown(data) {
  // Clean up test users
  if (data.userId) {
    http.del(
      `${BASE_URL}/api/users/${data.userId}`,
      null,
      {
        headers: { 'Authorization': `Bearer ${API_KEY}` },
      }
    );
  }
}

// Summary output
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```
</k6_test>

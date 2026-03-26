/**
 * K6 Load Testing Suite for EZ Agents
 *
 * Comprehensive load testing using k6:
 * - API load tests
 * - Concurrent user simulation
 * - Stress testing
 * - Soak testing
 * - Spike testing
 *
 * Usage: k6 run tests/perf/k6-load-test.ts
 */

// @ts-ignore - k6 imports are handled by k6 runtime
import http from 'k6/http';
// @ts-ignore
import { check, sleep } from 'k6';
// @ts-ignore
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const apiSuccessRate = new Rate('api_success_rate');
const responseTime = new Trend('response_time');
const tokenUsage = new Counter('token_usage');
const activeUsers = new Gauge('active_users');
const errorRate = new Rate('error_rate');
const throughput = new Counter('throughput');

interface TestScenario {
  name: string;
  prompt: string;
  expectedTokens: number;
  weight: number;
}

interface SetupData {
  startTime: number;
  scenarios: TestScenario[];
}

// Test configuration
export const options = {
  // Load test stages
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users (load test)
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users (stress test)
    { duration: '1m', target: 200 },  // Spike to 200 users
    { duration: '2m', target: 200 },  // Peak load
    { duration: '1m', target: 0 },    // Ramp down
  ],

  // Thresholds
  thresholds: {
    http_req_duration: ['p(50)<500', 'p(95)<1000', 'p(99)<2000'],
    api_success_rate: ['rate>0.95'],
    error_rate: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },

  // Other options
  discardResponseBodies: true,
  noConnectionReuse: false,
  userAgent: 'EZ-Agents-Load-Test/1.0',
};

// Test data
const testScenarios: TestScenario[] = [
  {
    name: 'simple_query',
    prompt: 'What is the capital of France?',
    expectedTokens: 50,
    weight: 30,
  },
  {
    name: 'code_generation',
    prompt: 'Write a TypeScript function to sort an array of objects by a key',
    expectedTokens: 200,
    weight: 25,
  },
  {
    name: 'text_analysis',
    prompt: 'Analyze the sentiment of this text: "The product is amazing!"',
    expectedTokens: 100,
    weight: 20,
  },
  {
    name: 'complex_reasoning',
    prompt: 'Explain the pros and cons of microservices architecture',
    expectedTokens: 500,
    weight: 15,
  },
  {
    name: 'context_heavy',
    prompt: 'Given a codebase with multiple files, how would you approach refactoring?',
    expectedTokens: 800,
    weight: 10,
  },
];

// Weighted scenario selector
function selectScenario(): TestScenario {
  const totalWeight = testScenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const scenario of testScenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      return scenario;
    }
  }

  return testScenarios[0];
}

// Main test function
export default function (): void {
  activeUsers.add(1);

  const scenario = selectScenario();
  const startTime = Date.now();

  // Simulate API call
  const response = http.post(
    'http://localhost:3000/api/v1/chat/completions',
    JSON.stringify({
      model: 'qwen',
      messages: [
        {
          role: 'user',
          content: scenario.prompt,
        },
      ],
      max_tokens: scenario.expectedTokens,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token',
      },
      timeout: '30s',
    }
  );

  const duration = Date.now() - startTime;
  responseTime.add(duration);

  // Check response
  const success = check(response, {
    'status is 200': (r: { status: number; body: string }) => r.status === 200,
    'response time < 2s': () => duration < 2000,
    'has response body': (r: { body: string }) => r.body && r.body.length > 0,
  });

  apiSuccessRate.add(success ? 1 : 0);
  errorRate.add(success ? 0 : 1);
  tokenUsage.add(scenario.expectedTokens);
  throughput.add(1);

  // Think time between requests
  sleep(1 + Math.random() * 2);

  activeUsers.add(-1);
}

// Setup function
export function setup(): SetupData {
  console.log('🚀 Starting K6 Load Test for EZ Agents');
  console.log('='.repeat(60));
  console.log(`Test Scenarios: ${testScenarios.length}`);
  console.log(`Total Stages: ${options.stages.length}`);
  console.log(`Total Duration: ${options.stages.reduce((sum, s) => sum + parseInt(s.duration), 0)} minutes`);
  console.log('='.repeat(60));

  return {
    startTime: Date.now(),
    scenarios: testScenarios,
  };
}

// Teardown function
export function teardown(data: SetupData): void {
  const duration = Date.now() - data.startTime;
  console.log('\n' + '='.repeat(60));
  console.log('📊 K6 Load Test Complete');
  console.log('='.repeat(60));
  console.log(`Total Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`Scenarios Tested: ${data.scenarios.length}`);
  console.log('='.repeat(60));
}

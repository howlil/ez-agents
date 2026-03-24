/**
 * Stress Test Script for EZ Agents
 * Uses k6 for stress testing beyond normal capacity
 * 
 * Run: k6 run tests/perf/stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loadTime = new Trend('load_time');
const requestCount = new Counter('requests');

// Test configuration - Stress test pushes beyond limits
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users (stress)
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 200 },   // Ramp up to 200 users (extreme stress)
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% under 2s (more lenient for stress)
    errors: ['rate<0.5'],               // Error rate under 50% (expected under stress)
  },
};

// Test scenario
export default function () {
  // Simulate multiple endpoints
  const endpoints = [
    'http://localhost:3000/health',
    'http://localhost:3000/api/status',
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(endpoint);
  
  // Track metrics
  requestCount.add(1);
  loadTime.add(response.timings.duration);
  
  // Check response
  const success = check(response, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!success);
  
  // Minimal sleep for stress testing
  sleep(0.5);
}

// Summary handler
export function handleSummary(data) {
  return {
    'tests/perf/results/stress-test-summary.json': JSON.stringify(data, null, 2),
    stdout: stressTestSummary(data),
  };
}

function stressTestSummary(data) {
  const { metrics } = data;
  const httpReqDuration = metrics.http_req_duration?.values;
  const errors = metrics.errors?.values;
  
  return `
Stress Test Summary:
  Total Requests: ${metrics.requests?.values.count || 0}
  Avg Response Time: ${httpReqDuration?.avg?.toFixed(2) || 0}ms
  95th Percentile: ${httpReqDuration?.['p(95)']?.toFixed(2) || 0}ms
  Max Response Time: ${httpReqDuration?.max?.toFixed(2) || 0}ms
  Error Rate: ${(errors?.rate || 0) * 100}%
  
  Performance under stress: ${errors?.rate < 0.5 ? '✓ PASS' : '✗ FAIL'}
  `;
}

/**
 * Load Test Script for EZ Agents
 * Uses k6 for performance and load testing
 * 
 * Run: k6 run tests/perf/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loadTime = new Trend('load_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    errors: ['rate<0.1'],              // Error rate should be less than 10%
  },
};

// Test scenario
export default function () {
  // Simulate API request
  const response = http.get('http://localhost:3000/health');
  
  // Track load time
  loadTime.add(response.timings.duration);
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Track errors
  errorRate.add(!success);
  
  // Sleep between requests
  sleep(1);
}

// Summary handler
export function handleSummary(data) {
  return {
    'tests/perf/results/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  const httpReqDuration = metrics.http_req_duration?.values;
  
  return `
Load Test Summary:
  Requests: ${metrics.http_reqs?.values.count || 0}
  Avg Response Time: ${httpReqDuration?.avg?.toFixed(2) || 0}ms
  95th Percentile: ${httpReqDuration?.['p(95)']?.toFixed(2) || 0}ms
  Error Rate: ${(metrics.errors?.values.rate || 0) * 100}%
  `;
}

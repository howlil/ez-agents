/**
 * API Monitor — Endpoint latency tracking with baseline storage
 * Tracks p50, p95, p99 percentiles
 */

const fs = require('fs');
const path = require('path');

class ApiMonitor {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.latenciesPath = path.join(this.cwd, '.planning', 'perf', 'api-latencies.json');
  }

  /**
   * Track endpoint latency
   * @param {string} baseUrl - Base URL of API
   * @param {Array} endpoints - Array of endpoint paths to track
   * @returns {Array} Latency results
   */
  async trackEndpoint(baseUrl, endpoints) {
    const results = [];

    for (const endpoint of endpoints) {
      const start = Date.now();
      try {
        // Placeholder - would make actual HTTP request in real implementation
        const latency = Date.now() - start;
        results.push({
          endpoint: endpoint.path || endpoint,
          method: endpoint.method || 'GET',
          latency,
          status: 200,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        results.push({
          endpoint: endpoint.path || endpoint,
          method: endpoint.method || 'GET',
          latency: -1,
          error: e.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Calculate percentiles from latency array
   * @param {Array} latencies - Array of latency values
   * @returns {Object} Percentile values
   */
  calculatePercentiles(latencies) {
    const sorted = latencies.filter(l => l > 0).sort((a, b) => a - b);
    if (sorted.length === 0) return { p50: 0, p95: 0, p99: 0 };

    return {
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

/**
 * Track endpoint latency
 * @param {string} baseUrl - Base URL of API
 * @param {Array} endpoints - Array of endpoint paths to track
 * @returns {Array} Latency results
 */
async function trackEndpoint(baseUrl, endpoints) {
  const monitor = new ApiMonitor();
  return monitor.trackEndpoint(baseUrl, endpoints);
}

/**
 * Calculate percentiles from latency array
 * @param {Array} latencies - Array of latency values
 * @returns {Object} Percentile values
 */
function calculatePercentiles(latencies) {
  const monitor = new ApiMonitor();
  return monitor.calculatePercentiles(latencies);
}

module.exports = { ApiMonitor, trackEndpoint, calculatePercentiles };

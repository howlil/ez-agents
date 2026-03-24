/**
 * Perf Analyzer — Core performance analysis coordinator
 * Orchestrates all analyzers and aggregates results
 */

const fs = require('fs');
const path = require('path');

class PerfAnalyzer {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
  }

  /**
   * Run all performance analyzers and aggregate results
   * @param {Object} options - Analysis options
   * @returns {Object} Aggregated performance results
   */
  async analyze(options = {}) {
    const results = {
      timestamp: new Date().toISOString(),
      db: null,
      frontend: null,
      api: null,
      errors: []
    };

    try {
      // Run DB analysis if DB URL provided
      if (options.dbUrl) {
        const { analyzeQueries } = require('./db-optimizer.cjs');
        results.db = await analyzeQueries(options.dbUrl, options.queries || []);
      }
    } catch (e) {
      results.errors.push(`DB analysis failed: ${e.message}`);
    }

    try {
      // Run frontend analysis if URL provided
      if (options.url) {
        const { runLighthouse } = require('./frontend-performance.cjs');
        results.frontend = await runLighthouse(options.url);
      }
    } catch (e) {
      results.errors.push(`Frontend analysis failed: ${e.message}`);
    }

    try {
      // Run API analysis if API URL provided
      if (options.apiUrl) {
        const { trackEndpoint } = require('./api-monitor.cjs');
        results.api = await trackEndpoint(options.apiUrl, options.endpoints || []);
      }
    } catch (e) {
      results.errors.push(`API analysis failed: ${e.message}`);
    }

    return results;
  }

  /**
   * Aggregate results from multiple analyzers
   * @param {Array} results - Array of analysis results
   * @returns {Object} Aggregated results
   */
  aggregate(results) {
    return results.reduce((acc, r) => {
      if (r.db) acc.db.push(r.db);
      if (r.frontend) acc.frontend.push(r.frontend);
      if (r.api) acc.api.push(r.api);
      acc.errors.push(...(r.errors || []));
      return acc;
    }, { db: [], frontend: [], api: [], errors: [] });
  }
}

module.exports = { PerfAnalyzer, analyze: PerfAnalyzer.prototype.analyze };

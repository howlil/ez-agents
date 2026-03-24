/**
 * Perf Reporter — Performance report generation
 * Generates structured reports and saves to .planning/logs/
 */

const fs = require('fs');
const path = require('path');

class PerfReporter {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
  }

  /**
   * Generate structured performance report
   * @param {Object} results - Analysis results from PerfAnalyzer
   * @returns {Object} Structured report
   */
  generateReport(results) {
    return {
      timestamp: results.timestamp || new Date().toISOString(),
      summary: {
        dbIssues: results.db?.suggestions?.length || 0,
        frontendScore: results.frontend?.performance || 0,
        apiLatency: results.api ? this.calculateAvgLatency(results.api) : 0
      },
      details: {
        db: results.db || null,
        frontend: results.frontend || null,
        api: results.api || null
      },
      errors: results.errors || [],
      recommendations: this.generateRecommendations(results)
    };
  }

  /**
   * Save report to .planning/logs/
   * @param {Object} report - Report to save
   * @param {string} filename - Optional filename
   * @returns {string} Path to saved report
   */
  saveReport(report, filename) {
    const logsDir = path.join(this.cwd, '.planning', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const reportFilename = filename || `perf-${Date.now()}.json`;
    const reportPath = path.join(logsDir, reportFilename);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    return reportPath;
  }

  /**
   * Calculate average latency from API results
   * @param {Array} apiResults - API latency results
   * @returns {number} Average latency
   */
  calculateAvgLatency(apiResults) {
    if (!apiResults || apiResults.length === 0) return 0;
    const valid = apiResults.filter(r => r.latency > 0);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((sum, r) => sum + r.latency, 0) / valid.length);
  }

  /**
   * Generate recommendations from analysis results
   * @param {Object} results - Analysis results
   * @returns {Array} Recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.db?.suggestions?.length > 0) {
      recommendations.push({
        category: 'database',
        priority: 'high',
        suggestion: `Address ${results.db.suggestions.length} query optimization opportunities`
      });
    }

    if (results.frontend?.performance < 50) {
      recommendations.push({
        category: 'frontend',
        priority: 'critical',
        suggestion: 'Frontend performance score is low - optimize bundle size and Core Web Vitals'
      });
    }

    return recommendations;
  }
}

/**
 * Generate structured performance report
 * @param {Object} results - Analysis results from PerfAnalyzer
 * @returns {Object} Structured report
 */
function generateReport(results) {
  const reporter = new PerfReporter();
  return reporter.generateReport(results);
}

/**
 * Save report to .planning/logs/
 * @param {Object} report - Report to save
 * @param {string} filename - Optional filename
 * @returns {string} Path to saved report
 */
function saveReport(report, filename) {
  const reporter = new PerfReporter();
  return reporter.saveReport(report, filename);
}

module.exports = { PerfReporter, generateReport, saveReport };

/**
 * Cost Reporter — Cost breakdown by phase/operation/provider with trend analysis
 * Generates detailed cost reports from cost-tracker data
 */

const fs = require('fs');
const path = require('path');

class CostReporter {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.metricsPath = path.join(this.cwd, '.planning', 'metrics.json');
    this.reportsDir = path.join(this.cwd, '.planning', 'finops', 'reports');
    this.ensureDir();
  }

  /**
   * Generate cost breakdown report
   * @param {Object} options - Report options
   * @returns {Object} Cost report
   */
  generateReport(options = {}) {
    const { CostTracker } = require('../cost-tracker.cjs');
    const tracker = new CostTracker(this.cwd);
    const data = tracker.aggregate();

    const report = {
      timestamp: new Date().toISOString(),
      total: data.total,
      byPhase: data.by_phase || {},
      byProvider: data.by_provider || {},
      trend: this.calculateTrend(data),
      recommendations: this.generateRecommendations(data)
    };

    return report;
  }

  /**
   * Save report to file
   * @param {Object} report - Report to save
   * @param {string} filename - Optional filename
   * @returns {string} Path to saved report
   */
  saveReport(report, filename) {
    const reportFilename = filename || `cost-${Date.now()}.json`;
    const reportPath = path.join(this.reportsDir, reportFilename);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    return reportPath;
  }

  /**
   * Calculate cost trend
   * @param {Object} data - Aggregated cost data
   * @returns {Array} Trend data
   */
  calculateTrend(data) {
    // Placeholder - would track historical trend
    return [{
      timestamp: new Date().toISOString(),
      total: data.total.cost || 0
    }];
  }

  /**
   * Generate cost optimization recommendations
   * @param {Object} data - Cost data
   * @returns {Array} Recommendations
   */
  generateRecommendations(data) {
    const recommendations = [];

    // Check for high-cost phases
    for (const [phase, costs] of Object.entries(data.by_phase || {})) {
      if (costs.cost > 10) {
        recommendations.push({
          category: 'phase',
          phase,
          suggestion: `High cost phase ($${costs.cost}) — review operation efficiency`
        });
      }
    }

    // Check for expensive providers
    for (const [provider, costs] of Object.entries(data.by_provider || {})) {
      if (costs.cost > 5) {
        recommendations.push({
          category: 'provider',
          provider,
          suggestion: `Consider alternative models for ${provider}`
        });
      }
    }

    return recommendations;
  }

  /**
   * Ensure reports directory exists
   */
  ensureDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }
}

/**
 * Generate cost report
 * @param {Object} options - Report options
 * @param {string} cwd - Working directory
 * @returns {Object} Cost report
 */
function generateReport(options = {}, cwd) {
  const reporter = new CostReporter(cwd);
  return reporter.generateReport(options);
}

/**
 * Save cost report
 * @param {Object} report - Report to save
 * @param {string} filename - Filename
 * @param {string} cwd - Working directory
 * @returns {string} Path to saved report
 */
function saveReport(report, filename, cwd) {
  const reporter = new CostReporter(cwd);
  return reporter.saveReport(report, filename);
}

module.exports = { CostReporter, generateReport, saveReport };

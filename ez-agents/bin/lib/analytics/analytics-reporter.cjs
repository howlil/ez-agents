/**
 * Analytics Reporter — Aggregated analytics report generation
 * Generates reports from events, NPS, funnels, and cohorts
 */

const fs = require('fs');
const path = require('path');

class AnalyticsReporter {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.reportsDir = path.join(this.cwd, '.planning', 'analytics', 'reports');
    this.ensureDir();
  }

  /**
   * Generate aggregated analytics report
   * @param {Object} options - Report options
   * @returns {Object} Analytics report
   */
  generateReport(options = {}) {
    const { calculateNPS } = require('./nps-tracker.cjs');
    const { analyzeFunnel } = require('./funnel-analyzer.cjs');
    const { AnalyticsCollector } = require('./analytics-collector.cjs');

    const collector = new AnalyticsCollector(this.cwd);
    const events = collector.getAllEvents();
    const nps = calculateNPS(this.cwd);

    // Group events by type
    const eventsByType = {};
    for (const event of events) {
      if (!eventsByType[event.eventType]) {
        eventsByType[event.eventType] = 0;
      }
      eventsByType[event.eventType]++;
    }

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalEvents: events.length,
        uniqueEventTypes: Object.keys(eventsByType).length,
        npsScore: nps.score
      },
      events: {
        byType: eventsByType,
        recent: events.slice(-10)
      },
      nps,
      recommendations: this.generateRecommendations(events, nps)
    };
  }

  /**
   * Save report to file
   * @param {Object} report - Report to save
   * @param {string} filename - Optional filename
   * @returns {string} Path to saved report
   */
  saveReport(report, filename) {
    const reportFilename = filename || `analytics-${Date.now()}.json`;
    const reportPath = path.join(this.reportsDir, reportFilename);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    return reportPath;
  }

  /**
   * Generate recommendations from analytics
   * @param {Array} events - Events array
   * @param {Object} nps - NPS data
   * @returns {Array} Recommendations
   */
  generateRecommendations(events, nps) {
    const recommendations = [];

    if (nps.score < 0) {
      recommendations.push({
        category: 'nps',
        priority: 'high',
        suggestion: 'NPS is negative — investigate detractor feedback'
      });
    }

    if (events.length < 100) {
      recommendations.push({
        category: 'tracking',
        priority: 'medium',
        suggestion: 'Low event volume — ensure all key actions are tracked'
      });
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
 * Generate analytics report
 * @param {Object} options - Report options
 * @param {string} cwd - Working directory
 * @returns {Object} Analytics report
 */
function generateReport(options = {}, cwd) {
  const reporter = new AnalyticsReporter(cwd);
  return reporter.generateReport(options);
}

/**
 * Save analytics report
 * @param {Object} report - Report to save
 * @param {string} filename - Filename
 * @param {string} cwd - Working directory
 * @returns {string} Path to saved report
 */
function saveReport(report, filename, cwd) {
  const reporter = new AnalyticsReporter(cwd);
  return reporter.saveReport(report, filename);
}

module.exports = { AnalyticsReporter, generateReport, saveReport };

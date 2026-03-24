#!/usr/bin/env node

/**
 * Quality Metrics — Track quality gate metrics over time
 *
 * Provides:
 * - Pass/fail rate tracking per gate
 * - Trend analysis (improving, stable, degrading)
 * - Quality reports per phase
 * - Overall quality scoring
 *
 * Usage:
 *   const QualityMetrics = require('./quality-metrics.cjs');
 *   const metrics = new QualityMetrics();
 *   metrics.recordGateResult('test', true, 5000);
 *   const report = metrics.getReport();
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');
const logger = new Logger();

const METRICS_PATH = path.join(process.cwd(), '.planning', 'quality-metrics.json');
const REPORTS_DIR = path.join(process.cwd(), '.planning', 'reports');

class QualityMetrics {
  constructor() {
    this.data = this.load();
  }

  /**
   * Load metrics from disk
   */
  load() {
    try {
      if (fs.existsSync(METRICS_PATH)) {
        const data = JSON.parse(fs.readFileSync(METRICS_PATH, 'utf8'));
        return data;
      }
    } catch (err) {
      logger.warn('Failed to load quality metrics, starting fresh', { error: err.message });
    }

    return {
      gates: {},
      phases: {},
      overall: {
        peakScore: 0,
        currentScore: 0
      }
    };
  }

  /**
   * Save metrics to disk
   */
  save() {
    try {
      const dir = path.dirname(METRICS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(METRICS_PATH, JSON.stringify(this.data, null, 2), 'utf8');
      logger.debug('Quality metrics saved');
    } catch (err) {
      logger.error('Failed to save quality metrics', { error: err.message });
    }
  }

  /**
   * Record gate result
   * @param {string} gateId - Gate identifier
   * @param {boolean} passed - Whether gate passed
   * @param {number} duration - Execution time in ms
   */
  recordGateResult(gateId, passed, duration = 0) {
    if (!this.data.gates[gateId]) {
      this.data.gates[gateId] = { history: [] };
    }

    const entry = {
      passed,
      duration,
      timestamp: new Date().toISOString()
    };

    this.data.gates[gateId].history.push(entry);

    // Keep last 100 runs
    this.data.gates[gateId].history = this.data.gates[gateId].history.slice(-100);

    this.save();
  }

  /**
   * Get pass rate for a gate
   * @param {string} gateId - Gate identifier
   * @returns {number} Pass rate (0-1)
   */
  getPassRate(gateId) {
    const history = this.data.gates[gateId]?.history || [];
    if (history.length === 0) return 1.0;

    const passed = history.filter(h => h.passed).length;
    return passed / history.length;
  }

  /**
   * Get trend for a gate
   * @param {string} gateId - Gate identifier
   * @returns {string} Trend: 'improving', 'stable', 'degrading', 'insufficient_data'
   */
  getTrend(gateId) {
    const history = this.data.gates[gateId]?.history || [];
    if (history.length < 5) return 'insufficient_data';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentRate = recent.filter(h => h.passed).length / recent.length;
    const olderRate = older.filter(h => h.passed).length / older.length;

    if (recentRate > olderRate + 0.1) return 'improving';
    if (recentRate < olderRate - 0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate overall quality score
   * @returns {number} Score (0-100)
   */
  calculateOverallScore() {
    const gateIds = Object.keys(this.data.gates);
    if (gateIds.length === 0) return 100;

    let totalScore = 0;
    for (const gateId of gateIds) {
      totalScore += this.getPassRate(gateId) * 100;
    }

    const score = Math.round(totalScore / gateIds.length);

    // Track peak and current
    this.data.overall.currentScore = score;
    if (score > this.data.overall.peakScore) {
      this.data.overall.peakScore = score;
    }

    this.save();
    return score;
  }

  /**
   * Get quality report
   * @returns {Object} Quality report
   */
  getReport() {
    const report = {
      gates: {},
      overall: {
        score: this.calculateOverallScore(),
        peakScore: this.data.overall.peakScore,
        trend: this.getOverallTrend()
      },
      generated: new Date().toISOString()
    };

    for (const [gateId, data] of Object.entries(this.data.gates)) {
      report.gates[gateId] = {
        passRate: this.getPassRate(gateId),
        trend: this.getTrend(gateId),
        totalRuns: data.history.length,
        avgDuration: this.getAverageDuration(gateId)
      };
    }

    return report;
  }

  /**
   * Get overall trend
   * @returns {string} Overall trend
   */
  getOverallTrend() {
    const gateIds = Object.keys(this.data.gates);
    if (gateIds.length === 0) return 'stable';

    const trends = gateIds.map(id => this.getTrend(id));
    const degrading = trends.filter(t => t === 'degrading').length;
    const improving = trends.filter(t => t === 'improving').length;

    if (degrading > improving) return 'degrading';
    if (improving > degrading) return 'improving';
    return 'stable';
  }

  /**
   * Get average duration for a gate
   * @param {string} gateId - Gate identifier
   * @returns {number} Average duration in ms
   */
  getAverageDuration(gateId) {
    const history = this.data.gates[gateId]?.history || [];
    if (history.length === 0) return 0;

    const total = history.reduce((sum, h) => sum + (h.duration || 0), 0);
    return Math.round(total / history.length);
  }

  /**
   * Generate quality report for a phase
   * @param {string} phaseId - Phase identifier
   * @returns {string} Markdown report
   */
  generatePhaseReport(phaseId) {
    const report = this.getReport();

    const markdown = `# Quality Report: Phase ${phaseId}

**Generated:** ${new Date().toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Overall Score | ${report.overall.score}/100 |
| Peak Score | ${report.overall.peakScore}/100 |
| Trend | ${report.overall.trend} |

## Gate Performance

| Gate | Pass Rate | Trend | Avg Duration |
|------|-----------|-------|--------------|
${Object.entries(report.gates).map(([gate, data]) => 
  `| ${gate} | ${(data.passRate * 100).toFixed(1)}% | ${data.trend} | ${data.avgDuration}ms |`
).join('\n')}

## Recommendations

${this.generateRecommendations(report)}

---
*Report generated by EZ Agents Quality Metrics*
`;

    // Save report
    try {
      const dir = REPORTS_DIR;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const reportPath = path.join(dir, `quality-phase-${phaseId}.md`);
      fs.writeFileSync(reportPath, markdown, 'utf8');
      logger.info('Quality report generated', { path: reportPath });
    } catch (err) {
      logger.error('Failed to save quality report', { error: err.message });
    }

    return markdown;
  }

  /**
   * Generate recommendations based on report
   * @param {Object} report - Quality report
   * @returns {string} Recommendations
   */
  generateRecommendations(report) {
    const recommendations = [];

    for (const [gateId, data] of Object.entries(report.gates)) {
      if (data.passRate < 0.8) {
        recommendations.push(`- **${gateId}**: Low pass rate (${(data.passRate * 100).toFixed(1)}%). Review gate configuration and fix flaky tests.`);
      }
      if (data.trend === 'degrading') {
        recommendations.push(`- **${gateId}**: Quality degrading. Investigate recent changes.`);
      }
      if (data.avgDuration > 60000) {
        recommendations.push(`- **${gateId}**: Slow execution (${data.avgDuration}ms). Consider optimization.`);
      }
    }

    if (report.overall.trend === 'degrading') {
      recommendations.push('- **Overall**: Quality trend is degrading. Consider pausing feature work and addressing technical debt.');
    }

    if (recommendations.length === 0) {
      return 'No specific recommendations. Quality metrics are healthy.';
    }

    return recommendations.join('\n');
  }

  /**
   * Check if quality allows phase completion
   * @returns {Object} Result with allowed flag and reasons
   */
  canCompletePhase() {
    const report = this.getReport();
    const reasons = [];

    // Check for degrading quality
    const degradingGates = Object.entries(report.gates)
      .filter(([_, data]) => data.trend === 'degrading');

    if (degradingGates.length > 0) {
      reasons.push(`Quality degrading on ${degradingGates.length} gate(s): ${degradingGates.map(([id, _]) => id).join(', ')}`);
    }

    // Check overall score
    if (report.overall.score < 70) {
      reasons.push(`Overall quality score too low: ${report.overall.score}/100 (minimum: 70)`);
    }

    return {
      allowed: reasons.length === 0,
      reasons
    };
  }
}

module.exports = { QualityMetrics };

/**
 * Regression Detector — Baseline comparison and regression flagging
 * Flags >10% degradation with severity levels
 */

class RegressionDetector {
  /**
   * Detect regressions by comparing current metrics against baseline
   * @param {Object} current - Current metrics
   * @param {Object} baseline - Baseline metrics
   * @param {number} threshold - Regression threshold percentage (default: 10)
   * @returns {Array} Array of regression findings
   */
  detectRegressions(current, baseline, threshold = 10) {
    const regressions = [];

    for (const [metric, currentValue] of Object.entries(current)) {
      const baselineValue = baseline[metric];
      if (baselineValue === undefined || baselineValue === 0) continue;

      const change = ((currentValue - baselineValue) / baselineValue) * 100;

      if (change > threshold) {
        regressions.push({
          metric,
          current: currentValue,
          baseline: baselineValue,
          changePercent: Math.round(change * 100) / 100,
          severity: change > 50 ? 'critical' : change > 20 ? 'high' : 'medium'
        });
      }
    }

    return regressions;
  }

  /**
   * Save baseline metrics
   * @param {Object} metrics - Metrics to save
   * @param {string} name - Baseline name
   * @param {string} cwd - Working directory
   */
  saveBaseline(metrics, name = 'default', cwd) {
    const fs = require('fs');
    const path = require('path');
    const baselinePath = path.join(cwd || process.cwd(), '.planning', 'perf-baselines', `${name}.json`);

    // Ensure directory exists
    const dir = path.dirname(baselinePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(baselinePath, JSON.stringify({
      ...metrics,
      metadata: {
        name,
        createdAt: new Date().toISOString()
      }
    }, null, 2));
  }

  /**
   * Load baseline metrics
   * @param {string} name - Baseline name
   * @param {string} cwd - Working directory
   * @returns {Object|null} Baseline metrics or null
   */
  loadBaseline(name = 'default', cwd) {
    const fs = require('fs');
    const path = require('path');
    const baselinePath = path.join(cwd || process.cwd(), '.planning', 'perf-baselines', `${name}.json`);

    if (!fs.existsSync(baselinePath)) return null;

    return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  }
}

/**
 * Detect regressions by comparing current metrics against baseline
 * @param {Object} current - Current metrics
 * @param {Object} baseline - Baseline metrics
 * @param {number} threshold - Regression threshold percentage (default: 10)
 * @returns {Array} Array of regression findings
 */
function detectRegressions(current, baseline, threshold = 10) {
  const detector = new RegressionDetector();
  return detector.detectRegressions(current, baseline, threshold);
}

module.exports = { RegressionDetector, detectRegressions };

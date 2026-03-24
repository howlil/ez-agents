/**
 * Perf Baseline — Save and load performance baselines
 * Stores baselines in .planning/perf-baselines/
 */

const fs = require('fs');
const path = require('path');

class PerfBaseline {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.baselinesDir = path.join(this.cwd, '.planning', 'perf-baselines');
  }

  /**
   * Save baseline metrics
   * @param {Object} metrics - Metrics to save
   * @param {string} name - Baseline name
   * @returns {string} Path to saved baseline
   */
  saveBaseline(metrics, name = 'default') {
    // Ensure directory exists
    if (!fs.existsSync(this.baselinesDir)) {
      fs.mkdirSync(this.baselinesDir, { recursive: true });
    }

    const baselinePath = path.join(this.baselinesDir, `${name}.json`);
    const baseline = {
      ...metrics,
      metadata: {
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf8');
    return baselinePath;
  }

  /**
   * Load baseline metrics
   * @param {string} name - Baseline name
   * @returns {Object|null} Baseline metrics or null
   */
  loadBaseline(name = 'default') {
    const baselinePath = path.join(this.baselinesDir, `${name}.json`);

    if (!fs.existsSync(baselinePath)) return null;

    return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  }

  /**
   * List all available baselines
   * @returns {Array} Array of baseline names
   */
  listBaselines() {
    if (!fs.existsSync(this.baselinesDir)) return [];

    return fs.readdirSync(this.baselinesDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  /**
   * Delete a baseline
   * @param {string} name - Baseline name
   * @returns {boolean} Success
   */
  deleteBaseline(name) {
    const baselinePath = path.join(this.baselinesDir, `${name}.json`);

    if (!fs.existsSync(baselinePath)) return false;

    fs.unlinkSync(baselinePath);
    return true;
  }
}

/**
 * Save baseline metrics
 * @param {Object} metrics - Metrics to save
 * @param {string} name - Baseline name
 * @returns {string} Path to saved baseline
 */
function saveBaseline(metrics, name = 'default') {
  const baseline = new PerfBaseline();
  return baseline.saveBaseline(metrics, name);
}

/**
 * Load baseline metrics
 * @param {string} name - Baseline name
 * @returns {Object|null} Baseline metrics or null
 */
function loadBaseline(name = 'default') {
  const baseline = new PerfBaseline();
  return baseline.loadBaseline(name);
}

module.exports = { PerfBaseline, saveBaseline, loadBaseline };

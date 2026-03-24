/**
 * Budget Enforcer — Enforces spending limits and auto-pauses over-budget operations
 * Integrates with cost-tracker for budget ceiling enforcement
 */

const fs = require('fs');
const path = require('path');

class BudgetEnforcer {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.configPath = path.join(this.cwd, '.planning', 'config.json');
  }

  /**
   * Check if budget is exceeded
   * @param {number} currentCost - Current total cost
   * @returns {Object} Budget status { ok, warning, exceeded, action }
   */
  checkBudget(currentCost) {
    const config = this.loadConfig();
    const ceiling = config.cost_tracking?.budget?.ceiling || null;
    const warningThreshold = config.cost_tracking?.warning_threshold || 80;

    if (!ceiling) {
      return { ok: true, warning: false, exceeded: false, action: 'none' };
    }

    const percentage = (currentCost / ceiling) * 100;

    if (percentage >= 100) {
      return {
        ok: false,
        warning: false,
        exceeded: true,
        action: config.cost_tracking?.auto_pause ? 'pause' : 'alert',
        percentage: Math.round(percentage)
      };
    }

    if (percentage >= warningThreshold) {
      return {
        ok: true,
        warning: true,
        exceeded: false,
        action: 'warn',
        percentage: Math.round(percentage)
      };
    }

    return { ok: true, warning: false, exceeded: false, action: 'none', percentage: Math.round(percentage) };
  }

  /**
   * Enforce budget (exit if exceeded and auto_pause enabled)
   * @param {number} currentCost - Current total cost
   */
  enforce(currentCost) {
    const status = this.checkBudget(currentCost);

    if (status.exceeded && status.action === 'pause') {
      console.error(`Budget ceiling exceeded (${status.percentage}%) — operations paused`);
      process.exit(1);
    }

    if (status.warning) {
      console.warn(`Budget warning: ${status.percentage}% of ceiling used`);
    }

    return status;
  }

  /**
   * Set budget ceiling
   * @param {number} ceiling - Budget ceiling in USD
   */
  setCeiling(ceiling) {
    const config = this.loadConfig();
    if (!config.cost_tracking) config.cost_tracking = {};
    if (!config.cost_tracking.budget) config.cost_tracking.budget = {};
    config.cost_tracking.budget.ceiling = ceiling;
    this.saveConfig(config);
  }

  /**
   * Load config
   * @returns {Object} Config
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      return { cost_tracking: { budget: {}, warning_threshold: 80 } };
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  /**
   * Save config
   * @param {Object} config - Config to save
   */
  saveConfig(config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
  }
}

/**
 * Check budget status
 * @param {number} currentCost - Current cost
 * @param {string} cwd - Working directory
 * @returns {Object} Budget status
 */
function checkBudget(currentCost, cwd) {
  const enforcer = new BudgetEnforcer(cwd);
  return enforcer.checkBudget(currentCost);
}

/**
 * Enforce budget
 * @param {number} currentCost - Current cost
 * @param {string} cwd - Working directory
 */
function enforce(currentCost, cwd) {
  const enforcer = new BudgetEnforcer(cwd);
  return enforcer.enforce(currentCost);
}

module.exports = { BudgetEnforcer, checkBudget, enforce };

'use strict';
/**
 * EZ Cost Tracker — Token usage and USD cost recording with budget enforcement
 * Persists entries to .planning/metrics.json using file-lock for concurrent safety.
 * Usage:
 *   const CostTracker = require('./cost-tracker.cjs');
 *   const ct = new CostTracker(cwd);
 *   await ct.record({ phase: 30, provider: 'claude', model: 'claude-sonnet-4-6', input_tokens: 1000, output_tokens: 500 });
 *   const report = ct.aggregate();
 *   const budget = ct.checkBudget();
 */

const fs = require('fs');
const path = require('path');
const { withLock } = require('./file-lock.cjs');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Returns default cost configuration with model rates.
 */
function defaultCostConfig() {
  return {
    enabled: true,
    budget: null,
    warning_threshold: 80,
    auto_pause: false,
    rates: {
      'claude-3':          { input: 0.003, output: 0.015 },
      'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
      'gpt-4':             { input: 0.03,  output: 0.06  },
      'qwen':              { input: 0.002, output: 0.006 },
      'kimi':              { input: 0.002, output: 0.006 },
    },
  };
}

/**
 * Read cost_tracking section from .planning/config.json.
 * Falls back to defaultCostConfig() when absent or unreadable.
 * @param {string} cwd
 * @returns {object}
 */
function readCostConfig(cwd) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) return defaultCostConfig();
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return Object.assign(defaultCostConfig(), raw.cost_tracking || {});
  } catch (e) {
    return defaultCostConfig();
  }
}

class CostTracker {
  /**
   * @param {string} [cwd] - Working directory (defaults to process.cwd())
   */
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.metricsPath = path.join(this.cwd, '.planning', 'metrics.json');
  }

  /**
   * Returns the cost_tracking config merged with defaults.
   * @returns {object}
   */
  getConfig() {
    return readCostConfig(this.cwd);
  }

  /**
   * Record a cost entry to metrics.json atomically (via file-lock).
   * If cost_usd is not supplied, it is computed from token counts and model rates.
   * @param {object} entry
   * @param {string} [entry.agent] - Agent name for per-agent tracking (e.g., 'ez-planner', 'ez-executor')
   * @returns {Promise<void>}
   */
  async record(entry) {
    // Ensure .planning directory exists before locking
    const planningDir = path.join(this.cwd, '.planning');
    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }

    await withLock(this.metricsPath, async () => {
      // Read existing data or initialise empty structure
      let data = { version: '1.0', entries: [] };
      if (fs.existsSync(this.metricsPath)) {
        try {
          data = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
          if (!Array.isArray(data.entries)) data.entries = [];
        } catch (e) {
          logger.warn('cost-tracker: failed to parse metrics.json, reinitialising', { error: e.message });
          data = { version: '1.0', entries: [] };
        }
      }

      // Compute cost_usd if not provided
      let cost_usd = entry.cost_usd;
      if (cost_usd === undefined || cost_usd === null) {
        const cfg = readCostConfig(this.cwd);
        const rates = cfg.rates || {};
        const modelKey = entry.model;
        const providerKey = entry.provider;
        const rate = rates[modelKey] || rates[providerKey] || null;
        if (rate) {
          const inputTokens = entry.input_tokens || 0;
          const outputTokens = entry.output_tokens || 0;
          cost_usd = (inputTokens * rate.input + outputTokens * rate.output) / 1000;
        } else {
          cost_usd = 0;
        }
      }

      const fullEntry = Object.assign({}, entry, {
        timestamp: new Date().toISOString(),
        cost_usd,
      });

      data.entries.push(fullEntry);
      fs.writeFileSync(this.metricsPath, JSON.stringify(data, null, 2), 'utf8');
    });
  }

  /**
   * Aggregate cost entries, optionally filtered.
   * @param {object} [filter] - Optional { phase?, milestone?, provider?, by_agent? }
   * @param {boolean} [filter.by_agent] - If true, group by agent field and return nested breakdown
   * @returns {{ total: { cost: number, tokens: number }, by_phase: object, by_provider: object, by_agent?: object }}
   */
  aggregate(filter = {}) {
    const emptyResult = () => ({ total: { cost: 0, tokens: 0 }, by_phase: {}, by_provider: {} });
    
    if (!fs.existsSync(this.metricsPath)) return emptyResult();

    let data;
    try {
      data = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
    } catch (e) {
      return emptyResult();
    }

    let entries = data.entries || [];

    if (filter.phase !== undefined) entries = entries.filter(e => e.phase == filter.phase);
    if (filter.milestone)          entries = entries.filter(e => e.milestone === filter.milestone);
    if (filter.provider)           entries = entries.filter(e => e.provider === filter.provider);

    const result = { total: { cost: 0, tokens: 0 }, by_phase: {}, by_provider: {} };

    for (const e of entries) {
      const phaseKey = String(e.phase || 'unknown');
      if (!result.by_phase[phaseKey]) result.by_phase[phaseKey] = { cost: 0, tokens: 0 };
      result.by_phase[phaseKey].cost   += e.cost_usd || 0;
      result.by_phase[phaseKey].tokens += (e.input_tokens || 0) + (e.output_tokens || 0);

      const provKey = e.provider || 'unknown';
      if (!result.by_provider[provKey]) result.by_provider[provKey] = { cost: 0 };
      result.by_provider[provKey].cost += e.cost_usd || 0;

      result.total.cost   += e.cost_usd || 0;
      result.total.tokens += (e.input_tokens || 0) + (e.output_tokens || 0);
    }

    // Add by_agent breakdown if requested
    if (filter.by_agent) {
      result.by_agent = {};
      for (const e of entries) {
        const agentKey = e.agent || 'unknown';
        if (!result.by_agent[agentKey]) result.by_agent[agentKey] = { cost: 0, tokens: 0 };
        result.by_agent[agentKey].cost += e.cost_usd || 0;
        result.by_agent[agentKey].tokens += (e.input_tokens || 0) + (e.output_tokens || 0);
      }
    }

    return result;
  }

  /**
   * Check total spending against a budget ceiling.
   * Does NOT call process.exit() — caller decides how to react.
   * @param {object} [opts] - { ceiling?, warning_threshold? }
   * @returns {{ status: 'ok'|'warning'|'exceeded', message: string, total?: number, ceiling?: number, percentUsed?: number }}
   */
  checkBudget(opts = {}) {
    const cfg = this.getConfig();
    const ceiling = (opts.ceiling !== undefined) ? opts.ceiling : cfg.budget;
    const warning_threshold = (opts.warning_threshold !== undefined) ? opts.warning_threshold : cfg.warning_threshold;

    const agg = this.aggregate();
    const total = agg.total.cost;

    if (ceiling === null || ceiling === undefined || typeof ceiling !== 'number') {
      return { status: 'ok', message: 'No budget set' };
    }

    if (total >= ceiling) {
      return {
        status: 'exceeded',
        message: `Budget ceiling $${ceiling} exceeded ($${total.toFixed(4)} spent)`,
        total,
        ceiling,
      };
    }

    const percentUsed = (total / ceiling) * 100;
    if (percentUsed >= warning_threshold) {
      return {
        status: 'warning',
        message: `${percentUsed.toFixed(1)}% of budget used`,
        total,
        ceiling,
        percentUsed,
      };
    }

    return {
      status: 'ok',
      message: 'Within budget',
      total,
      ceiling,
      percentUsed,
    };
  }

  /**
   * Persist a budget ceiling (and optional warning threshold) to .planning/config.json.
   * @param {number} ceiling
   * @param {number} [warningThreshold]
   */
  setBudget(ceiling, warningThreshold) {
    const configPath = path.join(this.cwd, '.planning', 'config.json');
    const planningDir = path.join(this.cwd, '.planning');

    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }

    let config = {};
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        config = {};
      }
    }

    if (!config.cost_tracking) config.cost_tracking = {};
    config.cost_tracking.budget = ceiling;
    if (warningThreshold !== undefined) {
      config.cost_tracking.warning_threshold = warningThreshold;
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }
}

module.exports = CostTracker;

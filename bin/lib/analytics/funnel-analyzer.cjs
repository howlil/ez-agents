/**
 * Funnel Analyzer — User funnel step tracking and drop-off analysis
 * Tracks conversion through defined funnel steps
 */

const fs = require('fs');
const path = require('path');

class FunnelAnalyzer {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.funnelPath = path.join(this.cwd, '.planning', 'analytics', 'funnels.json');
    this.ensureFile();
  }

  /**
   * Track user progression through funnel step
   * @param {string} funnelName - Funnel name
   * @param {string} userId - User ID
   * @param {string} step - Current step name
   */
  trackStep(funnelName, userId, step) {
    const funnels = this.getFunnels();
    
    if (!funnels[funnelName]) {
      funnels[funnelName] = { steps: [], users: {} };
    }

    const funnel = funnels[funnelName];
    
    // Add step if new
    if (!funnel.steps.includes(step)) {
      funnel.steps.push(step);
    }

    // Track user progression
    if (!funnel.users[userId]) {
      funnel.users[userId] = [];
    }
    funnel.users[userId].push({ step, timestamp: new Date().toISOString() });

    this.saveFunnels(funnels);
  }

  /**
   * Analyze funnel conversion
   * @param {string} funnelName - Funnel name
   * @returns {Object} Funnel analysis { steps, dropOff }
   */
  analyzeFunnel(funnelName) {
    const funnels = this.getFunnels();
    const funnel = funnels[funnelName];

    if (!funnel || funnel.steps.length === 0) {
      return { steps: [], dropOff: [], totalUsers: 0 };
    }

    const stepCounts = {};
    const userSteps = {};

    // Count users at each step
    for (const [userId, steps] of Object.entries(funnel.users)) {
      const uniqueSteps = [...new Set(steps.map(s => s.step))];
      for (const step of uniqueSteps) {
        stepCounts[step] = (stepCounts[step] || 0) + 1;
      }
      userSteps[userId] = uniqueSteps.length;
    }

    // Calculate drop-off between steps
    const dropOff = [];
    for (let i = 0; i < funnel.steps.length - 1; i++) {
      const current = stepCounts[funnel.steps[i]] || 0;
      const next = stepCounts[funnel.steps[i + 1]] || 0;
      dropOff.push({
        from: funnel.steps[i],
        to: funnel.steps[i + 1],
        dropOff: current - next,
        dropOffRate: current > 0 ? Math.round(((current - next) / current) * 100) : 0
      });
    }

    return {
      steps: funnel.steps.map(step => ({
        name: step,
        users: stepCounts[step] || 0
      })),
      dropOff,
      totalUsers: Object.keys(funnel.users).length
    };
  }

  /**
   * Get all funnels
   * @returns {Object} All funnels
   */
  getFunnels() {
    if (!fs.existsSync(this.funnelPath)) return {};
    return JSON.parse(fs.readFileSync(this.funnelPath, 'utf8'));
  }

  /**
   * Save funnels
   * @param {Object} funnels - Funnels to save
   */
  saveFunnels(funnels) {
    fs.writeFileSync(this.funnelPath, JSON.stringify(funnels, null, 2), 'utf8');
  }

  /**
   * Ensure funnels file exists
   */
  ensureFile() {
    const dir = path.dirname(this.funnelPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.funnelPath)) {
      fs.writeFileSync(this.funnelPath, '{}', 'utf8');
    }
  }
}

/**
 * Track funnel step
 * @param {string} funnelName - Funnel name
 * @param {string} userId - User ID
 * @param {string} step - Step name
 * @param {string} cwd - Working directory
 */
function trackStep(funnelName, userId, step, cwd) {
  const analyzer = new FunnelAnalyzer(cwd);
  return analyzer.trackStep(funnelName, userId, step);
}

/**
 * Analyze funnel
 * @param {string} funnelName - Funnel name
 * @param {string} cwd - Working directory
 * @returns {Object} Funnel analysis
 */
function analyzeFunnel(funnelName, cwd) {
  const analyzer = new FunnelAnalyzer(cwd);
  return analyzer.analyzeFunnel(funnelName);
}

module.exports = { FunnelAnalyzer, trackStep, analyzeFunnel };

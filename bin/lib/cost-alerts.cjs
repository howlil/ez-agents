#!/usr/bin/env node

/**
 * EZ Cost Alerts — Multi-threshold budget alert system
 *
 * Monitors budget usage and triggers alerts at configurable thresholds (50%, 75%, 90%)
 * Persists alerts to .planning/alerts.json using file-lock for concurrent safety
 *
 * Usage:
 *   const CostAlerts = require('./cost-alerts.cjs');
 *   const alerts = new CostAlerts(cwd);
 *   const triggered = alerts.checkThresholds({ percentUsed: 80, totalSpent: 4.00, budget: 5.00 });
 *   triggered.forEach(alert => alerts.logAlert(alert));
 */

const fs = require('fs');
const path = require('path');
const { withLock } = require('./file-lock.cjs');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Alert threshold levels
 */
const THRESHOLDS = {
  INFO: 50,
  WARNING: 75,
  CRITICAL: 90
};

/**
 * Get alert level from threshold percentage
 * @param {number} threshold - Threshold percentage
 * @returns {string} - Alert level: 'info', 'warning', or 'critical'
 */
function getLevelFromThreshold(threshold) {
  if (threshold >= THRESHOLDS.CRITICAL) return 'critical';
  if (threshold >= THRESHOLDS.WARNING) return 'warning';
  if (threshold >= THRESHOLDS.INFO) return 'info';
  return null;
}

class CostAlerts {
  /**
   * Create CostAlerts instance
   * @param {string} [cwd] - Working directory (defaults to process.cwd())
   */
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.alertsPath = path.join(this.cwd, '.planning', 'alerts.json');
  }

  /**
   * Get alerts file path
   * @returns {string} - Path to alerts.json
   */
  getAlertsFile() {
    return this.alertsPath;
  }

  /**
   * Check thresholds and return triggered alerts
   * @param {Object} params - Budget parameters
   * @param {number} params.percentUsed - Current budget usage percentage
   * @param {number} params.totalSpent - Total amount spent
   * @param {number} params.budget - Budget ceiling
   * @returns {Array<Object>} - Array of triggered alert objects
   */
  checkThresholds({ percentUsed, totalSpent, budget }) {
    const alerts = [];
    const thresholdLevels = [
      { threshold: THRESHOLDS.INFO, level: 'info' },
      { threshold: THRESHOLDS.WARNING, level: 'warning' },
      { threshold: THRESHOLDS.CRITICAL, level: 'critical' }
    ];

    for (const { threshold, level } of thresholdLevels) {
      if (percentUsed >= threshold) {
        alerts.push({
          threshold,
          level,
          percentUsed: Math.round(percentUsed * 100) / 100,
          totalSpent: Math.round(totalSpent * 10000) / 10000,
          budget: Math.round(budget * 10000) / 10000,
          message: `Budget ${level}: ${percentUsed.toFixed(1)}% used ($${totalSpent.toFixed(4)} of $${budget.toFixed(4)})`,
          timestamp: new Date().toISOString()
        });
      }
    }

    return alerts;
  }

  /**
   * Log alert to alerts.json
   * @param {Object} alert - Alert object to log
   * @returns {Promise<void>}
   */
  async logAlert(alert) {
    const planningDir = path.join(this.cwd, '.planning');

    // Ensure .planning directory exists
    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }

    await withLock(this.alertsPath, async () => {
      // Read existing alerts or initialize
      let data = { alerts: [] };
      if (fs.existsSync(this.alertsPath)) {
        try {
          data = JSON.parse(fs.readFileSync(this.alertsPath, 'utf8'));
          if (!Array.isArray(data.alerts)) data.alerts = [];
        } catch (e) {
          logger.warn('cost-alerts: failed to parse alerts.json, reinitializing', { error: e.message });
          data = { alerts: [] };
        }
      }

      // Check for duplicate (same threshold within 24 hours)
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const isDuplicate = data.alerts.some(existingAlert => {
        if (existingAlert.threshold !== alert.threshold) return false;
        const existingTime = new Date(existingAlert.timestamp).getTime();
        return (now - existingTime) < twentyFourHours;
      });

      if (!isDuplicate) {
        data.alerts.push(alert);
        fs.writeFileSync(this.alertsPath, JSON.stringify(data, null, 2), 'utf8');
        logger.info('cost-alerts: alert logged', { threshold: alert.threshold, level: alert.level });
      } else {
        logger.debug('cost-alerts: duplicate alert suppressed', { threshold: alert.threshold });
      }
    });
  }

  /**
   * Get all alerts
   * @returns {Array<Object>} - Array of alert objects
   */
  getAlerts() {
    if (!fs.existsSync(this.alertsPath)) {
      return [];
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.alertsPath, 'utf8'));
      return Array.isArray(data.alerts) ? data.alerts : [];
    } catch (e) {
      logger.warn('cost-alerts: failed to read alerts.json', { error: e.message });
      return [];
    }
  }

  /**
   * Get alerts filtered by level
   * @param {string} level - Alert level to filter by
   * @returns {Array<Object>} - Array of filtered alert objects
   */
  getAlertsByLevel(level) {
    return this.getAlerts().filter(alert => alert.level === level);
  }

  /**
   * Clear all alerts
   * @returns {Promise<void>}
   */
  async clearAlerts() {
    await withLock(this.alertsPath, async () => {
      fs.writeFileSync(this.alertsPath, JSON.stringify({ alerts: [] }, null, 2), 'utf8');
      logger.info('cost-alerts: all alerts cleared');
    });
  }
}

module.exports = CostAlerts;
module.exports.THRESHOLDS = THRESHOLDS;
module.exports.getLevelFromThreshold = getLevelFromThreshold;

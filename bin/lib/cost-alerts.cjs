'use strict';
/**
 * EZ Cost Alerts — Multi-threshold budget alert system
 * Triggers alerts at 50%, 75%, and 90% budget usage
 * With duplicate prevention (24h window)
 */

const fs = require('fs');
const path = require('path');

/**
 * Alert threshold percentages
 */
const THRESHOLDS = {
  INFO: 50,
  WARNING: 75,
  CRITICAL: 90
};

/**
 * Duplicate prevention window in milliseconds (24 hours)
 */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

class CostAlerts {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.planningDir = path.join(this.cwd, '.planning');
    this.alertsFile = path.join(this.planningDir, 'alerts.json');
    this._ensurePlanningDir();
  }

  /**
   * Ensure .planning directory exists
   */
  _ensurePlanningDir() {
    if (!fs.existsSync(this.planningDir)) {
      fs.mkdirSync(this.planningDir, { recursive: true });
    }
  }

  /**
   * Load existing alerts from file
   * @returns {Array} Existing alerts
   */
  _loadAlerts() {
    try {
      if (fs.existsSync(this.alertsFile)) {
        const data = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
        return data.alerts || [];
      }
    } catch (err) {
      // File corrupted or unreadable, start fresh
    }
    return [];
  }

  /**
   * Save alerts to file
   * @param {Array} alerts - Alerts to save
   */
  _saveAlerts(alerts) {
    const data = {
      alerts,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(this.alertsFile, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Check if alert is duplicate within 24h window
   * @param {Array} existingAlerts - Existing alerts
   * @param {object} newAlert - New alert to check
   * @returns {boolean} True if duplicate
   */
  _isDuplicate(existingAlerts, newAlert) {
    const now = new Date().getTime();
    return existingAlerts.some(alert => {
      if (alert.threshold !== newAlert.threshold || alert.level !== newAlert.level) {
        return false;
      }
      const alertTime = new Date(alert.timestamp).getTime();
      return (now - alertTime) < DUPLICATE_WINDOW_MS;
    });
  }

  /**
   * Check thresholds and return triggered alerts
   * @param {object} opts - Alert options
   * @param {number} opts.percentUsed - Current budget usage percentage
   * @param {number} opts.totalSpent - Total amount spent
   * @param {number} opts.budget - Total budget
   * @returns {Array} Array of triggered alerts
   */
  checkThresholds(opts) {
    const { percentUsed, totalSpent, budget } = opts;
    const triggered = [];

    const thresholds = [
      { level: 'info', threshold: THRESHOLDS.INFO },
      { level: 'warning', threshold: THRESHOLDS.WARNING },
      { level: 'critical', threshold: THRESHOLDS.CRITICAL }
    ];

    for (const { level, threshold } of thresholds) {
      if (percentUsed >= threshold) {
        triggered.push({
          threshold,
          level,
          percentUsed,
          totalSpent,
          budget,
          message: this._buildMessage(level, threshold, percentUsed, totalSpent, budget),
          timestamp: new Date().toISOString()
        });
      }
    }

    return triggered;
  }

  /**
   * Build alert message
   * @private
   */
  _buildMessage(level, threshold, percentUsed, totalSpent, budget) {
    const levelMessages = {
      info: 'Budget usage has reached',
      warning: 'Budget usage is getting high at',
      critical: 'CRITICAL: Budget usage is very high at'
    };
    return `${levelMessages[level]} ${percentUsed.toFixed(1)}% (${totalSpent.toFixed(2)}/${budget.toFixed(2)})`;
  }

  /**
   * Log alert to alerts.json with duplicate prevention
   * @param {object} alert - Alert object to log
   * @returns {Promise<void>}
   */
  async logAlert(alert) {
    const existingAlerts = this._loadAlerts();

    // Check for duplicates
    if (this._isDuplicate(existingAlerts, alert)) {
      return; // Skip duplicate
    }

    existingAlerts.push(alert);
    this._saveAlerts(existingAlerts);
  }

  /**
   * Get all alerts
   * @returns {Array} All alerts
   */
  getAlerts() {
    return this._loadAlerts();
  }

  /**
   * Get alerts by level
   * @param {string} level - Alert level (info, warning, critical)
   * @returns {Array} Filtered alerts
   */
  getAlertsByLevel(level) {
    const alerts = this._loadAlerts();
    return alerts.filter(alert => alert.level === level);
  }
}

// Export thresholds as static property
CostAlerts.THRESHOLDS = THRESHOLDS;

module.exports = CostAlerts;

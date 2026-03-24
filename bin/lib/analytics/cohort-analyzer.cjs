/**
 * Cohort Analyzer — Cohort-based usage pattern analysis
 * Groups users by time/behavior and tracks retention
 */

const fs = require('fs');
const path = require('path');

class CohortAnalyzer {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.cohortsPath = path.join(this.cwd, '.planning', 'analytics', 'cohorts.json');
    this.ensureFile();
  }

  /**
   * Define a cohort by date range
   * @param {string} name - Cohort name
   * @param {string} startDate - Start date (ISO)
   * @param {string} endDate - End date (ISO)
   * @param {Array} users - User IDs in cohort
   */
  defineCohort(name, startDate, endDate, users) {
    const cohorts = this.getCohorts();
    
    cohorts[name] = {
      startDate,
      endDate,
      users,
      size: users.length,
      createdAt: new Date().toISOString()
    };

    this.saveCohorts(cohorts);
  }

  /**
   * Calculate retention for a cohort
   * @param {string} cohortName - Cohort name
   * @param {Array} periods - Time periods to analyze
   * @returns {Object} Retention data
   */
  calculateRetention(cohortName, periods = []) {
    const cohorts = this.getCohorts();
    const cohort = cohorts[cohortName];

    if (!cohort) {
      return { error: 'Cohort not found' };
    }

    const retention = [];
    const initialSize = cohort.size;

    for (const period of periods) {
      const activeUsers = this.getActiveUsersInPeriod(cohortName, period);
      retention.push({
        period: period.name,
        activeUsers: activeUsers.length,
        retentionRate: initialSize > 0 ? Math.round((activeUsers.length / initialSize) * 100) : 0
      });
    }

    return { cohort: cohortName, retention, initialSize };
  }

  /**
   * Get active users in a period
   * @param {string} cohortName - Cohort name
   * @param {Object} period - Period definition
   * @returns {Array} Active user IDs
   */
  getActiveUsersInPeriod(cohortName, period) {
    // Placeholder - would track actual user activity
    const cohorts = this.getCohorts();
    const cohort = cohorts[cohortName];
    if (!cohort) return [];
    
    // Return all users for now (placeholder)
    return cohort.users;
  }

  /**
   * Get all cohorts
   * @returns {Object} All cohorts
   */
  getCohorts() {
    if (!fs.existsSync(this.cohortsPath)) return {};
    return JSON.parse(fs.readFileSync(this.cohortsPath, 'utf8'));
  }

  /**
   * Save cohorts
   * @param {Object} cohorts - Cohorts to save
   */
  saveCohorts(cohorts) {
    fs.writeFileSync(this.cohortsPath, JSON.stringify(cohorts, null, 2), 'utf8');
  }

  /**
   * Ensure cohorts file exists
   */
  ensureFile() {
    const dir = path.dirname(this.cohortsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.cohortsPath)) {
      fs.writeFileSync(this.cohortsPath, '{}', 'utf8');
    }
  }
}

/**
 * Define a cohort
 * @param {string} name - Cohort name
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {Array} users - User IDs
 * @param {string} cwd - Working directory
 */
function defineCohort(name, startDate, endDate, users, cwd) {
  const analyzer = new CohortAnalyzer(cwd);
  return analyzer.defineCohort(name, startDate, endDate, users);
}

/**
 * Calculate cohort retention
 * @param {string} cohortName - Cohort name
 * @param {Array} periods - Periods to analyze
 * @param {string} cwd - Working directory
 * @returns {Object} Retention data
 */
function calculateRetention(cohortName, periods, cwd) {
  const analyzer = new CohortAnalyzer(cwd);
  return analyzer.calculateRetention(cohortName, periods);
}

module.exports = { CohortAnalyzer, defineCohort, calculateRetention };

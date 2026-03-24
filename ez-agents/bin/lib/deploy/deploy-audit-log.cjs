/**
 * Deploy Audit Log — Writes deploy audit logs
 * Logs to .planning/logs/deploy-{timestamp}.json
 */

const fs = require('fs');
const path = require('path');

class DeployAuditLog {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.logsDir = path.join(this.cwd, '.planning', 'logs');
  }

  /**
   * Write deploy audit log
   * @param {Object} deployDetails - Deploy details to log
   * @returns {string} Path to written log
   */
  writeAuditLog(deployDetails) {
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `deploy-${timestamp}.json`;
    const logPath = path.join(this.logsDir, filename);

    const logEntry = {
      timestamp: new Date().toISOString(),
      ...deployDetails
    };

    fs.writeFileSync(logPath, JSON.stringify(logEntry, null, 2), 'utf8');
    return logPath;
  }

  /**
   * Read deploy audit log
   * @param {string} filename - Log filename
   * @returns {Object} Log entry
   */
  readAuditLog(filename) {
    const logPath = path.join(this.logsDir, filename);
    if (!fs.existsSync(logPath)) return null;
    return JSON.parse(fs.readFileSync(logPath, 'utf8'));
  }

  /**
   * List all deploy audit logs
   * @returns {Array} Array of log filenames
   */
  listAuditLogs() {
    if (!fs.existsSync(this.logsDir)) return [];
    return fs.readdirSync(this.logsDir).filter(f => f.startsWith('deploy-') && f.endsWith('.json'));
  }
}

/**
 * Write deploy audit log
 * @param {Object} deployDetails - Deploy details
 * @param {string} cwd - Working directory
 * @returns {string} Path to written log
 */
function writeAuditLog(deployDetails, cwd) {
  const logger = new DeployAuditLog(cwd);
  return logger.writeAuditLog(deployDetails);
}

module.exports = { DeployAuditLog, writeAuditLog };

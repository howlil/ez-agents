#!/usr/bin/env node

/**
 * EZ Security Scan Runner — Secure scanning orchestration with safe defaults
 *
 * Provides security scanning with:
 * - Baseline (passive) mode as default - non-destructive automated scanning
 * - Active mode requires explicit opt-in via active: true
 * - OWASP ZAP baseline scan integration
 * - Structured result output with report paths
 *
 * Usage:
 *   const { runSecurityScan } = require('./security-scan-runner.cjs');
 *   const result = runSecurityScan({ target: 'http://localhost:3000' });
 */

const path = require('path');
const fs = require('fs');
const { SecurityScanError } = require('./security-errors.cjs');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Generate timestamp for report filename
 * @returns {string} - Timestamp string
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Ensure report directory exists
 * @returns {string} - Report directory path
 */
function ensureReportDir() {
  const reportDir = path.join(process.cwd(), '.planning', 'security', 'scans');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  return reportDir;
}

/**
 * Build baseline scan command (non-destructive)
 * @param {string} target - Target URL
 * @returns {string} - ZAP baseline command
 */
function buildBaselineCommand(target) {
  // OWASP ZAP baseline scan - passive, non-destructive
  // Reference: https://www.zaproxy.org/docs/docker/baseline-scan/
  return `zap-baseline.py -t ${target} -r report-${getTimestamp()}.html`;
}

/**
 * Build active scan command (requires opt-in)
 * @param {string} target - Target URL
 * @returns {string} - ZAP active scan command
 */
function buildActiveCommand(target) {
  // OWASP ZAP active scan - includes attack vectors
  return `zap-full-scan.py -t ${target} -r report-${getTimestamp()}.html --attack`;
}

/**
 * Run security scan with specified options
 * @param {Object} options - Scan options
 * @param {string} options.target - Target URL to scan
 * @param {'baseline'|'active'} options.mode - Scan mode (default: 'baseline')
 * @param {boolean} options.active - Explicit opt-in for active scanning
 * @returns {Object} - Scan result with mode, target, command, reportPath, ok
 * @throws {SecurityScanError} - If target missing or invalid mode
 */
function runSecurityScan(options = {}) {
  const { target, mode, active = false } = options;

  // Validate target
  if (!target) {
    throw new SecurityScanError('Target URL is required', {
      code: 'MISSING_TARGET',
      provided: options
    });
  }

  // Determine mode - baseline is default, active requires explicit opt-in
  let scanMode = mode || 'baseline';
  if (active === true) {
    scanMode = 'active';
  }

  // Validate mode
  if (!['baseline', 'active'].includes(scanMode)) {
    throw new SecurityScanError(`Invalid scan mode: ${scanMode}. Must be 'baseline' or 'active'`, {
      code: 'INVALID_MODE',
      provided: scanMode
    });
  }

  // Build command based on mode
  let command;
  if (scanMode === 'active') {
    command = buildActiveCommand(target);
  } else {
    command = buildBaselineCommand(target);
  }

  // Generate report path
  const reportDir = ensureReportDir();
  const reportPath = path.join(reportDir, `report-${scanMode}-${getTimestamp()}.html`);

  const result = {
    ok: true,
    mode: scanMode,
    target,
    command,
    reportPath,
    isDestructive: scanMode === 'active',
    requiresApproval: scanMode === 'active'
  };

  logger.info('Security scan configured', {
    mode: scanMode,
    target,
    isDestructive: scanMode === 'active',
    timestamp: new Date().toISOString()
  });

  return result;
}

module.exports = {
  runSecurityScan
};

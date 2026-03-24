#!/usr/bin/env node

/**
 * Error Registry — Central error code and severity registry
 *
 * Provides:
 * - Standardized error codes with prefixes
 * - Severity levels for all errors
 * - Lookup functions for error metadata
 *
 * Error Code Scheme:
 *   ERR_<CATEGORY>_<NAME>
 *
 * Categories:
 *   SESSION, CONTEXT, SECURITY, GIT, QUALITY, PHASE, AGENT, RCA, CACHE, GATE
 */

const SEVERITY = {
  CRITICAL: 'critical',  // System unusable — immediate exit
  ERROR: 'error',        // Operation failed — retry or exit
  WARNING: 'warning',    // Recoverable issue — continue with warning
  INFO: 'info',          // Normal operation — informational
  DEBUG: 'debug'         // Detailed tracing — development only
};

const ERROR_CODES = {
  SESSION: {
    NOT_FOUND: { code: 'ERR_SESSION_NOT_FOUND', severity: SEVERITY.ERROR },
    CHAIN_BROKEN: { code: 'ERR_SESSION_CHAIN_BROKEN', severity: SEVERITY.CRITICAL },
    EXPORT_FAILED: { code: 'ERR_SESSION_EXPORT_FAILED', severity: SEVERITY.ERROR },
    IMPORT_FAILED: { code: 'ERR_SESSION_IMPORT_FAILED', severity: SEVERITY.ERROR },
    CORRUPTED: { code: 'ERR_SESSION_CORRUPTED', severity: SEVERITY.CRITICAL },
    VERSION_MISMATCH: { code: 'ERR_SESSION_VERSION_MISMATCH', severity: SEVERITY.ERROR }
  },

  CONTEXT: {
    ACCESS_DENIED: { code: 'ERR_CONTEXT_ACCESS_DENIED', severity: SEVERITY.ERROR },
    URL_FETCH_FAILED: { code: 'ERR_CONTEXT_URL_FETCH_FAILED', severity: SEVERITY.ERROR },
    FILE_ACCESS_FAILED: { code: 'ERR_CONTEXT_FILE_ACCESS_FAILED', severity: SEVERITY.ERROR },
    SECURITY_SCAN_FAILED: { code: 'ERR_CONTEXT_SECURITY_SCAN_FAILED', severity: SEVERITY.CRITICAL },
    XSS_DETECTED: { code: 'ERR_CONTEXT_XSS_DETECTED', severity: SEVERITY.CRITICAL },
    TIMEOUT: { code: 'ERR_CONTEXT_TIMEOUT', severity: SEVERITY.WARNING }
  },

  SECURITY: {
    SCAN_FAILED: { code: 'ERR_SECURITY_SCAN_FAILED', severity: SEVERITY.ERROR },
    PROVIDER_ERROR: { code: 'ERR_SECURITY_PROVIDER_ERROR', severity: SEVERITY.CRITICAL },
    COMPLIANCE_FAILED: { code: 'ERR_SECURITY_COMPLIANCE_FAILED', severity: SEVERITY.ERROR },
    AUDIT_FAILED: { code: 'ERR_SECURITY_AUDIT_FAILED', severity: SEVERITY.ERROR },
    SECRET_DETECTED: { code: 'ERR_SECURITY_SECRET_DETECTED', severity: SEVERITY.CRITICAL }
  },

  GIT: {
    BRANCH_EXISTS: { code: 'ERR_GIT_BRANCH_EXISTS', severity: SEVERITY.ERROR },
    BRANCH_NOT_FOUND: { code: 'ERR_GIT_BRANCH_NOT_FOUND', severity: SEVERITY.ERROR },
    MERGE_CONFLICT: { code: 'ERR_GIT_MERGE_CONFLICT', severity: SEVERITY.ERROR },
    VALIDATION_FAILED: { code: 'ERR_GIT_VALIDATION_FAILED', severity: SEVERITY.ERROR },
    COMMIT_FAILED: { code: 'ERR_GIT_COMMIT_FAILED', severity: SEVERITY.ERROR },
    PUSH_FAILED: { code: 'ERR_GIT_PUSH_FAILED', severity: SEVERITY.ERROR }
  },

  QUALITY: {
    GATE_FAILED: { code: 'ERR_QUALITY_GATE_FAILED', severity: SEVERITY.ERROR },
    DEGRADATION_DETECTED: { code: 'ERR_QUALITY_DEGRADATION_DETECTED', severity: SEVERITY.WARNING },
    METRICS_ERROR: { code: 'ERR_QUALITY_METRICS_ERROR', severity: SEVERITY.ERROR },
    REPORT_FAILED: { code: 'ERR_QUALITY_REPORT_FAILED', severity: SEVERITY.ERROR }
  },

  PHASE: {
    NOT_FOUND: { code: 'ERR_PHASE_NOT_FOUND', severity: SEVERITY.ERROR },
    LOCKED: { code: 'ERR_PHASE_LOCKED', severity: SEVERITY.ERROR },
    LOCK_ACQUISITION_FAILED: { code: 'ERR_PHASE_LOCK_ACQUISITION_FAILED', severity: SEVERITY.ERROR },
    INVALID_STATE: { code: 'ERR_PHASE_INVALID_STATE', severity: SEVERITY.ERROR },
    TASK_FAILED: { code: 'ERR_PHASE_TASK_FAILED', severity: SEVERITY.ERROR }
  },

  AGENT: {
    NOT_FOUND: { code: 'ERR_AGENT_NOT_FOUND', severity: SEVERITY.ERROR },
    ASSIGNMENT_FAILED: { code: 'ERR_AGENT_ASSIGNMENT_FAILED', severity: SEVERITY.ERROR },
    TIMEOUT: { code: 'ERR_AGENT_TIMEOUT', severity: SEVERITY.ERROR },
    NESTING_EXCEEDED: { code: 'ERR_AGENT_NESTING_EXCEEDED', severity: SEVERITY.CRITICAL }
  },

  RCA: {
    ANALYSIS_FAILED: { code: 'ERR_RCA_ANALYSIS_FAILED', severity: SEVERITY.ERROR },
    CONTEXT_CAPTURE_FAILED: { code: 'ERR_RCA_CONTEXT_CAPTURE_FAILED', severity: SEVERITY.WARNING },
    PATTERN_NOT_FOUND: { code: 'ERR_RCA_PATTERN_NOT_FOUND', severity: SEVERITY.INFO }
  },

  CACHE: {
    RECORD_FAILED: { code: 'ERR_CACHE_RECORD_FAILED', severity: SEVERITY.ERROR },
    LOAD_FAILED: { code: 'ERR_CACHE_LOAD_FAILED', severity: SEVERITY.WARNING },
    SAVE_FAILED: { code: 'ERR_CACHE_SAVE_FAILED', severity: SEVERITY.WARNING },
    CORRUPTED: { code: 'ERR_CACHE_CORRUPTED', severity: SEVERITY.ERROR }
  },

  GATE: {
    NOT_REGISTERED: { code: 'ERR_GATE_NOT_REGISTERED', severity: SEVERITY.ERROR },
    EXECUTION_FAILED: { code: 'ERR_GATE_EXECUTION_FAILED', severity: SEVERITY.ERROR },
    VALIDATION_FAILED: { code: 'ERR_GATE_VALIDATION_FAILED', severity: SEVERITY.ERROR },
    BYPASS_REQUIRES_REASON: { code: 'ERR_GATE_BYPASS_REQUIRES_REASON', severity: SEVERITY.ERROR }
  },

  // Generic fallback
  UNKNOWN: { code: 'ERR_UNKNOWN', severity: SEVERITY.ERROR }
};

/**
 * Get error code metadata
 * @param {string} category - Error category (SESSION, CONTEXT, etc.)
 * @param {string} name - Error name (NOT_FOUND, CHAIN_BROKEN, etc.)
 * @returns {{code: string, severity: string}|null} Error metadata or null
 */
function getErrorCode(category, name) {
  return ERROR_CODES[category]?.[name] || null;
}

/**
 * Get all error codes
 * @returns {Object} All error codes by category
 */
function getAllCodes() {
  return ERROR_CODES;
}

/**
 * Get severity level by name
 * @param {string} name - Severity name (CRITICAL, ERROR, etc.)
 * @returns {string|null} Severity value or null
 */
function getSeverity(name) {
  return SEVERITY[name] || null;
}

/**
 * Get all severity levels
 * @returns {Object} All severity levels
 */
function getAllSeverities() {
  return SEVERITY;
}

/**
 * Lookup error by code string
 * @param {string} codeString - Full error code (e.g., 'ERR_SESSION_NOT_FOUND')
 * @returns {{category: string, name: string, code: string, severity: string}|null}
 */
function lookupByCode(codeString) {
  for (const [category, errors] of Object.entries(ERROR_CODES)) {
    for (const [name, data] of Object.entries(errors)) {
      if (data.code === codeString) {
        return { category, name, ...data };
      }
    }
  }
  return null;
}

/**
 * Validate error code format
 * @param {string} code - Error code to validate
 * @returns {boolean} True if valid format
 */
function isValidCode(code) {
  return lookupByCode(code) !== null;
}

module.exports = {
  SEVERITY,
  ERROR_CODES,
  getErrorCode,
  getAllCodes,
  getSeverity,
  getAllSeverities,
  lookupByCode,
  isValidCode
};

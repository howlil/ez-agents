#!/usr/bin/env node

/**
 * EZ Security Audit Log — Event validation and file verification
 *
 * Provides audit logging with:
 * - Required fields: timestamp, actor, action, resource, outcome
 * - Sensitive data detection (token, secret, password, apiKey)
 * - File verification with invalid line tracking
 * - Redaction enforcement
 *
 * Usage:
 *   const { validateAuditEvent, verifyAuditLogFile } = require('./security-audit-log.cjs');
 *   const result = validateAuditEvent({ timestamp, actor, action, resource, outcome });
 */

const fs = require('fs');
const path = require('path');
const { SecurityAuditError } = require('./security-errors.cjs');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Patterns for detecting sensitive data
 */
const SENSITIVE_PATTERNS = [
  { key: 'token', pattern: /token/i },
  { key: 'secret', pattern: /secret/i },
  { key: 'password', pattern: /password/i },
  { key: 'apiKey', pattern: /api[_-]?key/i },
  { key: 'apikey', pattern: /apikey/i },
  { key: 'bearer', pattern: /bearer/i },
  { key: 'private[_-]?key', pattern: /private[_-]?key/i },
  { key: 'credential', pattern: /credential/i }
];

/**
 * Required fields for audit events
 */
const REQUIRED_FIELDS = ['timestamp', 'actor', 'action', 'resource', 'outcome'];

/**
 * Validate an audit event for required fields and sensitive data
 * @param {Object} event - Audit event to validate
 * @returns {Object} - Validation result with valid, errors
 */
function validateAuditEvent(event) {
  const errors = [];

  // Check if event is provided
  if (!event || typeof event !== 'object') {
    return {
      valid: false,
      errors: ['Event must be an object']
    };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in event)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check for sensitive data in event
  const sensitiveData = findSensitiveData(event);
  if (sensitiveData.length > 0) {
    errors.push(`Event contains sensitive data: ${sensitiveData.join(', ')}`);
  }

  const result = {
    valid: errors.length === 0,
    errors,
    event: errors.length === 0 ? event : null,
    sensitiveDataFound: sensitiveData.length > 0,
    sensitiveFields: sensitiveData
  };

  logger.debug('Audit event validated', {
    valid: result.valid,
    errorCount: errors.length,
    sensitiveDataFound: result.sensitiveDataFound,
    timestamp: new Date().toISOString()
  });

  return result;
}

/**
 * Recursively find sensitive data in an object
 * @param {Object} obj - Object to scan
 * @param {string} parentKey - Parent key for nested objects
 * @param {boolean} isEnvelope - Whether we're in the envelope (timestamp, actor, etc.)
 * @returns {string[]} - Array of sensitive field names found
 */
function findSensitiveData(obj, parentKey = '', isEnvelope = true) {
  const sensitiveFields = [];

  if (!obj || typeof obj !== 'object') {
    return sensitiveFields;
  }

  // Envelope fields that should not be checked for sensitive values
  const ENVELOPE_FIELDS = new Set(['timestamp', 'actor', 'action', 'resource', 'outcome', 'correlation_id', 'source_ip', 'user_agent']);

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    const isEnvelopeField = isEnvelope && ENVELOPE_FIELDS.has(key);

    // Check if key matches sensitive patterns (always check keys)
    for (const { key: patternName, pattern } of SENSITIVE_PATTERNS) {
      if (pattern.test(key)) {
        sensitiveFields.push(fullKey);
        break;
      }
    }

    // Check if value contains sensitive patterns (only for non-envelope fields)
    if (typeof value === 'string' && !isEnvelopeField) {
      for (const { key: patternName, pattern } of SENSITIVE_PATTERNS) {
        if (pattern.test(value)) {
          sensitiveFields.push(fullKey);
          break;
        }
      }
    }

    // Recursively check nested objects
    if (typeof value === 'object' && value !== null) {
      // Nested objects are not envelope fields
      const nestedSensitive = findSensitiveData(value, fullKey, false);
      sensitiveFields.push(...nestedSensitive);
    }
  }

  return sensitiveFields;
}

/**
 * Verify an audit log file
 * @param {string} filePath - Path to the audit log file
 * @returns {Object} - Verification result with ok, invalidLines, errors
 */
function verifyAuditLogFile(filePath) {
  const result = {
    ok: false,
    invalidLines: [],
    errors: [],
    totalLines: 0,
    validLines: 0
  };

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    result.errors.push(`File not found: ${filePath}`);
    return result;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    result.totalLines = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      // Try to parse as JSON
      let event;
      try {
        event = JSON.parse(line);
      } catch (parseErr) {
        result.invalidLines.push({
          line: lineNum,
          content: line.substring(0, 100),
          error: `Invalid JSON: ${parseErr.message}`
        });
        continue;
      }

      // Validate the event
      const validation = validateAuditEvent(event);
      if (!validation.valid) {
        result.invalidLines.push({
          line: lineNum,
          content: line.substring(0, 100),
          errors: validation.errors
        });
      } else {
        result.validLines++;
      }
    }

    // Determine overall status
    result.ok = result.errors.length === 0 && result.invalidLines.length === 0;

    logger.info('Audit log file verified', {
      filePath,
      totalLines: result.totalLines,
      validLines: result.validLines,
      invalidLines: result.invalidLines.length,
      ok: result.ok,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    result.errors.push(`Failed to read file: ${err.message}`);
    logger.error('Failed to verify audit log file', {
      filePath,
      error: err.message
    });
  }

  return result;
}

/**
 * Redact sensitive data from an object (for safe logging)
 * @param {Object} obj - Object to redact
 * @returns {Object} - Redacted object
 */
function redactSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const redacted = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if key is sensitive
    const isSensitive = SENSITIVE_PATTERNS.some(({ pattern }) => pattern.test(key));
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

module.exports = {
  validateAuditEvent,
  verifyAuditLogFile,
  redactSensitiveData,
  REQUIRED_FIELDS,
  SENSITIVE_PATTERNS
};

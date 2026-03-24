#!/usr/bin/env node

/**
 * Context Access Error Classes
 *
 * Provides structured error handling for context access operations
 * including file access, URL fetching, and security scanning.
 */

const { SEVERITY, getErrorCode } = require('./error-registry.cjs');

class ContextAccessError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ContextAccessError';
    this.code = options.code || getErrorCode('CONTEXT', 'ACCESS_DENIED')?.code || 'CONTEXT_ACCESS_ERROR';
    this.severity = options.severity || getErrorCode('CONTEXT', 'ACCESS_DENIED')?.severity || SEVERITY.ERROR;
    this.details = options.details || {};
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, ContextAccessError);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

class URLFetchError extends ContextAccessError {
  constructor(url, reason, options = {}) {
    super(`Failed to fetch URL: ${reason}`, {
      code: getErrorCode('CONTEXT', 'URL_FETCH_FAILED')?.code || 'URL_FETCH_ERROR',
      severity: SEVERITY.ERROR,
      details: { url, reason, ...options.details }
    });
    this.name = 'URLFetchError';
    this.url = url;
    this.reason = reason;
  }
}

class FileAccessError extends ContextAccessError {
  constructor(path, reason, options = {}) {
    super(`Failed to access file: ${reason}`, {
      code: getErrorCode('CONTEXT', 'FILE_ACCESS_FAILED')?.code || 'FILE_ACCESS_ERROR',
      severity: SEVERITY.ERROR,
      details: { path, reason, ...options.details }
    });
    this.name = 'FileAccessError';
    this.path = path;
    this.reason = reason;
  }
}

class SecurityScanError extends ContextAccessError {
  constructor(findings, options = {}) {
    super(`Security scan failed: ${findings.length} issue(s) detected`, {
      code: getErrorCode('CONTEXT', 'SECURITY_SCAN_FAILED')?.code || 'SECURITY_SCAN_ERROR',
      severity: SEVERITY.CRITICAL,
      details: { findings, ...options.details }
    });
    this.name = 'SecurityScanError';
    this.findings = findings;
  }
}

module.exports = {
  ContextAccessError,
  URLFetchError,
  FileAccessError,
  SecurityScanError
};

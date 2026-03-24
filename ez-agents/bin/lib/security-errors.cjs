#!/usr/bin/env node

/**
 * Security Operations Error Classes
 *
 * Provides structured error handling for security operations
 */

class SecurityOpsError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'SecurityOpsError';
    this.context = context;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, SecurityOpsError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp
    };
  }
}

class SecurityScanError extends SecurityOpsError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'SecurityScanError';
  }
}

class SecurityProviderError extends SecurityOpsError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'SecurityProviderError';
  }
}

class SecurityComplianceError extends SecurityOpsError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'SecurityComplianceError';
  }
}

class SecurityAuditError extends SecurityOpsError {
  constructor(message, context = {}) {
    super(message, context);
    this.name = 'SecurityAuditError';
  }
}

module.exports = {
  SecurityOpsError,
  SecurityScanError,
  SecurityProviderError,
  SecurityComplianceError,
  SecurityAuditError
};

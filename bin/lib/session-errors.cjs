#!/usr/bin/env node

/**
 * Session Error Classes
 *
 * Provides structured error handling for session operations
 */

class SessionError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'SessionError';
    this.code = options.code || 'SESSION_ERROR';
    this.details = options.details || {};
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, SessionError);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

class SessionNotFoundError extends SessionError {
  constructor(sessionId, options = {}) {
    super(`Session '${sessionId}' not found`, {
      code: 'SESSION_NOT_FOUND',
      details: { sessionId, ...options.details }
    });
    this.name = 'SessionNotFoundError';
    this.sessionId = sessionId;
  }
}

class SessionChainError extends SessionError {
  constructor(message, chain = [], options = {}) {
    super(message, {
      code: 'SESSION_CHAIN_ERROR',
      details: { chain, ...options.details }
    });
    this.name = 'SessionChainError';
    this.chain = chain;
  }
}

class SessionExportError extends SessionError {
  constructor(format, reason, options = {}) {
    super(`Export failed for format '${format}': ${reason}`, {
      code: 'SESSION_EXPORT_ERROR',
      details: { format, reason, ...options.details }
    });
    this.name = 'SessionExportError';
    this.format = format;
    this.reason = reason;
  }
}

class SessionImportError extends SessionError {
  constructor(message, validationErrors = [], options = {}) {
    super(message, {
      code: 'SESSION_IMPORT_ERROR',
      details: { validationErrors, ...options.details }
    });
    this.name = 'SessionImportError';
    this.validationErrors = validationErrors;
  }
}

module.exports = {
  SessionError,
  SessionNotFoundError,
  SessionChainError,
  SessionExportError,
  SessionImportError
};

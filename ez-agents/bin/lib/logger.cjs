#!/usr/bin/env node

/**
 * EZ Logger — Centralized logging module for EZ workflow
 *
 * Provides structured logging with levels (ERROR, WARN, INFO, DEBUG)
 * Logs to console only (no file logging)
 * Replaces silent catch {} blocks with proper error logging
 *
 * Usage:
 *   const Logger = require('./logger.cjs');
 *   const logger = new Logger();
 *   logger.error('Something failed', { context: 'details' });
 */

class Logger {
  /**
   * Create a Logger instance
   */
  constructor() {
    // No file logging - console only
  }

  /**
   * Write a log entry to console
   * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   */
  log(level, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      pid: process.pid
    };

    // Always output to console
    if (level === 'ERROR') {
      console.error(`[EZ ${level}] ${message}`);
    } else if (level === 'WARN') {
      console.warn(`[EZ ${level}] ${message}`);
    } else if (process.env.DEBUG === 'ez-agents') {
      // Only output INFO/DEBUG in debug mode
      console.log(`[EZ ${level}] ${message}`);
    }
  }

  /**
   * Log an ERROR level message
   * @param {string} msg - Error message
   * @param {Object} ctx - Additional context
   */
  error(msg, ctx) {
    this.log('ERROR', msg, ctx);
  }

  /**
   * Log a WARN level message
   * @param {string} msg - Warning message
   * @param {Object} ctx - Additional context
   */
  warn(msg, ctx) {
    this.log('WARN', msg, ctx);
  }

  /**
   * Log an INFO level message
   * @param {string} msg - Info message
   * @param {Object} ctx - Additional context
   */
  info(msg, ctx) {
    this.log('INFO', msg, ctx);
  }

  /**
   * Log a DEBUG level message
   * @param {string} msg - Debug message
   * @param {Object} ctx - Additional context
   */
  debug(msg, ctx) {
    this.log('DEBUG', msg, ctx);
  }

  /**
   * Get log file path (returns null - no file logging)
   * @returns {null} - Always null
   */
  getLogFile() {
    return null;
  }
}

// Singleton instance for default usage
const defaultLogger = new Logger();

module.exports = Logger;
module.exports.defaultLogger = defaultLogger;

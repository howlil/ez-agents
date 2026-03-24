#!/usr/bin/env node

/**
 * EZ Lock Logger
 *
 * Dedicated logging for phase lock operations.
 * Logs to console only (no file logging).
 *
 * Features:
 * - Structured logging
 * - Log levels: INFO, WARN, ERROR
 * - Automatic timestamp and context
 *
 * Usage:
 *   const LockLogger = require('./lock-logger.cjs');
 *   const lockLogger = new LockLogger();
 *
 *   lockLogger.log('INFO', 'acquire', { phase: '47', agent_id: 'agent-1', result: 'success' });
 *   lockLogger.log('WARN', 'conflict', { phase: '47', holder_agent: 'agent-2' });
 */

const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * LockLogger class for lock operation logging.
 */
class LockLogger {
  /**
   * Creates a new LockLogger instance.
   */
  constructor() {
    // Console only - no file logging
  }

  /**
   * Log a lock operation.
   * @param {string} level - Log level: INFO, WARN, ERROR
   * @param {string} operation - Operation type: acquire, release, heartbeat, conflict, stale
   * @param {Object} data - Operation data
   */
  log(level, operation, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      operation,
      ...data
    };

    // Log to console
    if (level === 'ERROR') {
      console.error(`[EZ LOCK] ${JSON.stringify(entry)}`);
    } else if (level === 'WARN') {
      console.warn(`[EZ LOCK] ${JSON.stringify(entry)}`);
    } else if (process.env.DEBUG === 'ez-agents') {
      console.log(`[EZ LOCK] ${JSON.stringify(entry)}`);
    }
  }

  /**
   * Log lock acquire.
   * @param {string} phase - Phase number
   * @param {string} agentId - Agent identifier
   * @param {Object} result - Acquire result
   */
  logAcquire(phase, agentId, result) {
    const data = {
      phase,
      agent_id: agentId,
      result: result.acquired ? 'success' : (result.conflict ? 'conflict' : 'error'),
      message: result.message
    };

    if (result.lockInfo) {
      data.holder_agent = result.lockInfo.agent_id;
      data.holder_name = result.lockInfo.agent_name;
      data.expires_at = result.expiresAt;
    }

    const level = result.acquired ? 'INFO' : (result.conflict ? 'WARN' : 'ERROR');
    this.log(level, 'acquire', data);
  }

  /**
   * Log lock release.
   * @param {string} phase - Phase number
   * @param {string} agentId - Agent identifier
   * @param {Object} result - Release result
   */
  logRelease(phase, agentId, result) {
    const data = {
      phase,
      agent_id: agentId,
      result: result.released ? 'success' : 'error',
      message: result.message
    };

    if (result.lockInfo) {
      data.held_duration_ms = Date.now() - new Date(result.lockInfo.acquired_at).getTime();
    }

    const level = result.released ? 'INFO' : 'ERROR';
    this.log(level, 'release', data);
  }

  /**
   * Log heartbeat.
   * @param {string} phase - Phase number
   * @param {string} agentId - Agent identifier
   * @param {Object} result - Heartbeat result
   */
  logHeartbeat(phase, agentId, result) {
    const data = {
      phase,
      agent_id: agentId,
      result: result.success ? 'success' : 'error',
      message: result.message
    };

    if (result.lockInfo) {
      data.expires_at = result.lockInfo.expires_at;
    }

    const level = result.success ? 'INFO' : 'WARN';
    this.log(level, 'heartbeat', data);
  }

  /**
   * Log stale lock detection.
   * @param {string} phase - Phase number
   * @param {Object} lockInfo - Stale lock info
   */
  logStale(phase, lockInfo) {
    const data = {
      phase,
      previous_agent: lockInfo.agent_id,
      previous_name: lockInfo.agent_name,
      reason: 'expired',
      action: 'auto-release'
    };

    if (lockInfo.expires_at) {
      data.expired_at = lockInfo.expires_at;
    }

    this.log('WARN', 'stale', data);
  }

  /**
   * Log lock status update.
   * @param {number} lockCount - Number of active locks
   * @param {Object} result - Update result
   */
  logStateUpdate(lockCount, result) {
    const data = {
      lock_count: lockCount,
      result: result.updated ? 'success' : 'error'
    };

    if (result.error) {
      data.error = result.error;
    }

    const level = result.updated ? 'INFO' : 'WARN';
    this.log(level, 'state_update', data);
  }

  /**
   * Get log file path (returns null - no file logging).
   * @returns {null} - Always null
   */
  getLogPath() {
    return null;
  }

  /**
   * Read recent log entries (returns empty array - no file logging).
   * @param {number} limit - Number of entries to read
   * @returns {Array<Object>} - Empty array
   */
  readRecent(limit = 100) {
    return [];
  }

  /**
   * Clear log file (no-op - no file logging).
   * @returns {boolean} - Always true
   */
  clear() {
    return true;
  }
}

module.exports = LockLogger;

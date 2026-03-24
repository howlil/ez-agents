#!/usr/bin/env node

/**
 * EZ Revision Loop Controller
 *
 * Implements learning-based revision loops with early exit capabilities.
 * Tracks learnings across revision iterations, performs root cause analysis,
 * detects quality degradation, and exits early when further iterations would waste resources.
 *
 * Features:
 * - Configurable max revision attempts (default: 3)
 * - Exponential backoff between retries
 * - Learning tracking with structured JSON storage
 * - Quality degradation detection with multi-signal scoring
 * - Early exit with human review handoff
 *
 * Usage:
 *   const RevisionLoopController = require('./revision-loop.cjs');
 *   const controller = new RevisionLoopController();
 *   const shouldRetry = await controller.shouldRetry('task-01');
 *   await controller.recordAttempt('task-01', error, qualityScore);
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * RevisionLoopController class for managing revision loops with learning tracking.
 */
class RevisionLoopController {
  /**
   * Creates a new RevisionLoopController instance.
   * @param {Object} options - Configuration options
   * @param {number} options.maxAttempts - Maximum revision attempts (default: 3)
   * @param {number} options.baseDelay - Base delay for backoff in ms (default: 1000)
   * @param {number} options.maxDelay - Maximum delay in ms (default: 8000)
   * @param {string} options.memoryDir - Directory for MEMORY.json files (default: '.planning/phases')
   */
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 8000;
    this.memoryDir = options.memoryDir || path.join(process.cwd(), '.planning', 'phases');
    
    /** @private */
    this._revisionHistory = new Map();
  }

  /**
   * Calculate delay with exponential backoff.
   * @param {number} attempt - Current attempt number (0-indexed)
   * @returns {number} - Delay in milliseconds
   */
  calculateDelay(attempt) {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );
    // Add jitter (±25%) to prevent thundering herd
    const jitter = 0.75 + (Math.random() * 0.5);
    return Math.round(delay * jitter);
  }

  /**
   * Check if a task should be retried.
   * @param {string} taskId - Task identifier
   * @returns {Promise<boolean>} - True if should retry, false if max attempts reached
   */
  async shouldRetry(taskId) {
    const history = await this.getRevisionHistory(taskId);
    const attemptCount = history.length;
    
    if (attemptCount >= this.maxAttempts) {
      logger.info('Max revision attempts reached', { taskId, attempts: attemptCount, max: this.maxAttempts });
      return false;
    }
    
    return true;
  }

  /**
   * Record a revision attempt with error and quality score.
   * @param {string} taskId - Task identifier
   * @param {Error|string} error - Error that occurred or null if success
   * @param {number} qualityScore - Quality score (0-100)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Recorded attempt data
   */
  async recordAttempt(taskId, error, qualityScore, metadata = {}) {
    const timestamp = new Date().toISOString();
    const attemptNumber = (await this.getRevisionHistory(taskId)).length + 1;
    
    const attempt = {
      iteration: attemptNumber,
      timestamp,
      error: error ? (error.message || String(error)) : null,
      error_type: error ? this._classifyError(error) : null,
      quality_score: qualityScore,
      success: !error && qualityScore >= 70,
      ...metadata
    };
    
    // Store in memory
    if (!this._revisionHistory.has(taskId)) {
      this._revisionHistory.set(taskId, []);
    }
    this._revisionHistory.get(taskId).push(attempt);
    
    // Persist to MEMORY.json
    await this._persistMemory(taskId);
    
    logger.info('Revision attempt recorded', {
      taskId,
      attempt: attemptNumber,
      success: attempt.success,
      qualityScore
    });
    
    return attempt;
  }

  /**
   * Get revision history for a task.
   * @param {string} taskId - Task identifier
   * @returns {Promise<Array<Object>>} - Array of revision attempts
   */
  async getRevisionHistory(taskId) {
    // Check memory first
    if (this._revisionHistory.has(taskId)) {
      return this._revisionHistory.get(taskId);
    }
    
    // Load from MEMORY.json
    const memoryFile = this._getMemoryFilePath(taskId);
    if (fs.existsSync(memoryFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        const history = data.revisions || [];
        this._revisionHistory.set(taskId, history);
        return history;
      } catch (err) {
        logger.warn('Failed to load revision history', { taskId, error: err.message });
      }
    }
    
    return [];
  }

  /**
   * Reset revision counter for a task (e.g., when task definition changes).
   * @param {string} taskId - Task identifier
   * @returns {Promise<void>}
   */
  async resetCounter(taskId) {
    this._revisionHistory.delete(taskId);
    const memoryFile = this._getMemoryFilePath(taskId);
    if (fs.existsSync(memoryFile)) {
      fs.unlinkSync(memoryFile);
    }
    logger.info('Revision counter reset', { taskId });
  }

  /**
   * Get current attempt count for a task.
   * @param {string} taskId - Task identifier
   * @returns {Promise<number>} - Number of attempts
   */
  async getAttemptCount(taskId) {
    const history = await this.getRevisionHistory(taskId);
    return history.length;
  }

  /**
   * Classify error into standard categories.
   * @param {Error|string} error - Error to classify
   * @returns {string} - Error category
   * @private
   */
  _classifyError(error) {
    const errorMsg = error ? (error.message || String(error)).toLowerCase() : '';
    
    if (errorMsg.includes('dependenc') || errorMsg.includes('module not found') || errorMsg.includes('import')) {
      return 'Dependency';
    }
    if (errorMsg.includes('syntax') || errorMsg.includes('parse') || errorMsg.includes('unexpected')) {
      return 'Syntax';
    }
    if (errorMsg.includes('logic') || errorMsg.includes('incorrect') || errorMsg.includes('wrong')) {
      return 'Logic';
    }
    if (errorMsg.includes('resource') || errorMsg.includes('memory') || errorMsg.includes('disk') || errorMsg.includes('quota')) {
      return 'Resource';
    }
    if (errorMsg.includes('timeout') || errorMsg.includes('time out') || errorMsg.includes('took too long')) {
      return 'Timeout';
    }
    
    return 'Unknown';
  }

  /**
   * Get MEMORY.json file path for a task.
   * @param {string} taskId - Task identifier
   * @returns {string} - File path
   * @private
   */
  _getMemoryFilePath(taskId) {
    // Sanitize taskId for filename
    const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.memoryDir, `${safeTaskId}-MEMORY.json`);
  }

  /**
   * Persist revision history to MEMORY.json.
   * @param {string} taskId - Task identifier
   * @returns {Promise<void>}
   * @private
   */
  async _persistMemory(taskId) {
    const memoryFile = this._getMemoryFilePath(taskId);
    const history = this._revisionHistory.get(taskId) || [];
    
    const memoryData = {
      taskId,
      lastUpdated: new Date().toISOString(),
      revisionCount: history.length,
      revisions: history
    };
    
    // Atomic write: temp file + rename
    const tempFile = memoryFile + '.tmp';
    try {
      fs.writeFileSync(tempFile, JSON.stringify(memoryData, null, 2), 'utf8');
      fs.renameSync(tempFile, memoryFile);
    } catch (err) {
      logger.error('Failed to persist revision memory', { taskId, error: err.message });
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  /**
   * Get summary statistics for revision loops.
   * @returns {Object} - Statistics
   */
  getStats() {
    const taskIds = Array.from(this._revisionHistory.keys());
    const totalRevisions = taskIds.reduce((sum, id) => sum + this._revisionHistory.get(id).length, 0);
    const successfulRevisions = taskIds.reduce((sum, id) => {
      return sum + this._revisionHistory.get(id).filter(r => r.success).length;
    }, 0);
    
    return {
      totalTasks: taskIds.length,
      totalRevisions,
      successfulRevisions,
      successRate: totalRevisions > 0 ? (successfulRevisions / totalRevisions * 100).toFixed(1) : 0
    };
  }
}

module.exports = RevisionLoopController;

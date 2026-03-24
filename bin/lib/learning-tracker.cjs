#!/usr/bin/env node

/**
 * EZ Learning Tracker
 *
 * Implements structured learning tracking for revision loops.
 * Stores learnings in JSON format with semantic tagging for cross-task search.
 * Preserves learnings across iterations and sessions.
 *
 * Features:
 * - Structured JSON schema for learnings
 * - Task-level MEMORY.json storage
 * - Semantic tagging for cross-task search
 * - Learning persistence across sessions
 *
 * Schema:
 * {
 *   taskId: string,
 *   lastUpdated: ISO8601,
 *   revisionCount: number,
 *   revisions: [
 *     {
 *       iteration: number,
 *       timestamp: ISO8601,
 *       error_type: string,
 *       root_cause: string,
 *       fix_attempted: string,
 *       quality_delta: number,
 *       tags: string[]
 *     }
 *   ]
 * }
 *
 * Usage:
 *   const LearningTracker = require('./learning-tracker.cjs');
 *   const tracker = new LearningTracker();
 *   await tracker.recordLearning('task-01', { error_type: 'Syntax', root_cause: 'Missing semicolon' });
 *   const learnings = await tracker.getLearnings('task-01');
 *   const related = await tracker.searchLearnings('Syntax');
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * LearningTracker class for managing revision learnings.
 */
class LearningTracker {
  /**
   * Creates a new LearningTracker instance.
   * @param {Object} options - Configuration options
   * @param {string} options.memoryDir - Directory for MEMORY.json files (default: '.planning/phases')
   */
  constructor(options = {}) {
    this.memoryDir = options.memoryDir || path.join(process.cwd(), '.planning', 'phases');
    
    /** @private */
    this._learnings = new Map();
    
    // Ensure memory directory exists
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  /**
   * Record a learning entry for a task.
   * @param {string} taskId - Task identifier
   * @param {Object} learning - Learning data
   * @param {number} learning.iteration - Iteration number
   * @param {string} learning.error_type - Error category (Dependency, Syntax, Logic, Resource, Timeout)
   * @param {string} learning.root_cause - Root cause analysis result
   * @param {string} learning.fix_attempted - Fix that was tried
   * @param {number} learning.quality_delta - Quality score change from previous iteration
   * @param {string[]} learning.tags - Semantic tags for search
   * @returns {Promise<Object>} - Recorded learning data
   */
  async recordLearning(taskId, learning) {
    const timestamp = new Date().toISOString();
    
    const learningEntry = {
      iteration: learning.iteration || 1,
      timestamp,
      error_type: learning.error_type || 'Unknown',
      root_cause: learning.root_cause || '',
      fix_attempted: learning.fix_attempted || '',
      quality_delta: learning.quality_delta || 0,
      tags: learning.tags || this._generateTags(learning),
      success: learning.success || false
    };
    
    // Store in memory
    if (!this._learnings.has(taskId)) {
      this._learnings.set(taskId, {
        taskId,
        lastUpdated: timestamp,
        revisionCount: 0,
        revisions: []
      });
    }
    
    const taskLearnings = this._learnings.get(taskId);
    taskLearnings.revisions.push(learningEntry);
    taskLearnings.revisionCount = taskLearnings.revisions.length;
    taskLearnings.lastUpdated = timestamp;
    
    // Persist to MEMORY.json
    await this._persistMemory(taskId);
    
    logger.info('Learning recorded', {
      taskId,
      iteration: learningEntry.iteration,
      errorType: learningEntry.error_type,
      rootCause: learningEntry.root_cause
    });
    
    return learningEntry;
  }

  /**
   * Get all learnings for a task.
   * @param {string} taskId - Task identifier
   * @returns {Promise<Object>} - Task learnings with all revisions
   */
  async getLearnings(taskId) {
    // Check memory first
    if (this._learnings.has(taskId)) {
      return this._learnings.get(taskId);
    }
    
    // Load from MEMORY.json
    const memoryFile = this._getMemoryFilePath(taskId);
    if (fs.existsSync(memoryFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        this._learnings.set(taskId, data);
        return data;
      } catch (err) {
        logger.warn('Failed to load learnings', { taskId, error: err.message });
      }
    }
    
    return { taskId, revisionCount: 0, revisions: [] };
  }

  /**
   * Search learnings across all tasks by error category or tags.
   * @param {string} query - Search query (error type, tag, or keyword)
   * @param {Object} options - Search options
   * @param {number} options.limit - Maximum results (default: 10)
   * @returns {Promise<Array<Object>>} - Matching learnings with context
   */
  async searchLearnings(query, options = {}) {
    const limit = options.limit || 10;
    const queryLower = query.toLowerCase();
    const results = [];
    
    // Load all MEMORY.json files
    const files = fs.readdirSync(this.memoryDir)
      .filter(f => f.endsWith('-MEMORY.json'));
    
    for (const file of files) {
      const memoryFile = path.join(this.memoryDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        const taskId = data.taskId;
        
        // Search in revisions
        for (const revision of data.revisions || []) {
          const matchScore = this._calculateMatchScore(revision, queryLower);
          
          if (matchScore > 0) {
            results.push({
              taskId,
              iteration: revision.iteration,
              error_type: revision.error_type,
              root_cause: revision.root_cause,
              fix_attempted: revision.fix_attempted,
              tags: revision.tags,
              matchScore,
              timestamp: revision.timestamp
            });
          }
        }
      } catch (err) {
        logger.warn('Failed to read learning file during search', { file, error: err.message });
      }
    }
    
    // Sort by match score and limit results
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results.slice(0, limit);
  }

  /**
   * Get learnings by error category.
   * @param {string} category - Error category (Dependency, Syntax, Logic, Resource, Timeout)
   * @param {number} limit - Maximum results
   * @returns {Promise<Array<Object>>} - Matching learnings
   */
  async getLearningsByCategory(category, limit = 10) {
    return this.searchLearnings(category, { limit });
  }

  /**
   * Get cross-task patterns from learnings.
   * @returns {Promise<Object>} - Pattern analysis
   */
  async getPatterns() {
    const categoryCount = {};
    const taskFailures = {};
    const commonRootCauses = {};
    
    // Load all MEMORY.json files
    const files = fs.readdirSync(this.memoryDir)
      .filter(f => f.endsWith('-MEMORY.json'));
    
    for (const file of files) {
      const memoryFile = path.join(this.memoryDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
        const taskId = data.taskId;
        taskFailures[taskId] = data.revisionCount;
        
        for (const revision of data.revisions || []) {
          // Count by category
          const category = revision.error_type || 'Unknown';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
          
          // Count root causes
          const rootCause = revision.root_cause || 'Unknown';
          commonRootCauses[rootCause] = (commonRootCauses[rootCause] || 0) + 1;
        }
      } catch (err) {
        // Skip invalid files
      }
    }
    
    // Sort root causes by frequency
    const sortedRootCauses = Object.entries(commonRootCauses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cause, count]) => ({ cause, count }));
    
    return {
      categoryCount,
      taskFailures,
      commonRootCauses: sortedRootCauses,
      totalTasks: files.length,
      totalRevisions: Object.values(categoryCount).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Clear learnings for a task.
   * @param {string} taskId - Task identifier
   * @returns {Promise<void>}
   */
  async clearLearnings(taskId) {
    this._learnings.delete(taskId);
    const memoryFile = this._getMemoryFilePath(taskId);
    if (fs.existsSync(memoryFile)) {
      fs.unlinkSync(memoryFile);
    }
    logger.info('Learnings cleared', { taskId });
  }

  /**
   * Generate semantic tags from learning data.
   * @param {Object} learning - Learning data
   * @returns {string[]} - Generated tags
   * @private
   */
  _generateTags(learning) {
    const tags = [];
    
    // Add error type as tag
    if (learning.error_type) {
      tags.push(learning.error_type.toLowerCase());
    }
    
    // Extract keywords from root cause
    if (learning.root_cause) {
      const keywords = learning.root_cause
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !['this', 'that', 'with', 'from', 'have', 'been'].includes(word));
      tags.push(...keywords.slice(0, 5));
    }
    
    // Add fix-related tags
    if (learning.fix_attempted) {
      if (learning.fix_attempted.toLowerCase().includes('retry')) tags.push('retry');
      if (learning.fix_attempted.toLowerCase().includes('rollback')) tags.push('rollback');
      if (learning.fix_attempted.toLowerCase().includes('workaround')) tags.push('workaround');
    }
    
    return [...new Set(tags)]; // Deduplicate
  }

  /**
   * Calculate match score for search.
   * @param {Object} revision - Revision data
   * @param {string} query - Lowercase search query
   * @returns {number} - Match score
   * @private
   */
  _calculateMatchScore(revision, query) {
    let score = 0;
    
    // Exact error type match (highest priority)
    if (revision.error_type && revision.error_type.toLowerCase() === query) {
      score += 10;
    }
    
    // Error type contains query
    if (revision.error_type && revision.error_type.toLowerCase().includes(query)) {
      score += 5;
    }
    
    // Root cause contains query
    if (revision.root_cause && revision.root_cause.toLowerCase().includes(query)) {
      score += 3;
    }
    
    // Tag match
    if (revision.tags && revision.tags.some(tag => tag.toLowerCase() === query)) {
      score += 5;
    }
    if (revision.tags && revision.tags.some(tag => tag.toLowerCase().includes(query))) {
      score += 2;
    }
    
    // Fix attempted contains query
    if (revision.fix_attempted && revision.fix_attempted.toLowerCase().includes(query)) {
      score += 1;
    }
    
    return score;
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
   * Persist learnings to MEMORY.json.
   * @param {string} taskId - Task identifier
   * @returns {Promise<void>}
   * @private
   */
  async _persistMemory(taskId) {
    const memoryFile = this._getMemoryFilePath(taskId);
    const data = this._learnings.get(taskId);
    
    if (!data) return;
    
    // Atomic write: temp file + rename
    const tempFile = memoryFile + '.tmp';
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, memoryFile);
    } catch (err) {
      logger.error('Failed to persist learnings', { taskId, error: err.message });
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  /**
   * Get summary statistics for learning tracker.
   * @returns {Promise<Object>} - Statistics
   */
  async getStats() {
    const patterns = await this.getPatterns();
    const successCount = Array.from(this._learnings.values())
      .reduce((sum, data) => sum + data.revisions.filter(r => r.success).length, 0);
    const totalRevisions = patterns.totalRevisions;
    
    return {
      totalTasks: patterns.totalTasks,
      totalRevisions,
      successfulRevisions: successCount,
      successRate: totalRevisions > 0 ? (successCount / totalRevisions * 100).toFixed(1) : 0,
      topCategories: patterns.categoryCount,
      topRootCauses: patterns.commonRootCauses.slice(0, 5)
    };
  }
}

module.exports = LearningTracker;

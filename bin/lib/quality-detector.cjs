#!/usr/bin/env node

/**
 * EZ Quality Degradation Detector
 *
 * Implements multi-signal quality scoring and degradation detection.
 * Triggers early exit when quality drops 20% from peak iteration.
 *
 * Features:
 * - Multi-signal metrics: test pass rate, lint errors, diff size, execution time
 * - Weighted composite scoring: Tests (50%), Lint (20%), Diff (20%), Time (10%)
 * - Degradation detection with 20% drop-from-peak threshold
 * - Human review handoff with flagged tasks
 *
 * Usage:
 *   const QualityDetector = require('./quality-detector.cjs');
 *   const detector = new QualityDetector();
 *   const score = await detector.calculateQualityScore(taskId, iteration);
 *   const shouldExit = await detector.shouldExitEarly(taskId);
 *   if (shouldExit) await detector.flagForReview(taskId, 'Quality degradation detected');
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Quality metric weights.
 */
const WEIGHTS = {
  tests: 0.50,      // Test pass rate
  lint: 0.20,       // Lint error count
  diff: 0.20,       // Diff size stability
  time: 0.10        // Execution time
};

/**
 * QualityDetector class for monitoring quality degradation.
 */
class QualityDetector {
  /**
   * Creates a new QualityDetector instance.
   * @param {Object} options - Configuration options
   * @param {number} options.degradationThreshold - Drop from peak to trigger exit (default: 0.20 = 20%)
   * @param {Object} options.weights - Metric weights (default: WEIGHTS)
   * @param {string} options.qualityDir - Directory for quality data (default: '.planning/phases')
   */
  constructor(options = {}) {
    this.degradationThreshold = options.degradationThreshold || 0.20;
    this.weights = options.weights || WEIGHTS;
    this.qualityDir = options.qualityDir || path.join(process.cwd(), '.planning', 'phases');
    
    /** @private */
    this._qualityHistory = new Map();
    this._flaggedTasks = new Map();
  }

  /**
   * Calculate quality score for a task iteration.
   * @param {string} taskId - Task identifier
   * @param {Object} metrics - Quality metrics
   * @param {number} metrics.testPassRate - Test pass rate (0-1)
   * @param {number} metrics.lintErrorCount - Number of lint errors
   * @param {number} metrics.lintErrorMax - Maximum acceptable lint errors
   * @param {number} metrics.diffSize - Lines changed in diff
   * @param {number} metrics.diffSizeBaseline - Baseline diff size for comparison
   * @param {number} metrics.executionTimeMs - Execution time in milliseconds
   * @param {number} metrics.executionTimeMax - Maximum acceptable execution time
   * @returns {Promise<Object>} - Quality score breakdown
   */
  async calculateQualityScore(taskId, metrics) {
    const timestamp = new Date().toISOString();
    
    // Calculate individual metric scores (0-100)
    const testScore = this._calculateTestScore(metrics.testPassRate);
    const lintScore = this._calculateLintScore(metrics.lintErrorCount, metrics.lintErrorMax);
    const diffScore = this._calculateDiffScore(metrics.diffSize, metrics.diffSizeBaseline);
    const timeScore = this._calculateTimeScore(metrics.executionTimeMs, metrics.executionTimeMax);
    
    // Calculate weighted composite score
    const compositeScore = (
      testScore * this.weights.tests +
      lintScore * this.weights.lint +
      diffScore * this.weights.diff +
      timeScore * this.weights.time
    );
    
    const qualityData = {
      timestamp,
      taskId,
      iteration: metrics.iteration || 1,
      scores: {
        test: Math.round(testScore * 100) / 100,
        lint: Math.round(lintScore * 100) / 100,
        diff: Math.round(diffScore * 100) / 100,
        time: Math.round(timeScore * 100) / 100,
        composite: Math.round(compositeScore * 100) / 100
      },
      metrics: {
        testPassRate: metrics.testPassRate,
        lintErrorCount: metrics.lintErrorCount,
        diffSize: metrics.diffSize,
        executionTimeMs: metrics.executionTimeMs
      }
    };
    
    // Store in history
    if (!this._qualityHistory.has(taskId)) {
      this._qualityHistory.set(taskId, []);
    }
    this._qualityHistory.get(taskId).push(qualityData);
    
    logger.info('Quality score calculated', {
      taskId,
      iteration: qualityData.iteration,
      compositeScore: qualityData.scores.composite
    });
    
    return qualityData;
  }

  /**
   * Detect if quality has degraded beyond threshold.
   * @param {string} taskId - Task identifier
   * @returns {Promise<Object>} - Degradation analysis
   */
  async detectDegradation(taskId) {
    const history = await this.getQualityHistory(taskId);
    
    if (history.length < 2) {
      return {
        isDegraded: false,
        reason: 'Insufficient history (need 2+ iterations)'
      };
    }
    
    // Find peak score
    const peakIteration = history.reduce((max, curr) => 
      curr.scores.composite > max.scores.composite ? curr : max
    , history[0]);
    
    const peakScore = peakIteration.scores.composite;
    const currentScore = history[history.length - 1].scores.composite;
    
    // Calculate drop from peak
    const dropFromPeak = peakScore > 0 ? (peakScore - currentScore) / peakScore : 0;
    const isDegraded = dropFromPeak >= this.degradationThreshold;
    
    // Identify which metrics degraded
    const degradedMetrics = this._identifyDegradedMetrics(
      peakIteration.scores,
      history[history.length - 1].scores
    );
    
    const analysis = {
      isDegraded,
      peakScore,
      currentScore,
      dropFromPeak: Math.round(dropFromPeak * 10000) / 100,
      threshold: this.degradationThreshold * 100,
      peakIteration: peakIteration.iteration,
      currentIteration: history[history.length - 1].iteration,
      degradedMetrics,
      recommendation: isDegraded ? 'EXIT_EARLY' : 'CONTINUE'
    };
    
    logger.info('Degradation detection', {
      taskId,
      isDegraded,
      dropFromPeak: analysis.dropFromPeak,
      threshold: analysis.threshold
    });
    
    return analysis;
  }

  /**
   * Check if task should exit early due to quality degradation.
   * @param {string} taskId - Task identifier
   * @returns {Promise<boolean>} - True if should exit early
   */
  async shouldExitEarly(taskId) {
    const analysis = await this.detectDegradation(taskId);
    return analysis.isDegraded;
  }

  /**
   * Flag task for human review due to early exit.
   * @param {string} taskId - Task identifier
   * @param {string} reason - Reason for flagging
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Flag record
   */
  async flagForReview(taskId, reason, context = {}) {
    const timestamp = new Date().toISOString();
    const history = await this.getQualityHistory(taskId);
    const currentScore = history.length > 0 ? history[history.length - 1].scores.composite : null;
    
    const flag = {
      taskId,
      timestamp,
      reason,
      status: 'pending_review',
      qualityScore: currentScore,
      iterationCount: history.length,
      context,
      flagged_by: 'quality-detector'
    };
    
    this._flaggedTasks.set(taskId, flag);
    
    // Persist to file
    await this._persistFlag(flag);
    
    logger.warn('Task flagged for review', {
      taskId,
      reason,
      qualityScore: currentScore
    });
    
    return flag;
  }

  /**
   * Get quality history for a task.
   * @param {string} taskId - Task identifier
   * @returns {Promise<Array<Object>>} - Quality history
   */
  async getQualityHistory(taskId) {
    // Check memory first
    if (this._qualityHistory.has(taskId)) {
      return this._qualityHistory.get(taskId);
    }
    
    // Load from quality.json
    const qualityFile = this._getQualityFilePath(taskId);
    if (fs.existsSync(qualityFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(qualityFile, 'utf8'));
        const history = data.history || [];
        this._qualityHistory.set(taskId, history);
        return history;
      } catch (err) {
        logger.warn('Failed to load quality history', { taskId, error: err.message });
      }
    }
    
    return [];
  }

  /**
   * Get all flagged tasks.
   * @returns {Promise<Array<Object>>} - Flagged tasks
   */
  async getFlaggedTasks() {
    return Array.from(this._flaggedTasks.values());
  }

  /**
   * Clear flag for a task (after review).
   * @param {string} taskId - Task identifier
   * @returns {Promise<void>}
   */
  async clearFlag(taskId) {
    if (this._flaggedTasks.has(taskId)) {
      const flag = this._flaggedTasks.get(taskId);
      flag.status = 'resolved';
      flag.resolvedAt = new Date().toISOString();
      this._flaggedTasks.set(taskId, flag);
      await this._persistFlag(flag);
      logger.info('Flag cleared', { taskId });
    }
  }

  /**
   * Get summary statistics.
   * @returns {Promise<Object>} - Statistics
   */
  async getStats() {
    const taskIds = Array.from(this._qualityHistory.keys());
    const totalIterations = taskIds.reduce((sum, id) => sum + this._qualityHistory.get(id).length, 0);
    const flaggedCount = (await this.getFlaggedTasks()).length;
    
    // Calculate average scores
    let totalComposite = 0;
    let count = 0;
    for (const taskId of taskIds) {
      for (const data of this._qualityHistory.get(taskId)) {
        totalComposite += data.scores.composite;
        count++;
      }
    }
    
    return {
      totalTasks: taskIds.length,
      totalIterations,
      flaggedTasks: flaggedCount,
      averageQualityScore: count > 0 ? Math.round((totalComposite / count) * 100) / 100 : 0,
      degradationThreshold: this.degradationThreshold * 100
    };
  }

  /**
   * Calculate test pass rate score.
   * @param {number} passRate - Test pass rate (0-1)
   * @returns {number} - Score (0-100)
   * @private
   */
  _calculateTestScore(passRate) {
    return Math.max(0, Math.min(100, passRate * 100));
  }

  /**
   * Calculate lint error score.
   * @param {number} errorCount - Number of lint errors
   * @param {number} maxErrors - Maximum acceptable errors
   * @returns {number} - Score (0-100)
   * @private
   */
  _calculateLintScore(errorCount, maxErrors = 10) {
    if (errorCount === 0) return 100;
    const ratio = errorCount / maxErrors;
    return Math.max(0, 100 - (ratio * 100));
  }

  /**
   * Calculate diff size score.
   * @param {number} diffSize - Current diff size
   * @param {number} baseline - Baseline diff size
   * @returns {number} - Score (0-100)
   * @private
   */
  _calculateDiffScore(diffSize, baseline = diffSize) {
    if (baseline === 0) return 100;
    const ratio = diffSize / baseline;
    // Score decreases as diff grows beyond baseline
    if (ratio <= 1) return 100;
    if (ratio >= 3) return 0;
    return 100 - ((ratio - 1) / 2 * 100);
  }

  /**
   * Calculate execution time score.
   * @param {number} timeMs - Execution time in ms
   * @param {number} maxTimeMs - Maximum acceptable time
   * @returns {number} - Score (0-100)
   * @private
   */
  _calculateTimeScore(timeMs, maxTimeMs = 30000) {
    if (timeMs <= 0) return 100;
    const ratio = timeMs / maxTimeMs;
    if (ratio <= 0.5) return 100;
    if (ratio >= 1.5) return 0;
    return 100 - ((ratio - 0.5) * 100);
  }

  /**
   * Identify which metrics have degraded.
   * @param {Object} peakScores - Scores at peak iteration
   * @param {Object} currentScores - Current scores
   * @returns {string[]} - Degraded metric names
   * @private
   */
  _identifyDegradedMetrics(peakScores, currentScores) {
    const degraded = [];
    const threshold = 10; // 10% drop in individual metric
    
    if (peakScores.test - currentScores.test >= threshold) {
      degraded.push('test_pass_rate');
    }
    if (peakScores.lint - currentScores.lint >= threshold) {
      degraded.push('lint_errors');
    }
    if (peakScores.diff - currentScores.diff >= threshold) {
      degraded.push('diff_size');
    }
    if (peakScores.time - currentScores.time >= threshold) {
      degraded.push('execution_time');
    }
    
    return degraded;
  }

  /**
   * Get quality.json file path for a task.
   * @param {string} taskId - Task identifier
   * @returns {string} - File path
   * @private
   */
  _getQualityFilePath(taskId) {
    const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.qualityDir, `${safeTaskId}-QUALITY.json`);
  }

  /**
   * Persist quality history to file.
   * @param {string} taskId - Task identifier
   * @returns {Promise<void>}
   * @private
   */
  async _persistQuality(taskId) {
    const qualityFile = this._getQualityFilePath(taskId);
    const history = this._qualityHistory.get(taskId);
    
    if (!history) return;
    
    const data = {
      taskId,
      lastUpdated: new Date().toISOString(),
      iterationCount: history.length,
      history
    };
    
    const tempFile = qualityFile + '.tmp';
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, qualityFile);
    } catch (err) {
      logger.error('Failed to persist quality data', { taskId, error: err.message });
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  /**
   * Persist flag to file.
   * @param {Object} flag - Flag data
   * @returns {Promise<void>}
   * @private
   */
  async _persistFlag(flag) {
    const flagFile = path.join(this.qualityDir, 'FLAGS.json');
    
    let flags = [];
    if (fs.existsSync(flagFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(flagFile, 'utf8'));
        flags = data.flags || [];
      } catch (err) {
        // Start fresh
      }
    }
    
    // Update or add flag
    const existingIndex = flags.findIndex(f => f.taskId === flag.taskId);
    if (existingIndex >= 0) {
      flags[existingIndex] = flag;
    } else {
      flags.push(flag);
    }
    
    const data = {
      lastUpdated: new Date().toISOString(),
      flags
    };
    
    const tempFile = flagFile + '.tmp';
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, flagFile);
    } catch (err) {
      logger.error('Failed to persist flags', { error: err.message });
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
}

module.exports = QualityDetector;

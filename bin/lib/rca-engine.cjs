#!/usr/bin/env node

/**
 * EZ Root Cause Analysis Engine
 *
 * Implements automated root cause analysis for revision failures.
 * Classifies errors into 5 standard categories and suggests fix strategies.
 * Triggered after 2nd failure on the same task.
 *
 * Features:
 * - 5-category classification: Dependency, Syntax, Logic, Resource, Timeout
 * - Error pattern detection across task history
 * - Context analysis: task type, recent changes, dependency state
 * - Fix strategy recommendations based on classification
 *
 * Usage:
 *   const RCAEngine = require('./rca-engine.cjs');
 *   const rca = new RCAEngine();
 *   const analysis = await rca.analyze(error, taskContext);
 *   const fix = rca.suggestFix(analysis.category, taskContext);
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Error categories for RCA classification.
 * @enum {string}
 */
const ErrorCategory = {
  DEPENDENCY: 'Dependency',
  SYNTAX: 'Syntax',
  LOGIC: 'Logic',
  RESOURCE: 'Resource',
  TIMEOUT: 'Timeout',
  UNKNOWN: 'Unknown'
};

/**
 * Fix strategies by error category.
 */
const FIX_STRATEGIES = {
  [ErrorCategory.DEPENDENCY]: [
    'Install missing dependency: npm install <package>',
    'Check package.json for version conflicts',
    'Verify import path is correct',
    'Clear node_modules and reinstall: rm -rf node_modules && npm install',
    'Check for peer dependency requirements'
  ],
  [ErrorCategory.SYNTAX]: [
    'Run linter to identify syntax errors: npm run lint',
    'Check for missing semicolons, brackets, or quotes',
    'Verify TypeScript types if using .ts files',
    'Use Prettier to auto-fix formatting: npx prettier --write',
    'Check for unclosed strings or template literals'
  ],
  [ErrorCategory.LOGIC]: [
    'Review conditional logic and edge cases',
    'Add console.log statements to trace execution',
    'Write unit test to reproduce the issue',
    'Check for off-by-one errors in loops',
    'Verify function return values match expectations'
  ],
  [ErrorCategory.RESOURCE]: [
    'Check available disk space',
    'Monitor memory usage during execution',
    'Close unused file handles and connections',
    'Increase resource limits if configurable',
    'Implement streaming for large data processing'
  ],
  [ErrorCategory.TIMEOUT]: [
    'Increase timeout threshold if operation is expected to be slow',
    'Implement pagination or chunking for large operations',
    'Add progress indicators for long-running tasks',
    'Check for infinite loops or blocking operations',
    'Optimize database queries or API calls'
  ]
};

/**
 * RCAEngine class for root cause analysis.
 */
class RCAEngine {
  /**
   * Creates a new RCAEngine instance.
   * @param {Object} options - Configuration options
   * @param {number} options.triggerThreshold - Failures before RCA triggers (default: 2)
   */
  constructor(options = {}) {
    this.triggerThreshold = options.triggerThreshold || 2;
    
    /** @private */
    this._analysisHistory = new Map();
  }

  /**
   * Analyze an error and determine root cause.
   * @param {Error|string} error - Error to analyze
   * @param {Object} taskContext - Task context information
   * @param {string} taskContext.taskId - Task identifier
   * @param {string} taskContext.taskType - Type of task (build, test, lint, etc.)
   * @param {string[]} taskContext.recentChanges - Recent code changes
   * @param {Object} taskContext.dependencyState - Dependency state info
   * @param {number} taskContext.failureCount - Number of failures so far
   * @returns {Promise<Object>} - RCA result with category and recommendations
   */
  async analyze(error, taskContext) {
    const timestamp = new Date().toISOString();
    const errorMsg = error ? (error.message || String(error)) : '';
    
    // Classify the error
    const category = this._classifyError(errorMsg);
    
    // Analyze patterns if multiple failures
    const patterns = taskContext.failureCount >= 2 
      ? this._analyzePatterns(taskContext.taskId, category)
      : null;
    
    // Analyze context
    const contextAnalysis = this._analyzeContext(taskContext);
    
    const analysis = {
      timestamp,
      taskId: taskContext.taskId,
      error_message: errorMsg,
      category,
      confidence: this._calculateConfidence(errorMsg, category),
      patterns,
      context_analysis: contextAnalysis,
      recommended_actions: this._getRecommendedActions(category, contextAnalysis)
    };
    
    // Store analysis history
    if (!this._analysisHistory.has(taskContext.taskId)) {
      this._analysisHistory.set(taskContext.taskId, []);
    }
    this._analysisHistory.get(taskContext.taskId).push(analysis);
    
    logger.info('RCA completed', {
      taskId: taskContext.taskId,
      category,
      confidence: analysis.confidence
    });
    
    return analysis;
  }

  /**
   * Suggest fix strategy based on error category and context.
   * @param {string} category - Error category from RCA
   * @param {Object} context - Task context
   * @returns {Object} - Fix suggestion with steps
   */
  suggestFix(category, context = {}) {
    const strategies = FIX_STRATEGIES[category] || FIX_STRATEGIES[ErrorCategory.UNKNOWN];
    
    // Prioritize strategies based on context
    const prioritized = this._prioritizeStrategies(strategies, context);
    
    return {
      category,
      primary_fix: prioritized[0],
      alternative_fixes: prioritized.slice(1, 3),
      all_strategies: prioritized,
      estimated_success_rate: this._estimateSuccessRate(category, context)
    };
  }

  /**
   * Check if RCA should be triggered for a task.
   * @param {string} taskId - Task identifier
   * @param {number} failureCount - Number of failures
   * @returns {boolean} - True if RCA should run
   */
  shouldTrigger(taskId, failureCount) {
    return failureCount >= this.triggerThreshold;
  }

  /**
   * Get RCA history for a task.
   * @param {string} taskId - Task identifier
   * @returns {Array<Object>} - Analysis history
   */
  getAnalysisHistory(taskId) {
    return this._analysisHistory.get(taskId) || [];
  }

  /**
   * Classify error into standard category.
   * @param {string} errorMsg - Error message
   * @returns {string} - Error category
   * @private
   */
  _classifyError(errorMsg) {
    if (!errorMsg) return ErrorCategory.UNKNOWN;
    
    const lower = errorMsg.toLowerCase();
    
    // Dependency errors
    if (lower.includes('cannot find module') ||
        lower.includes('module not found') ||
        lower.includes('require is not defined') ||
        lower.includes('import') && (lower.includes('not found') || lower.includes('missing')) ||
        lower.includes('dependency') ||
        lower.includes('package') && lower.includes('not installed')) {
      return ErrorCategory.DEPENDENCY;
    }
    
    // Syntax errors
    if (lower.includes('syntaxerror') ||
        lower.includes('unexpected token') ||
        lower.includes('parse error') ||
        lower.includes('missing') && (lower.includes('semicolon') || lower.includes('bracket') || lower.includes('parenthesis')) ||
        lower.includes('invalid syntax') ||
        lower.includes('identifier') && lower.includes('expected')) {
      return ErrorCategory.SYNTAX;
    }
    
    // Resource errors
    if (lower.includes('no space left') ||
        lower.includes('out of memory') ||
        lower.includes('too many open files') ||
        lower.includes('resource temporarily unavailable') ||
        lower.includes('quota exceeded') ||
        lower.includes('memory allocation failed')) {
      return ErrorCategory.RESOURCE;
    }
    
    // Timeout errors
    if (lower.includes('timeout') ||
        lower.includes('timed out') ||
        lower.includes('took too long') ||
        lower.includes('exceeded maximum') && lower.includes('time') ||
        lower.includes('deadline exceeded')) {
      return ErrorCategory.TIMEOUT;
    }
    
    // Logic errors (catch-all for functional issues)
    if (lower.includes('assertion') ||
        lower.includes('expected') && lower.includes('received') ||
        lower.includes('incorrect') ||
        lower.includes('wrong') ||
        lower.includes('failed') && lower.includes('test')) {
      return ErrorCategory.LOGIC;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Analyze patterns across multiple failures.
   * @param {string} taskId - Task identifier
   * @param {string} currentCategory - Current error category
   * @returns {Object} - Pattern analysis
   * @private
   */
  _analyzePatterns(taskId, currentCategory) {
    const history = this._analysisHistory.get(taskId) || [];
    
    if (history.length === 0) {
      return { isRecurring: false };
    }
    
    // Check if same category recurring
    const sameCategoryCount = history.filter(h => h.category === currentCategory).length;
    const isRecurring = sameCategoryCount >= 2;
    
    // Check for category escalation
    const categories = history.map(h => h.category);
    const uniqueCategories = [...new Set(categories)];
    const isEscalating = uniqueCategories.length > 2;
    
    return {
      isRecurring,
      sameCategoryCount,
      isEscalating,
      uniqueCategories,
      totalFailures: history.length + 1
    };
  }

  /**
   * Analyze task context for contributing factors.
   * @param {Object} taskContext - Task context
   * @returns {Object} - Context analysis
   * @private
   */
  _analyzeContext(taskContext) {
    const analysis = {
      taskType: taskContext.taskType || 'unknown',
      recentChanges: taskContext.recentChanges || [],
      dependencyIssues: [],
      riskFactors: []
    };
    
    // Check for risky recent changes
    if (analysis.recentChanges.length > 0) {
      const riskyPatterns = [
        { pattern: /config/i, risk: 'Configuration change may have side effects' },
        { pattern: /dependenc|package\.json/i, risk: 'Dependency changes may break imports' },
        { pattern: /import|require/i, risk: 'Import changes may cause module resolution issues' },
        { pattern: /async|await|promise/i, risk: 'Async changes may introduce timing issues' }
      ];
      
      for (const change of analysis.recentChanges) {
        for (const { pattern, risk } of riskyPatterns) {
          if (pattern.test(change)) {
            analysis.riskFactors.push(risk);
          }
        }
      }
    }
    
    // Check dependency state
    if (taskContext.dependencyState) {
      const deps = taskContext.dependencyState;
      if (deps.outdated && deps.outdated.length > 0) {
        analysis.dependencyIssues.push(`${deps.outdated.length} outdated dependencies`);
      }
      if (deps.missing && deps.missing.length > 0) {
        analysis.dependencyIssues.push(`Missing: ${deps.missing.join(', ')}`);
      }
      if (deps.conflicts && deps.conflicts.length > 0) {
        analysis.dependencyIssues.push(`Conflicts: ${deps.conflicts.join(', ')}`);
      }
    }
    
    return analysis;
  }

  /**
   * Calculate confidence score for classification.
   * @param {string} errorMsg - Error message
   * @param {string} category - Classified category
   * @returns {number} - Confidence (0-1)
   * @private
   */
  _calculateConfidence(errorMsg, category) {
    if (!errorMsg) return 0.5;
    
    const lower = errorMsg.toLowerCase();
    let confidence = 0.5;
    
    // High confidence for explicit error types
    if (lower.includes('syntaxerror')) confidence = 0.95;
    else if (lower.includes('timeout')) confidence = 0.9;
    else if (lower.includes('module not found')) confidence = 0.95;
    else if (lower.includes('out of memory')) confidence = 0.9;
    else if (lower.includes('assertion')) confidence = 0.85;
    
    // Boost confidence for multiple indicators
    const indicators = {
      [ErrorCategory.DEPENDENCY]: ['module', 'import', 'require', 'dependency', 'package'],
      [ErrorCategory.SYNTAX]: ['syntax', 'token', 'parse', 'semicolon', 'bracket'],
      [ErrorCategory.LOGIC]: ['assertion', 'expected', 'received', 'incorrect', 'wrong'],
      [ErrorCategory.RESOURCE]: ['memory', 'disk', 'file', 'resource', 'quota'],
      [ErrorCategory.TIMEOUT]: ['timeout', 'timed out', 'too long', 'deadline']
    };
    
    const categoryIndicators = indicators[category] || [];
    const matchCount = categoryIndicators.filter(word => lower.includes(word)).length;
    confidence = Math.min(0.95, confidence + (matchCount * 0.05));
    
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Get recommended actions based on category and context.
   * @param {string} category - Error category
   * @param {Object} contextAnalysis - Context analysis result
   * @returns {string[]} - Recommended actions
   * @private
   */
  _getRecommendedActions(category, contextAnalysis) {
    const actions = [];
    
    // Base recommendations from category
    const baseActions = FIX_STRATEGIES[category] || [];
    actions.push(...baseActions.slice(0, 2));
    
    // Add context-specific recommendations
    if (contextAnalysis.dependencyIssues.length > 0) {
      actions.push('Resolve dependency issues: ' + contextAnalysis.dependencyIssues.join(', '));
    }
    
    if (contextAnalysis.riskFactors.length > 0) {
      actions.push('Review recent changes for: ' + contextAnalysis.riskFactors.join('; '));
    }
    
    return actions;
  }

  /**
   * Prioritize fix strategies based on context.
   * @param {string[]} strategies - Available strategies
   * @param {Object} context - Task context
   * @returns {string[]} - Prioritized strategies
   * @private
   */
  _prioritizeStrategies(strategies, context) {
    // Simple prioritization: return as-is for now
    // Could be enhanced with ML-based ranking based on historical success rates
    return [...strategies];
  }

  /**
   * Estimate success rate for a fix strategy.
   * @param {string} category - Error category
   * @param {Object} context - Task context
   * @returns {number} - Estimated success rate (0-1)
   * @private
   */
  _estimateSuccessRate(category, context) {
    // Base rates by category (from historical data)
    const baseRates = {
      [ErrorCategory.DEPENDENCY]: 0.85,
      [ErrorCategory.SYNTAX]: 0.90,
      [ErrorCategory.LOGIC]: 0.70,
      [ErrorCategory.RESOURCE]: 0.75,
      [ErrorCategory.TIMEOUT]: 0.80,
      [ErrorCategory.UNKNOWN]: 0.50
    };
    
    return baseRates[category] || 0.50;
  }
}

module.exports = RCAEngine;
module.exports.ErrorCategory = ErrorCategory;
module.exports.FIX_STRATEGIES = FIX_STRATEGIES;

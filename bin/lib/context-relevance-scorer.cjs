#!/usr/bin/env node

/**
 * Context Relevance Scorer — Score context items by relevance
 *
 * Analyzes context items and assigns relevance scores based on:
 * - Recency
 * - Frequency of access
 * - Relationship to current task
 */

class ContextRelevanceScorer {
  /**
   * Create a ContextRelevanceScorer instance
   */
  constructor() {
    this.defaultWeights = {
      recency: 0.4,
      frequency: 0.3,
      relevance: 0.3
    };
  }

  /**
   * Score a context item
   * @param {Object} item - Context item to score
   * @param {Object} options - Scoring options
   * @returns {number} Relevance score (0-100)
   */
  score(item, options = {}) {
    const { recency = 0, frequency = 0, relevance = 0 } = item;
    const weights = { ...this.defaultWeights, ...options.weights };

    const recencyScore = this._scoreRecency(recency, options);
    const frequencyScore = this._scoreFrequency(frequency, options);
    const relevanceScore = this._scoreRelevance(relevance, options);

    return Math.round(
      recencyScore * weights.recency +
      frequencyScore * weights.frequency +
      relevanceScore * weights.relevance
    );
  }

  /**
   * Score based on recency
   * @param {number} lastAccessed - Timestamp of last access
   * @param {Object} options - Options
   * @returns {number} Score (0-100)
   */
  _scoreRecency(lastAccessed, options = {}) {
    if (!lastAccessed) return 50;
    const now = Date.now();
    const age = now - lastAccessed;
    const maxAge = options.maxAge || 3600000; // 1 hour default

    return Math.max(0, Math.min(100, 100 - (age / maxAge) * 100));
  }

  /**
   * Score based on access frequency
   * @param {number} accessCount - Number of accesses
   * @param {Object} options - Options
   * @returns {number} Score (0-100)
   */
  _scoreFrequency(accessCount, options = {}) {
    if (!accessCount) return 0;
    const maxCount = options.maxCount || 100;
    return Math.min(100, (accessCount / maxCount) * 100);
  }

  /**
   * Score based on content relevance
   * @param {number} relevance - Pre-computed relevance value
   * @param {Object} options - Options
   * @returns {number} Score (0-100)
   */
  _scoreRelevance(relevance, options = {}) {
    if (relevance === undefined || relevance === null) return 50;
    return Math.max(0, Math.min(100, relevance));
  }

  /**
   * Score multiple items and sort by relevance
   * @param {Array} items - Context items to score
   * @param {Object} options - Scoring options
   * @returns {Array} Items with scores, sorted by relevance
   */
  scoreAll(items, options = {}) {
    return items
      .map(item => ({
        ...item,
        relevanceScore: this.score(item, options)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

module.exports = ContextRelevanceScorer;

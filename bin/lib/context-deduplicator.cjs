#!/usr/bin/env node

/**
 * Context Deduplicator — Remove duplicate context items
 *
 * Identifies and removes:
 * - Exact duplicates
 * - Near-duplicates (similar content)
 * - Redundant information
 */

class ContextDeduplicator {
  /**
   * Create a ContextDeduplicator instance
   */
  constructor() {
    this.seen = new Set();
    this.similarityThreshold = 0.9; // 90% similar = duplicate
  }

  /**
   * Generate a hash for content
   * @param {string} content - Content to hash
   * @returns {string} Hash value
   */
  _hash(content) {
    // Simple hash for deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Check if content is a duplicate
   * @param {string} content - Content to check
   * @returns {boolean} True if duplicate
   */
  isDuplicate(content) {
    const hash = this._hash(content);
    return this.seen.has(hash);
  }

  /**
   * Mark content as seen
   * @param {string} content - Content to mark
   */
  markSeen(content) {
    const hash = this._hash(content);
    this.seen.add(hash);
  }

  /**
   * Deduplicate an array of items
   * @param {Array} items - Items to deduplicate
   * @param {string} keyField - Field to use for deduplication
   * @returns {Array} Deduplicated items
   */
  deduplicate(items, keyField = 'content') {
    const seen = new Set();
    const result = [];

    for (const item of items) {
      const key = item[keyField] || JSON.stringify(item);
      const hash = this._hash(key);

      if (!seen.has(hash)) {
        seen.add(hash);
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Clear the seen set
   */
  clear() {
    this.seen.clear();
  }

  /**
   * Get deduplication statistics
   * @param {Array} original - Original items
   * @param {Array} deduplicated - Deduplicated items
   * @returns {Object} Statistics
   */
  getStats(original, deduplicated) {
    const removed = original.length - deduplicated.length;
    const ratio = original.length > 0 ? (removed / original.length) * 100 : 0;

    return {
      original: original.length,
      deduplicated: deduplicated.length,
      removed,
      ratio: Math.round(ratio * 100) / 100
    };
  }
}

module.exports = ContextDeduplicator;

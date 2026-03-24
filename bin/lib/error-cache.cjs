#!/usr/bin/env node

/**
 * Error Cache — Track recurring errors for deduplication
 *
 * Stores error fingerprints and counts occurrences to identify
 * recurring issues vs. one-time failures.
 */

class ErrorCache {
  /**
   * Create an ErrorCache instance
   */
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
  }

  /**
   * Generate a fingerprint for an error
   * @param {Error} error - The error to fingerprint
   * @returns {string} Error fingerprint
   */
  fingerprint(error) {
    if (!error) return 'unknown';
    const name = error.name || 'Error';
    const message = error.message || '';
    const stack = error.stack || '';
    const firstLine = stack.split('\n')[1] || '';
    return `${name}:${message}:${firstLine}`;
  }

  /**
   * Record an error occurrence
   * @param {Error} error - The error to record
   * @param {Object} context - Additional context
   * @returns {string} Error fingerprint
   */
  record(error, context = {}) {
    const fp = this.fingerprint(error);
    const entry = this.cache.get(fp);

    if (entry) {
      entry.count++;
      entry.lastSeen = Date.now();
      entry.context = context;
    } else {
      if (this.cache.size >= this.maxSize) {
        // Remove oldest entry
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      this.cache.set(fp, {
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      });
    }

    return fp;
  }

  /**
   * Check if an error is recurring (seen more than once)
   * @param {string} fingerprint - Error fingerprint
   * @returns {boolean} True if error has been seen before
   */
  isRecurring(fingerprint) {
    const entry = this.cache.get(fingerprint);
    return entry && entry.count > 1;
  }

  /**
   * Get error entry by fingerprint
   * @param {string} fingerprint - Error fingerprint
   * @returns {Object|undefined} Error entry
   */
  get(fingerprint) {
    return this.cache.get(fingerprint);
  }

  /**
   * Clear the error cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  stats() {
    let recurring = 0;
    this.cache.forEach(entry => {
      if (entry.count > 1) recurring++;
    });

    return {
      total: this.cache.size,
      recurring,
      unique: this.cache.size - recurring
    };
  }
}

module.exports = { ErrorCache };

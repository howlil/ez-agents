#!/usr/bin/env node

/**
 * Context Metadata Tracker — Track metadata for context items
 *
 * Tracks:
   - Creation time
   - Last access time
   - Access count
   - Source/origin
   - Tags/categories
 */

class ContextMetadataTracker {
  /**
   * Create a ContextMetadataTracker instance
   */
  constructor() {
    this.metadata = new Map();
  }

  /**
   * Track metadata for a context item
   * @param {string} id - Item identifier
   * @param {Object} data - Metadata to track
   */
  track(id, data = {}) {
    const existing = this.metadata.get(id) || {};

    this.metadata.set(id, {
      createdAt: existing.createdAt || Date.now(),
      updatedAt: Date.now(),
      lastAccessed: existing.lastAccessed || Date.now(),
      accessCount: existing.accessCount || 0,
      ...data
    });
  }

  /**
   * Record an access to a context item
   * @param {string} id - Item identifier
   */
  recordAccess(id) {
    const data = this.metadata.get(id);
    if (data) {
      data.lastAccessed = Date.now();
      data.accessCount = (data.accessCount || 0) + 1;
      this.metadata.set(id, data);
    }
  }

  /**
   * Get metadata for an item
   * @param {string} id - Item identifier
   * @returns {Object|undefined} Metadata
   */
  get(id) {
    return this.metadata.get(id);
  }

  /**
   * Remove metadata for an item
   * @param {string} id - Item identifier
   * @returns {boolean} True if removed
   */
  remove(id) {
    return this.metadata.delete(id);
  }

  /**
   * Get all tracked metadata
   * @returns {Object} All metadata
   */
  getAll() {
    const result = {};
    this.metadata.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Clear all metadata
   */
  clear() {
    this.metadata.clear();
  }

  /**
   * Get statistics about tracked items
   * @returns {Object} Statistics
   */
  stats() {
    let totalAccesses = 0;
    let oldest = Infinity;
    let newest = 0;

    this.metadata.forEach(data => {
      totalAccesses += data.accessCount || 0;
      if (data.createdAt < oldest) oldest = data.createdAt;
      if (data.createdAt > newest) newest = data.createdAt;
    });

    return {
      total: this.metadata.size,
      totalAccesses,
      avgAccesses: this.metadata.size > 0 ? Math.round(totalAccesses / this.metadata.size) : 0,
      oldest: oldest === Infinity ? null : new Date(oldest).toISOString(),
      newest: new Date(newest).toISOString()
    };
  }

  /**
   * Find items by metadata criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching item IDs
   */
  findBy(criteria) {
    const results = [];

    this.metadata.forEach((data, id) => {
      let matches = true;

      for (const [key, value] of Object.entries(criteria)) {
        if (data[key] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        results.push(id);
      }
    });

    return results;
  }
}

module.exports = ContextMetadataTracker;

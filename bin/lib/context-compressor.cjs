#!/usr/bin/env node

/**
 * Context Compressor — Compress context to reduce token usage
 *
 * Strategies:
 * - Remove redundant information
 * - Summarize verbose sections
 * - Compress repeated patterns
 */

class ContextCompressor {
  /**
   * Create a ContextCompressor instance
   */
  constructor() {
    this.compressionThreshold = 0.8; // Compress if over 80% of limit
    this.defaultLimit = 100000; // Default token limit
  }

  /**
   * Compress context content
   * @param {string} content - Content to compress
   * @param {Object} options - Compression options
   * @returns {string} Compressed content
   */
  compress(content, options = {}) {
    if (!content) return '';

    let result = content;
    const limit = options.limit || this.defaultLimit;

    // Remove excessive whitespace
    result = this._removeExtraWhitespace(result);

    // Check if compression is needed
    if (result.length < limit * this.compressionThreshold) {
      return result;
    }

    // Apply aggressive compression
    result = this._summarizeSections(result, options);

    return result;
  }

  /**
   * Remove extra whitespace from content
   * @param {string} content - Content to process
   * @returns {string} Processed content
   */
  _removeExtraWhitespace(content) {
    return content
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
      .replace(/^\s*\n/gm, ''); // Remove leading blank lines
  }

  /**
   * Summarize long sections
   * @param {string} content - Content to summarize
   * @param {Object} options - Options
   * @returns {string} Summarized content
   */
  _summarizeSections(content, options = {}) {
    const maxLength = options.maxLength || 50000;

    if (content.length <= maxLength) {
      return content;
    }

    // Keep first and last parts, summarize middle
    const keepLength = Math.floor(maxLength / 3);
    const start = content.slice(0, keepLength);
    const end = content.slice(-keepLength);
    const omitted = content.length - (keepLength * 2);

    return `${start}\n\n[... ${omitted} characters omitted ...]\n\n${end}`;
  }

  /**
   * Get compression statistics
   * @param {string} original - Original content
   * @param {string} compressed - Compressed content
   * @returns {Object} Compression statistics
   */
  getStats(original, compressed) {
    const originalLength = original?.length || 0;
    const compressedLength = compressed?.length || 0;
    const saved = originalLength - compressedLength;
    const ratio = originalLength > 0 ? (saved / originalLength) * 100 : 0;

    return {
      original: originalLength,
      compressed: compressedLength,
      saved,
      ratio: Math.round(ratio * 100) / 100
    };
  }
}

module.exports = ContextCompressor;

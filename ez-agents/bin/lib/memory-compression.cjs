#!/usr/bin/env node

/**
 * Memory Compression — Compress long session transcripts
 *
 * Reduces session size by keeping first N and last M messages
 */

const { defaultLogger: logger } = require('./logger.cjs');

class MemoryCompression {
  /**
   * Create a MemoryCompression instance
   * @param {Object} sessionManager - SessionManager instance
   */
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Compress a session transcript
   * @param {string} sessionId - Session ID
   * @param {Object} options - Compression options
   * @param {number} [options.threshold=50] - Minimum messages before compression
   * @param {number} [options.keepFirst=5] - Messages to keep at start
   * @param {number} [options.keepLast=10] - Messages to keep at end
   * @returns {Object} Compression result
   */
  compress(sessionId, options = {}) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return { compressed: false, reason: 'Session not found' };
    }

    const {
      threshold = 50,
      keepFirst = 5,
      keepLast = 10
    } = options;

    const transcript = session.context?.transcript || '';
    
    // Handle string transcript (split by newlines or messages)
    let messages = [];
    if (typeof transcript === 'string') {
      // Try to parse as JSON array first
      try {
        messages = JSON.parse(transcript);
      } catch {
        // Split by newlines as fallback
        messages = transcript.split('\n').filter(line => line.trim());
      }
    } else if (Array.isArray(transcript)) {
      messages = transcript;
    }

    if (messages.length <= threshold) {
      logger.info('Session below compression threshold', { sessionId, messageCount: messages.length });
      return { 
        compressed: false, 
        reason: 'Below threshold',
        messageCount: messages.length,
        threshold 
      };
    }

    // Create compressed transcript
    const firstMessages = messages.slice(0, keepFirst);
    const lastMessages = messages.slice(-keepLast);
    const compressedCount = messages.length - keepFirst - keepLast;

    const placeholder = {
      role: 'system',
      content: `... ${compressedCount} messages compressed ...`,
      timestamp: new Date().toISOString(),
      compressed: true
    };

    const compressedMessages = [
      ...firstMessages,
      placeholder,
      ...lastMessages
    ];

    // Update session
    const updates = {
      context: {
        transcript: compressedMessages
      },
      metadata: {
        compressed: true,
        compressed_at: new Date().toISOString(),
        compression_stats: {
          original_count: messages.length,
          compressed_count: compressedMessages.length,
          removed_count: compressedCount
        }
      }
    };

    this.sessionManager.updateSession(sessionId, updates);

    const reduction = Math.round((1 - compressedMessages.length / messages.length) * 100);

    logger.info('Session compressed', { 
      sessionId, 
      originalLength: messages.length, 
      newLength: compressedMessages.length,
      reduction 
    });

    return {
      compressed: true,
      originalLength: messages.length,
      newLength: compressedMessages.length,
      reduction
    };
  }

  /**
   * Get compression stats for a session
   * @param {string} sessionId - Session ID
   * @returns {Object} Compression statistics
   */
  getCompressionStats(sessionId) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return { compressed: false, reason: 'Session not found' };
    }

    if (!session.metadata?.compressed) {
      return { compressed: false };
    }

    const originalSize = session.metadata.compression_stats?.original_count || 0;
    const compressedSize = session.metadata.compression_stats?.compressed_count || 0;
    const reduction = session.metadata.compression_stats?.removed_count || 0;
    const reductionPercent = originalSize > 0 
      ? Math.round((reduction / originalSize) * 100) 
      : 0;

    return {
      compressed: true,
      original_size: originalSize,
      compressed_size: compressedSize,
      reduction_percent: reductionPercent,
      compressed_at: session.metadata.compressed_at
    };
  }

  /**
   * Check if session should be compressed
   * @param {string} sessionId - Session ID
   * @param {number} threshold - Message threshold
   * @returns {boolean} True if compression recommended
   */
  shouldCompress(sessionId, threshold = 50) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return false;
    }

    const transcript = session.context?.transcript || '';
    let messageCount = 0;

    if (typeof transcript === 'string') {
      try {
        const messages = JSON.parse(transcript);
        messageCount = Array.isArray(messages) ? messages.length : 0;
      } catch {
        messageCount = transcript.split('\n').filter(line => line.trim()).length;
      }
    } else if (Array.isArray(transcript)) {
      messageCount = transcript.length;
    }

    return messageCount > threshold;
  }

  /**
   * Compress all sessions exceeding threshold
   * @param {Object} options - Compression options
   * @returns {Object} Batch compression result
   */
  compressAll(options = {}) {
    const sessions = this.sessionManager.listSessions();
    const results = {
      total: sessions.length,
      compressed: 0,
      skipped: 0,
      details: []
    };

    for (const sessionMeta of sessions) {
      const shouldCompress = this.shouldCompress(sessionMeta.session_id, options.threshold);
      
      if (shouldCompress) {
        const result = this.compress(sessionMeta.session_id, options);
        if (result.compressed) {
          results.compressed++;
          results.details.push({
            sessionId: sessionMeta.session_id,
            ...result
          });
        } else {
          results.skipped++;
        }
      } else {
        results.skipped++;
      }
    }

    logger.info('Batch compression complete', {
      total: results.total,
      compressed: results.compressed,
      skipped: results.skipped
    });

    return results;
  }

  /**
   * Decompress a session (restore placeholder info)
   * Note: Cannot restore original messages, only marks as decompressed
   * @param {string} sessionId - Session ID
   * @returns {Object} Decompression result
   */
  decompress(sessionId) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return { decompressed: false, reason: 'Session not found' };
    }

    if (!session.metadata?.compressed) {
      return { decompressed: false, reason: 'Not compressed' };
    }

    // Remove compression metadata
    this.sessionManager.updateSession(sessionId, {
      metadata: {
        compressed: false,
        compressed_at: null,
        compression_stats: null
      }
    });

    logger.info('Session marked as decompressed', { sessionId });

    return {
      decompressed: true,
      note: 'Original messages cannot be restored'
    };
  }
}

module.exports = MemoryCompression;

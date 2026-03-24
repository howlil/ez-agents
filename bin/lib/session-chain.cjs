#!/usr/bin/env node

/**
 * Session Chain — Navigate linked sessions
 *
 * Provides chain navigation, visualization, and repair capabilities
 */

const fs = require('fs');
const path = require('path');
const { SessionChainError } = require('./session-errors.cjs');
const { defaultLogger: logger } = require('./logger.cjs');

class SessionChain {
  /**
   * Create a SessionChain instance
   * @param {Object} sessionManager - SessionManager instance
   */
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Navigate to adjacent session in chain
   * @param {string} sessionId - Current session ID
   * @param {string} direction - Navigation direction ('previous' or 'next')
   * @returns {Object|null} Adjacent session or null
   */
  navigate(sessionId, direction) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return null;
    }

    const chain = session.metadata?.session_chain || [];
    const currentIndex = chain.indexOf(sessionId);

    if (currentIndex === -1) {
      // Session not in chain, check if it's the last one
      logger.warn('Session not in chain', { sessionId });
      return null;
    }

    if (direction === 'previous') {
      if (currentIndex > 0) {
        const previousId = chain[currentIndex - 1];
        return this.sessionManager.loadSession(previousId);
      }
      return null;
    }

    if (direction === 'next') {
      if (currentIndex < chain.length - 1) {
        const nextId = chain[currentIndex + 1];
        return this.sessionManager.loadSession(nextId);
      }
      return null;
    }

    throw new SessionChainError(`Invalid direction: ${direction}`, chain);
  }

  /**
   * Get full chain as array of session objects
   * @param {string} sessionId - Session ID in the chain
   * @returns {Array} Array of session objects
   */
  getChain(sessionId) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return [];
    }

    const chain = session.metadata?.session_chain || [];
    const chainSessions = [];

    for (const id of chain) {
      const chainSession = this.sessionManager.loadSession(id);
      if (chainSession) {
        chainSessions.push(chainSession);
      } else {
        logger.warn('Missing session in chain', { id });
      }
    }

    // Include current session if not already in chain
    if (!chain.includes(sessionId)) {
      chainSessions.push(session);
    }

    return chainSessions;
  }

  /**
   * Get chain visualization string
   * @param {string} sessionId - Session ID
   * @returns {string} Formatted chain visualization
   */
  getChainVisualization(sessionId) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return `Session not found: ${sessionId}`;
    }

    const chain = session.metadata?.session_chain || [];
    const currentIndex = chain.indexOf(sessionId);

    let viz = `Session Chain for ${sessionId}:\n\n`;

    chain.forEach((id, index) => {
      const chainSession = this.sessionManager.loadSession(id);
      const startedAt = chainSession?.metadata?.started_at || 'Unknown';
      const status = chainSession?.metadata?.status || 'unknown';
      const marker = index === currentIndex ? ' <-- Current' : '';
      viz += `[${index + 1}] ${id} (${startedAt}) - ${status}${marker}\n`;
    });

    if (!chain.includes(sessionId)) {
      const startedAt = session.metadata?.started_at || 'Unknown';
      const status = session.metadata?.status || 'unknown';
      viz += `[${chain.length + 1}] ${sessionId} (${startedAt}) - ${status} <-- Current\n`;
    }

    viz += `\nNavigation:\n`;
    if (currentIndex > 0) {
      viz += `- Previous: ${chain[currentIndex - 1]}\n`;
    } else {
      viz += `- Previous: none\n`;
    }

    if (currentIndex < chain.length - 1) {
      viz += `- Next: ${chain[currentIndex + 1]}\n`;
    } else {
      viz += `- Next: none\n`;
    }

    return viz;
  }

  /**
   * Repair broken chain links
   * @param {string} sessionId - Session ID
   * @returns {Object} Repair result with warnings
   */
  repairChain(sessionId) {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      throw new SessionChainError(`Session not found: ${sessionId}`, []);
    }

    const chain = session.metadata?.session_chain || [];
    const warnings = [];
    const repaired = [];

    // Get all available sessions
    const allSessions = this.sessionManager.listSessions();
    const availableIds = new Set(allSessions.map(s => s.session_id));

    // Find missing links
    const missingLinks = [];
    for (const id of chain) {
      if (!availableIds.has(id)) {
        missingLinks.push(id);
      }
    }

    if (missingLinks.length === 0) {
      return { repaired: false, warnings: ['Chain is intact'] };
    }

    // Attempt to repair by finding closest timestamp match
    for (const missingId of missingLinks) {
      const match = this._findClosestSessionMatch(missingId, allSessions);
      if (match) {
        logger.info('Auto-repaired chain link', { missing: missingId, found: match.session_id });
        repaired.push({ missing: missingId, found: match.session_id });
      } else {
        warnings.push(`Unrecoverable link: ${missingId}`);
      }
    }

    // Update chain with repaired links
    if (repaired.length > 0) {
      const newChain = chain.map(id => {
        const repair = repaired.find(r => r.missing === id);
        return repair ? repair.found : id;
      });

      this.sessionManager.updateSession(sessionId, {
        metadata: { session_chain: newChain }
      });
    }

    return {
      repaired: repaired.length > 0,
      repairs: repaired,
      warnings
    };
  }

  /**
   * Find closest session match by timestamp
   * @private
   */
  _findClosestSessionMatch(missingId, allSessions) {
    // Extract timestamp from missing ID
    const timestampMatch = missingId.match(/session-(.+)/);
    if (!timestampMatch) {
      return null;
    }

    const missingTimestamp = timestampMatch[1];

    // Find session with closest timestamp
    let closestMatch = null;
    let minDiff = Infinity;

    for (const session of allSessions) {
      const sessionTimestamp = session.session_id.replace('session-', '');
      const diff = this._compareTimestamps(missingTimestamp, sessionTimestamp);

      if (diff < minDiff) {
        minDiff = diff;
        closestMatch = session;
      }
    }

    // Only return match if within reasonable threshold (1 hour)
    if (minDiff < 3600000) {
      return closestMatch;
    }

    return null;
  }

  /**
   * Compare timestamps and return difference in ms
   * @private
   */
  _compareTimestamps(ts1, ts2) {
    try {
      const date1 = new Date(ts1.replace(/-/g, ':').replace('T', ' '));
      const date2 = new Date(ts2.replace(/-/g, ':').replace('T', ' '));
      return Math.abs(date1 - date2);
    } catch {
      return Infinity;
    }
  }

  /**
   * Add session to chain
   * @param {string} sessionId - Session ID to add to
   * @param {string} linkedSessionId - Session ID to link
   * @param {string} position - Position ('before' or 'after')
   * @returns {boolean} Success
   */
  addToChain(sessionId, linkedSessionId, position = 'after') {
    const session = this.sessionManager.loadSession(sessionId);
    if (!session) {
      return false;
    }

    const linkedSession = this.sessionManager.loadSession(linkedSessionId);
    if (!linkedSession) {
      return false;
    }

    let chain = session.metadata?.session_chain || [];

    // Ensure current session is in chain
    if (!chain.includes(sessionId)) {
      chain.push(sessionId);
    }

    const currentIndex = chain.indexOf(sessionId);

    if (position === 'after') {
      // Insert after current
      chain.splice(currentIndex + 1, 0, linkedSessionId);
    } else if (position === 'before') {
      // Insert before current
      chain.splice(currentIndex, 0, linkedSessionId);
    }

    // Update both sessions
    this.sessionManager.updateSession(sessionId, {
      metadata: { session_chain: chain }
    });

    // Also update linked session's chain
    const linkedChain = linkedSession.metadata?.session_chain || [];
    if (!linkedChain.includes(sessionId)) {
      linkedChain.push(sessionId);
      this.sessionManager.updateSession(linkedSessionId, {
        metadata: { session_chain: linkedChain }
      });
    }

    logger.info('Session added to chain', { sessionId, linkedSessionId, position });
    return true;
  }
}

module.exports = SessionChain;

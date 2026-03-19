#!/usr/bin/env node

/**
 * Session Manager — Core session state persistence module
 *
 * Manages session lifecycle: create, load, update, end, list
 * Sessions stored in .planning/sessions/session-{timestamp}.json
 */

const fs = require('fs');
const path = require('path');
const { safePlanningWriteSync } = require('./planning-write.cjs');
const { defaultLogger: logger } = require('./logger.cjs');

class SessionManager {
  /**
   * Create a SessionManager instance
   * @param {string} sessionsDir - Directory for session files (default: .planning/sessions)
   */
  constructor(sessionsDir = '.planning/sessions') {
    this.sessionsDir = sessionsDir;
    this._ensureDir();
  }

  /**
   * Ensure sessions directory exists
   * @private
   */
  _ensureDir() {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
      logger.info('Sessions directory created', { dir: this.sessionsDir });
    }
  }

  /**
   * Generate session ID from timestamp
   * Format: session-YYYYMMDD-HHMMSS
   * @private
   * @returns {string} Session ID
   */
  _generateSessionId() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .slice(0, -5); // Remove milliseconds and Z
    return `session-${timestamp}`;
  }

  /**
   * Deep merge source into target
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  _deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] instanceof Object && key !== null) {
          result[key] = this._deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  /**
   * Create a new session
   * @param {Object} options - Session options
   * @param {string} [options.model] - Model identifier
   * @param {number} [options.phase] - Phase number
   * @param {number} [options.plan] - Plan number
   * @param {string} [options.objective] - Session objective
   * @returns {string} Session ID
   */
  createSession(options = {}) {
    const sessionId = this._generateSessionId();
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);

    const session = {
      metadata: {
        session_id: sessionId,
        session_version: '1.0',
        started_at: new Date().toISOString(),
        ended_at: null,
        model: options.model || null,
        phase: options.phase || null,
        plan: options.plan || null,
        status: 'active',
        session_chain: [],
        token_usage: {
          input: 0,
          output: 0,
          total: 0
        }
      },
      context: {
        transcript: '',
        tasks: [],
        decisions: [],
        file_changes: [],
        open_questions: [],
        blockers: []
      },
      state: {
        current_phase: options.phase || null,
        current_plan: options.plan || null,
        incomplete_tasks: [],
        last_action: null,
        next_recommended_action: options.objective || null
      }
    };

    try {
      safePlanningWriteSync(sessionPath, JSON.stringify(session, null, 2));
      logger.info('Session created', { sessionId, sessionPath });
      return sessionId;
    } catch (err) {
      logger.error('Failed to create session', { sessionId, error: err.message });
      throw err;
    }
  }

  /**
   * Load a session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session object or null if not found
   */
  loadSession(sessionId) {
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);

    if (!fs.existsSync(sessionPath)) {
      logger.error('Session not found', { sessionId, sessionPath });
      return null;
    }

    try {
      const content = fs.readFileSync(sessionPath, 'utf-8');
      const session = JSON.parse(content);
      logger.info('Session loaded', { sessionId });
      return session;
    } catch (err) {
      logger.error('Failed to load session', { sessionId, error: err.message });
      return null;
    }
  }

  /**
   * Get the most recent session
   * @returns {Object|null} Last session or null if none exist
   */
  getLastSession() {
    const sessionFiles = this._getSessionFiles();

    if (sessionFiles.length === 0) {
      logger.info('No sessions found');
      return null;
    }

    // Files are sorted, newest first
    const lastFile = sessionFiles[0];
    const sessionId = lastFile.replace('.json', '');
    return this.loadSession(sessionId);
  }

  /**
   * Update a session with new data
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates to merge into session
   * @returns {boolean} True on success, false if session not found
   */
  updateSession(sessionId, updates) {
    const session = this.loadSession(sessionId);
    if (!session) {
      return false;
    }

    const updatedSession = this._deepMerge(session, updates);
    const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);

    try {
      safePlanningWriteSync(sessionPath, JSON.stringify(updatedSession, null, 2));
      logger.info('Session updated', { sessionId });
      return true;
    } catch (err) {
      logger.error('Failed to update session', { sessionId, error: err.message });
      return false;
    }
  }

  /**
   * End a session
   * @param {string} sessionId - Session ID
   * @param {Object} finalState - Final state information
   * @param {string} [finalState.status] - Final status (default: 'completed')
   * @param {Array} [finalState.incomplete_tasks] - Incomplete tasks
   * @param {string} [finalState.next_recommended_action] - Next recommended action
   * @returns {boolean} True on success, false if session not found
   */
  endSession(sessionId, finalState = {}) {
    const session = this.loadSession(sessionId);
    if (!session) {
      return false;
    }

    const updates = {
      metadata: {
        ended_at: new Date().toISOString(),
        status: finalState.status || 'completed'
      },
      state: {}
    };

    if (finalState.incomplete_tasks) {
      updates.state.incomplete_tasks = finalState.incomplete_tasks;
    }

    if (finalState.next_recommended_action) {
      updates.state.next_recommended_action = finalState.next_recommended_action;
    }

    return this.updateSession(sessionId, updates);
  }

  /**
   * List all sessions
   * @returns {Array} Array of session metadata sorted by date (newest first)
   */
  listSessions() {
    const sessionFiles = this._getSessionFiles();
    const sessions = [];

    for (const file of sessionFiles) {
      const sessionId = file.replace('.json', '');
      const session = this.loadSession(sessionId);
      if (session) {
        sessions.push({
          session_id: session.metadata.session_id,
          started_at: session.metadata.started_at,
          ended_at: session.metadata.ended_at,
          model: session.metadata.model,
          phase: session.metadata.phase,
          plan: session.metadata.plan,
          status: session.metadata.status
        });
      }
    }

    return sessions;
  }

  /**
   * Get session files sorted by name (newest first)
   * @private
   * @returns {Array} Array of filenames
   */
  _getSessionFiles() {
    if (!fs.existsSync(this.sessionsDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(this.sessionsDir)
        .filter(file => /^session-.*\.json$/.test(file))
        .sort()
        .reverse();
      return files;
    } catch (err) {
      logger.error('Failed to read sessions directory', { error: err.message });
      return [];
    }
  }
}

module.exports = SessionManager;

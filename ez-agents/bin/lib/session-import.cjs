#!/usr/bin/env node

/**
 * Session Import — Import session data from exported files
 *
 * Validates session structure and chain integrity
 * Supports model-specific adapters
 */

const fs = require('fs');
const { SessionImportError, SessionNotFoundError } = require('./session-errors.cjs');
const { defaultLogger: logger } = require('./logger.cjs');

class SessionImport {
  /**
   * Create a SessionImport instance
   * @param {Object} sessionManager - SessionManager instance
   */
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Import a session from file
   * @param {string} sessionFile - Path to session file
   * @param {Object} options - Import options
   * @param {string} [options.sourceModel] - Source model for adapter
   * @returns {Object} Import result with sessionId and warnings
   */
  import(sessionFile, options = {}) {
    const { sourceModel } = options;
    const warnings = [];

    // Read and parse file
    let importedData;
    try {
      const content = fs.readFileSync(sessionFile, 'utf-8');
      importedData = JSON.parse(content);
    } catch (err) {
      throw new SessionImportError(`Failed to parse JSON: ${err.message}`, [err.message]);
    }

    // Handle model-specific format conversion
    if (sourceModel) {
      importedData = this.importFromModelSpecificFormat(importedData, sourceModel);
    }

    // Validate structure
    const structureValidation = this.validateStructure(importedData);
    if (!structureValidation.valid) {
      throw new SessionImportError('Invalid session structure', structureValidation.errors);
    }

    // Validate session chain
    const chainValidation = this.validateSessionChain(importedData);
    if (!chainValidation.valid) {
      throw new SessionImportError('Invalid session chain', chainValidation.errors);
    }

    // Validate chain links exist
    const linksValidation = this.validateChainLinksExist(importedData);
    if (linksValidation.warnings && linksValidation.warnings.length > 0) {
      warnings.push(...linksValidation.warnings);
    }

    // Create new session
    const newSessionId = this.sessionManager.createSession({
      model: importedData.metadata?.model,
      phase: importedData.metadata?.phase,
      plan: importedData.metadata?.plan
    });

    // Merge imported context and state
    const updates = {
      context: importedData.context || {},
      state: importedData.state || {}
    };

    // Add previous session to chain
    const previousSessionId = importedData.metadata?.session_id;
    if (previousSessionId) {
      updates.metadata = {
        session_chain: [previousSessionId]
      };
    }

    this.sessionManager.updateSession(newSessionId, updates);

    logger.info('Session imported', { sessionId: newSessionId, sourceFile: sessionFile });

    return {
      success: true,
      sessionId: newSessionId,
      warnings
    };
  }

  /**
   * Validate session structure
   * @param {Object} session - Session object
   * @returns {Object} Validation result
   */
  validateStructure(session) {
    const errors = [];

    // Check for export wrapper or direct session
    const sessionData = session.session || session;

    if (!sessionData.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!sessionData.metadata.session_id) {
        errors.push('Missing metadata.session_id');
      }
      if (!sessionData.metadata.started_at) {
        errors.push('Missing metadata.started_at');
      }
      if (!sessionData.metadata.session_version) {
        errors.push('Missing metadata.session_version');
      }
    }

    if (!sessionData.context) {
      errors.push('Missing context section');
    } else {
      if (!Array.isArray(sessionData.context.tasks)) {
        errors.push('context.tasks must be an array');
      }
      if (!Array.isArray(sessionData.context.decisions)) {
        errors.push('context.decisions must be an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate session chain integrity
   * @param {Object} session - Session object
   * @returns {Object} Validation result
   */
  validateSessionChain(session) {
    const errors = [];
    const sessionData = session.session || session;

    if (sessionData.metadata?.session_chain) {
      const chain = sessionData.metadata.session_chain;
      const sessionId = sessionData.metadata.session_id;

      if (!Array.isArray(chain)) {
        errors.push('session_chain must be an array');
      } else if (chain.includes(sessionId)) {
        errors.push('Circular reference detected: session_chain includes current session_id');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate chain links exist in session manager
   * @param {Object} session - Session object
   * @returns {Object} Validation result with warnings
   */
  validateChainLinksExist(session) {
    const warnings = [];
    const sessionData = session.session || session;

    if (sessionData.metadata?.session_chain) {
      const chain = sessionData.metadata.session_chain;
      const missingLinks = [];

      for (const id of chain) {
        const linkedSession = this.sessionManager.loadSession(id);
        if (!linkedSession) {
          missingLinks.push(id);
        }
      }

      if (missingLinks.length > 0) {
        warnings.push(`Missing chain links: ${missingLinks.join(', ')}`);
      }
    }

    return {
      valid: true,
      warnings
    };
  }

  /**
   * Import from model-specific format
   * @param {Object} data - Data to convert
   * @param {string} sourceModel - Source model name
   * @returns {Object} Converted session object
   */
  importFromModelSpecificFormat(data, sourceModel) {
    // If data has session wrapper, use it
    if (data.session) {
      return data.session;
    }

    // Model-specific adapters (can be extended)
    switch (sourceModel.toLowerCase()) {
      case 'claude':
        return this._adaptClaudeFormat(data);
      case 'qwen':
        return this._adaptQwenFormat(data);
      case 'openai':
        return this._adaptOpenAIFormat(data);
      case 'kimi':
        return this._adaptKimiFormat(data);
      default:
        // Assume standard format
        return data;
    }
  }

  /**
   * Adapt Claude-specific format
   * @private
   */
  _adaptClaudeFormat(data) {
    // Claude format adapter (placeholder)
    return data;
  }

  /**
   * Adapt Qwen-specific format
   * @private
   */
  _adaptQwenFormat(data) {
    // Qwen format adapter (placeholder)
    return data;
  }

  /**
   * Adapt OpenAI-specific format
   * @private
   */
  _adaptOpenAIFormat(data) {
    // OpenAI format adapter (placeholder)
    return data;
  }

  /**
   * Adapt Kimi-specific format
   * @private
   */
  _adaptKimiFormat(data) {
    // Kimi format adapter (placeholder)
    return data;
  }
}

module.exports = SessionImport;

/**
 * Quality Gate Coordinator
 *
 * Central registry and execution engine for quality gates.
 * Supports gate registration, execution, bypass with audit trail, and status reporting.
 * Uses Zod for schema validation of gate inputs/outputs.
 */

const fs = require('fs');
const path = require('path');
const { z } = require('zod');

/**
 * Get the audit trail file path (computed at runtime to support cwd changes)
 * @returns {string}
 */
function getAuditFilePath() {
  return path.join(process.cwd(), '.planning', 'gate-audit.json');
}

/**
 * @typedef {Object} GateDefinition
 * @property {string} id - Gate identifier
 * @property {z.ZodSchema} schema - Zod schema for context validation
 * @property {Function} executor - Gate execution function
 */

/**
 * @typedef {Object} GateStatus
 * @property {'registered' | 'passed' | 'failed' | 'bypassed'} state - Current gate state
 * @property {string} [id] - Gate identifier
 * @property {Date} [registeredAt] - Registration timestamp
 * @property {Date} [executedAt] - Execution timestamp
 * @property {Date} [bypassedAt] - Bypass timestamp
 * @property {string} [bypassReason] - Reason for bypass
 * @property {Array} [errors] - Errors from last execution
 * @property {Array} [warnings] - Warnings from last execution
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {boolean} passed - Whether the gate passed
 * @property {Array<{path: string, message: string}>} [errors] - Validation or execution errors
 * @property {Array<string>} [warnings] - Warnings
 */

/**
 * @typedef {Object} AuditEntry
 * @property {string} gateId - Gate identifier
 * @property {'bypass'} action - Action type
 * @property {string} reason - Reason for bypass
 * @property {string} timestamp - ISO timestamp
 */

class QualityGate {
  /**
   * @type {Map<string, GateDefinition>}
   */
  #gates;

  /**
   * @type {Map<string, GateStatus>}
   */
  #status;

  /**
   * @type {Array<AuditEntry>}
   */
  #auditTrail;

  constructor() {
    this.#gates = new Map();
    this.#status = new Map();
    this.#auditTrail = this.#loadAuditTrail();
  }

  /**
   * Load audit trail from file
   * @returns {Array<AuditEntry>}
   */
  #loadAuditTrail() {
    const auditFilePath = getAuditFilePath();
    try {
      if (fs.existsSync(auditFilePath)) {
        const content = fs.readFileSync(auditFilePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      // If file is corrupted or unreadable, start fresh
      console.warn('Warning: Could not load gate audit trail, starting fresh');
    }
    return [];
  }

  /**
   * Save audit trail to file
   */
  #saveAuditTrail() {
    const auditFilePath = getAuditFilePath();
    try {
      const dir = path.dirname(auditFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(auditFilePath, JSON.stringify(this.#auditTrail, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving gate audit trail:', err.message);
    }
  }

  /**
   * Format Zod validation errors into structured array with field paths
   * @param {z.ZodError} zodError
   * @returns {Array<{path: string, message: string}>}
   */
  #formatValidationErrors(zodError) {
    const errors = [];
    for (const issue of zodError.errors) {
      const fieldPath = issue.path.join('.');
      errors.push({
        path: fieldPath || 'root',
        message: issue.message,
      });
    }
    return errors;
  }

  /**
   * Register a quality gate
   * @param {string} id - Unique gate identifier
   * @param {z.ZodSchema} schema - Zod schema for context validation
   * @param {Function} executor - Async function that executes the gate logic
   * @returns {void}
   */
  registerGate(id, schema, executor) {
    if (!id || typeof id !== 'string') {
      throw new Error('Gate ID must be a non-empty string');
    }

    if (!schema || !schema.safeParse) {
      throw new Error('Schema must be a valid Zod schema');
    }

    if (typeof executor !== 'function') {
      throw new Error('Executor must be a function');
    }

    this.#gates.set(id, { id, schema, executor });
    this.#status.set(id, {
      state: 'registered',
      id,
      registeredAt: new Date(),
    });
  }

  /**
   * Execute a quality gate
   * @param {string} id - Gate identifier
   * @param {any} context - Context data to validate and pass to executor
   * @returns {Promise<ExecutionResult>}
   */
  async executeGate(id, context) {
    const gate = this.#gates.get(id);

    if (!gate) {
      throw new Error(`Gate not registered: ${id}`);
    }

    // Validate context against schema
    const parseResult = gate.schema.safeParse(context);

    if (!parseResult.success) {
      const errors = this.#formatValidationErrors(parseResult.error);
      const status = {
        ...this.#status.get(id),
        state: 'failed',
        executedAt: new Date(),
        errors,
      };
      this.#status.set(id, status);
      return { passed: false, errors, warnings: [] };
    }

    // Run executor with validated context
    try {
      const result = await gate.executor(parseResult.data);

      // Handle executor result
      if (result.passed) {
        const status = {
          ...this.#status.get(id),
          state: 'passed',
          executedAt: new Date(),
          errors: [],
          warnings: result.warnings || [],
        };
        this.#status.set(id, status);
        return { passed: true, errors: [], warnings: result.warnings || [] };
      } else {
        const errors = result.errors || [{ path: 'executor', message: 'Gate execution failed' }];
        const status = {
          ...this.#status.get(id),
          state: 'failed',
          executedAt: new Date(),
          errors,
          warnings: result.warnings || [],
        };
        this.#status.set(id, status);
        return { passed: false, errors, warnings: result.warnings || [] };
      }
    } catch (err) {
      const errors = [{ path: 'executor', message: err.message || 'Executor threw an exception' }];
      const status = {
        ...this.#status.get(id),
        state: 'failed',
        executedAt: new Date(),
        errors,
      };
      this.#status.set(id, status);
      return { passed: false, errors, warnings: [] };
    }
  }

  /**
   * Bypass a quality gate with mandatory audit reason
   * @param {string} id - Gate identifier
   * @param {string} reason - Reason for bypass (cannot be empty)
   * @returns {void}
   */
  bypassGate(id, reason) {
    const gate = this.#gates.get(id);

    if (!gate) {
      throw new Error(`Gate not registered: ${id}`);
    }

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      throw new Error('Bypass reason must be a non-empty string');
    }

    const status = {
      ...this.#status.get(id),
      state: 'bypassed',
      bypassedAt: new Date(),
      bypassReason: reason.trim(),
    };
    this.#status.set(id, status);

    // Log to audit trail
    const auditEntry = {
      gateId: id,
      action: 'bypass',
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
    };
    this.#auditTrail.push(auditEntry);
    this.#saveAuditTrail();
  }

  /**
   * Get the current status of a gate
   * @param {string} id - Gate identifier
   * @returns {GateStatus}
   */
  getGateStatus(id) {
    const status = this.#status.get(id);

    if (!status) {
      throw new Error(`Gate not registered: ${id}`);
    }

    return { ...status };
  }

  /**
   * Get all registered gate IDs
   * @returns {Array<string>}
   */
  getRegisteredGates() {
    return Array.from(this.#gates.keys());
  }

  /**
   * Get the audit trail
   * @returns {Array<AuditEntry>}
   */
  getAuditTrail() {
    return [...this.#auditTrail];
  }

  /**
   * Check if a gate is registered
   * @param {string} id - Gate identifier
   * @returns {boolean}
   */
  isRegistered(id) {
    return this.#gates.has(id);
  }

  /**
   * Reset gate status (for testing)
   * @param {string} id - Gate identifier
   * @returns {void}
   */
  resetGate(id) {
    const gate = this.#gates.get(id);
    if (gate) {
      this.#status.set(id, {
        state: 'registered',
        id,
        registeredAt: new Date(),
      });
    }
  }

  /**
   * Clear all gates and audit trail (for testing)
   * @returns {void}
   */
  clear() {
    this.#gates.clear();
    this.#status.clear();
    this.#auditTrail = [];
    // Also clear the audit file
    const auditFilePath = getAuditFilePath();
    if (fs.existsSync(auditFilePath)) {
      fs.writeFileSync(auditFilePath, '[]', 'utf-8');
    }
  }
}

module.exports = { QualityGate, z };

#!/usr/bin/env node

/**
 * Skill Context — Context schema validation for skill matcher
 *
 * Validates and normalizes matcher context:
 * - stack: object with language, framework, version
 * - scope: enum [new-feature, bugfix, refactor, migration, maintenance]
 * - projectType: string (optional)
 * - mode: enum [greenfield, existing, rapid-mvp, scale-up, maintenance]
 * - constraints: object with deadline, teamSize, compliance, legacySystems
 * - taskDescription: string (for keyword matching)
 * - codebaseFiles: array of strings (for file pattern matching)
 * - executedCommands: array of strings (for command matching)
 *
 * Usage:
 *   const { validateContext, CONTEXT_SCHEMA } = require('./skill-context.cjs');
 *   const { valid, errors, normalizedContext } = validateContext(context);
 */

const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Context schema definition
 */
const CONTEXT_SCHEMA = {
  stack: {
    type: 'object',
    optional: true,
    properties: {
      language: { type: 'string', optional: false },
      framework: { type: 'string', optional: true },
      version: { type: 'string', optional: true }
    }
  },
  scope: {
    type: 'enum',
    values: ['new-feature', 'bugfix', 'refactor', 'migration', 'maintenance'],
    optional: true
  },
  projectType: {
    type: 'string',
    optional: true
  },
  mode: {
    type: 'enum',
    values: ['greenfield', 'existing', 'rapid-mvp', 'scale-up', 'maintenance'],
    optional: true,
    normalize: (value) => {
      const mappings = {
        'mvp': 'rapid-mvp',
        'green-field': 'greenfield',
        'brownfield': 'existing',
        'scale': 'scale-up',
        'maint': 'maintenance'
      };
      return mappings[value] || value;
    }
  },
  constraints: {
    type: 'object',
    optional: true,
    properties: {
      deadline: { type: 'string', optional: true },
      teamSize: { type: 'number', optional: true },
      compliance: { type: 'array', optional: true },
      legacySystems: { type: 'array', optional: true }
    }
  },
  taskDescription: { type: 'string', optional: true },
  codebaseFiles: { type: 'array', optional: true },
  executedCommands: { type: 'array', optional: true }
};

/**
 * Validate and normalize context object
 * @param {Object} context - Context object to validate
 * @returns {Object} Validation result: { valid, errors, normalizedContext }
 */
function validateContext(context) {
  const errors = [];
  const normalized = { ...context };

  if (!context || typeof context !== 'object') {
    return {
      valid: false,
      errors: ['Context must be an object'],
      normalizedContext: null
    };
  }

  // Validate and normalize mode
  if (context.mode) {
    const modeSchema = CONTEXT_SCHEMA.mode;
    if (!modeSchema.values.includes(context.mode)) {
      const normalizedMode = modeSchema.normalize?.(context.mode);
      if (normalizedMode && modeSchema.values.includes(normalizedMode)) {
        normalized.mode = normalizedMode;
      } else {
        errors.push(`Invalid mode: ${context.mode}. Valid: ${modeSchema.values.join(', ')}`);
      }
    }
  }

  // Validate scope
  if (context.scope) {
    const scopeSchema = CONTEXT_SCHEMA.scope;
    if (!scopeSchema.values.includes(context.scope)) {
      errors.push(`Invalid scope: ${context.scope}. Valid: ${scopeSchema.values.join(', ')}`);
    }
  }

  // Validate stack structure
  if (context.stack) {
    if (!context.stack.language && !context.stack.framework) {
      errors.push('Stack must have at least language or framework');
    }
  }

  // Validate constraints structure
  if (context.constraints) {
    if (context.constraints.teamSize && typeof context.constraints.teamSize !== 'number') {
      errors.push('teamSize must be a number');
    }
    if (context.constraints.compliance && !Array.isArray(context.constraints.compliance)) {
      errors.push('compliance must be an array');
    }
  }

  if (errors.length > 0) {
    logger.warn('Context validation failed', {
      errorCount: errors.length,
      errors
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedContext: errors.length === 0 ? normalized : null
  };
}

module.exports = {
  validateContext,
  CONTEXT_SCHEMA
};

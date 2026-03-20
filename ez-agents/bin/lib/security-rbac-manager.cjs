#!/usr/bin/env node

/**
 * EZ Security RBAC Manager — Manifest-driven role validation and provisioning
 *
 * Provides RBAC management with:
 * - Manifest validation for role definitions
 * - Required fields: role, permissions, subjects
 * - Provisioning plan generation (create, update, noop, remove)
 * - Declarative role management
 *
 * Usage:
 *   const { validateRoleManifest, buildProvisioningPlan } = require('./security-rbac-manager.cjs');
 *   const result = validateRoleManifest({ role: 'admin', permissions: ['read'], subjects: ['user:alice'] });
 */

const { SecurityOpsError } = require('./security-errors.cjs');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Validate a role manifest
 * @param {Object} manifest - Role manifest to validate
 * @param {string} manifest.role - Role name
 * @param {string[]} manifest.permissions - Array of permissions
 * @param {string[]} manifest.subjects - Array of subjects (users/groups)
 * @returns {Object} - Validation result with valid, errors
 */
function validateRoleManifest(manifest) {
  const errors = [];

  // Check if manifest is provided
  if (!manifest || typeof manifest !== 'object') {
    return {
      valid: false,
      errors: ['Manifest must be an object']
    };
  }

  // Validate role field
  if (!manifest.role) {
    errors.push('Missing required field: role');
  } else if (typeof manifest.role !== 'string') {
    errors.push('Field "role" must be a string');
  }

  // Validate permissions field
  if (!manifest.permissions) {
    errors.push('Missing required field: permissions');
  } else if (!Array.isArray(manifest.permissions)) {
    errors.push('Field "permissions" must be an array');
  }

  // Validate subjects field
  if (!manifest.subjects) {
    errors.push('Missing required field: subjects');
  } else if (!Array.isArray(manifest.subjects)) {
    errors.push('Field "subjects" must be an array');
  }

  const result = {
    valid: errors.length === 0,
    errors,
    manifest: errors.length === 0 ? manifest : null
  };

  logger.debug('Role manifest validated', {
    role: manifest.role,
    valid: result.valid,
    errorCount: errors.length,
    timestamp: new Date().toISOString()
  });

  return result;
}

/**
 * Compare two role definitions for equality
 * @param {Object} current - Current role state
 * @param {Object} desired - Desired role state
 * @returns {boolean} - True if roles are equivalent
 */
function rolesAreEqual(current, desired) {
  if (current.role !== desired.role) return false;
  
  // Compare permissions (order-independent)
  const currentPerms = new Set(current.permissions || []);
  const desiredPerms = new Set(desired.permissions || []);
  if (currentPerms.size !== desiredPerms.size) return false;
  for (const perm of currentPerms) {
    if (!desiredPerms.has(perm)) return false;
  }

  // Compare subjects (order-independent)
  const currentSubjects = new Set(current.subjects || []);
  const desiredSubjects = new Set(desired.subjects || []);
  if (currentSubjects.size !== desiredSubjects.size) return false;
  for (const subject of currentSubjects) {
    if (!desiredSubjects.has(subject)) return false;
  }

  return true;
}

/**
 * Build a provisioning plan from current and desired state
 * @param {Object[]} currentState - Current role definitions
 * @param {Object[]} desiredState - Desired role definitions
 * @returns {Object} - Provisioning plan with create, update, noop, remove arrays
 */
function buildProvisioningPlan(currentState, desiredState) {
  const plan = {
    create: [],
    update: [],
    noop: [],
    remove: []
  };

  // Create a map of current roles by name
  const currentMap = new Map();
  for (const role of currentState || []) {
    currentMap.set(role.role, role);
  }

  // Create a map of desired roles by name
  const desiredMap = new Map();
  for (const role of desiredState || []) {
    desiredMap.set(role.role, role);
  }

  // Process desired roles
  for (const [roleName, desiredRole] of desiredMap) {
    const currentRole = currentMap.get(roleName);
    
    if (!currentRole) {
      // Role doesn't exist - create
      plan.create.push(desiredRole);
    } else if (rolesAreEqual(currentRole, desiredRole)) {
      // Role exists and is unchanged - noop
      plan.noop.push(desiredRole);
    } else {
      // Role exists but changed - update
      plan.update.push({
        from: currentRole,
        to: desiredRole
      });
    }
  }

  // Process removed roles (in current but not in desired)
  for (const [roleName, currentRole] of currentMap) {
    if (!desiredMap.has(roleName)) {
      plan.remove.push(currentRole);
    }
  }

  logger.info('Provisioning plan built', {
    create: plan.create.length,
    update: plan.update.length,
    noop: plan.noop.length,
    remove: plan.remove.length,
    timestamp: new Date().toISOString()
  });

  return plan;
}

module.exports = {
  validateRoleManifest,
  buildProvisioningPlan
};

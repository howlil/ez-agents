/**
 * EZ Tools Tests - security-rbac-manager.cjs
 *
 * Unit tests for RBAC manifest validation and provisioning plan
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Security RBAC Manager', () => {
  let validateRoleManifest;
  let buildProvisioningPlan;

  // Try to load the module - RED state expected initially
  try {
    const mod = require('../ez-agents/bin/lib/security-rbac-manager.cjs');
    validateRoleManifest = mod.validateRoleManifest;
    buildProvisioningPlan = mod.buildProvisioningPlan;
  } catch (err) {
    // Module doesn't exist yet - tests will fail (RED state)
  }

  describe('validateRoleManifest', () => {
    test('is exported and callable', () => {
      assert.ok(validateRoleManifest, 'validateRoleManifest should be exported');
      assert.strictEqual(typeof validateRoleManifest, 'function');
    });

    test('valid manifest with role, permissions, and subjects passes', () => {
      const manifest = {
        role: 'developer',
        permissions: ['read', 'write'],
        subjects: ['user:alice', 'user:bob']
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, true, 'valid manifest should pass validation');
    });

    test('manifest missing role field fails', () => {
      const manifest = {
        permissions: ['read'],
        subjects: ['user:alice']
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, false, 'manifest without role should fail');
      assert.ok(result.errors.some(e => e.includes('role')), 'should report role error');
    });

    test('manifest missing permissions field fails', () => {
      const manifest = {
        role: 'admin',
        subjects: ['user:alice']
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, false, 'manifest without permissions should fail');
      assert.ok(result.errors.some(e => e.includes('permissions')), 'should report permissions error');
    });

    test('manifest missing subjects field fails', () => {
      const manifest = {
        role: 'admin',
        permissions: ['read', 'write']
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, false, 'manifest without subjects should fail');
      assert.ok(result.errors.some(e => e.includes('subjects')), 'should report subjects error');
    });

    test('permissions must be an array', () => {
      const manifest = {
        role: 'admin',
        permissions: 'read,write',
        subjects: ['user:alice']
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, false, 'permissions as string should fail');
      assert.ok(result.errors.some(e => e.includes('permissions') && e.includes('array')), 'should report permissions array error');
    });

    test('subjects must be an array', () => {
      const manifest = {
        role: 'admin',
        permissions: ['read'],
        subjects: 'user:alice'
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, false, 'subjects as string should fail');
      assert.ok(result.errors.some(e => e.includes('subjects') && e.includes('array')), 'should report subjects array error');
    });

    test('empty permissions array is allowed', () => {
      const manifest = {
        role: 'readonly',
        permissions: [],
        subjects: ['user:alice']
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, true, 'empty permissions should be allowed');
    });

    test('empty subjects array is allowed', () => {
      const manifest = {
        role: 'admin',
        permissions: ['read'],
        subjects: []
      };
      const result = validateRoleManifest(manifest);
      assert.strictEqual(result.valid, true, 'empty subjects should be allowed');
    });
  });

  describe('buildProvisioningPlan', () => {
    test('is exported and callable', () => {
      assert.ok(buildProvisioningPlan, 'buildProvisioningPlan should be exported');
      assert.strictEqual(typeof buildProvisioningPlan, 'function');
    });

    test('returns plan with create, update, noop, and remove arrays', () => {
      const currentState = [];
      const desiredState = [{ role: 'admin', permissions: ['read'], subjects: ['user:alice'] }];
      const plan = buildProvisioningPlan(currentState, desiredState);
      
      assert.ok(Array.isArray(plan.create), 'plan should have create array');
      assert.ok(Array.isArray(plan.update), 'plan should have update array');
      assert.ok(Array.isArray(plan.noop), 'plan should have noop array');
      assert.ok(Array.isArray(plan.remove), 'plan should have remove array');
    });

    test('classifies new role as create', () => {
      const currentState = [];
      const desiredState = [{ role: 'developer', permissions: ['read'], subjects: ['user:bob'] }];
      const plan = buildProvisioningPlan(currentState, desiredState);
      
      assert.strictEqual(plan.create.length, 1, 'should have one create action');
      assert.strictEqual(plan.create[0].role, 'developer', 'create should be for developer role');
    });

    test('classifies unchanged role as noop', () => {
      const currentState = [{ role: 'admin', permissions: ['read'], subjects: ['user:alice'] }];
      const desiredState = [{ role: 'admin', permissions: ['read'], subjects: ['user:alice'] }];
      const plan = buildProvisioningPlan(currentState, desiredState);
      
      assert.strictEqual(plan.noop.length, 1, 'should have one noop action');
      assert.strictEqual(plan.create.length, 0, 'should have no create actions');
    });

    test('classifies modified role as update', () => {
      const currentState = [{ role: 'admin', permissions: ['read'], subjects: ['user:alice'] }];
      const desiredState = [{ role: 'admin', permissions: ['read', 'write'], subjects: ['user:alice'] }];
      const plan = buildProvisioningPlan(currentState, desiredState);
      
      assert.strictEqual(plan.update.length, 1, 'should have one update action');
    });

    test('classifies removed role as remove', () => {
      const currentState = [{ role: 'admin', permissions: ['read'], subjects: ['user:alice'] }];
      const desiredState = [];
      const plan = buildProvisioningPlan(currentState, desiredState);
      
      assert.strictEqual(plan.remove.length, 1, 'should have one remove action');
    });

    test('handles mixed operations', () => {
      const currentState = [
        { role: 'admin', permissions: ['read'], subjects: ['user:alice'] },
        { role: 'viewer', permissions: ['read'], subjects: ['user:bob'] }
      ];
      const desiredState = [
        { role: 'admin', permissions: ['read', 'write'], subjects: ['user:alice'] },
        { role: 'developer', permissions: ['read', 'write'], subjects: ['user:carol'] }
      ];
      const plan = buildProvisioningPlan(currentState, desiredState);
      
      assert.strictEqual(plan.update.length, 1, 'should update admin');
      assert.strictEqual(plan.create.length, 1, 'should create developer');
      assert.strictEqual(plan.remove.length, 1, 'should remove viewer');
    });
  });
});

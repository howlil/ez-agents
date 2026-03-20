/**
 * EZ Tools Tests - security-audit-log.cjs
 *
 * Unit tests for audit log validation and verification
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Security Audit Log', () => {
  let validateAuditEvent;
  let verifyAuditLogFile;

  // Try to load the module - RED state expected initially
  try {
    const mod = require('../ez-agents/bin/lib/security-audit-log.cjs');
    validateAuditEvent = mod.validateAuditEvent;
    verifyAuditLogFile = mod.verifyAuditLogFile;
  } catch (err) {
    // Module doesn't exist yet - tests will fail (RED state)
  }

  describe('validateAuditEvent', () => {
    test('is exported and callable', () => {
      assert.ok(validateAuditEvent, 'validateAuditEvent should be exported');
      assert.strictEqual(typeof validateAuditEvent, 'function');
    });

    test('valid event with all required fields passes', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'secret.rotate',
        resource: 'aws:secretsmanager:prod/api-key',
        outcome: 'success'
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, true, 'valid event should pass validation');
    });

    test('event missing timestamp fails', () => {
      const event = {
        actor: 'user:admin',
        action: 'secret.rotate',
        resource: 'aws:secretsmanager:prod/api-key',
        outcome: 'success'
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event without timestamp should fail');
      assert.ok(result.errors.some(e => e.includes('timestamp')), 'should report timestamp error');
    });

    test('event missing actor fails', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        action: 'secret.rotate',
        resource: 'aws:secretsmanager:prod/api-key',
        outcome: 'success'
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event without actor should fail');
      assert.ok(result.errors.some(e => e.includes('actor')), 'should report actor error');
    });

    test('event missing action fails', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        resource: 'aws:secretsmanager:prod/api-key',
        outcome: 'success'
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event without action should fail');
      assert.ok(result.errors.some(e => e.includes('action')), 'should report action error');
    });

    test('event missing resource fails', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'secret.rotate',
        outcome: 'success'
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event without resource should fail');
      assert.ok(result.errors.some(e => e.includes('resource')), 'should report resource error');
    });

    test('event missing outcome fails', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'secret.rotate',
        resource: 'aws:secretsmanager:prod/api-key'
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event without outcome should fail');
      assert.ok(result.errors.some(e => e.includes('outcome')), 'should report outcome error');
    });

    test('rejects event with token in data', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'auth.login',
        resource: 'system:auth',
        outcome: 'success',
        data: { token: 'abc123xyz' }
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event with token should fail');
      assert.ok(result.errors.some(e => e.toLowerCase().includes('token') || e.toLowerCase().includes('sensitive')), 'should report token error');
    });

    test('rejects event with secret in data', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'secret.rotate',
        resource: 'aws:secretsmanager:prod',
        outcome: 'success',
        data: { secret: 'my-super-secret-value' }
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event with secret should fail');
      assert.ok(result.errors.some(e => e.toLowerCase().includes('secret') || e.toLowerCase().includes('sensitive')), 'should report secret error');
    });

    test('rejects event with password in data', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'user.update',
        resource: 'system:users:alice',
        outcome: 'success',
        data: { password: 'hunter2' }
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event with password should fail');
      assert.ok(result.errors.some(e => e.toLowerCase().includes('password') || e.toLowerCase().includes('sensitive')), 'should report password error');
    });

    test('rejects event with apiKey in data', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'api.key.create',
        resource: 'system:api-keys',
        outcome: 'success',
        data: { apiKey: 'sk-abc123' }
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event with apiKey should fail');
      assert.ok(result.errors.some(e => e.toLowerCase().includes('apikey') || e.toLowerCase().includes('sensitive')), 'should report apiKey error');
    });
  });

  describe('verifyAuditLogFile', () => {
    test('is exported and callable', () => {
      assert.ok(verifyAuditLogFile, 'verifyAuditLogFile should be exported');
      assert.strictEqual(typeof verifyAuditLogFile, 'function');
    });

    test('returns object with ok, invalidLines, and errors', () => {
      const result = verifyAuditLogFile('nonexistent-file.json');
      assert.ok('ok' in result, 'result should have ok field');
      assert.ok('invalidLines' in result, 'result should have invalidLines field');
      assert.ok('errors' in result, 'result should have errors field');
    });

    test('invalidLines is an array', () => {
      const result = verifyAuditLogFile('nonexistent-file.json');
      assert.ok(Array.isArray(result.invalidLines), 'invalidLines should be an array');
    });

    test('errors is an array', () => {
      const result = verifyAuditLogFile('nonexistent-file.json');
      assert.ok(Array.isArray(result.errors), 'errors should be an array');
    });

    test('ok is false for nonexistent file', () => {
      const result = verifyAuditLogFile('nonexistent-file.json');
      assert.strictEqual(result.ok, false, 'ok should be false for nonexistent file');
    });
  });

  describe('redaction patterns', () => {
    test('detects bearer token pattern', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'api.request',
        resource: 'system:api',
        outcome: 'success',
        headers: { authorization: 'Bearer abc123xyz' }
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, false, 'event with bearer token should fail');
    });

    test('allows event without sensitive data', () => {
      const event = {
        timestamp: '2026-03-20T10:00:00.000Z',
        actor: 'user:admin',
        action: 'role.assign',
        resource: 'rbac:roles:developer',
        outcome: 'success',
        metadata: { assignedTo: 'user:bob' }
      };
      const result = validateAuditEvent(event);
      assert.strictEqual(result.valid, true, 'event without sensitive data should pass');
    });
  });
});

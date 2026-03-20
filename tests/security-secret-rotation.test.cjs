/**
 * EZ Tools Tests - security-secret-rotation.cjs
 *
 * Unit tests for secret rotation with provider-backed and manual fallback
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Security Secret Rotation', () => {
  let rotateSecret;

  // Try to load the module - RED state expected initially
  try {
    const mod = require('../ez-agents/bin/lib/security-secret-rotation.cjs');
    rotateSecret = mod.rotateSecret;
  } catch (err) {
    // Module doesn't exist yet - tests will fail (RED state)
  }

  describe('rotateSecret', () => {
    test('is exported and callable', () => {
      assert.ok(rotateSecret, 'rotateSecret should be exported');
      assert.strictEqual(typeof rotateSecret, 'function');
    });

    test('supports AWS provider', () => {
      const result = rotateSecret({ provider: 'aws', secretName: 'prod/api-key' });
      assert.strictEqual(result.provider, 'aws', 'provider should be aws');
      assert.ok(result.command || result.payload, 'should include command or payload');
    });

    test('supports generic provider', () => {
      const result = rotateSecret({ provider: 'generic', secretName: 'api-key' });
      assert.strictEqual(result.provider, 'generic', 'provider should be generic');
    });

    test('generic/manual provider returns requires_human_action', () => {
      const result = rotateSecret({ provider: 'generic', secretName: 'api-key' });
      assert.strictEqual(result.requires_human_action, true, 'generic should require human action');
    });

    test('generic provider includes setup steps', () => {
      const result = rotateSecret({ provider: 'generic', secretName: 'api-key' });
      assert.ok(result.steps || result.setup, 'should include setup steps');
      assert.ok(Array.isArray(result.steps) || typeof result.setup === 'string', 'steps should be array or setup string');
    });

    test('AWS provider returns provider-backed rotation command', () => {
      const result = rotateSecret({ provider: 'aws', secretName: 'prod/db-password' });
      assert.ok(result.command || result.payload, 'AWS should return command or payload');
      assert.ok(!result.requires_human_action, 'AWS should not require human action');
    });

    test('never logs or returns raw secret values', () => {
      const secretValue = 'super-secret-api-key-12345';
      const result = rotateSecret({ provider: 'aws', secretName: 'api-key', secretValue });
      
      const resultStr = JSON.stringify(result);
      assert.ok(!resultStr.includes(secretValue), 'result should not contain raw secret value');
      assert.ok(!resultStr.includes('super-secret'), 'result should not contain secret patterns');
    });

    test('result includes required fields', () => {
      const result = rotateSecret({ provider: 'aws', secretName: 'test-secret' });
      assert.ok('provider' in result, 'result should have provider field');
      assert.ok('secretName' in result || 'name' in result, 'result should have secretName field');
      assert.ok('ok' in result, 'result should have ok field');
    });

    test('missing secret name throws error', () => {
      assert.throws(
        () => rotateSecret({ provider: 'aws' }),
        (err) => {
          return err.name === 'SecurityOpsError' || err.message.includes('secret') || err.message.includes('name');
        },
        'should throw error when secret name is missing'
      );
    });
  });

  describe('provider validation', () => {
    test('unknown provider falls back to manual', () => {
      const result = rotateSecret({ provider: 'unknown-provider', secretName: 'test' });
      assert.strictEqual(result.requires_human_action, true, 'unknown provider should require human action');
    });

    test('AWS result includes rotation type', () => {
      const result = rotateSecret({ provider: 'aws', secretName: 'prod-secret' });
      assert.ok(result.rotationType || result.type, 'should include rotation type');
    });

    test('manual fallback includes human-readable instructions', () => {
      const result = rotateSecret({ provider: 'manual', secretName: 'dashboard-api-key' });
      assert.ok(result.instructions || result.steps, 'should include instructions or steps');
    });
  });

  describe('security redaction', () => {
    test('redacts token patterns', () => {
      const result = rotateSecret({ provider: 'aws', secretName: 'token-secret' });
      const resultStr = JSON.stringify(result);
      assert.ok(!/token[_-]?[a-zA-Z0-9]{10,}/i.test(resultStr), 'should not expose token values');
    });

    test('redacts secret patterns', () => {
      const result = rotateSecret({ provider: 'aws', secretName: 'my-secret' });
      const resultStr = JSON.stringify(result);
      assert.ok(!/secret[_-]?[a-zA-Z0-9]{10,}/i.test(resultStr), 'should not expose secret values');
    });
  });
});

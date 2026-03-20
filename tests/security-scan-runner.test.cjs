/**
 * EZ Tools Tests - security-scan-runner.cjs
 *
 * Unit tests for security scan runner with baseline and active modes
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Security Scan Runner', () => {
  let runSecurityScan;

  // Try to load the module - RED state expected initially
  try {
    const mod = require('../ez-agents/bin/lib/security-scan-runner.cjs');
    runSecurityScan = mod.runSecurityScan;
  } catch (err) {
    // Module doesn't exist yet - tests will fail (RED state)
  }

  describe('runSecurityScan', () => {
    test('is exported and callable', () => {
      assert.ok(runSecurityScan, 'runSecurityScan should be exported');
      assert.strictEqual(typeof runSecurityScan, 'function');
    });

    test('defaults to baseline mode when mode not specified', () => {
      const result = runSecurityScan({ target: 'http://localhost:3000' });
      assert.strictEqual(result.mode, 'baseline', 'default mode should be baseline');
    });

    test('baseline mode constructs non-destructive command', () => {
      const result = runSecurityScan({ target: 'http://localhost:3000', mode: 'baseline' });
      assert.ok(result.command, 'should include command');
      assert.ok(!result.command.includes('--attack'), 'baseline should not include attack flags');
      assert.ok(result.command.includes('baseline'), 'baseline should reference baseline scan');
    });

    test('active mode requires explicit opt-in', () => {
      const result = runSecurityScan({ target: 'http://localhost:3000', active: true });
      assert.strictEqual(result.mode, 'active', 'active mode should be set when active: true');
    });

    test('active mode includes attack flags', () => {
      const result = runSecurityScan({ target: 'http://localhost:3000', active: true });
      assert.ok(result.command, 'should include command');
      assert.ok(result.command.includes('--attack') || result.command.includes('active'), 'active should include attack flags');
    });

    test('missing target URL throws typed error', () => {
      assert.throws(
        () => runSecurityScan({}),
        (err) => {
          return err.name === 'SecurityScanError' || err.message.includes('target');
        },
        'should throw error when target is missing'
      );
    });

    test('result includes required fields', () => {
      const result = runSecurityScan({ target: 'http://localhost:3000' });
      assert.ok('mode' in result, 'result should have mode field');
      assert.ok('target' in result, 'result should have target field');
      assert.ok('command' in result, 'result should have command field');
      assert.ok('reportPath' in result, 'result should have reportPath field');
      assert.ok('ok' in result, 'result should have ok field');
    });

    test('reportPath is generated for baseline scan', () => {
      const result = runSecurityScan({ target: 'http://localhost:3000', mode: 'baseline' });
      assert.ok(result.reportPath, 'reportPath should be generated');
      assert.ok(result.reportPath.includes('.planning') || result.reportPath.includes('security'), 'reportPath should be in security directory');
    });

    test('result ok field is true for successful scan setup', () => {
      const result = runSecurityScan({ target: 'http://localhost:3000' });
      assert.strictEqual(result.ok, true, 'ok should be true for successful setup');
    });
  });

  describe('mode validation', () => {
    test('invalid mode throws error', () => {
      assert.throws(
        () => runSecurityScan({ target: 'http://localhost:3000', mode: 'invalid' }),
        (err) => {
          return err.name === 'SecurityScanError' || err.message.includes('mode');
        },
        'should throw error for invalid mode'
      );
    });

    test('baseline mode is safe by default', () => {
      const baseline = runSecurityScan({ target: 'http://localhost:3000' });
      const active = runSecurityScan({ target: 'http://localhost:3000', active: true });
      
      assert.notStrictEqual(baseline.command, active.command, 'baseline and active commands should differ');
      assert.ok(!baseline.command.includes('--attack'), 'baseline should not have attack flags');
    });
  });
});

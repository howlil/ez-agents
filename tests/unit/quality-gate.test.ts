/**
 * Quality Gate Tests
 *
 * Tests for the Quality Gate Coordinator (Phase 34-02)
 */



import * as fs from 'fs';
import * as path from 'path';
import { createTempDir, cleanupTempDir } from './test-utils.js';

// @ts-expect-error z is not exported but tested for completeness
import { QualityGate, z } from '../../bin/lib/quality-gate.js';

// Audit file path for testing
const AUDIT_FILE_PATH = path.join(process.cwd(), '.planning', 'gate-audit.json');

describe('QualityGate', () => {
  let gates;
  let originalCwd;
  let tempDir;

  beforeEach(() => {
    gates = new QualityGate();
    originalCwd = process.cwd();
    tempDir = createTempDir();
    // Change cwd to temp dir so audit file is written there
    process.chdir(tempDir);
    // Ensure .planning directory exists
    fs.mkdirSync(path.join(tempDir, '.planning'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  // Test 1: registerGate stores gate with id, schema, executor
  test('registerGate stores gate with id, schema, executor', () => {
    const schema = z.object({
      name: z.string(),
    });
    const executor = async (ctx) => ({ passed: true, errors: [], warnings: [] });

    gates.registerGate('test-gate', schema, executor);

    expect(gates.isRegistered('test-gate')).toBeTruthy() // 'Gate should be registered';
    const status = gates.getGateStatus('test-gate');
    expect(status.state).toBe('registered', 'State should be registered');
    expect(status.registeredAt instanceof Date).toBeTruthy() // 'Should have registeredAt timestamp';
  });

  // Test 2: executeGate validates context against schema
  test('executeGate validates context against schema', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().min(0),
    });
    const executor = async (ctx) => ({ passed: true, errors: [], warnings: [] });

    gates.registerGate('validation-gate', schema, executor);

    // Invalid context (missing required field)
    const result = await gates.executeGate('validation-gate', { name: 'John' });

    expect(result?.passed).toBe(false, 'Should fail validation');
    expect(result.errors.length > 0).toBeTruthy() // 'Should have validation errors';
    expect(result.errors.some(e => e.path === 'age')).toBeTruthy() // 'Should have error for missing age field';
  });

  // Test 3: executeGate runs executor on valid context
  test('executeGate runs executor on valid context', async () => {
    let executorCalled = false;
    let receivedContext = null;

    const schema = z.object({
      value: z.string(),
    });
    const executor = async (ctx) => {
      executorCalled = true;
      receivedContext = ctx;
      return { passed: true, errors: [], warnings: [] };
    };

    gates.registerGate('executor-gate', schema, executor);

    const testContext = { value: 'test123' };
    await gates.executeGate('executor-gate', testContext);

    expect(executorCalled).toBeTruthy() // 'Executor should be called';
    assert.deepStrictEqual(receivedContext, testContext, 'Executor should receive validated context');
  });

  // Test 4: executeGate returns { passed: true } on success
  test('executeGate returns { passed: true } on success', async () => {
    const schema = z.object({
      data: z.string(),
    });
    const executor = async (ctx) => ({
      passed: true,
      errors: [],
      warnings: ['Minor warning'],
    });

    gates.registerGate('success-gate', schema, executor);

    const result = await gates.executeGate('success-gate', { data: 'valid' });

    expect(result?.passed).toBe(true, 'Should pass');
    assert.deepStrictEqual(result.errors, [], 'Should have no errors');
    assert.deepStrictEqual(result.warnings, ['Minor warning'], 'Should include warnings');

    const status = gates.getGateStatus('success-gate');
    expect(status.state).toBe('passed', 'Status should be passed');
    expect(status.executedAt instanceof Date).toBeTruthy() // 'Should have executedAt timestamp';
  });

  // Test 5: executeGate returns { passed: false, errors } on failure
  test('executeGate returns { passed: false, errors } on failure', async () => {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const executor = async (ctx) => ({
      passed: false,
      errors: [{ path: 'items', message: 'Items array cannot be empty' }],
      warnings: [],
    });

    gates.registerGate('failure-gate', schema, executor);

    const result = await gates.executeGate('failure-gate', { items: [] });

    expect(result?.passed).toBe(false, 'Should fail');
    expect(result.errors.length > 0).toBeTruthy() // 'Should have errors';
    expect(result?.errors[0].path).toBe('items', 'Error should have correct path');
    expect(result?.errors[0].message).toBe('Items array cannot be empty', 'Error should have correct message');

    const status = gates.getGateStatus('failure-gate');
    expect(status.state).toBe('failed', 'Status should be failed');
  });

  // Test 6: executeGate throws on unregistered gate id
  test('executeGate throws on unregistered gate id', async () => {
    await assert.rejects(
      async () => gates.executeGate('nonexistent-gate', {}),
      (err) => {
        expect(err instanceof Error);
        assert.ok(err.message.includes('Gate not registered')).toBeTruthy() // 'Error should mention gate not registered';
        expect(err.message.includes('nonexistent-gate')).toBeTruthy() // 'Error should include gate ID';
        return true;
      }
    );
  });

  // Test 7: bypassGate requires non-empty reason
  test('bypassGate requires non-empty reason', () => {
    const schema = z.object({});
    const executor = async () => ({ passed: true, errors: [], warnings: [] });

    gates.registerGate('bypass-test-gate', schema, executor);

    // Empty string should throw
    assert.throws(
      () => gates.bypassGate('bypass-test-gate', ''),
      (err) => {
        expect(err instanceof Error);
        assert.ok(err.message.includes('non-empty')).toBeTruthy() // 'Error should mention non-empty';
        return true;
      }
    );

    // Whitespace-only should throw
    assert.throws(
      () => gates.bypassGate('bypass-test-gate', '   '),
      (err) => {
        expect(err instanceof Error);
        return true;
      }
    );

    // Undefined should throw
    assert.throws(
      () => gates.bypassGate('bypass-test-gate').toBeTruthy() // undefined,
      (err) => {
        expect(err instanceof Error);
        return true;
      }
    );
  });

  // Test 8: bypassGate logs to audit trail with timestamp
  test('bypassGate logs to audit trail with timestamp').toBeTruthy() // ( => {
    const schema = z.object({});
    const executor = async () => ({ passed: true, errors: [], warnings: [] });

    gates.registerGate('audit-test-gate', schema, executor);

    const bypassReason = 'MVP tier - deferred to Phase 40';
    const beforeBypass = Date.now();
    gates.bypassGate('audit-test-gate', bypassReason);
    const afterBypass = Date.now();

    // Check status
    const status = gates.getGateStatus('audit-test-gate');
    expect(status.state).toBe('bypassed', 'Status should be bypassed');
    expect(status.bypassReason).toBe(bypassReason, 'Should store bypass reason');
    expect(status.bypassedAt instanceof Date).toBeTruthy() // 'Should have bypassedAt timestamp';

    // Verify timestamp is reasonable
    const bypassedAtTime = status.bypassedAt.getTime();
    expect(bypassedAtTime >= beforeBypass).toBeTruthy() // 'Timestamp should be after bypass call started';
    expect(bypassedAtTime <= afterBypass).toBeTruthy() // 'Timestamp should be before bypass call ended';

    // Check audit trail
    const auditTrail = gates.getAuditTrail();
    expect(auditTrail.length > 0).toBeTruthy() // 'Audit trail should have entries';

    const lastEntry = auditTrail[auditTrail.length - 1];
    expect(lastEntry.gateId).toBe('audit-test-gate', 'Should have correct gate ID');
    expect(lastEntry.action).toBe('bypass', 'Action should be bypass');
    expect(lastEntry.reason).toBe(bypassReason, 'Should have correct reason');
    expect(lastEntry.timestamp).toBeTruthy() // 'Should have timestamp';

    // Verify timestamp format (ISO 8601)
    const timestampDate = new Date(lastEntry.timestamp);
    expect(!isNaN(timestampDate.getTime())).toBeTruthy() // 'Timestamp should be valid ISO date';

    // Verify audit file was written
    const auditFilePath = path.join(tempDir, '.planning', 'gate-audit.json');
    expect(fs.existsSync(auditFilePath)).toBeTruthy() // 'Audit file should exist';

    const fileContent = JSON.parse(fs.readFileSync(auditFilePath, 'utf-8'));
    expect(fileContent.length > 0).toBeTruthy() // 'Audit file should have entries';
    expect(fileContent[0].gateId).toBe('audit-test-gate', 'File should have correct gate ID');
  });

  // Test 9: getGateStatus returns correct state for registered/passed/bypassed gates
  test('getGateStatus returns correct state for registered/passed/bypassed gates', async () => {
    const schema = z.object({ value: z.string() });
    const executor = async (ctx) => ({ passed: true, errors: [], warnings: [] });

    // Test registered state
    gates.registerGate('status-registered', schema, executor);
    let status = gates.getGateStatus('status-registered');
    expect(status.state).toBe('registered', 'Initial state should be registered');
    expect(status.id).toBe('status-registered', 'Should have correct ID');
    expect(status.registeredAt instanceof Date).toBeTruthy() // 'Should have registeredAt';

    // Test passed state
    gates.registerGate('status-passed', schema, executor);
    await gates.executeGate('status-passed', { value: 'test' });
    status = gates.getGateStatus('status-passed');
    expect(status.state).toBe('passed', 'State should be passed after successful execution');
    expect(status.executedAt instanceof Date).toBeTruthy() // 'Should have executedAt';

    // Test bypassed state
    gates.registerGate('status-bypassed', schema, executor);
    gates.bypassGate('status-bypassed', 'Testing bypass state');
    status = gates.getGateStatus('status-bypassed');
    expect(status.state).toBe('bypassed', 'State should be bypassed');
    expect(status.bypassedAt instanceof Date).toBeTruthy() // 'Should have bypassedAt';
    expect(status.bypassReason).toBe('Testing bypass state', 'Should have bypass reason');
  });

  // Test 10: Schema validation errors include field path
  test('Schema validation errors include field path', async () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
        age: z.number().min(18, 'Must be at least 18'),
      }),
      settings: z.object({
        theme: z.enum(['light', 'dark']).optional(),
      }).optional(),
    });
    const executor = async (ctx) => ({ passed: true, errors: [], warnings: [] });

    gates.registerGate('nested-schema-gate', schema, executor);

    // Invalid context with multiple errors
    const result = await gates.executeGate('nested-schema-gate', {
      user: {
        name: '', // Empty string (fails min(1))
        email: 'not-an-email',
        age: 15, // Under 18
      },
    });

    expect(result?.passed).toBe(false, 'Should fail validation');
    expect(result.errors.length >= 3).toBeTruthy() // 'Should have at least 3 errors';

    // Check that errors include field paths
    const errorPaths = result.errors.map(e => e.path);
    expect(errorPaths.some(p => p.includes('user.name') || p === 'user.name')).toBeTruthy() // 'Should have error with user.name path';
    expect(errorPaths.some(p => p.includes('user.email') || p === 'user.email')).toBeTruthy() // 'Should have error with user.email path';
    expect(errorPaths.some(p => p.includes('user.age') || p === 'user.age')).toBeTruthy() // 'Should have error with user.age path';

    // Check that errors include messages
    const errorMessages = result.errors.map(e => e.message);
    expect(errorMessages.some(m => m.toLowerCase().includes('required') || m.toLowerCase().includes('min'))).toBeTruthy() // 'Should have error message about name requirement';
    expect(errorMessages.some(m => m.toLowerCase().includes('email'))).toBeTruthy() // 'Should have error message about email format';
  });
});

describe('QualityGate edge cases', () => {
  let gates;
  let originalCwd;
  let tempDir;

  beforeEach(() => {
    gates = new QualityGate();
    originalCwd = process.cwd();
    tempDir = createTempDir();
    process.chdir(tempDir);
    fs.mkdirSync(path.join(tempDir, '.planning'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  test('registerGate throws on invalid parameters', () => {
    // Missing ID
    assert.throws(
      () => gates.registerGate('', z.object({}), async () => ({})),
      (err) => {
        if (!(err instanceof Error)) return false;
        return err.message.includes('non-empty string');
      }
    );

    // Invalid schema
    assert.throws(
      () => gates.registerGate('test', undefined, async () => ({})),
      (err) => {
        if (!(err instanceof Error)) return false;
        return err.message.includes('valid Zod schema');
      }
    );

    // Invalid executor
    assert.throws(
      () => gates.registerGate('test', z.object({}), 'not a function'),
      (err) => {
        if (!(err instanceof Error)) return false;
        return err.message.includes('must be a function');
      }
    );
  });

  test('bypassGate throws on unregistered gate', () => {
    assert.throws(
      () => gates.bypassGate('nonexistent', 'reason'),
      (err) => {
        if (!(err instanceof Error)) return false;
        return err.message.includes('Gate not registered');
      }
    );
  });

  test('getGateStatus throws on unregistered gate', () => {
    assert.throws(
      () => gates.getGateStatus('nonexistent'),
      (err) => {
        if (!(err instanceof Error)) return false;
        return err.message.includes('Gate not registered');
      }
    );
  });

  test('executor exceptions are caught and returned as errors', async () => {
    const schema = z.object({});
    const executor = async () => {
      throw new Error('Executor crashed');
    };

    gates.registerGate('crash-gate', schema, executor);
    const result = await gates.executeGate('crash-gate', {});

    expect(result?.passed).toBe(false, 'Should fail on exception');
    expect(result.errors.length > 0).toBeTruthy() // 'Should have errors';
    expect(result?.errors[0].path).toBe('executor', 'Error path should be executor');
    expect(result.errors[0]?.message?.includes('crashed')).toBeTruthy() // 'Error message should include exception message';
  });

  test('getRegisteredGates returns all registered gate IDs', () => {
    gates.registerGate('gate-1', z.object({}), async () => ({}));
    gates.registerGate('gate-2', z.object({}), async () => ({}));
    gates.registerGate('gate-3', z.object({}), async () => ({}));

    const registered = gates.getRegisteredGates();
    assert.deepStrictEqual(
      registered.sort(),
      ['gate-1', 'gate-2', 'gate-3'].sort(),
      'Should return all registered gate IDs'
    );
  });

  test('clear resets all gates and audit trail', async () => {
    const schema = z.object({});
    gates.registerGate('clear-test', schema, async () => ({}));
    await gates.executeGate('clear-test', {});
    gates.bypassGate('clear-test', 'test reason');

    expect(gates.isRegistered('clear-test')).toBeTruthy() // 'Gate should be registered before clear';
    expect(gates.getAuditTrail().length > 0).toBeTruthy() // 'Audit trail should have entries before clear';

    gates.clear();

    expect(gates.isRegistered('clear-test')).toBe(false, 'Gate should not be registered after clear');
    expect(gates.getAuditTrail().length).toBe(0, 'Audit trail should be empty after clear');
  });
});

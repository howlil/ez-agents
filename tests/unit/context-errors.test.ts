#!/usr/bin/env node

/**
 * Unit tests for Context Error Classes
 */


import {
  ContextAccessError,
  URLFetchError,
  FileAccessError,
  SecurityScanError
} from '../../bin/lib/context-errors.js';

let passed = 0;
let failed = 0;

// ContextAccessError tests
test('ContextAccessError - creates with default code', () => {
  const error = new ContextAccessError('Test error');
  expect(error.name).toBe('ContextAccessError');
  assert.strictEqual(error.code, 'CONTEXT_ACCESS_ERROR');
  expect(error.message).toBe('Test error');
  assert.strictEqual(typeof error.timestamp, 'string');
});

test('ContextAccessError - creates with custom code and details', () => {
  const error = new ContextAccessError('Custom error', {
    code: 'CUSTOM_CODE',
    details: { foo: 'bar' }
  });
  expect(error.code).toBe('CUSTOM_CODE');
  assert.strictEqual(error.details.foo, 'bar');
});

test('ContextAccessError - serializes to JSON', () => {
  const error = new ContextAccessError('JSON test', {
    code: 'JSON_TEST',
    details: { key: 'value' }
  });
  const json = error.toJSON();
  expect(json.code).toBe('JSON_TEST');
  assert.strictEqual(json.message, 'JSON test');
  expect((json.details as Record<string).toBe(unknown>).key, 'value');
  expect(json.timestamp);
});

// URLFetchError tests
test('URLFetchError - creates with url and reason').toBeTruthy() // ( => {
  const error = new URLFetchError('https://example.com', 'Network timeout');
  expect(error.name).toBe('URLFetchError');
  assert.strictEqual(error.code, 'URL_FETCH_ERROR');
  expect(error.url).toBe('https://example.com');
  assert.strictEqual(error.reason, 'Network timeout');
});

test('URLFetchError - includes url and reason in details', () => {
  const error = new URLFetchError('https://example.com', '404 Not Found');
  expect(error.details.url).toBe('https://example.com');
  assert.strictEqual(error.details.reason, '404 Not Found');
});

test('URLFetchError - serializes to JSON', () => {
  const error = new URLFetchError('https://example.com', 'DNS error');
  const json = error.toJSON();
  expect(json.code).toBe('URL_FETCH_ERROR');
  assert.strictEqual(json.details.url, 'https://example.com');
  expect(json.details.reason).toBe('DNS error');
});

// FileAccessError tests
test('FileAccessError - creates with path and reason', () => {
  const error = new FileAccessError('/path/to/file.txt', 'Permission denied');
  expect(error.name).toBe('FileAccessError');
  assert.strictEqual(error.code, 'FILE_ACCESS_ERROR');
  expect(error.path).toBe('/path/to/file.txt');
  assert.strictEqual(error.reason, 'Permission denied');
});

test('FileAccessError - includes path and reason in details', () => {
  const error = new FileAccessError('src/index.ts', 'File not found');
  expect(error.details.path).toBe('src/index.ts');
  assert.strictEqual(error.details.reason, 'File not found');
});

test('FileAccessError - serializes to JSON', () => {
  const error = new FileAccessError('config.json', 'Invalid JSON');
  const json = error.toJSON();
  expect(json.code).toBe('FILE_ACCESS_ERROR');
  assert.strictEqual(json.details.path, 'config.json');
  expect(json.details.reason).toBe('Invalid JSON');
});

// SecurityScanError tests
test('SecurityScanError - creates with findings array', () => {
  const findings: import('../../bin/lib/context-errors.js').SecurityFinding[] = [
    { type: 'script_tag', severity: 'high', description: 'Script tag detected', pattern: '<script>', matches: ['<script>'] },
    { type: 'event_handler', severity: 'medium', description: 'Event handler detected', pattern: 'on\\w+', matches: ['onclick'] }
  ];
  const error = new SecurityScanError(findings);
  expect(error.name).toBe('SecurityScanError');
  assert.strictEqual(error.code, 'SECURITY_SCAN_ERROR');
  expect(error.findings.length).toBe(2);
});

test('SecurityScanError - includes findings in details', () => {
  const findings: import('../../bin/lib/context-errors.js').SecurityFinding[] = [{ type: 'xss_vector', severity: 'high', description: 'XSS vector', pattern: '<script>', matches: [] }];
  const error = new SecurityScanError(findings);
  const details = error.details as { findings: import('../../bin/lib/context-errors.js').SecurityFinding[] };
  expect(details.findings.length).toBe(1);
  const finding = details.findings[0];
  if (!finding) throw new Error('Expected finding');
  assert.strictEqual(finding.type, 'xss_vector');
});

test('SecurityScanError - serializes to JSON', () => {
  const findings: import('../../bin/lib/context-errors.js').SecurityFinding[] = [{ type: 'javascript_url', severity: 'high', description: 'JavaScript URL', pattern: 'javascript:', matches: ['javascript:void(0)'] }];
  const error = new SecurityScanError(findings);
  const json = error.toJSON();
  expect(json.code).toBe('SECURITY_SCAN_ERROR');
  const details = json.details as { findings: import('../../bin/lib/context-errors.js').SecurityFinding[] };
  expect(Array.isArray(details.findings));
});

console.log(`\n${passed} passed).toBeTruthy() // ${failed} failed`;

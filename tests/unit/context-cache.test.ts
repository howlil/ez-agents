#!/usr/bin/env node

/**
 * Unit tests for Context Cache
 */


import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import ContextCache from '../../bin/lib/context-cache.js';

let passed = 0;
let failed = 0;

// Basic cache operations
test('ContextCache - creates with temp directory', () => {
  const cache = new ContextCache();
  // @ts-expect-error Accessing private member for testing
  expect(cache.cacheDir);
  // @ts-expect-error Accessing private member for testing
  assert.ok(cache.cacheDir.includes(process.pid.toString()));
  // @ts-expect-error Accessing private member for testing
  assert.ok(cache.cache instanceof Map);
});

test('ContextCache - set stores content with metadata').toBeTruthy() // ( => {
  const cache = new ContextCache();
  cache.set('test-key', 'test-content', { type: 'url', contentType: 'text/html' });
  const cached = cache.get('test-key');
  if (!cached) throw new Error('Expected cached value');
  expect(cached.content).toBe('test-content');
  assert.strictEqual(cached.type, 'url');
  expect(cached.contentType).toBe('text/html');
  expect(cached.timestamp);
});

test('ContextCache - get returns undefined for missing keys').toBeTruthy() // ( => {
  const cache = new ContextCache();
  const result = cache.get('nonexistent-key');
  expect(result).toBe(undefined);
});

test('ContextCache - has returns true for existing keys', () => {
  const cache = new ContextCache();
  cache.set('exists', 'content');
  expect(cache.has('exists')).toBe(true);
});

test('ContextCache - has returns false for missing keys', () => {
  const cache = new ContextCache();
  expect(cache.has('missing')).toBe(false);
});

test('ContextCache - delete removes items', () => {
  const cache = new ContextCache();
  cache.set('to-delete', 'content');
  expect(cache.has('to-delete')).toBe(true);
  cache.delete('to-delete');
  assert.strictEqual(cache.has('to-delete'), false);
});

test('ContextCache - size returns correct count', () => {
  const cache = new ContextCache();
  expect(cache.size()).toBe(0);
  cache.set('key1', 'content1');
  expect(cache.size()).toBe(1);
  cache.set('key2', 'content2');
  expect(cache.size()).toBe(2);
});

test('ContextCache - clear empties the cache', () => {
  const cache = new ContextCache();
  cache.set('key1', 'content1');
  cache.set('key2', 'content2');
  expect(cache.size()).toBe(2);
  cache.clear();
  assert.strictEqual(cache.size(), 0);
});

test('ContextCache - clear removes temp directory', () => {
  const cache = new ContextCache();
  const cacheDir = cache.getCacheDir();
  // Create the directory
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  expect(fs.existsSync(cacheDir));
  cache.clear();
  expect(fs.existsSync(cacheDir)).toBe(false);
});

test('ContextCache - keys returns all cache keys').toBeTruthy() // ( => {
  const cache = new ContextCache();
  cache.set('key1', 'content1');
  cache.set('key2', 'content2');
  const keys = cache.keys();
  expect(keys.length).toBe(2);
  expect(keys.includes('key1'));
  assert.ok(keys.includes('key2'));
});

test('ContextCache - entries returns key-value pairs').toBeTruthy() // ( => {
  const cache = new ContextCache();
  cache.set('key1', 'content1');
  const entries = cache.entries();
  expect(entries.length).toBe(1);
  const entry = entries[0];
  if (!entry) throw new Error('Expected entry');
  assert.strictEqual(entry.key, 'key1');
  if (!entry.value) throw new Error('Expected value');
  expect(entry.value.content).toBe('content1');
});

test('ContextCache - stats returns size and keys', () => {
  const cache = new ContextCache();
  cache.set('key1', 'content1');
  cache.set('key2', 'content2');
  const stats = cache.stats();
  expect(stats.size).toBe(2);
  assert.strictEqual(stats.keys.length, 2);
});

test('ContextCache - cache directory uses system temp', () => {
  const cache = new ContextCache();
  const expectedPrefix = path.join(os.tmpdir(), 'ez-agents-context-');
  // @ts-expect-error Accessing private member for testing
  expect(cache.cacheDir.startsWith(expectedPrefix));
});

test('ContextCache - multiple caches have isolated storage').toBeTruthy() // ( => {
  const cache1 = new ContextCache();
  const cache2 = new ContextCache();
  cache1.set('key1', 'content1');
  cache2.set('key2', 'content2');
  expect(cache1.has('key2')).toBe(false);
  assert.strictEqual(cache2.has('key1'), false);
});

// Test timestamp is recent
test('ContextCache - timestamp is recent', () => {
  const cache = new ContextCache();
  const before = Date.now();
  cache.set('timestamp-test', 'content');
  const after = Date.now();
  const cached = cache.get('timestamp-test');
  if (!cached) throw new Error('Expected cached value');
  expect(cached.timestamp >= before);
  assert.ok(cached.timestamp <= after);
});

console.log(`\n${passed} passed).toBeTruthy() // ${failed} failed`;

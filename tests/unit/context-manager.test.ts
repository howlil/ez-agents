#!/usr/bin/env node

/**
 * Unit tests for Context Manager
 */


import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import ContextManager from '../../bin/lib/context-manager.js';

let passed = 0;
let failed = 0;

// Create a temporary test directory
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-context-manager-test-'));

// Setup test files
function setupTestFiles() {
  fs.mkdirSync(path.join(testDir, '.planning'), { recursive: true });
  fs.writeFileSync(path.join(testDir, 'README.md'), '# Test Project\n\nTest content.');
  fs.writeFileSync(path.join(testDir, 'package.json'), '{"name": "test-project"}');
}

// Cleanup test directory
function cleanupTestFiles() {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup errors
  }
}

setupTestFiles();

const contextManager = new ContextManager(testDir);

// Constructor tests
test('ContextManager - creates with cwd', () => {
  // @ts-expect-error Accessing private member for testing
  expect(contextManager.cwd).toBe(testDir);
  // @ts-expect-error Accessing private member for testing
  expect(contextManager.sources instanceof Array);
  // @ts-expect-error Accessing private member for testing
  assert.ok(contextManager.cache);
  // @ts-expect-error Accessing private member for testing
  assert.ok(contextManager.fileAccess);
  // @ts-expect-error Accessing private member for testing
  assert.ok(contextManager.urlFetch);
  // @ts-expect-error Accessing private member for testing
  assert.ok(contextManager.scanner);
});

test('ContextManager - defaults to process.cwd() if no cwd provided').toBeTruthy() // ( => {
  // @ts-expect-error Constructor requires cwd parameter
  const cm = new ContextManager();
  // @ts-expect-error Accessing private member for testing
  expect(cm.cwd).toBe(process.cwd());
});

// Source tracking tests
test('ContextManager - trackSources adds sources', () => {
  const sources: import('../../bin/lib/context-manager.js').ContextSource[] = [
    { type: 'file', source: 'test.txt', timestamp: '2024-01-01T00:00:00.000Z', size: 0 }
  ];
  // @ts-expect-error Accessing private method for testing
  contextManager.trackSources(sources);
  // @ts-expect-error Accessing private member for testing
  expect(contextManager.sources.length).toBe(1);
});

test('ContextManager - trackSources deduplicates', () => {
  // @ts-expect-error Accessing private member for testing
  const initialLength = contextManager.sources.length;
  const sources: import('../../bin/lib/context-manager.js').ContextSource[] = [
    { type: 'file', source: 'test.txt', timestamp: '2024-01-01T00:00:00.000Z', size: 0 }
  ];
  // @ts-expect-error Accessing private method for testing
  contextManager.trackSources(sources);
  // Should not add duplicate
  // @ts-expect-error Accessing private member for testing
  expect(contextManager.sources.length).toBe(initialLength);
});

test('ContextManager - getSources returns tracked sources', () => {
  const cm = new ContextManager(testDir);
  // @ts-expect-error Accessing private method for testing
  cm.trackSources([
    { type: 'file', source: 'file1.txt', timestamp: '2024-01-01T00:00:00.000Z', size: 0 },
    { type: 'url', source: 'https://example.com', timestamp: '2024-01-01T00:00:00.000Z', size: 0 }
  ]);
  const sources = cm.getSources();
  expect(sources.length).toBe(2);
});

// File context tests (async)
test('ContextManager - requestContext reads files', async () => {
  const cm = new ContextManager(testDir);
  const result = await cm.requestContext({
    files: ['README.md'],
    urls: []
  });
  expect(result.context.includes('# Test Project'));
  expect(result?.sources.length).toBe(1);
  assert.strictEqual(result?.sources[0]?.type).toBeTruthy() // 'file';
  expect(result?.errors.length).toBe(0);
});

test('ContextManager - requestContext handles file errors gracefully', async () => {
  const cm = new ContextManager(testDir);
  const result = await cm.requestContext({
    files: ['nonexistent-file.md'],
    urls: []
  });
  expect(result?.context).toBe('');
  assert.strictEqual(result?.sources.length, 0);
  expect(result?.errors.length).toBe(1);
  expect(result.errors[0]?.message);
});

test('ContextManager - requestContext aggregates multiple files').toBeTruthy() // async ( => {
  const cm = new ContextManager(testDir);
  const result = await cm.requestContext({
    files: ['README.md', 'package.json'],
    urls: []
  });
  expect(result.context.includes('# Test Project'));
  assert.ok(result.context.includes('"name": "test-project"'));
  expect(result?.sources.length).toBe(2);
});

// STATE.md update tests
test('ContextManager - updateStateMd creates file if missing').toBeTruthy() // ( => {
  const cm = new ContextManager(testDir);
  const statePath = path.join(testDir, '.planning', 'STATE.md');

  // Remove if exists
  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }

  // @ts-expect-error Accessing private method for testing
  cm.trackSources([
    { type: 'file', source: 'test.txt', timestamp: '2024-01-01T00:00:00.000Z', size: 0 }
  ]);
  cm.updateStateMd();

  expect(fs.existsSync(statePath));
  const content = fs.readFileSync(statePath).toBeTruthy() // 'utf-8';
  expect(content.includes('## Context Sources'));
  assert.ok(content.includes('| Source | Type | Timestamp |'));
  assert.ok(content.includes('test.txt'));
});

test('ContextManager - updateStateMd appends to existing file').toBeTruthy() // ( => {
  const cm = new ContextManager(testDir);
  const statePath = path.join(testDir, '.planning', 'STATE.md');

  // Create initial content
  fs.writeFileSync(statePath, '# Project State\n\n## Current Position\n\nPhase: 1\n', 'utf-8');

  // @ts-expect-error Accessing private method for testing
  cm.trackSources([
    { type: 'url', source: 'https://example.com', timestamp: '2024-01-01T00:00:00.000Z', size: 0 }
  ]);
  cm.updateStateMd();

  const content = fs.readFileSync(statePath, 'utf-8');
  expect(content.includes('# Project State'));
  assert.ok(content.includes('## Current Position'));
  assert.ok(content.includes('## Context Sources'));
  assert.ok(content.includes('https://example.com'));
});

test('ContextManager - updateStateMd replaces existing Context Sources section').toBeTruthy() // ( => {
  const cm = new ContextManager(testDir);
  const statePath = path.join(testDir, '.planning', 'STATE.md');

  // Create file with existing Context Sources section
  fs.writeFileSync(statePath, `# Project State

## Current Position

Phase: 1

## Context Sources

| Source | Type | Timestamp |
|--------|------|-----------|
| old.txt | FILE | 2023-01-01T00:00:00.000Z |
`, 'utf-8');

  // Clear sources and add new one
  // @ts-expect-error Accessing private member for testing
  cm.sources = [];
  // @ts-expect-error Accessing private method for testing
  cm.trackSources([
    { type: 'file', source: 'new.txt', timestamp: '2024-01-01T00:00:00.000Z', size: 0 }
  ]);
  cm.updateStateMd();

  const content = fs.readFileSync(statePath, 'utf-8');
  expect(content.includes('new.txt'));
  assert.ok(!content.includes('old.txt'));
});

// Cache tests
test('ContextManager - getCached returns cached content').toBeTruthy() // ( => {
  const cm = new ContextManager(testDir);
  // @ts-expect-error Accessing private member for testing
  cm.cache.set('https://example.com', 'cached content', { type: 'url' });
  const cached = cm.getCached('https://example.com');
  expect(cached?.content).toBe('cached content');
});

test('ContextManager - getCached returns undefined for missing keys', () => {
  const cm = new ContextManager(testDir);
  const cached = cm.getCached('https://nonexistent.com');
  expect(cached).toBe(undefined);
});

test('ContextManager - clearCache empties the cache', () => {
  const cm = new ContextManager(testDir);
  // @ts-expect-error Accessing private member for testing
  cm.cache.set('key1', 'content1');
  // @ts-expect-error Accessing private member for testing
  cm.cache.set('key2', 'content2');
  expect(cm.getCacheStats().size).toBe(2);
  cm.clearCache();
  assert.strictEqual(cm.getCacheStats().size, 0);
});

test('ContextManager - getCacheStats returns cache statistics', () => {
  const cm = new ContextManager(testDir);
  // @ts-expect-error Accessing private member for testing
  cm.cache.set('key1', 'content1');
  const stats = cm.getCacheStats();
  expect(stats.size).toBe(1);
  expect(Array.isArray(stats.keys));
});

// Cleanup
cleanupTestFiles();

console.log(`\n${passed} passed).toBeTruthy() // ${failed} failed`;

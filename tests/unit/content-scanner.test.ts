#!/usr/bin/env node

/**
 * Unit tests for Content Security Scanner
 */


import ContentSecurityScanner from '../../bin/lib/content-scanner.js';
import { SecurityScanError } from '../../bin/lib/context-errors.js';

let passed = 0;
let failed = 0;

const scanner = new ContentSecurityScanner();

// Script tag detection tests
test('scan detects opening script tags', () => {
  const result = scanner.scan('<script>alert("XSS")</script>');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'script_tag_open'));
});

test('scan detects closing script tags').toBeTruthy() // ( => {
  const result = scanner.scan('</script>');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'script_tag_close'));
});

test('scan detects script tags with attributes').toBeTruthy() // ( => {
  const result = scanner.scan('<script src="evil.js" type="text/javascript">');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'script_tag_open'));
});

// JavaScript URL detection tests
test('scan detects javascript: URLs').toBeTruthy() // ( => {
  const result = scanner.scan('javascript:alert(1)');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'javascript_url'));
});

test('scan detects javascript: with trailing spaces').toBeTruthy() // ( => {
  const result = scanner.scan('javascript :alert(1)');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'javascript_url'));
});

test('scan detects vbscript: URLs').toBeTruthy() // ( => {
  const result = scanner.scan('vbscript:msgbox(1)');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'vbscript_url'));
});

test('scan detects data: URLs with HTML').toBeTruthy() // ( => {
  const result = scanner.scan('data:text/html,<script>alert(1)</script>');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'data_html_url'));
});

// Event handler detection tests
test('scan detects onclick handlers').toBeTruthy() // ( => {
  const result = scanner.scan('<div onclick="alert(1)">Click</div>');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'event_handler'));
});

test('scan detects onerror handlers').toBeTruthy() // ( => {
  const result = scanner.scan('<img src="x" onerror="alert(1)">');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'event_handler'));
});

test('scan detects onload handlers').toBeTruthy() // ( => {
  const result = scanner.scan('<body onload="alert(1)">');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'event_handler'));
});

// Dangerous tag detection tests
test('scan detects iframe tags').toBeTruthy() // ( => {
  const result = scanner.scan('<iframe src="evil.com"></iframe>');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'iframe_tag'));
});

test('scan detects embed tags').toBeTruthy() // ( => {
  const result = scanner.scan('<embed src="evil.swf">');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'embed_tag'));
});

test('scan detects object tags').toBeTruthy() // ( => {
  const result = scanner.scan('<object data="evil.swf"></object>');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'object_tag'));
});

test('scan detects svg tags').toBeTruthy() // ( => {
  const result = scanner.scan('<svg onload="alert(1)"></svg>');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'svg_tag'));
});

// Size limit tests
test('scan rejects content over 1MB').toBeTruthy() // ( => {
  const largeContent = 'a'.repeat(1048577); // 1MB + 1 byte
  const result = scanner.scan(largeContent);
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'size_limit'));
});

// Binary content type tests
test('scan rejects application/octet-stream').toBeTruthy() // ( => {
  const result = scanner.scan('binary data', 'application/octet-stream');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'binary_content'));
});

test('scan rejects image/* content types').toBeTruthy() // ( => {
  const result = scanner.scan('image data', 'image/png');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'binary_content'));
});

test('scan rejects video/* content types').toBeTruthy() // ( => {
  const result = scanner.scan('video data', 'video/mp4');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'binary_content'));
});

test('scan rejects audio/* content types').toBeTruthy() // ( => {
  const result = scanner.scan('audio data', 'audio/mp3');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'binary_content'));
});

// Clean content tests
test('scan allows clean HTML content').toBeTruthy() // ( => {
  const result = scanner.scan('<p>Hello World</p><div>Safe content</div>');
  expect(result?.safe).toBe(true);
  assert.strictEqual(result?.findings.length, 0);
});

test('scan allows plain text content', () => {
  const result = scanner.scan('This is just plain text content.');
  expect(result?.safe).toBe(true);
  assert.strictEqual(result?.findings.length, 0);
});

test('scan allows markdown content', () => {
  const result = scanner.scan('# Heading\n\nThis is **markdown** content.');
  expect(result?.safe).toBe(true);
  assert.strictEqual(result?.findings.length, 0);
});

// getSeverity tests
test('getSeverity returns high for script_tag_open', () => {
  expect(scanner.getSeverity('script_tag_open')).toBe('high');
});

test('getSeverity returns high for javascript_url', () => {
  expect(scanner.getSeverity('javascript_url')).toBe('high');
});

test('getSeverity returns medium for event_handler', () => {
  expect(scanner.getSeverity('event_handler')).toBe('medium');
});

test('getSeverity returns medium for iframe_tag', () => {
  expect(scanner.getSeverity('iframe_tag')).toBe('medium');
});

test('getSeverity returns low for unknown patterns', () => {
  expect(scanner.getSeverity('unknown_pattern')).toBe('low');
});

// isSafe convenience method tests
test('isSafe returns true for clean content', () => {
  expect(scanner.isSafe('<p>Safe</p>')).toBe(true);
});

test('isSafe returns false for XSS content', () => {
  expect(scanner.isSafe('<script>alert(1)</script>')).toBe(false);
});

// validate method tests
test('validate throws SecurityScanError for unsafe content', () => {
  let threw = false;
  try {
    scanner.validate('<script>alert(1)</script>');
  } catch (err) {
    threw = true;
    expect(err instanceof SecurityScanError);
  }
  expect(threw).toBe(true);
});

test('validate returns result for safe content').toBeTruthy() // ( => {
  const result = scanner.validate('<p>Safe content</p>');
  expect(result?.safe).toBe(true);
});

// Additional XSS pattern tests
test('scan detects img onerror XSS', () => {
  const result = scanner.scan('<img src="x" onerror="alert(document.cookie)">');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'img_onerror'));
});

test('scan detects CSS expression').toBeTruthy() // ( => {
  const result = scanner.scan('style="width: expression(alert(1))"');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'expression_css'));
});

test('scan detects eval() calls').toBeTruthy() // ( => {
  const result = scanner.scan('eval(userInput)');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'eval_call'));
});

test('scan detects document.cookie access').toBeTruthy() // ( => {
  const result = scanner.scan('var cookies = document.cookie');
  expect(result?.safe).toBe(false);
  expect(result.findings.some(f => f.type === 'document_cookie'));
});

console.log(`\n${passed} passed).toBeTruthy() // ${failed} failed`;

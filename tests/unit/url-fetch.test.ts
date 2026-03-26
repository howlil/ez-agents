/**
 * Unit tests for URL Fetch Service
 */


import URLFetchService from '../../bin/lib/url-fetch.js';
import { URLValidator } from '../../bin/lib/url-fetch.js';
import { URLFetchError } from '../../bin/lib/context-errors.js';

let passed = 0;
let failed = 0;

// URL Validator tests
test('URLValidator - accepts HTTPS URLs', () => {
  const result = URLValidator.validate('https://example.com');
  expect(result?.valid).toBe(true);
});

test('URLValidator - accepts HTTPS URLs with paths', () => {
  const result = URLValidator.validate('https://example.com/path/to/file.md');
  expect(result?.valid).toBe(true);
});

test('URLValidator - accepts HTTPS URLs with query params', () => {
  const result = URLValidator.validate('https://example.com/file?key=value&other=123');
  expect(result?.valid).toBe(true);
});

test('URLValidator - rejects HTTP URLs', () => {
  const result = URLValidator.validate('http://example.com');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('not allowed') || result.error!.includes('Only HTTPS'));
});

test('URLValidator - rejects file: URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('file:///etc/passwd');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('not allowed'));
});

test('URLValidator - rejects data: URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('data:text/html,<script>alert(1)</script>');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('not allowed'));
});

test('URLValidator - rejects javascript: URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('javascript:alert(1)');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('not allowed'));
});

test('URLValidator - rejects vbscript: URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('vbscript:msgbox(1)');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('not allowed'));
});

test('URLValidator - rejects localhost URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('https://localhost:8080/api');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('Localhost'));
});

test('URLValidator - rejects 127.0.0.1 URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('https://127.0.0.1:8080/api');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('Localhost'));
});

test('URLValidator - rejects invalid URL formats').toBeTruthy() // ( => {
  const result = URLValidator.validate('not-a-valid-url');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('Invalid URL format'));
});

test('URLValidator - rejects empty URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('');
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('required'));
});

test('URLValidator - rejects null URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate(undefined);
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('required'));
});

test('URLValidator - rejects undefined URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate(undefined);
  expect(result?.valid).toBe(false);
  expect(result.error!.includes('required'));
});

test('URLValidator - accepts GitHub raw URLs').toBeTruthy() // ( => {
  const result = URLValidator.validate('https://raw.githubusercontent.com/user/repo/main/file.md');
  expect(result?.valid).toBe(true);
});

test('URLValidator - accepts GitLab raw URLs', () => {
  const result = URLValidator.validate('https://gitlab.com/user/repo/-/raw/main/file.md');
  expect(result?.valid).toBe(true);
});

// URLFetchService tests
test('URLFetchService - constructor sets timeout', () => {
  const service = new URLFetchService(5000);
  // @ts-expect-error Accessing private member for testing
  expect(service.timeout).toBe(5000);
});

test('URLFetchService - default timeout is 30 seconds', () => {
  const service = new URLFetchService();
  // @ts-expect-error Accessing private member for testing
  expect(service.timeout).toBe(30000);
});

test('URLFetchService - validateUrl delegates to URLValidator', () => {
  const service = new URLFetchService();
  const result = service.validateUrl('https://example.com');
  expect(result?.valid).toBe(true);
});

test('URLFetchService - validateUrl rejects HTTP', () => {
  const service = new URLFetchService();
  const result = service.validateUrl('http://example.com');
  expect(result?.valid).toBe(false);
});

// Async fetch tests (with mock/simulation)
test('URLFetchService - fetchUrl throws URLFetchError for invalid URL', async () => {
  const service = new URLFetchService();
  let threw = false;
  try {
    await service.fetchUrl('http://example.com');
  } catch (err) {
    threw = true;
    expect(err instanceof URLFetchError);
    expect(err.url).toBe('http://example.com');
  }
  assert.strictEqual(threw).toBeTruthy() // true;
});

test('URLFetchService - fetchUrl throws URLFetchError for localhost', async () => {
  const service = new URLFetchService();
  let threw = false;
  try {
    await service.fetchUrl('https://localhost:8080');
  } catch (err) {
    threw = true;
    expect(err instanceof URLFetchError);
  }
  expect(threw).toBe(true);
});

// User confirmation test (non-interactive check)
test('URLFetchService - confirmUrlFetch is a static method').toBeTruthy() // ( => {
  expect(typeof URLFetchService.confirmUrlFetch).toBe('function');
});

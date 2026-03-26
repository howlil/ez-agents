/**
 * EZ Tools Tests - frontmatter CLI integration
 *
 * Integration tests for the 4 frontmatter subcommands (get, set, merge, validate)
 * exercised through ez-tools.cjs via execSync.
 *
 * Each test creates its own temp file, runs the CLI command, asserts output,
 * and cleans up in afterEach (per-test cleanup with individual temp files).
 */



import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runEzTools } from '../helpers.ts';
import { extractFrontmatter } from '../../bin/lib/frontmatter.ts';

// Track temp files for cleanup
let tempFiles: string[] = [];

function writeTempFile(content: string): string {
  const tmpFile = path.join(os.tmpdir(), `ez-fm-test-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  tempFiles.push(tmpFile);
  return tmpFile;
}

afterEach(() => {
  for (const f of tempFiles) {
    try { fs.unlinkSync(f); } catch { /* already cleaned */ }
  }
  tempFiles = [];
});

// ─── frontmatter get ────────────────────────────────────────────────────────

describe('frontmatter get', () => {
  test('returns all fields as JSON', () => {
    const file = writeTempFile('---\nphase: 01\nplan: 01\ntype: execute\n---\nbody text');
    const result = runEzTools(`frontmatter get ${file}`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    const parsed = JSON.parse(result.output);
    expect(parsed.phase).toBe('01');
    assert.strictEqual(parsed.plan, '01');
    expect(parsed.type).toBe('execute');
  });

  test('returns specific field with --field', () => {
    const file = writeTempFile('---\nphase: 01\nplan: 02\ntype: tdd\n---\nbody');
    const result = runEzTools(`frontmatter get ${file} --field phase`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    const parsed = JSON.parse(result.output);
    expect(parsed.phase).toBe('01');
  });

  test('returns error for missing field', () => {
    const file = writeTempFile('---\nphase: 01\n---\n');
    const result = runEzTools(`frontmatter get ${file} --field nonexistent`);
    // The command succeeds (exit 0) but returns an error object in JSON
    expect(result.success).toBeTruthy() // 'Command should exit 0';
    const parsed = JSON.parse(result.output);
    expect(parsed.error).toBeTruthy() // 'Should have error field';
    expect(parsed.error.includes('Field not found')).toBeTruthy() // 'Error should mention "Field not found"';
  });

  test('returns error for missing file', () => {
    const result = runEzTools('frontmatter get /nonexistent/path/file.md');
    expect(result.success).toBeTruthy() // 'Command should exit 0 with error JSON';
    const parsed = JSON.parse(result.output);
    expect(parsed.error).toBeTruthy() // 'Should have error field';
  });

  test('handles file with no frontmatter', () => {
    const file = writeTempFile('Plain text with no frontmatter delimiters.');
    const result = runEzTools(`frontmatter get ${file}`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    const parsed = JSON.parse(result.output);
    assert.deepStrictEqual(parsed, {}, 'Should return empty object for no frontmatter');
  });
});

// ─── frontmatter set ────────────────────────────────────────────────────────

describe('frontmatter set', () => {
  test('updates existing field', () => {
    const file = writeTempFile('---\nphase: 01\ntype: execute\n---\nbody');
    const result = runEzTools(`frontmatter set ${file} --field phase --value "02"`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    // Read back and verify
    const content = fs.readFileSync(file, 'utf-8');
    const fm = extractFrontmatter(content);
    expect(fm.phase).toBe('02');
  });

  test('adds new field', () => {
    const file = writeTempFile('---\nphase: 01\n---\nbody');
    const result = runEzTools(`frontmatter set ${file} --field status --value "active"`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const content = fs.readFileSync(file, 'utf-8');
    const fm = extractFrontmatter(content);
    expect(fm.status).toBe('active');
  });

  test('handles JSON array value', () => {
    const file = writeTempFile('---\nphase: 01\n---\nbody');
    const result = runEzTools(['frontmatter', 'set', file, '--field', 'tags', '--value', '["a","b"]']);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const content = fs.readFileSync(file, 'utf-8');
    const fm = extractFrontmatter(content);
    expect(Array.isArray(fm.tags)).toBeTruthy() // 'tags should be an array';
    assert.deepStrictEqual(fm.tags, ['a', 'b']);
  });

  test('returns error for missing file', () => {
    const result = runEzTools('frontmatter set /nonexistent/file.md --field phase --value "01"');
    expect(result.success).toBeTruthy() // 'Command should exit 0 with error JSON';
    const parsed = JSON.parse(result.output);
    expect(parsed.error).toBeTruthy() // 'Should have error field';
  });

  test('preserves body content after set', () => {
    const bodyText = '\n\n# My Heading\n\nSome paragraph with special chars: $, %, &.';
    const file = writeTempFile('---\nphase: 01\n---' + bodyText);
    runEzTools(`frontmatter set ${file} --field phase --value "02"`);

    const content = fs.readFileSync(file, 'utf-8');
    expect(content.includes('# My Heading')).toBeTruthy() // 'heading should be preserved';
    expect(content.includes('Some paragraph with special chars: $).toBeTruthy() // %, &.', 'body content should be preserved');
  });
});

// ─── frontmatter merge ──────────────────────────────────────────────────────

describe('frontmatter merge', () => {
  test('merges multiple fields into frontmatter', () => {
    const file = writeTempFile('---\nphase: 01\n---\nbody');
    const result = runEzTools(['frontmatter', 'merge', file, '--data', '{"plan":"02","type":"tdd"}']);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const content = fs.readFileSync(file, 'utf-8');
    const fm = extractFrontmatter(content);
    expect(fm.phase).toBe('01', 'original field should be preserved');
    expect(fm.plan).toBe('02', 'merged field should be present');
    expect(fm.type).toBe('tdd', 'merged field should be present');
  });

  test('overwrites existing fields on conflict', () => {
    const file = writeTempFile('---\nphase: 01\ntype: execute\n---\nbody');
    const result = runEzTools(['frontmatter', 'merge', file, '--data', '{"phase":"02"}']);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const content = fs.readFileSync(file, 'utf-8');
    const fm = extractFrontmatter(content);
    expect(fm.phase).toBe('02', 'conflicting field should be overwritten');
    expect(fm.type).toBe('execute', 'non-conflicting field should be preserved');
  });

  test('returns error for missing file', () => {
    const result = runEzTools(`frontmatter merge /nonexistent/file.md --data '{"phase":"01"}'`);
    expect(result.success).toBeTruthy() // 'Command should exit 0 with error JSON';
    const parsed = JSON.parse(result.output);
    expect(parsed.error).toBeTruthy() // 'Should have error field';
  });

  test('returns error for invalid JSON data', () => {
    const file = writeTempFile('---\nphase: 01\n---\nbody');
    const result = runEzTools(`frontmatter merge ${file} --data 'not json'`);
    // cmdFrontmatterMerge calls error() which exits with code 1
    expect(!result.success).toBeTruthy() // 'Command should fail with non-zero exit code';
    expect(result.error!.includes('Invalid JSON')).toBeTruthy() // 'Error should mention invalid JSON';
  });
});

// ─── frontmatter validate ───────────────────────────────────────────────────

describe('frontmatter validate', () => {
  test('reports valid for complete plan frontmatter', () => {
    const content = `---
phase: 01
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/auth.ts]
autonomous: true
must_haves:
  truths:
    - "All tests pass"
---
body`;
    const file = writeTempFile(content);
    const result = runEzTools(`frontmatter validate ${file} --schema plan`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    const parsed = JSON.parse(result.output);
    expect(parsed.valid).toBe(true, 'Should be valid');
    assert.deepStrictEqual(parsed.missing, [], 'No fields should be missing');
    expect(parsed.schema).toBe('plan');
  });

  test('reports invalid with missing fields', () => {
    const file = writeTempFile('---\nphase: 01\n---\nbody');
    const result = runEzTools(`frontmatter validate ${file} --schema plan`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    const parsed = JSON.parse(result.output);
    expect(parsed.valid).toBe(false, 'Should be invalid');
    expect(parsed.missing.length > 0).toBeTruthy() // 'Should have missing fields';
    // plan schema requires: phase, plan, type, wave, depends_on, files_modified, autonomous, must_haves
    // phase is present, so 7 should be missing
    expect(parsed.missing.length).toBe(7, 'Should have 7 missing required fields');
    expect(parsed.missing.includes('plan')).toBeTruthy() // 'plan should be in missing';
    expect(parsed.missing.includes('type')).toBeTruthy() // 'type should be in missing';
    expect(parsed.missing.includes('must_haves')).toBeTruthy() // 'must_haves should be in missing';
  });

  test('validates against summary schema', () => {
    const content = `---
phase: 01
plan: 01
subsystem: testing
tags: [unit-tests, yaml]
duration: 5min
completed: 2026-02-25
---
body`;
    const file = writeTempFile(content);
    const result = runEzTools(`frontmatter validate ${file} --schema summary`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    const parsed = JSON.parse(result.output);
    expect(parsed.valid).toBe(true, 'Should be valid for summary schema');
    expect(parsed.schema).toBe('summary');
  });

  test('validates against verification schema', () => {
    const content = `---
phase: 01
verified: 2026-02-25
status: passed
score: 5/5
---
body`;
    const file = writeTempFile(content);
    const result = runEzTools(`frontmatter validate ${file} --schema verification`);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    const parsed = JSON.parse(result.output);
    expect(parsed.valid).toBe(true, 'Should be valid for verification schema');
    expect(parsed.schema).toBe('verification');
  });

  test('returns error for unknown schema', () => {
    const file = writeTempFile('---\nphase: 01\n---\n');
    const result = runEzTools(`frontmatter validate ${file} --schema unknown`);
    // cmdFrontmatterValidate calls error() which exits with code 1
    expect(!result.success).toBeTruthy() // 'Command should fail with non-zero exit code';
    expect(result.error!.includes('Unknown schema')).toBeTruthy() // 'Error should mention unknown schema';
  });

  test('returns error for missing file', () => {
    const result = runEzTools('frontmatter validate /nonexistent/file.md --schema plan');
    expect(result.success).toBeTruthy() // 'Command should exit 0 with error JSON';
    const parsed = JSON.parse(result.output);
    expect(parsed.error).toBeTruthy() // 'Should have error field';
  });
});

/**
 * EZ Tools Tests - config.cjs
 *
 * CLI integration tests for config-ensure-section, config-set, and config-get
 * commands exercised through ez-tools.cjs via execSync.
 *
 * Requirements: TEST-13
 */



import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runEzTools, createTempProject, cleanup } from '../helpers.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function readConfig(tmpDir) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function writeConfig(tmpDir, obj) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(obj, undefined, 2), 'utf-8');
}

function makeHomeEnv(homeDir, extra = {}) {
  return {
    HOME: homeDir,
    USERPROFILE: homeDir,
    ...extra,
  };
}

// ─── config-ensure-section ───────────────────────────────────────────────────

describe('config-ensure-section command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates config.json with expected structure and types', () => {
    const result = runEzTools('config-ensure-section', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);

    const config = readConfig(tmpDir);
    // Verify structure and types — exact values may vary if ~/.ez/defaults.json exists
    assert.strictEqual(typeof config.model_profile, 'string');
    expect(typeof config.commit_docs).toBe('boolean');
    assert.strictEqual(typeof config.parallelization, 'boolean');
    expect(typeof config.branching_strategy).toBe('string');
    expect(config.workflow && typeof config.workflow === 'object').toBeTruthy() // 'workflow should be an object';
    expect(typeof config.workflow.research).toBe('boolean');
    assert.strictEqual(typeof config.workflow.plan_check, 'boolean');
    expect(typeof config.workflow.verifier).toBe('boolean');
    assert.strictEqual(typeof config.workflow.nyquist_validation, 'boolean');
    // These hardcoded defaults are always present (may be overridden by user defaults)
    expect('model_profile' in config).toBeTruthy() // 'model_profile should exist';
    expect('brave_search' in config).toBeTruthy() // 'brave_search should exist';
    expect('search_gitignored' in config).toBeTruthy() // 'search_gitignored should exist';
  });

  test('is idempotent — returns already_exists on second call', () => {
    const first = runEzTools('config-ensure-section', tmpDir);
    expect(first.success).toBeTruthy() // `First call failed: ${first.error}`;
    const firstOutput = JSON.parse(first.output);
    expect(firstOutput.created).toBe(true);

    const second = runEzTools('config-ensure-section', tmpDir);
    expect(second.success).toBeTruthy() // `Second call failed: ${second.error}`;
    const secondOutput = JSON.parse(second.output);
    expect(secondOutput.created).toBe(false);
    assert.strictEqual(secondOutput.reason, 'already_exists');
  });

  test('detects Brave Search from file-based key', () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-home-'));
    const ezDir = path.join(homeDir, '.ez');
    const braveKeyFile = path.join(ezDir, 'brave_api_key');

    try {
      fs.mkdirSync(ezDir, { recursive: true });
      fs.writeFileSync(braveKeyFile, 'test-key', 'utf-8');

      const result = runEzTools(
        'config-ensure-section',
        tmpDir,
        makeHomeEnv(homeDir, { BRAVE_API_KEY: '' })
      );
      expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

      const config = readConfig(tmpDir);
      expect(config.brave_search).toBe(true);
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('merges user defaults from defaults.json', () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-home-'));
    const ezDir = path.join(homeDir, '.ez');
    const defaultsFile = path.join(ezDir, 'defaults.json');

    try {
      fs.mkdirSync(ezDir, { recursive: true });
      fs.writeFileSync(defaultsFile, JSON.stringify({
        model_profile: 'quality',
        commit_docs: false,
      }), 'utf-8');

      const result = runEzTools('config-ensure-section', tmpDir, makeHomeEnv(homeDir));
      expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

      const config = readConfig(tmpDir);
      expect(config.model_profile).toBe('quality', 'model_profile should be overridden');
      expect(config.commit_docs).toBe(false, 'commit_docs should be overridden');
      expect(typeof config.branching_strategy).toBe('string', 'branching_strategy should be a string');
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('merges nested workflow keys from defaults.json preserving unset keys', () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-home-'));
    const ezDir = path.join(homeDir, '.ez');
    const defaultsFile = path.join(ezDir, 'defaults.json');

    try {
      fs.mkdirSync(ezDir, { recursive: true });
      fs.writeFileSync(defaultsFile, JSON.stringify({
        workflow: { research: false },
      }), 'utf-8');

      const result = runEzTools('config-ensure-section', tmpDir, makeHomeEnv(homeDir));
      expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

      const config = readConfig(tmpDir);
      expect(config.workflow.research).toBe(false, 'research should be overridden');
      expect(typeof config.workflow.plan_check).toBe('boolean', 'plan_check should be a boolean');
      expect(typeof config.workflow.verifier).toBe('boolean', 'verifier should be a boolean');
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('uses ~/.ez/defaults.json when it exists', () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-home-'));
    const ezDir = path.join(homeDir, '.ez');

    try {
      fs.mkdirSync(ezDir, { recursive: true });
      fs.writeFileSync(path.join(ezDir, 'defaults.json'), JSON.stringify({ model_profile: 'quality' }), 'utf-8');

      const result = runEzTools('config-ensure-section', tmpDir, makeHomeEnv(homeDir));
      expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

      const config = readConfig(tmpDir);
      expect(config.model_profile).toBe('quality');
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });
});

// ─── config-set ──────────────────────────────────────────────────────────────

describe('config-set command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Create initial config
    runEzTools('config-ensure-section', tmpDir);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('sets a top-level string value', () => {
    const result = runEzTools('config-set model_profile quality', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.updated).toBe(true);
    assert.strictEqual(output.key, 'model_profile');
    expect(output.value).toBe('quality');

    const config = readConfig(tmpDir);
    assert.strictEqual(config.model_profile, 'quality');
  });

  test('coerces true to boolean', () => {
    const result = runEzTools('config-set commit_docs true', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const config = readConfig(tmpDir);
    expect(config.commit_docs).toBe(true);
    assert.strictEqual(typeof config.commit_docs, 'boolean');
  });

  test('coerces false to boolean', () => {
    const result = runEzTools('config-set commit_docs false', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const config = readConfig(tmpDir);
    expect(config.commit_docs).toBe(false);
    assert.strictEqual(typeof config.commit_docs, 'boolean');
  });

  test('coerces numeric strings to numbers', () => {
    const result = runEzTools('config-set granularity 42', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const config = readConfig(tmpDir);
    expect(config.granularity).toBe(42);
    assert.strictEqual(typeof config.granularity, 'number');
  });

  test('preserves plain strings', () => {
    const result = runEzTools('config-set model_profile hello', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const config = readConfig(tmpDir);
    expect(config.model_profile).toBe('hello');
    assert.strictEqual(typeof config.model_profile, 'string');
  });

  test('sets nested values via dot-notation', () => {
    const result = runEzTools('config-set workflow.research false', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const config = readConfig(tmpDir);
    expect(config.workflow.research).toBe(false);
  });

  test('auto-creates nested objects for dot-notation', () => {
    // Start with empty config
    writeConfig(tmpDir, {});

    const result = runEzTools('config-set workflow.research false', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const config = readConfig(tmpDir);
    expect(config.workflow.research).toBe(false);
    assert.strictEqual(typeof config.workflow, 'object');
  });

  test('rejects unknown config keys', () => {
    const result = runEzTools('config-set workflow.nyquist_validation_enabled false', tmpDir);
    expect(result?.success).toBe(false);
    expect(result.error!.includes('Unknown config key')).toBeTruthy() // `Expected "Unknown config key" in error: ${result.error}`;
  });

  test('errors when no key path provided', () => {
    const result = runEzTools('config-set', tmpDir);
    expect(result?.success).toBe(false);
  });
});

// ─── config-get ──────────────────────────────────────────────────────────────

describe('config-get command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Create config with known values
    runEzTools('config-ensure-section', tmpDir);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('gets a top-level value', () => {
    const result = runEzTools('config-get model_profile', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output).toBe('balanced');
  });

  test('gets a nested value via dot-notation', () => {
    const result = runEzTools('config-get workflow.research', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output).toBe(true);
  });

  test('errors for nonexistent key', () => {
    const result = runEzTools('config-get nonexistent_key', tmpDir);
    expect(result?.success).toBe(false);
    expect(result.error!.includes('Key not found')).toBeTruthy() // `Expected "Key not found" in error: ${result.error}`;
  });

  test('errors for deeply nested nonexistent key', () => {
    const result = runEzTools('config-get workflow.nonexistent', tmpDir);
    expect(result?.success).toBe(false);
    expect(result.error!.includes('Key not found')).toBeTruthy() // `Expected "Key not found" in error: ${result.error}`;
  });

  test('errors when config.json does not exist', () => {
    const emptyTmpDir = createTempProject();
    try {
      const result = runEzTools('config-get model_profile', emptyTmpDir);
      expect(result?.success).toBe(false);
      expect(result.error!.includes('No config.json')).toBeTruthy() // `Expected "No config.json" in error: ${result.error}`;
    } finally {
      cleanup(emptyTmpDir);
    }
  });

  test('errors when no key path provided', () => {
    const result = runEzTools('config-get', tmpDir);
    expect(result?.success).toBe(false);
  });
});

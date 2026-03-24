/**
 * EZ Agents Test Utilities
 * 
 * Shared test helpers to avoid duplication across test files.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Module-level counters for test tracking
let _passed = 0;
let _failed = 0;

/**
 * Create a temporary directory for testing.
 * @returns {string} Path to the created temporary directory
 */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ez-test-'));
}

/**
 * Clean up a temporary directory.
 * @param {string} dir - Path to the directory to remove
 */
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Simple test runner helper.
 * @param {string} name - Test name/description
 * @param {Function} fn - Test function to execute
 * @param {Object} counters - Optional counter object with pass/fail methods
 */
function test(name, fn, counters = null) {
  try {
    fn();
    console.log(`✓ ${name}`);
    if (counters && counters.pass) counters.pass();
    _passed++;
    return true;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    if (counters && counters.fail) counters.fail();
    _failed++;
    return false;
  }
}

/**
 * Get current test statistics.
 * @returns {{ passed: number, failed: number }}
 */
function getTestStats() {
  return { passed: _passed, failed: _failed };
}

/**
 * Reset test counters.
 */
function resetTestCounters() {
  _passed = 0;
  _failed = 0;
}

/**
 * Run all tests and report results.
 * @param {Array<Function>} tests - Array of test functions that return pass/fail counts
 * @returns {Promise<void>}
 */
async function runTests(testFns) {
  let passed = 0;
  let failed = 0;

  for (const testFn of testFns) {
    try {
      const result = await testFn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`  Unexpected error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

/**
 * Run tests with a custom summary format (for compatibility with existing tests).
 * @param {Function} testFn - Test function that manages its own pass/fail counters
 * @returns {Promise<void>}
 */
async function runTestsWithCounters(testFn) {
  let passed = 0;
  let failed = 0;

  const context = {
    pass: () => { passed++; },
    fail: () => { failed++; },
    getPassed: () => passed,
    getFailed: () => failed
  };

  try {
    await testFn(context);
  } finally {
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

module.exports = {
  createTempDir,
  cleanupTempDir,
  test,
  runTests,
  runTestsWithCounters,
  getTestStats,
  resetTestCounters
};

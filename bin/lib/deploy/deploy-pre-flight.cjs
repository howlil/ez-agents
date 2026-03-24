/**
 * Deploy Pre-Flight — Runs tests + lint before deploy
 * Blocks deploy if either fails
 */

const { execSync } = require('child_process');

class DeployPreFlight {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
  }

  /**
   * Run pre-flight checks (tests + lint)
   * @returns {Object} Result { passed, tests, lint, errors }
   */
  runPreFlight() {
    const result = {
      passed: true,
      tests: false,
      lint: false,
      errors: []
    };

    // Run tests
    try {
      execSync('npm test', { cwd: this.cwd, stdio: 'pipe' });
      result.tests = true;
    } catch (e) {
      result.passed = false;
      result.errors.push(`Tests failed: ${e.message}`);
    }

    // Run lint
    try {
      execSync('npm run lint', { cwd: this.cwd, stdio: 'pipe' });
      result.lint = true;
    } catch (e) {
      result.passed = false;
      result.errors.push(`Lint failed: ${e.message}`);
    }

    return result;
  }
}

/**
 * Run pre-flight checks
 * @param {string} cwd - Working directory
 * @returns {Object} Result { passed, tests, lint, errors }
 */
function runPreFlight(cwd) {
  const preFlight = new DeployPreFlight(cwd);
  return preFlight.runPreFlight();
}

module.exports = { DeployPreFlight, runPreFlight };

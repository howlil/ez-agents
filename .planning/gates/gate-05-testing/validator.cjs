/**
 * Gate 5: Testing Coverage Validator
 * 
 * Validates code coverage against archetype-specific thresholds.
 * Returns structured results for gap closure workflow.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config.yaml');

/**
 * Get coverage thresholds for a specific archetype
 * @param {string} archetype - 'mvp' | 'medium' | 'enterprise'
 * @returns {object} Threshold values for lines, branches, functions
 */
function getArchetypeThresholds(archetype) {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Gate 5 config not found at ${CONFIG_PATH}`);
  }
  
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  const config = yaml.load(configContent);
  
  const thresholds = config.archetypes[archetype];
  if (!thresholds) {
    throw new Error(`Unknown archetype: ${archetype}. Valid: mvp, medium, enterprise`);
  }
  
  return {
    lines: thresholds.lines,
    branches: thresholds.branches,
    functions: thresholds.functions
  };
}

/**
 * Run coverage collection and return results
 * @param {string} phaseDir - Directory to run coverage in
 * @returns {object} Coverage results from c8
 */
function runCoverage(phaseDir) {
  // Check if coverage report already exists (for testing/mocking)
  const coveragePath = path.join(phaseDir, 'coverage', 'coverage-summary.json');
  const altPath = path.join(phaseDir, 'coverage-summary.json');
  
  if (fs.existsSync(coveragePath)) {
    return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  }
  if (fs.existsSync(altPath)) {
    return JSON.parse(fs.readFileSync(altPath, 'utf8'));
  }

  try {
    // Run c8 report with JSON output
    execSync('npx c8 report --reporter=json', {
      cwd: phaseDir,
      stdio: 'pipe',
      encoding: 'utf8'
    });

    // Read the coverage summary
    if (fs.existsSync(coveragePath)) {
      return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    }
    if (fs.existsSync(altPath)) {
      return JSON.parse(fs.readFileSync(altPath, 'utf8'));
    }
    throw new Error('Coverage report not found - run tests first');
  } catch (error) {
    if (error.message.includes('c8')) {
      throw new Error(`Coverage execution failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate coverage against archetype thresholds
 * @param {string} phaseDir - Directory containing the code to validate
 * @param {string} archetype - 'mvp' | 'medium' | 'enterprise'
 * @returns {object} { pass: boolean, report: object, failures: string[] }
 */
function validateCoverage(phaseDir, archetype = 'medium') {
  const thresholds = getArchetypeThresholds(archetype);
  
  let coverage;
  try {
    coverage = runCoverage(phaseDir);
  } catch (error) {
    return {
      pass: false,
      report: { lines: 0, branches: 0, functions: 0 },
      failures: [`Coverage execution failed: ${error.message}`],
      error: error.message
    };
  }
  
  const totals = coverage.totals || coverage;
  const lines = totals.lines?.pct || 0;
  const branches = totals.branches?.pct || 0;
  const functions = totals.functions?.pct || 0;
  
  const failures = [];
  
  if (lines < thresholds.lines) {
    failures.push(`Lines coverage: ${lines}% < ${thresholds.lines}% (need ${thresholds.lines - lines}% more)`);
  }
  
  if (branches < thresholds.branches) {
    failures.push(`Branches coverage: ${branches}% < ${thresholds.branches}% (need ${thresholds.branches - branches}% more)`);
  }
  
  if (functions < thresholds.functions) {
    failures.push(`Functions coverage: ${functions}% < ${thresholds.functions}% (need ${thresholds.functions - functions}% more)`);
  }
  
  return {
    pass: failures.length === 0,
    report: {
      lines,
      branches,
      functions,
      thresholds
    },
    failures
  };
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'validate' && args[1]) {
    const phaseDir = args[1];
    const archetype = args[2] || 'medium';
    
    console.log(`Gate 5: Validating coverage in ${phaseDir} (${archetype})`);
    const result = validateCoverage(phaseDir, archetype);
    
    if (result.pass) {
      console.log('✅ Gate 5 PASSED');
      console.log(`   Lines: ${result.report.lines}%, Branches: ${result.report.branches}%, Functions: ${result.report.functions}%`);
      process.exit(0);
    } else {
      console.log('❌ Gate 5 FAILED');
      result.failures.forEach(f => console.log(`   - ${f}`));
      process.exit(1);
    }
  } else if (command === 'thresholds' && args[1]) {
    const archetype = args[1];
    const thresholds = getArchetypeThresholds(archetype);
    console.log(`Thresholds for ${archetype}:`);
    console.log(`  Lines: ${thresholds.lines}%`);
    console.log(`  Branches: ${thresholds.branches}%`);
    console.log(`  Functions: ${thresholds.functions}%`);
  } else {
    console.log('Usage: node gate-05-validator.cjs <command> [args]');
    console.log('Commands:');
    console.log('  validate <phaseDir> [archetype]  - Validate coverage');
    console.log('  thresholds <archetype>           - Show thresholds');
    process.exit(1);
  }
}

module.exports = {
  validateCoverage,
  getArchetypeThresholds,
  runCoverage
};

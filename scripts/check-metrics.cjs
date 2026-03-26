#!/usr/bin/env node

/**
 * Check Metrics CI Script
 *
 * Runs all code quality metric checks and generates a summary report.
 * Exits with error code if any thresholds are not met.
 *
 * Usage: node scripts/check-metrics.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', '.planning', 'reports');
const SUMMARY_FILE = path.join(REPORTS_DIR, 'phase14-metrics-summary.md');

// Thresholds
const THRESHOLDS = {
  complexity: 10,
  duplication: 5, // percentage
  eslintWarnings: 0,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, name) {
  log(`\nRunning: ${name}...`, 'blue');
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`✓ ${name} passed`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`✗ ${name} failed`, 'red');
    console.error(error.stdout || error.message);
    return { success: false, output: error.stdout || error.message };
  }
}

function generateSummary(results) {
  const timestamp = new Date().toISOString();

  const summary = `# Phase 14: Metrics Summary Report

**Generated:** ${timestamp}
**Phase:** 14 - Code Quality Metrics & Validation

---

## Executive Summary

| Metric | Status | Details |
|--------|--------|---------|
| ESLint | ${results.lint.success ? '✅ PASS' : '❌ FAIL'} | ${results.lint.success ? 'Zero warnings' : 'Warnings found'} |
| Duplicates | ${results.duplicates.success ? '✅ PASS' : '❌ FAIL'} | ${results.duplicates.success ? 'Below threshold' : 'Above threshold'} |
| Coupling | ${results.coupling.success ? '✅ PASS' : '❌ FAIL'} | ${results.coupling.success ? 'No circular dependencies' : 'Circular dependencies found'} |

---

## Detailed Results

### ESLint

${results.lint.success ? '✅ All checks passed' : '❌ Issues found - see .planning/reports/eslint/phase14-eslint-baseline.txt'}

### Duplicate Code (jscpd)

${results.duplicates.success ? '✅ No significant duplicates found' : '❌ Duplicates detected - see .planning/reports/jscpd/'}

### Module Coupling (madge)

${results.coupling.success ? '✅ No circular dependencies found' : '❌ Circular dependencies detected - see .planning/reports/coupling/'}

---

## Thresholds

| Metric | Target | Status |
|--------|--------|--------|
| Cyclomatic Complexity | < ${THRESHOLDS.complexity} per function | ${results.lint.success ? '✅' : '❌'} |
| Duplicate Code | < ${THRESHOLDS.duplication}% | ${results.duplicates.success ? '✅' : '❌'} |
| Module Coupling | < 5 dependencies | ${results.coupling.success ? '✅' : '❌'} |
| ESLint Warnings | ${THRESHOLDS.eslintWarnings} | ${results.lint.success ? '✅' : '❌'} |

---

## Recommendations

${results.lint.success && results.duplicates.success && results.coupling.success
    ? '✅ All metrics are within acceptable thresholds. Continue monitoring.'
    : '❌ Some metrics are outside acceptable thresholds. Review detailed reports and create follow-up tasks.'}

---

*Report generated: ${timestamp}*
*Phase 14: Code Quality Metrics & Validation*
`;

  fs.writeFileSync(SUMMARY_FILE, summary);
  log(`\nSummary report saved to: ${SUMMARY_FILE}`, 'blue');
}

// Main execution
log('═══════════════════════════════════════════', 'blue');
log('  Code Quality Metrics Check', 'blue');
log('═══════════════════════════════════════════\n', 'blue');

const results = {
  lint: runCommand('npm run lint', 'ESLint'),
  duplicates: runCommand('npm run check:duplicates', 'Duplicate Detection'),
  coupling: runCommand('npm run check:coupling', 'Coupling Analysis'),
};

generateSummary(results);

log('\n═══════════════════════════════════════════', 'blue');

const allPassed = results.lint.success && results.duplicates.success && results.coupling.success;

if (allPassed) {
  log('  ✅ All metrics passed!', 'green');
  log('═══════════════════════════════════════════\n', 'blue');
  process.exit(0);
} else {
  log('  ❌ Some metrics failed. Review reports.', 'red');
  log('═══════════════════════════════════════════\n', 'blue');
  process.exit(1);
}

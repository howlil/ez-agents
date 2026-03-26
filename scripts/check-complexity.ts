/**
 * Check Complexity Script - Validates code complexity against thresholds
 *
 * Uses CodeComplexityAnalyzer to check cyclomatic complexity of all functions.
 * Fails build if any function exceeds complexity threshold of 10.
 *
 * Usage: npm run check:complexity
 */

import { CodeComplexityAnalyzer, type ComplexityIssue } from '../bin/lib/code-complexity-analyzer.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MAX_COMPLEXITY = 10;

async function main() {
  console.log('🔍 Analyzing code complexity...\n');

  const analyzer = new CodeComplexityAnalyzer(rootDir);
  const issues = await analyzer.analyzeComplexity(rootDir);

  // Filter for complexity violations (complexity > 10)
  const violations = issues.filter(
    (issue) => issue.rule === 'complexity' && issue.score > MAX_COMPLEXITY
  );

  if (violations.length === 0) {
    console.log(`✅ Code complexity check passed! All functions have complexity ≤ ${MAX_COMPLEXITY}`);
    process.exit(0);
  }

  console.error(`❌ Code complexity check failed! Found ${violations.length} function(s) exceeding complexity threshold\n`);
  console.error('Violations:\n');

  // Group by file for better readability
  const byFile = new Map<string, ComplexityIssue[]>();
  for (const violation of violations) {
    const existing = byFile.get(violation.file) || [];
    existing.push(violation);
    byFile.set(violation.file, existing);
  }

  for (const [file, fileIssues] of byFile.entries()) {
    console.error(`  ${path.relative(rootDir, file)}:`);
    for (const issue of fileIssues) {
      console.error(`    Line ${issue.line}: complexity ${issue.score} (threshold: ${MAX_COMPLEXITY})`);
    }
    console.error('');
  }

  console.error(`Summary: ${violations.length} function(s) exceed complexity threshold of ${MAX_COMPLEXITY}`);
  console.error('\n💡 Tip: Consider refactoring large functions into smaller, focused methods.');
  process.exit(1);
}

main().catch((error) => {
  console.error('Error running complexity check:', error);
  process.exit(1);
});

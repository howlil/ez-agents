/**
 * EZ Tools Tests - FinOpsCLI Integration Tests
 *
 * Integration tests for the finops CLI commands covering
 * budget management, cost tracking, and reporting.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: COST-06
 */



import * as path from 'path';
import * as fs from 'fs';


describe('ez-agents finops', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('finops budget --set configures spending limit', () => {
    const result = runEzTools(
      ['finops', 'budget', '--set', '--ceiling', '100', '--warning', '80'],
      tmpDir
    );
    expect(result.success).toBeTruthy() // 'finops budget --set must exit 0: ' + result.error;
    expect(result.output.includes('Budget set')).toBeTruthy() // 'output must confirm budget set';

    const configPath = path.join(tmpDir, '.planning', 'budget.json');
    expect(fs.existsSync(configPath)).toBeTruthy() // 'budget.json must exist after setting budget';
  });

  test('finops budget --status shows current spending status', () => {
    // Set budget first
    runEzTools(['finops', 'budget', '--set', '--ceiling', '100'], tmpDir);

    const result = runEzTools(['finops', 'budget', '--status'], tmpDir);
    expect(result.success).toBeTruthy() // 'finops budget --status must exit 0: ' + result.error;
    expect(result.output.includes('ceiling') || result.output.includes('Budget')).toBeTruthy() // 'output must show budget info';
  });

  test('finops record --cost logs expense with category', () => {
    const result = runEzTools(
      ['finops', 'record', '--cost', '25.50', '--category', 'api_calls', '--service', 'openai'],
      tmpDir
    );
    expect(result.success).toBeTruthy() // 'finops record must exit 0: ' + result.error;
    expect(result.output.includes('Recorded') || result.output.includes('cost')).toBeTruthy() // 'output must confirm cost recorded';

    const metricsPath = path.join(tmpDir, '.planning', 'finops.json');
    expect(fs.existsSync(metricsPath)).toBeTruthy() // 'finops.json must exist after recording cost';
  });

  test('finops report --period generates cost report', () => {
    const result = runEzTools(
      ['finops', 'report', '--period', 'monthly', '--month', '2026-03'],
      tmpDir
    );
    expect(result.success).toBeTruthy() // 'finops report must exit 0: ' + result.error;
    expect(result.output.includes('Report') || result.output.includes('Total') || result.output.includes('cost')).toBeTruthy() // 'output must contain report data';
  });

  test('finops analyze --recommendations returns optimization suggestions', () => {
    const result = runEzTools(
      ['finops', 'analyze', '--recommendations'],
      tmpDir
    );
    expect(result.success).toBeTruthy() // 'finops analyze must exit 0: ' + result.error;
    // Should return recommendations or indicate no data
    expect(result.output.includes('Recommendation') ||
      result.output.includes('recommendation') ||
      result.output.includes('No data') ||
      result.output.includes('no data')).toBeTruthy() // 'output must contain recommendations or indicate no data';
  });

  test('finops export --format csv exports cost data', () => {
    const result = runEzTools(
      ['finops', 'export', '--format', 'csv', '--output', 'finops-export'],
      tmpDir
    );
    expect(result.success).toBeTruthy() // 'finops export must exit 0: ' + result.error;

    // Should create CSV file or return path
    const csvPath = path.join(tmpDir, 'finops-export.csv');
    expect(fs.existsSync(csvPath) || result.output.includes('.csv')).toBeTruthy() // 'must create CSV export file or return path';
  });
});

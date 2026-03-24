/**
 * Project Reporter Tests
 * Tests for ProjectReporter class
 */

const { strict: assert } = require('assert');
const path = require('path');
const { ProjectReporter } = require('../../bin/lib/project-reporter.cjs');
const { describe, it, before } = require('vitest');

const testRoot = path.join(__dirname, '..', 'fixtures', 'test-project');

describe('ProjectReporter', () => {
  let reporter;

  before(() => {
    reporter = new ProjectReporter(testRoot);
  });

  it('generate returns complete report with all sections', () => {
    const structure = {
      root: testRoot,
      directories: [{ path: path.join(testRoot, 'src'), depth: 1 }],
      entryPoints: [path.join(testRoot, 'src', 'index.ts')],
      configFiles: [path.join(testRoot, 'package.json')],
      sourceDirs: [path.join(testRoot, 'src')],
      testDirs: [],
      files: [path.join(testRoot, 'src', 'index.ts')],
      modules: [{ name: 'components', path: path.join(testRoot, 'src', 'components'), fileCount: 5 }]
    };
    const stack = {
      language: 'typescript',
      runtime: 'node',
      packageManager: 'pnpm',
      frameworks: ['React', 'Next.js'],
      databases: ['PostgreSQL'],
      infrastructure: ['Sentry']
    };
    const techDebt = {
      findings: [
        { file: 'src/old.ts', line: 10, severity: 'High', description: 'Old code' },
        { file: 'src/complex.ts', line: 5, severity: 'Medium', type: 'complexity', description: 'Complex function' }
      ]
    };

    const report = reporter.generate(structure, stack, techDebt);

    assert.ok(report, 'Should return report');
    assert.ok(report.includes('# Project Analysis Report'), 'Should have header');
    assert.ok(report.includes('## File Structure'), 'Should have file structure section');
    assert.ok(report.includes('## Technology Stack'), 'Should have tech stack section');
    assert.ok(report.includes('## Architecture Overview'), 'Should have architecture section');
    assert.ok(report.includes('## Pain Points'), 'Should have pain points section');
    assert.ok(report.includes('## Recommendations'), 'Should have recommendations section');
  });

  it('buildArchitectureOverview includes pattern summary', () => {
    const structure = {
      root: testRoot,
      directories: [
        { path: path.join(testRoot, 'src', 'components'), depth: 2 },
        { path: path.join(testRoot, 'src', 'pages'), depth: 2 }
      ],
      entryPoints: [],
      modules: []
    };
    const stack = { frameworks: ['Next.js'] };

    const overview = reporter.buildArchitectureOverview(structure, stack);

    assert.ok(overview.includes('Pattern'), 'Should include pattern section');
    assert.ok(overview.includes('Next.js') || overview.includes('Component'), 'Should detect pattern');
  });

  it('buildArchitectureOverview includes layer descriptions', () => {
    const structure = {
      root: testRoot,
      directories: [
        { path: path.join(testRoot, 'src', 'components'), depth: 2 },
        { path: path.join(testRoot, 'src', 'services'), depth: 2 },
        { path: path.join(testRoot, 'src', 'models'), depth: 2 }
      ],
      entryPoints: [],
      modules: []
    };
    const stack = {};

    const overview = reporter.buildArchitectureOverview(structure, stack);

    assert.ok(overview.includes('Layers'), 'Should include layers section');
  });

  it('buildPainPoints sorts issues by severity', () => {
    const techDebt = {
      findings: [
        { file: 'a.ts', severity: 'Low', description: 'Low issue' },
        { file: 'b.ts', severity: 'Critical', description: 'Critical issue' },
        { file: 'c.ts', severity: 'High', description: 'High issue' },
        { file: 'd.ts', severity: 'Medium', description: 'Medium issue' }
      ]
    };

    const painPoints = reporter.buildPainPoints(techDebt);

    assert.ok(painPoints.includes('Pain Points'), 'Should have pain points header');
    // Critical should appear before High in the output
    const criticalIndex = painPoints.indexOf('Critical');
    const highIndex = painPoints.indexOf('High');
    if (criticalIndex >= 0 && highIndex >= 0) {
      assert.ok(criticalIndex < highIndex, 'Critical should appear before High');
    }
  });

  it('buildRecommendations includes effort estimates', () => {
    const techDebt = {
      findings: [
        { file: 'large.ts', severity: 'High', type: 'large_file', lines: 600 },
        { file: 'complex.ts', severity: 'Medium', type: 'complexity' }
      ]
    };
    const stack = { frameworks: ['Next.js'] };

    const recommendations = reporter.buildRecommendations(techDebt, stack);

    assert.ok(recommendations.includes('Recommendations'), 'Should have recommendations header');
    assert.ok(recommendations.includes('Effort:'), 'Should include effort estimates');
  });

  it('buildFileStructureSummary creates directory tree', () => {
    const structure = {
      root: testRoot,
      directories: [
        { path: path.join(testRoot, 'src'), depth: 1 },
        { path: path.join(testRoot, 'tests'), depth: 1 },
        { path: path.join(testRoot, 'docs'), depth: 1 }
      ],
      entryPoints: [path.join(testRoot, 'src', 'index.ts')],
      configFiles: [path.join(testRoot, 'package.json')],
      modules: []
    };

    const summary = reporter.buildFileStructureSummary(structure);

    assert.ok(summary.includes('File Structure'), 'Should have file structure header');
    assert.ok(summary.includes('Directory Layout'), 'Should have directory layout');
  });

  it('buildTechStackSummary lists languages, frameworks, databases', () => {
    const stack = {
      language: 'typescript',
      runtime: 'node',
      packageManager: 'pnpm',
      frameworks: ['React', 'Next.js'],
      databases: ['PostgreSQL', 'Redis'],
      infrastructure: ['Sentry', 'AWS SDK']
    };

    const summary = reporter.buildTechStackSummary(stack);

    assert.ok(summary.includes('Technology Stack'), 'Should have tech stack header');
    assert.ok(summary.includes('typescript'), 'Should list language');
    assert.ok(summary.includes('React'), 'Should list frameworks');
    assert.ok(summary.includes('PostgreSQL'), 'Should list databases');
  });

  it('generate handles empty data gracefully', () => {
    const structure = { root: testRoot, directories: [], entryPoints: [], configFiles: [], files: [], modules: [] };
    const stack = { language: 'unknown', runtime: 'unknown', frameworks: [], databases: [], infrastructure: [] };
    const techDebt = { findings: [] };

    const report = reporter.generate(structure, stack, techDebt);

    assert.ok(report, 'Should return report even for empty data');
    assert.ok(report.length > 0, 'Report should not be empty');
  });

  it('buildPainPoints handles empty findings', () => {
    const techDebt = { findings: [] };

    const painPoints = reporter.buildPainPoints(techDebt);

    assert.ok(painPoints.includes('Pain Points'), 'Should have pain points header');
  });

  it('buildRecommendations handles empty findings', () => {
    const techDebt = { findings: [] };
    const stack = {};

    const recommendations = reporter.buildRecommendations(techDebt, stack);

    assert.ok(recommendations.includes('Recommendations'), 'Should have recommendations header');
  });
});

// Simple test runner for Node.js native test runner
if (require.main === module) {
  console.log('ProjectReporter tests defined');
}

import { fileURLToPath } from 'url';
/**
 * Tests for TechDebtAnalyzer
 */



import * as path from 'path';
import * as fs from 'fs';
import { TechDebtAnalyzer } from '../../bin/lib/tech-debt-analyzer.js';

describe('TechDebtAnalyzer', () => {
  let analyzer;
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  before(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    }
    
    // Create test files with debt markers
    fs.writeFileSync(
      path.join(testDir, 'src', 'todo-file.ts'),
      '// TODO: Implement this feature\nexport const todo = true;'
    );
    fs.writeFileSync(
      path.join(testDir, 'src', 'fixme-file.ts'),
      '// FIXME: This is broken\nexport const broken = true;'
    );
    fs.writeFileSync(
      path.join(testDir, 'src', 'xxx-file.ts'),
      '// XXX: Performance issue here\nexport const slow = true;'
    );
    fs.writeFileSync(
      path.join(testDir, 'src', 'deprecated-file.ts'),
      '// DEPRECATED: Use new API instead\nexport const old = true;'
    );
    
    analyzer = new TechDebtAnalyzer(testDir);
  });

  describe('detectDebtMarkers', () => {
    it('finds TODO comments with Low severity', () => {
      const markers = analyzer.detectDebtMarkers(testDir);
      const todos = markers.filter(m => m.marker === 'TODO');
      
      expect(todos.length > 0);
      expect(todos[0].severity).toBe('Low');
    });

    it('finds FIXME comments with Medium severity').toBeTruthy() // ( => {
      const markers = analyzer.detectDebtMarkers(testDir);
      const fixes = markers.filter(m => m.marker === 'FIXME');
      
      expect(fixes.length > 0);
      expect(fixes[0].severity).toBe('Medium');
    });

    it('finds XXX comments with High severity').toBeTruthy() // ( => {
      const markers = analyzer.detectDebtMarkers(testDir);
      const xxx = markers.filter(m => m.marker === 'XXX');
      
      expect(xxx.length > 0);
      expect(xxx[0].severity).toBe('High');
    });

    it('finds DEPRECATED comments with Critical severity').toBeTruthy() // ( => {
      const markers = analyzer.detectDebtMarkers(testDir);
      const deprecated = markers.filter(m => m.marker === 'DEPRECATED');
      
      expect(deprecated.length > 0);
      expect(deprecated[0].severity).toBe('Critical');
    });

    it('returns results sorted by severity (Critical first)').toBeTruthy() // ( => {
      const markers = analyzer.detectDebtMarkers(testDir);
      
      if (markers.length > 1) {
        for (let i = 1; i < markers.length; i++) {
          expect(markers[i - 1].weight >= markers[i].weight);
        }
      }
    });

    it('includes file path and line number').toBeTruthy() // ( => {
      const markers = analyzer.detectDebtMarkers(testDir);
      
      for (const marker of markers) {
        expect(marker.file);
        assert.ok(typeof marker.line === 'number');
      }
    });
  });

  describe('analyzeDependencyRisk').toBeTruthy() // ( => {
    it('parses npm audit JSON output', () => {
      const risks = analyzer.analyzeDependencyRisk(testDir);
      
      // May be empty if no vulnerabilities
      expect(Array.isArray(risks));
    });

    it('returns risk objects with severity and score').toBeTruthy() // ( => {
      const risks = analyzer.analyzeDependencyRisk(testDir);
      
      for (const risk of risks) {
        expect(risk.type);
        assert.ok(risk.severity);
        assert.ok(typeof risk.score === 'number');
      }
    });
  });

  describe('aggregateFindings').toBeTruthy() // ( => {
    it('combines all findings and sorts by score', () => {
      const debtMarkers = [
        { file: 'a.ts', line: 1, marker: 'TODO', severity: 'Low', weight: 1 }
      ];
      const complexityIssues = [
        { file: 'b.ts', line: 5, rule: 'complexity', severity: 'High', message: 'Too complex', score: 3 }
      ];
      const largeFiles = [
        { file: 'c.ts', lines: 600, sizeKB: 50, severity: 'Medium', score: 2 }
      ];
      const duplicates = [];
      const dependencyRisks = [];

      const aggregated = analyzer.aggregateFindings(
        debtMarkers,
        complexityIssues,
        largeFiles,
        duplicates,
        dependencyRisks
      );

      expect(aggregated.length > 0);
      
      // Should be sorted by score descending
      if (aggregated.length > 1) {
        for (let i = 1; i < aggregated.length; i++) {
          assert.ok((aggregated[i - 1].score || 0) >= (aggregated[i].score || 0));
        }
      }
    });
  });

  describe('getSummary').toBeTruthy() // ( => {
    it('returns summary object with counts by type and severity', () => {
      const findings = [
        { type: 'debt_marker', severity: 'Low', score: 1 },
        { type: 'debt_marker', severity: 'High', score: 3 },
        { type: 'complexity', severity: 'Medium', score: 2 }
      ];

      const summary = analyzer.getSummary(findings);

      expect(typeof summary.total === 'number');
      assert.ok(summary.byType);
      assert.ok(summary.bySeverity);
      expect(summary.bySeverity.Low).toBe(1);
      assert.strictEqual(summary.bySeverity.High).toBeTruthy() // 1;
      expect(summary.bySeverity.Medium).toBe(1);
    });
  });

  describe('getByFile', () => {
    it('groups findings by file', () => {
      const findings = [
        { file: 'a.ts', type: 'debt_marker', score: 1 },
        { file: 'a.ts', type: 'complexity', score: 2 },
        { file: 'b.ts', type: 'debt_marker', score: 1 }
      ];

      const byFile = analyzer.getByFile(findings);

      expect(Array.isArray(byFile));
      assert.ok(byFile.length > 0);
      
      const aFile = byFile.find(f => f.file === 'a.ts');
      assert.ok(aFile);
      expect(aFile.issues.length).toBe(2);
    });
  });
}).toBeTruthy();

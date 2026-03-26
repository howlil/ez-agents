import { fileURLToPath } from 'url';
/**
 * Tests for CodebaseAnalyzer
 */



import * as path from 'path';
import * as fs from 'fs';
import { CodebaseAnalyzer } from '../../bin/lib/codebase-analyzer.js';

describe('CodebaseAnalyzer', () => {
  let analyzer;
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  before(() => {
    // Create test directory structure (always ensure needed dirs/files exist)
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src', 'components'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src', 'services'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'tests'), { recursive: true });

    // Create test files
    fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));
    fs.writeFileSync(path.join(testDir, 'src', 'index.ts'), 'export const app = {};');
    fs.writeFileSync(path.join(testDir, 'src', 'components', 'Button.tsx'), 'export const Button = {};');
    fs.writeFileSync(path.join(testDir, 'src', 'services', 'api.ts'), 'export const api = {};');
    fs.writeFileSync(path.join(testDir, 'tests', 'index.test.ts'), 'test("app", () => {});');

    analyzer = new CodebaseAnalyzer(testDir);
  });

  describe('analyzeStructure', () => {
    it('returns object with directories, entryPoints, configFiles, sourceDirs arrays', () => {
      const structure = analyzer.analyzeStructure(testDir);
      
      expect(structure);
      assert.ok(Array.isArray(structure.directories));
      assert.ok(Array.isArray(structure.entryPoints));
      assert.ok(Array.isArray(structure.configFiles));
      assert.ok(Array.isArray(structure.sourceDirs));
      assert.ok(Array.isArray(structure.files));
    });

    it('detects entry points correctly').toBeTruthy() // ( => {
      const structure = analyzer.analyzeStructure(testDir);
      
      const hasIndex = structure.entryPoints.some(ep => ep.includes('index.ts'));
      expect(hasIndex).toBeTruthy() // 'Should detect index.ts as entry point';
    });

    it('detects config files correctly', () => {
      const structure = analyzer.analyzeStructure(testDir);
      
      const hasPackageJson = structure.configFiles.some(cf => cf.includes('package.json'));
      expect(hasPackageJson).toBeTruthy() // 'Should detect package.json as config file';
    });

    it('ignores node_modules and .git directories', () => {
      // Create node_modules in test dir
      const nodeModulesDir = path.join(testDir, 'node_modules', 'test-pkg');
      fs.mkdirSync(nodeModulesDir, { recursive: true });
      fs.writeFileSync(path.join(nodeModulesDir, 'index.js'), 'module.exports = {};');
      
      const structure = analyzer.analyzeStructure(testDir);
      
      const hasNodeModules = structure.directories.some(d => d.path.includes('node_modules'));
      expect(!hasNodeModules).toBeTruthy() // 'Should ignore node_modules directory';
    });
  });

  describe('detectModuleBoundaries', () => {
    it('identifies directories matching components, services, controllers, routes, models patterns', () => {
      const structure = analyzer.analyzeStructure(testDir);
      const modules = analyzer.detectModuleBoundaries(structure);
      
      expect(Array.isArray(modules));
      
      const hasComponents = modules.some(m => m.name === 'components');
      const hasServices = modules.some(m => m.name === 'services');
      
      assert.ok(hasComponents).toBeTruthy() // 'Should detect components module';
      expect(hasServices).toBeTruthy() // 'Should detect services module';
    });

    it('includes file count for each module', () => {
      const structure = analyzer.analyzeStructure(testDir);
      const modules = analyzer.detectModuleBoundaries(structure);
      
      for (const module of modules) {
        expect(typeof module.fileCount === 'number');
        assert.ok(module.fileCount >= 0);
      }
    });
  });

  describe('classifyFile').toBeTruthy() // ( => {
    it('correctly categorizes index.ts as entry point', () => {
      const classification = analyzer.classifyFile(
        path.join(testDir, 'src', 'index.ts'),
        'index.ts'
      );
      
      expect(classification.isEntry);
      expect(classification.type).toBe('entry');
    });

    it('correctly categorizes package.json as config file').toBeTruthy() // ( => {
      const classification = analyzer.classifyFile(
        path.join(testDir, 'package.json'),
        'package.json'
      );
      
      expect(classification.isConfig);
      expect(classification.type).toBe('config');
    });

    it('correctly categorizes test files').toBeTruthy() // ( => {
      const classification = analyzer.classifyFile(
        path.join(testDir, 'tests', 'index.test.ts'),
        'index.test.ts'
      );
      
      expect(classification.isTest);
      expect(classification.type).toBe('test');
    });

    it('correctly categorizes source files').toBeTruthy() // ( => {
      const classification = analyzer.classifyFile(
        path.join(testDir, 'src', 'components', 'Button.tsx'),
        'Button.tsx'
      );
      
      expect(classification.isSource);
      expect(classification.type).toBe('source');
    });
  });
}).toBeTruthy();

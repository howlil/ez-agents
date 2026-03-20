/**
 * Tests for StackDetector and FrameworkDetector
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { StackDetector } = require('../../bin/lib/stack-detector.cjs');
const { FrameworkDetector } = require('../../bin/lib/framework-detector.cjs');

describe('StackDetector', () => {
  let detector;
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  before(() => {
    // Ensure test directory exists with package.json
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create test package.json
    const pkgPath = path.join(testDir, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.0.0',
        next: '^14.0.0',
        pg: '^8.0.0',
        mongoose: '^7.0.0',
        '@sentry/node': '^7.0.0'
      },
      devDependencies: {
        jest: '^29.0.0'
      }
    }, null, 2));

    // Create lock files for package manager detection
    fs.writeFileSync(path.join(testDir, 'pnpm-lock.yaml'), '');
    
    detector = new StackDetector(testDir);
  });

  describe('detectPackageManager', () => {
    it('returns pnpm when pnpm-lock.yaml exists', () => {
      const pm = detector.detectPackageManager(testDir);
      assert.strictEqual(pm, 'pnpm');
    });

    it('returns yarn when yarn.lock exists', () => {
      // Create yarn.lock
      fs.writeFileSync(path.join(testDir, 'yarn.lock'), '');
      fs.unlinkSync(path.join(testDir, 'pnpm-lock.yaml'));
      
      const newDetector = new StackDetector(testDir);
      const pm = newDetector.detectPackageManager(testDir);
      assert.strictEqual(pm, 'yarn');
      
      // Restore
      fs.writeFileSync(path.join(testDir, 'pnpm-lock.yaml'), '');
      fs.unlinkSync(path.join(testDir, 'yarn.lock'));
    });

    it('returns npm when package-lock.json exists', () => {
      // Remove other lock files
      if (fs.existsSync(path.join(testDir, 'pnpm-lock.yaml'))) {
        fs.unlinkSync(path.join(testDir, 'pnpm-lock.yaml'));
      }
      if (fs.existsSync(path.join(testDir, 'yarn.lock'))) {
        fs.unlinkSync(path.join(testDir, 'yarn.lock'));
      }
      
      fs.writeFileSync(path.join(testDir, 'package-lock.json'), '{}');
      
      const newDetector = new StackDetector(testDir);
      const pm = newDetector.detectPackageManager(testDir);
      assert.strictEqual(pm, 'npm');
      
      // Restore
      fs.unlinkSync(path.join(testDir, 'package-lock.json'));
      fs.writeFileSync(path.join(testDir, 'pnpm-lock.yaml'), '');
    });
  });

  describe('detectFrameworks', () => {
    it('returns ["React"] when dependencies has react', () => {
      const frameworks = detector.detectFrameworks({ react: '^18.0.0' });
      assert.ok(frameworks.includes('React'));
    });

    it('returns ["Next.js"] when dependencies has next', () => {
      const frameworks = detector.detectFrameworks({ next: '^14.0.0' });
      assert.ok(frameworks.includes('Next.js'));
    });

    it('detects multiple frameworks', () => {
      const frameworks = detector.detectFrameworks({ 
        react: '^18.0.0', 
        next: '^14.0.0',
        express: '^4.0.0'
      });
      assert.ok(frameworks.includes('React'));
      assert.ok(frameworks.includes('Next.js'));
      assert.ok(frameworks.includes('Express'));
    });
  });

  describe('detectDatabases', () => {
    it('returns ["PostgreSQL"] when dependencies has pg', () => {
      const databases = detector.detectDatabases({ pg: '^8.0.0' });
      assert.ok(databases.includes('PostgreSQL'));
    });

    it('returns ["MongoDB"] when dependencies has mongoose', () => {
      const databases = detector.detectDatabases({ mongoose: '^7.0.0' });
      assert.ok(databases.includes('MongoDB'));
    });

    it('detects multiple databases', () => {
      const databases = detector.detectDatabases({ 
        pg: '^8.0.0',
        mongoose: '^7.0.0',
        redis: '^4.0.0'
      });
      assert.ok(databases.includes('PostgreSQL'));
      assert.ok(databases.includes('MongoDB'));
      assert.ok(databases.includes('Redis'));
    });
  });

  describe('detectInfrastructure', () => {
    it('returns ["Sentry"] when dependencies has @sentry/node', () => {
      const infrastructure = detector.detectInfrastructure({ '@sentry/node': '^7.0.0' });
      assert.ok(infrastructure.includes('Sentry'));
    });

    it('detects testing frameworks', () => {
      const infrastructure = detector.detectInfrastructure({ jest: '^29.0.0' });
      assert.ok(infrastructure.includes('Jest'));
    });
  });

  describe('detect', () => {
    it('returns complete stack object', () => {
      const stack = detector.detect(testDir);
      
      assert.ok(stack);
      assert.ok(typeof stack.language === 'string');
      assert.ok(typeof stack.runtime === 'string');
      assert.ok(typeof stack.packageManager === 'string');
      assert.ok(Array.isArray(stack.frameworks));
      assert.ok(Array.isArray(stack.databases));
      assert.ok(Array.isArray(stack.infrastructure));
    });
  });

  describe('detectConfigFiles', () => {
    it('finds tsconfig.json when it exists', () => {
      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), '{}');
      
      const configs = detector.detectConfigFiles(testDir);
      assert.ok(configs.typescript);
      assert.ok(configs.typescript.exists);
      
      fs.unlinkSync(path.join(testDir, 'tsconfig.json'));
    });

    it('finds jest.config.js when it exists', () => {
      fs.writeFileSync(path.join(testDir, 'jest.config.js'), 'module.exports = {};');
      
      const configs = detector.detectConfigFiles(testDir);
      assert.ok(configs.jest);
      assert.ok(configs.jest.exists);
      
      fs.unlinkSync(path.join(testDir, 'jest.config.js'));
    });
  });
});

describe('FrameworkDetector', () => {
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  describe('detectFromConfig', () => {
    it('finds typescript when tsconfig.json exists', () => {
      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), '{}');
      
      const detector = new FrameworkDetector(testDir);
      const configs = detector.detectFromConfig(testDir);
      
      assert.ok(configs.typescript);
      
      fs.unlinkSync(path.join(testDir, 'tsconfig.json'));
    });

    it('finds jest when jest.config.js exists', () => {
      fs.writeFileSync(path.join(testDir, 'jest.config.js'), 'module.exports = {};');
      
      const detector = new FrameworkDetector(testDir);
      const configs = detector.detectFromConfig(testDir);
      
      assert.ok(configs.jest);
      
      fs.unlinkSync(path.join(testDir, 'jest.config.js'));
    });

    it('finds docker when Dockerfile exists', () => {
      fs.writeFileSync(path.join(testDir, 'Dockerfile'), 'FROM node:18');
      
      const detector = new FrameworkDetector(testDir);
      const configs = detector.detectFromConfig(testDir);
      
      assert.ok(configs.docker);
      
      fs.unlinkSync(path.join(testDir, 'Dockerfile'));
    });
  });

  describe('detectFromImports', () => {
    it('finds React from import React statements', () => {
      const testFile = path.join(testDir, 'test-react.tsx');
      fs.writeFileSync(testFile, 'import React from "react";\nexport const App = () => <div />;');
      
      const detector = new FrameworkDetector(testDir);
      const imports = detector.detectFromImports([testFile]);
      
      assert.ok(imports['React']);
      
      fs.unlinkSync(testFile);
    });

    it('finds Next.js from next/server imports', () => {
      const testFile = path.join(testDir, 'test-next.tsx');
      fs.writeFileSync(testFile, 'import { NextRequest } from "next/server";');
      
      const detector = new FrameworkDetector(testDir);
      const imports = detector.detectFromImports([testFile]);
      
      assert.ok(imports['Next.js']);
      
      fs.unlinkSync(testFile);
    });
  });
});

import { fileURLToPath } from 'url';
/**
 * Constraint Extractor Tests
 * Tests for ConstraintExtractor class
 */



import * as path from 'path';
import * as fs from 'fs';
import { ConstraintExtractor } from '../../bin/lib/constraint-extractor.js';

const testRoot = path.join(__dirname, '..', 'fixtures', 'test-project');

describe('ConstraintExtractor', () => {
  let extractor;

  before(() => {
    extractor = new ConstraintExtractor(testRoot);
  });

  beforeEach(() => {
    // Ensure test directory exists
    if (!fs.existsSync(testRoot)) {
      fs.mkdirSync(testRoot, { recursive: true });
    }
  });

  it('extractDeadlines finds Q1/Q2/Q3/Q4 mentions', () => {
    const readmePath = path.join(testRoot, 'README.md');
    fs.writeFileSync(readmePath, '# Test Project\n\nTarget launch: Q2 2026\n');

    const deadlines = extractor.extractDeadlines(testRoot);

    const quarterDeadlines = deadlines.filter(d => d.deadlineType === 'quarter');
    expect(quarterDeadlines.length > 0).toBeTruthy() // 'Should find quarter mentions';
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractDeadlines finds date patterns (2026, 2027)', () => {
    const readmePath = path.join(testRoot, 'README.md');
    fs.writeFileSync(readmePath, '# Test Project\n\nExpected completion: 2026\n');

    const deadlines = extractor.extractDeadlines(testRoot);

    const yearDeadlines = deadlines.filter(d => d.deadlineType === 'year');
    expect(yearDeadlines.length > 0).toBeTruthy() // 'Should find year mentions';
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractTeamSize infers from package.json authors', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      authors: ['Author 1', 'Author 2', 'Author 3']
    }, undefined, 2));

    const teamSize = extractor.extractTeamSize(testRoot);

    expect(teamSize.inferred >= 3).toBeTruthy() // 'Should infer team size from authors';
    expect(teamSize.sources.some(s => s.type === 'authors')).toBeTruthy() // 'Should have authors source';
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractTeamSize infers from CONTRIBUTING.md', () => {
    const contributingPath = path.join(testRoot, 'CONTRIBUTING.md');
    fs.writeFileSync(contributingPath, '# Contributing\n\nThank you to all contributors and developers!\n');

    const teamSize = extractor.extractTeamSize(testRoot);

    expect(teamSize.sources.some(s => s.type === 'contributing_mentions')).toBeTruthy() // 'Should find contributing mentions';
    
    // Cleanup
    fs.unlinkSync(contributingPath);
  });

  it('extractBudgetTier returns startup for Vercel hosting', () => {
    const vercelPath = path.join(testRoot, 'vercel.json');
    fs.writeFileSync(vercelPath, JSON.stringify({ version: 2 }));

    const budget = extractor.extractBudgetTier(testRoot);

    expect(budget.tier).toBe('startup', 'Should detect startup tier for Vercel');
    
    // Cleanup
    fs.unlinkSync(vercelPath);
  });

  it('extractBudgetTier returns enterprise for AWS mentions', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { '@aws-sdk/client-s3': '^3.0.0' }
    }, undefined, 2));

    const budget = extractor.extractBudgetTier(testRoot);

    expect(budget.tier).toBe('enterprise', 'Should detect enterprise tier for AWS');
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractCompliance finds GDPR mentions', () => {
    const readmePath = path.join(testRoot, 'README.md');
    fs.writeFileSync(readmePath, '# Test Project\n\nThis project is GDPR compliant.\n');

    const compliance = extractor.extractCompliance(testRoot);

    const gdprCompliance = compliance.find(c => c.requirement === 'GDPR');
    expect(gdprCompliance).toBeTruthy() // 'Should find GDPR compliance';
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractCompliance finds HIPAA mentions', () => {
    const securityPath = path.join(testRoot, 'SECURITY.md');
    fs.writeFileSync(securityPath, '# Security\n\nHIPAA compliant healthcare data handling.\n');

    const compliance = extractor.extractCompliance(testRoot);

    const hipaaCompliance = compliance.find(c => c.requirement === 'HIPAA');
    expect(hipaaCompliance).toBeTruthy() // 'Should find HIPAA compliance';
    
    // Cleanup
    fs.unlinkSync(securityPath);
  });

  it('extractCompliance finds accessibility/a11y mentions', () => {
    const readmePath = path.join(testRoot, 'README.md');
    fs.writeFileSync(readmePath, '# Test Project\n\nWCAG 2.1 a11y compliance is a priority.\n');

    const compliance = extractor.extractCompliance(testRoot);

    const a11yCompliance = compliance.find(c => c.complianceType === 'accessibility');
    expect(a11yCompliance).toBeTruthy() // 'Should find accessibility compliance';
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractLegacyFactors finds deprecated dependencies', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { 'old-package': '^0.9.0' }
    }, undefined, 2));

    const factors = extractor.extractLegacyFactors(testRoot);

    const outdatedFactors = factors.filter(f => f.factor.includes('Outdated'));
    expect(outdatedFactors.length > 0).toBeTruthy() // 'Should find outdated dependencies';
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractLegacyFactors finds migration mentions', () => {
    const migrationPath = path.join(testRoot, 'docs', 'MIGRATION.md');
    fs.mkdirSync(path.dirname(migrationPath), { recursive: true });
    fs.writeFileSync(migrationPath, '# Migration Guide\n\nMigration from v1 to v2 requires...\n');

    const factors = extractor.extractLegacyFactors(testRoot);

    const migrationFactors = factors.filter(f => f.factor.toLowerCase().includes('migration'));
    expect(migrationFactors.length > 0).toBeTruthy() // 'Should find migration mentions';
    
    // Cleanup
    fs.unlinkSync(migrationPath);
    fs.rmdirSync(path.dirname(migrationPath));
  });

  it('extractScalabilityNeeds infers from Redis usage', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { 'redis': '^4.0.0' }
    }, undefined, 2));

    const needs = extractor.extractScalabilityNeeds(testRoot);

    const cachingNeeds = needs.filter(n => n.need.includes('Caching'));
    expect(cachingNeeds.length > 0).toBeTruthy() // 'Should infer caching need from Redis';
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractScalabilityNeeds infers from queue system usage', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { 'bull': '^4.0.0' }
    }, undefined, 2));

    const needs = extractor.extractScalabilityNeeds(testRoot);

    const queueNeeds = needs.filter(n => n.need.includes('queue') || n.need.includes('Job'));
    expect(queueNeeds.length > 0).toBeTruthy() // 'Should infer queue need from Bull';
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extract returns complete constraints object', () => {
    const constraints = extractor.extract(testRoot);

    expect(constraints).toBeTruthy() // 'Should return constraints object';
    expect(Array.isArray(constraints.deadlines)).toBeTruthy() // 'Should have deadlines array';
    expect(constraints.teamSize).toBeTruthy() // 'Should have teamSize object';
    expect(constraints.budgetTier).toBeTruthy() // 'Should have budgetTier object';
    expect(Array.isArray(constraints.compliance)).toBeTruthy() // 'Should have compliance array';
    expect(Array.isArray(constraints.legacyFactors)).toBeTruthy() // 'Should have legacyFactors array';
    expect(Array.isArray(constraints.scalabilityNeeds)).toBeTruthy() // 'Should have scalabilityNeeds array';
  });

  it('extract handles missing files gracefully', () => {
    const emptyRoot = path.join(testRoot, 'nonexistent');
    const extractorEmpty = new ConstraintExtractor(emptyRoot);

    const constraints = extractorEmpty.extract(emptyRoot);

    expect(constraints).toBeTruthy() // 'Should return constraints even for empty directory';
    expect(Array.isArray(constraints.deadlines)).toBeTruthy() // 'Should have empty deadlines array';
  });
});

// Simple test runner for Node.js native test runner
if (require.main === module) {
  console.log('ConstraintExtractor tests defined');
}

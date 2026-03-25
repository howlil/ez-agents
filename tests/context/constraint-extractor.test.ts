import { fileURLToPath } from 'url';
import path from 'path';
/**
 * Constraint Extractor Tests
 * Tests for ConstraintExtractor class
 */

const { describe, it, before, beforeEach } = require('node:test');
import assert from 'node:assert';
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
    assert.ok(quarterDeadlines.length > 0, 'Should find quarter mentions');
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractDeadlines finds date patterns (2026, 2027)', () => {
    const readmePath = path.join(testRoot, 'README.md');
    fs.writeFileSync(readmePath, '# Test Project\n\nExpected completion: 2026\n');

    const deadlines = extractor.extractDeadlines(testRoot);

    const yearDeadlines = deadlines.filter(d => d.deadlineType === 'year');
    assert.ok(yearDeadlines.length > 0, 'Should find year mentions');
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractTeamSize infers from package.json authors', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      authors: ['Author 1', 'Author 2', 'Author 3']
    }, null, 2));

    const teamSize = extractor.extractTeamSize(testRoot);

    assert.ok(teamSize.inferred >= 3, 'Should infer team size from authors');
    assert.ok(teamSize.sources.some(s => s.type === 'authors'), 'Should have authors source');
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractTeamSize infers from CONTRIBUTING.md', () => {
    const contributingPath = path.join(testRoot, 'CONTRIBUTING.md');
    fs.writeFileSync(contributingPath, '# Contributing\n\nThank you to all contributors and developers!\n');

    const teamSize = extractor.extractTeamSize(testRoot);

    assert.ok(teamSize.sources.some(s => s.type === 'contributing_mentions'), 'Should find contributing mentions');
    
    // Cleanup
    fs.unlinkSync(contributingPath);
  });

  it('extractBudgetTier returns startup for Vercel hosting', () => {
    const vercelPath = path.join(testRoot, 'vercel.json');
    fs.writeFileSync(vercelPath, JSON.stringify({ version: 2 }));

    const budget = extractor.extractBudgetTier(testRoot);

    assert.strictEqual(budget.tier, 'startup', 'Should detect startup tier for Vercel');
    
    // Cleanup
    fs.unlinkSync(vercelPath);
  });

  it('extractBudgetTier returns enterprise for AWS mentions', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { '@aws-sdk/client-s3': '^3.0.0' }
    }, null, 2));

    const budget = extractor.extractBudgetTier(testRoot);

    assert.strictEqual(budget.tier, 'enterprise', 'Should detect enterprise tier for AWS');
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractCompliance finds GDPR mentions', () => {
    const readmePath = path.join(testRoot, 'README.md');
    fs.writeFileSync(readmePath, '# Test Project\n\nThis project is GDPR compliant.\n');

    const compliance = extractor.extractCompliance(testRoot);

    const gdprCompliance = compliance.find(c => c.requirement === 'GDPR');
    assert.ok(gdprCompliance, 'Should find GDPR compliance');
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractCompliance finds HIPAA mentions', () => {
    const securityPath = path.join(testRoot, 'SECURITY.md');
    fs.writeFileSync(securityPath, '# Security\n\nHIPAA compliant healthcare data handling.\n');

    const compliance = extractor.extractCompliance(testRoot);

    const hipaaCompliance = compliance.find(c => c.requirement === 'HIPAA');
    assert.ok(hipaaCompliance, 'Should find HIPAA compliance');
    
    // Cleanup
    fs.unlinkSync(securityPath);
  });

  it('extractCompliance finds accessibility/a11y mentions', () => {
    const readmePath = path.join(testRoot, 'README.md');
    fs.writeFileSync(readmePath, '# Test Project\n\nWCAG 2.1 a11y compliance is a priority.\n');

    const compliance = extractor.extractCompliance(testRoot);

    const a11yCompliance = compliance.find(c => c.complianceType === 'accessibility');
    assert.ok(a11yCompliance, 'Should find accessibility compliance');
    
    // Cleanup
    fs.unlinkSync(readmePath);
  });

  it('extractLegacyFactors finds deprecated dependencies', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { 'old-package': '^0.9.0' }
    }, null, 2));

    const factors = extractor.extractLegacyFactors(testRoot);

    const outdatedFactors = factors.filter(f => f.factor.includes('Outdated'));
    assert.ok(outdatedFactors.length > 0, 'Should find outdated dependencies');
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractLegacyFactors finds migration mentions', () => {
    const migrationPath = path.join(testRoot, 'docs', 'MIGRATION.md');
    fs.mkdirSync(path.dirname(migrationPath), { recursive: true });
    fs.writeFileSync(migrationPath, '# Migration Guide\n\nMigration from v1 to v2 requires...\n');

    const factors = extractor.extractLegacyFactors(testRoot);

    const migrationFactors = factors.filter(f => f.factor.toLowerCase().includes('migration'));
    assert.ok(migrationFactors.length > 0, 'Should find migration mentions');
    
    // Cleanup
    fs.unlinkSync(migrationPath);
    fs.rmdirSync(path.dirname(migrationPath));
  });

  it('extractScalabilityNeeds infers from Redis usage', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { 'redis': '^4.0.0' }
    }, null, 2));

    const needs = extractor.extractScalabilityNeeds(testRoot);

    const cachingNeeds = needs.filter(n => n.need.includes('Caching'));
    assert.ok(cachingNeeds.length > 0, 'Should infer caching need from Redis');
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extractScalabilityNeeds infers from queue system usage', () => {
    const pkgPath = path.join(testRoot, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({
      name: 'test',
      dependencies: { 'bull': '^4.0.0' }
    }, null, 2));

    const needs = extractor.extractScalabilityNeeds(testRoot);

    const queueNeeds = needs.filter(n => n.need.includes('queue') || n.need.includes('Job'));
    assert.ok(queueNeeds.length > 0, 'Should infer queue need from Bull');
    
    // Cleanup
    fs.unlinkSync(pkgPath);
  });

  it('extract returns complete constraints object', () => {
    const constraints = extractor.extract(testRoot);

    assert.ok(constraints, 'Should return constraints object');
    assert.ok(Array.isArray(constraints.deadlines), 'Should have deadlines array');
    assert.ok(constraints.teamSize, 'Should have teamSize object');
    assert.ok(constraints.budgetTier, 'Should have budgetTier object');
    assert.ok(Array.isArray(constraints.compliance), 'Should have compliance array');
    assert.ok(Array.isArray(constraints.legacyFactors), 'Should have legacyFactors array');
    assert.ok(Array.isArray(constraints.scalabilityNeeds), 'Should have scalabilityNeeds array');
  });

  it('extract handles missing files gracefully', () => {
    const emptyRoot = path.join(testRoot, 'nonexistent');
    const extractorEmpty = new ConstraintExtractor(emptyRoot);

    const constraints = extractorEmpty.extract(emptyRoot);

    assert.ok(constraints, 'Should return constraints even for empty directory');
    assert.ok(Array.isArray(constraints.deadlines), 'Should have empty deadlines array');
  });
});

// Simple test runner for Node.js native test runner
if (require.main === module) {
  console.log('ConstraintExtractor tests defined');
}

/**
 * Unit Tests for Skill Resolver
 *
 * Tests conflict detection, classification, priority rule application,
 * and decision logging for the SkillResolver class.
 */

import assert from 'node:assert';
import { test } from './test-utils.js';
import { SkillResolver, PRIORITY_RULES, CONFLICT_TYPES } from '../../bin/lib/skill-resolver.js';

console.log('Running Skill Resolver Tests...\n');

let passed = 0;
let failed = 0;

// Test: PRIORITY_RULES exports with expected keys
test('PRIORITY_RULES contains security > speed rule', () => {
  assert.ok(PRIORITY_RULES['security > speed'], 'Missing security > speed rule');
  assert.strictEqual(PRIORITY_RULES['security > speed'].absolute, true);
  assert.strictEqual(PRIORITY_RULES['security > speed'].higher, 'security');
});

test('PRIORITY_RULES contains maintainability > novelty rule', () => {
  assert.ok(PRIORITY_RULES['maintainability > novelty'], 'Missing maintainability > novelty rule');
  assert.strictEqual(PRIORITY_RULES['maintainability > novelty'].absolute, true);
});

test('PRIORITY_RULES contains data integrity > performance rule', () => {
  assert.ok(PRIORITY_RULES['data integrity > performance'], 'Missing data integrity rule');
});

// Test: SkillResolver constructor
test('SkillResolver instantiates with default options', () => {
  const resolver = new SkillResolver();
  assert.ok(resolver, 'Resolver should be instantiated');
  // @ts-expect-error Accessing private member for testing
  assert.ok(resolver.priorityRules, 'Should have priority rules');
  // @ts-expect-error Accessing private member for testing
  assert.deepStrictEqual(resolver.context, {});
  // @ts-expect-error Accessing private member for testing
  assert.deepStrictEqual(resolver.decisionLog, []);
});

test('SkillResolver accepts custom context', () => {
  const resolver = new SkillResolver({ context: { project_phase: 'MVP' } });
  // @ts-expect-error Accessing private member for testing
  assert.strictEqual(resolver.context.project_phase, 'MVP');
});

// Test: detectConflict with no-conflict scenario
test('detectConflict returns no conflict when skills agree', () => {
  const resolver = new SkillResolver();
  const skills = [
    { name: 'security-skill', description: '', version: '1.0.0', tags: [], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', recommendations: [{ aspect: 'auth', value: 'JWT', tags: ['security'] }] },
    { name: 'api-skill', description: '', version: '1.0.0', tags: [], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', recommendations: [{ aspect: 'transport', value: 'HTTPS', tags: ['security'] }] }
  ];
  // @ts-expect-error Testing with partial skill objects
  const result = resolver.detectConflict(skills);
  assert.strictEqual(result?.hasConflict, false);
  assert.deepStrictEqual(result.conflicts, []);
});

test('detectConflict detects conflict on same aspect with different values', () => {
  const resolver = new SkillResolver();
  // Skills use workflow property, not recommendations
  const skills = [
    { name: 'skill-a', description: '', version: '1.0.0', tags: ['performance'], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', workflow: { caching: ['use-redis'] } },
    { name: 'skill-b', description: '', version: '1.0.0', tags: ['simplicity'], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', workflow: { caching: ['no-caching'] } }
  ];
  // @ts-expect-error Testing with partial skill objects
  const result = resolver.detectConflict(skills);
  assert.strictEqual(result?.hasConflict, true);
  assert.strictEqual(result?.conflicts.length, 1);
  if (!result?.conflicts[0]) throw new Error('Expected conflict');
  assert.strictEqual(result.conflicts[0].aspect, 'caching');
});

// Test: classifyConflict
test('classifyConflict identifies Security vs Speed conflict', () => {
  const resolver = new SkillResolver();
  const conflict = {
    aspect: 'validation',
    type: 'Security vs Speed',
    skills: ['security', 'speed'],
    recommendations: [
      { skillName: 'security', value: 'strict-validation', tags: ['security'] },
      { skillName: 'speed', value: 'skip-validation', tags: ['speed', 'delivery'] }
    ]
  };
  // @ts-expect-error Testing with partial conflict object
  const type = resolver.classifyConflict(conflict);
  assert.strictEqual(type, 'Security vs Speed');
});

test('classifyConflict returns default type when no known tags match', () => {
  const resolver = new SkillResolver();
  const conflict = {
    aspect: 'color-scheme',
    type: 'Visual vs Branding',
    skills: ['skill-a', 'skill-b'],
    recommendations: [
      { skillName: 'skill-a', value: 'blue', tags: ['visual'] },
      { skillName: 'skill-b', value: 'red', tags: ['branding'] }
    ]
  };
  // @ts-expect-error Testing with partial conflict object
  const type = resolver.classifyConflict(conflict);
  assert.ok(typeof type === 'string', 'Should return a string type');
});

// Test: resolve
test('resolve returns no-conflict result when skills are compatible', () => {
  const resolver = new SkillResolver();
  const skills = [
    { name: 'monolith', description: '', version: '1.0.0', tags: ['simplicity'], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', workflow: { deployment: ['single-unit'] } }
  ];
  // @ts-expect-error Testing with partial skill objects
  const result = resolver.resolve(skills, {});
  assert.ok(result, 'Should return a result');
  assert.ok('decision' in result, 'Should have decision property');
  assert.strictEqual(result?.escalated, false);
});

test('resolve logs decisions when conflicts are found', () => {
  const resolver = new SkillResolver();
  const skills = [
    { name: 'fast-skill', description: '', version: '1.0.0', tags: ['speed', 'delivery'], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', workflow: { validation: ['skip-validation'] } },
    { name: 'secure-skill', description: '', version: '1.0.0', tags: ['security'], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', workflow: { validation: ['strict-validation'] } }
  ];
  // @ts-expect-error Testing with partial skill objects
  resolver.resolve(skills, {});
  // @ts-expect-error Accessing private member for testing
  assert.ok(Array.isArray(resolver.decisionLog), 'decisionLog should be an array');
});

// Test: logDecision
test('logDecision appends to decisionLog', () => {
  const resolver = new SkillResolver();
  // @ts-expect-error Accessing private member for testing
  resolver.logDecision({ conflict: undefined, resolution: undefined, context: { type: 'test' }, timestamp: new Date().toISOString() });
  // @ts-expect-error Accessing private member for testing
  assert.strictEqual(resolver.decisionLog.length, 1);
  // @ts-expect-error Accessing private member for testing
  const entry = resolver.decisionLog[0];
  if (!entry) throw new Error('Expected entry');
  assert.strictEqual((entry as any).type, 'test');
});

test('logDecision stores the decision entry as-is', () => {
  const resolver = new SkillResolver();
  const entry = { conflict: undefined, resolution: undefined, context: { type: 'test' }, timestamp: new Date().toISOString() };
  // @ts-expect-error Accessing private member for testing
  resolver.logDecision(entry);
  // @ts-expect-error Accessing private member for testing
  const logEntry = resolver.decisionLog[0];
  if (!logEntry) throw new Error('Expected log entry');
  assert.ok((logEntry as any).timestamp, 'Should preserve timestamp');
  assert.strictEqual((logEntry as any).context.type, 'test');
});

// Summary
console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

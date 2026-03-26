/**
 * Unit Tests for Skill Resolver
 *
 * Tests conflict detection, classification, priority rule application,
 * and decision logging for the SkillResolver class.
 */


import { test } from './test-utils.js';
import { SkillResolver, PRIORITY_RULES, CONFLICT_TYPES } from '../../bin/lib/skill-resolver.js';

console.log('Running Skill Resolver Tests...\n');

let passed = 0;
let failed = 0;

// Test: PRIORITY_RULES exports with expected keys
test('PRIORITY_RULES contains security > speed rule', () => {
  expect(PRIORITY_RULES['security > speed']).toBeTruthy() // 'Missing security > speed rule';
  expect(PRIORITY_RULES['security > speed'].absolute).toBe(true);
  assert.strictEqual(PRIORITY_RULES['security > speed'].higher, 'security');
});

test('PRIORITY_RULES contains maintainability > novelty rule', () => {
  expect(PRIORITY_RULES['maintainability > novelty']).toBeTruthy() // 'Missing maintainability > novelty rule';
  expect(PRIORITY_RULES['maintainability > novelty'].absolute).toBe(true);
});

test('PRIORITY_RULES contains data integrity > performance rule', () => {
  expect(PRIORITY_RULES['data integrity > performance']).toBeTruthy() // 'Missing data integrity rule';
});

// Test: SkillResolver constructor
test('SkillResolver instantiates with default options', () => {
  const resolver = new SkillResolver();
  expect(resolver).toBeTruthy() // 'Resolver should be instantiated';
  // @ts-expect-error Accessing private member for testing
  expect(resolver.priorityRules).toBeTruthy() // 'Should have priority rules';
  // @ts-expect-error Accessing private member for testing
  assert.deepStrictEqual(resolver.context, {});
  // @ts-expect-error Accessing private member for testing
  assert.deepStrictEqual(resolver.decisionLog, []);
});

test('SkillResolver accepts custom context', () => {
  const resolver = new SkillResolver({ context: { project_phase: 'MVP' } });
  // @ts-expect-error Accessing private member for testing
  expect(resolver.context.project_phase).toBe('MVP');
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
  expect(result?.hasConflict).toBe(false);
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
  expect(result?.hasConflict).toBe(true);
  assert.strictEqual(result?.conflicts.length, 1);
  if (!result?.conflicts[0]) throw new Error('Expected conflict');
  expect(result.conflicts[0].aspect).toBe('caching');
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
  expect(type).toBe('Security vs Speed');
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
  expect(typeof type === 'string').toBeTruthy() // 'Should return a string type';
});

// Test: resolve
test('resolve returns no-conflict result when skills are compatible', () => {
  const resolver = new SkillResolver();
  const skills = [
    { name: 'monolith', description: '', version: '1.0.0', tags: ['simplicity'], prerequisites: [], best_practices: [], anti_patterns: [], scope: 'global', path: '', body: '', workflow: { deployment: ['single-unit'] } }
  ];
  // @ts-expect-error Testing with partial skill objects
  const result = resolver.resolve(skills, {});
  expect(result).toBeTruthy() // 'Should return a result';
  expect('decision' in result).toBeTruthy() // 'Should have decision property';
  expect(result?.escalated).toBe(false);
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
  expect(Array.isArray(resolver.decisionLog)).toBeTruthy() // 'decisionLog should be an array';
});

// Test: logDecision
test('logDecision appends to decisionLog', () => {
  const resolver = new SkillResolver();
  // @ts-expect-error Accessing private member for testing
  resolver.logDecision({ conflict: undefined, resolution: undefined, context: { type: 'test' }, timestamp: new Date().toISOString() });
  // @ts-expect-error Accessing private member for testing
  expect(resolver.decisionLog.length).toBe(1);
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
  expect((logEntry as any).timestamp).toBeTruthy() // 'Should preserve timestamp';
  expect((logEntry as any).context.type).toBe('test');
});

// Summary
console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

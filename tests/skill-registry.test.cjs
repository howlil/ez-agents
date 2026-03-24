#!/usr/bin/env node

/**
 * Unit Tests for Skill Registry
 *
 * Tests loading, retrieval, filtering, and search functionality
 * for the SkillRegistry and LazySkillRegistry classes.
 */

const assert = require('assert');
const path = require('path');
const { SkillRegistry, LazySkillRegistry } = require('../ez-agents/bin/lib/skill-registry.cjs');

console.log('Running Skill Registry Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    console.log(`  Stack: ${error.stack}`);
    failed++;
  }
}

// Test fixtures path
const FIXTURES_PATH = path.join(__dirname, 'fixtures', 'skills');
const GLOBAL_PATH = path.join(FIXTURES_PATH, 'global');
const LOCAL_PATH = path.join(FIXTURES_PATH, 'local');

// Test: Constructor
test('SkillRegistry instantiates with default options', () => {
  const registry = new SkillRegistry();
  assert.ok(registry, 'Should instantiate');
  assert.ok(registry.skills instanceof Map, 'Should have skills Map');
  assert.strictEqual(registry.loaded, false, 'Should not be loaded initially');
});

test('SkillRegistry accepts custom globalPath and localPath', () => {
  const registry = new SkillRegistry({
    globalPath: '/custom/global',
    localPath: '/custom/local'
  });
  assert.strictEqual(registry.globalSkillsPath, '/custom/global');
  assert.strictEqual(registry.localSkillsPath, '/custom/local');
});

// Test: Load
test('load() populates skills Map from fixtures', async () => {
  const registry = new SkillRegistry({
    globalPath: GLOBAL_PATH,
    localPath: LOCAL_PATH
  });
  await registry.load();
  assert.ok(registry.loaded, 'Should be loaded');
  assert.ok(registry.skills.size > 0, 'Should have loaded skills');
});

test('load() returns registry for chaining', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  const result = await registry.load();
  assert.strictEqual(result, registry, 'Should return self for chaining');
});

// Test: Get
test('get() returns skill by name', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const skill = registry.get('test_skill_v1');
  assert.ok(skill, 'Should return skill');
  assert.strictEqual(skill.name, 'test_skill_v1');
  assert.strictEqual(skill.description, 'Test skill for unit testing');
});

test('get() returns undefined for non-existent skill', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const skill = registry.get('non_existent_skill');
  assert.strictEqual(skill, undefined);
});

// Test: GetAll
test('getAll() returns array of all skills', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const skills = registry.getAll();
  assert.ok(Array.isArray(skills), 'Should return array');
  assert.ok(skills.length > 0, 'Should have skills');
  skills.forEach(skill => {
    assert.ok(skill.name, 'Each skill should have name');
    assert.ok(skill.description, 'Each skill should have description');
  });
});

// Test: FindByTag
test('findByTag() filters skills by tag', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const laravelSkills = registry.findByTag('laravel');
  assert.ok(Array.isArray(laravelSkills), 'Should return array');
  assert.ok(laravelSkills.length > 0, 'Should find laravel skills');
  laravelSkills.forEach(skill => {
    assert.ok(skill.tags.includes('laravel'), 'Each skill should have laravel tag');
  });
});

test('findByTag() returns empty array for non-existent tag', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const skills = registry.findByTag('non_existent_tag_xyz');
  assert.ok(Array.isArray(skills), 'Should return array');
  assert.strictEqual(skills.length, 0, 'Should be empty');
});

// Test: FindByCategory
test('findByCategory() filters skills by category', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const stackSkills = registry.findByCategory('stack');
  assert.ok(Array.isArray(stackSkills), 'Should return array');
  assert.ok(stackSkills.length > 0, 'Should find stack skills');
  stackSkills.forEach(skill => {
    assert.strictEqual(skill.category, 'stack', 'Each skill should be stack category');
  });
});

test('findByCategory() returns empty array for non-existent category', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const skills = registry.findByCategory('non_existent_category');
  assert.ok(Array.isArray(skills), 'Should return array');
  assert.strictEqual(skills.length, 0, 'Should be empty');
});

// Test: FindByStack
test('findByStack() filters skills by stack string', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const phpSkills = registry.findByStack('php/laravel-11');
  assert.ok(Array.isArray(phpSkills), 'Should return array');
  phpSkills.forEach(skill => {
    assert.ok(skill.stack.includes('php/laravel-11'), 'Should match stack');
  });
});

test('findByStack() filters skills by stack object', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const skills = registry.findByStack({ language: 'php', framework: 'laravel' });
  assert.ok(Array.isArray(skills), 'Should return array');
  skills.forEach(skill => {
    assert.ok(skill.stack.includes('php/laravel'), 'Should match stack object');
  });
});

// Test: Search
test('search() finds skills by keyword in name', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const results = registry.search('test');
  assert.ok(Array.isArray(results), 'Should return array');
  assert.ok(results.length > 0, 'Should find skills with "test" in name');
  results.forEach(skill => {
    const match = skill.name.toLowerCase().includes('test');
    assert.ok(match, 'Should match name');
  });
});

test('search() finds skills by keyword in description', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const results = registry.search('laravel');
  assert.ok(Array.isArray(results), 'Should return array');
  results.forEach(skill => {
    const match = skill.name.toLowerCase().includes('laravel') ||
                  skill.description.toLowerCase().includes('laravel') ||
                  skill.tags?.some(t => t.toLowerCase().includes('laravel'));
    assert.ok(match, 'Should match name, description, or tags');
  });
});

test('search() is case-insensitive', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  const lower = registry.search('laravel');
  const upper = registry.search('LARAVEL');
  assert.deepStrictEqual(lower, upper, 'Search should be case-insensitive');
});

// Test: Local Override
test('local skills override global skills with same name', async () => {
  const registry = new SkillRegistry({
    globalPath: GLOBAL_PATH,
    localPath: LOCAL_PATH
  });
  await registry.load();
  const skill = registry.get('test_skill_v1');
  assert.ok(skill, 'Should return skill');
  assert.strictEqual(skill.version, '2.0.0', 'Should be local version');
  assert.strictEqual(skill.scope, 'local', 'Should be from local scope');
});

// Test: Clear
test('clear() removes all skills', async () => {
  const registry = new SkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  assert.ok(registry.skills.size > 0, 'Should have skills before clear');
  registry.clear();
  assert.strictEqual(registry.skills.size, 0, 'Should be empty after clear');
  assert.strictEqual(registry.loaded, false, 'Should not be loaded after clear');
});

// Test: LazySkillRegistry
test('LazySkillRegistry instantiates with cache', async () => {
  const registry = new LazySkillRegistry({ globalPath: GLOBAL_PATH });
  assert.ok(registry.cache instanceof Map, 'Should have cache Map');
  assert.strictEqual(registry.cacheTTL, 5 * 60 * 1000, 'Default TTL should be 5 minutes');
});

test('LazySkillRegistry caches get() results', async () => {
  const registry = new LazySkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  
  // First get should populate cache
  const skill1 = registry.get('test_skill_v1');
  assert.ok(skill1, 'First get should return skill');
  
  // Second get should use cache
  const skill2 = registry.get('test_skill_v1');
  assert.ok(skill2, 'Second get should return skill');
  assert.deepStrictEqual(skill1, skill2, 'Should return same cached result');
});

test('LazySkillRegistry caches getAll() results', async () => {
  const registry = new LazySkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  
  const all1 = registry.getAll();
  const all2 = registry.getAll();
  assert.deepStrictEqual(all1, all2, 'Should return cached results');
});

test('LazySkillRegistry respects cache TTL', async () => {
  const registry = new LazySkillRegistry({ 
    globalPath: GLOBAL_PATH,
    cacheTTL: 100 // 100ms for testing
  });
  await registry.load();
  
  // Populate cache
  registry.get('test_skill_v1');
  
  // Wait for cache to expire
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Cache should be expired, but skill still available from parent
  const skill = registry.get('test_skill_v1');
  assert.ok(skill, 'Should still return skill after cache expiry');
});

test('LazySkillRegistry.clearCache() clears cache', async () => {
  const registry = new LazySkillRegistry({ globalPath: GLOBAL_PATH });
  await registry.load();
  
  // Populate cache
  registry.get('test_skill_v1');
  registry.getAll();
  
  registry.clearCache();
  assert.strictEqual(registry.cache.size, 0, 'Cache should be empty');
  assert.strictEqual(registry.cacheTimestamps.size, 0, 'Timestamps should be empty');
});

// Summary
console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nFailed tests indicate issues with skill-registry.cjs');
  process.exit(1);
}
console.log('\nAll skill registry tests passed!');

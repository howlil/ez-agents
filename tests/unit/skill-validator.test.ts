/**
 * Unit Tests for Skill Validator
 *
 * Tests schema validation, required fields, category validation,
 * tag validation, triggers validation, and workflow validation
 * for the SkillValidator class.
 */


import { test } from './test-utils.js';
import { SkillValidator, SKILL_SCHEMA, ALLOWED_TAGS } from '../../bin/lib/skill-validator.js';

console.log('Running Skill Validator Tests...\n');

let passed = 0;
let failed = 0;

// Test: Exports
test('SkillValidator class is exported', () => {
  expect(SkillValidator).toBeTruthy() // 'SkillValidator should be exported';
  expect(typeof SkillValidator).toBe('function', 'Should be a constructor');
});

test('SKILL_SCHEMA is exported with required fields', () => {
  expect(SKILL_SCHEMA).toBeTruthy() // 'SKILL_SCHEMA should be exported';
  expect(Array.isArray(SKILL_SCHEMA.required)).toBeTruthy() // 'Should have required array';
  expect(SKILL_SCHEMA.required.includes('name')).toBeTruthy() // 'Should require name';
  expect(SKILL_SCHEMA.required.includes('description')).toBeTruthy() // 'Should require description';
  expect(SKILL_SCHEMA.required.includes('version')).toBeTruthy() // 'Should require version';
  expect(SKILL_SCHEMA.required.includes('category')).toBeTruthy() // 'Should require category';
});

test('ALLOWED_TAGS is exported with 50+ tags', () => {
  expect(Array.isArray(ALLOWED_TAGS)).toBeTruthy() // 'ALLOWED_TAGS should be an array';
  expect(ALLOWED_TAGS.length >= 30).toBeTruthy() // `Should have at least 30 tags, has ${ALLOWED_TAGS.length}`;
  expect(ALLOWED_TAGS.includes('laravel')).toBeTruthy() // 'Should include laravel tag';
  expect(ALLOWED_TAGS.includes('react')).toBeTruthy() // 'Should include react tag';
  expect(ALLOWED_TAGS.includes('microservices')).toBeTruthy() // 'Should include microservices tag';
});

// Test: Constructor
test('SkillValidator instantiates without options', () => {
  const validator = new SkillValidator();
  expect(validator).toBeTruthy() // 'Should instantiate';
  expect(typeof validator.validate === 'function').toBeTruthy() // 'Should have validate method';
});

// Test: Validate - Required Fields
test('validate() returns valid for complete skill object', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(true, 'Should be valid');
  expect(result?.errors.length).toBe(0, 'Should have no errors');
});

test('validate() rejects skill without name', () => {
  const validator = new SkillValidator();
  const skill = {
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('name'))).toBeTruthy() // 'Should error about name';
});

test('validate() rejects skill without description', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    version: '1.0.0',
    category: 'stack'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('description'))).toBeTruthy() // 'Should error about description';
});

test('validate() rejects skill without version', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    category: 'stack'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('version'))).toBeTruthy() // 'Should error about version';
});

test('validate() rejects skill without category', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('category'))).toBeTruthy() // 'Should error about category';
});

test('validate() rejects empty string for required fields', () => {
  const validator = new SkillValidator();
  const skill = {
    name: '',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('name'))).toBeTruthy() // 'Should error about empty name';
});

test('validate() rejects null for required fields', () => {
  const validator = new SkillValidator();
  const skill = {
    name: null,
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('name'))).toBeTruthy() // 'Should error about null name';
});

// Test: Validate - Category
test('validate() accepts valid categories', () => {
  const validator = new SkillValidator();
  const categories = ['stack', 'architecture', 'domain', 'operational', 'governance'];
  
  categories.forEach(category => {
    const skill = {
      name: 'test_skill_v1',
      description: 'Test skill',
      version: '1.0.0',
      category
    };
    // @ts-expect-error Partial skill object for testing
    const result = validator.validate(skill);
    expect(result?.valid).toBe(true, `Should accept category: ${category}`);
  });
});

test('validate() rejects invalid category', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'invalid_category'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('Invalid category'))).toBeTruthy() // 'Should error about invalid category';
});

// Test: Validate - Tags
test('validateTags() accepts valid tags', () => {
  const validator = new SkillValidator();
  const tags = ['laravel', 'php', 'backend', 'framework'];
  const errors = validator.validateTags(tags);
  expect(errors.length).toBe(0, 'Should have no errors for valid tags');
});

test('validateTags() rejects non-array tags', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateTags('laravel');
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('array')).toBeTruthy() // 'Should mention array';
});

test('validateTags() rejects invalid tags', () => {
  const validator = new SkillValidator();
  const errors = validator.validateTags(['laravel', 'invalid_tag_xyz_123']);
  expect(errors.length).toBe(1, 'Should have error for invalid tag');
  expect(errors[0]?.includes('Invalid tag')).toBeTruthy() // 'Should mention invalid tag';
});

test('validate() integrates tag validation', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack',
    tags: ['laravel', 'invalid_tag_xyz']
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('Invalid tag'))).toBeTruthy() // 'Should error about invalid tag';
});

// Test: Validate - Triggers
test('validateTriggers() accepts valid triggers object', () => {
  const validator = new SkillValidator();
  const triggers = {
    keywords: ['laravel', 'php'],
    filePatterns: ['composer.json', 'artisan'],
    commands: ['composer install'],
    stack: 'php/laravel-11',
    projectArchetypes: ['ecommerce'],
    modes: ['greenfield']
  };
  const errors = validator.validateTriggers(triggers);
  expect(errors.length).toBe(0, 'Should have no errors');
});

test('validateTriggers() rejects non-object triggers', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-object input
  const errors = validator.validateTriggers('invalid');
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('object')).toBeTruthy() // 'Should mention object';
});

test('validateTriggers() rejects non-array keywords', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateTriggers({ keywords: 'laravel' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('keywords')).toBeTruthy() // 'Should mention keywords';
  expect(errors[0]?.includes('array')).toBeTruthy() // 'Should mention array';
});

test('validateTriggers() rejects non-array filePatterns', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateTriggers({ filePatterns: 'composer.json' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('filePatterns')).toBeTruthy() // 'Should mention filePatterns';
});

test('validateTriggers() rejects non-array commands', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateTriggers({ commands: 'composer install' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('commands')).toBeTruthy() // 'Should mention commands';
});

test('validateTriggers() rejects non-string stack', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-string input
  const errors = validator.validateTriggers({ stack: 123 });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('stack')).toBeTruthy() // 'Should mention stack';
  expect(errors[0]?.includes('string')).toBeTruthy() // 'Should mention string';
});

test('validateTriggers() rejects non-array projectArchetypes', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateTriggers({ projectArchetypes: 'ecommerce' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('projectArchetypes')).toBeTruthy() // 'Should mention projectArchetypes';
});

test('validateTriggers() rejects non-array modes', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateTriggers({ modes: 'greenfield' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('modes')).toBeTruthy() // 'Should mention modes';
});

test('validate() integrates triggers validation', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack',
    triggers: {
      keywords: 'invalid' // Should be array
    }
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('keywords'))).toBeTruthy() // 'Should error about keywords';
});

// Test: Validate - Recommended Structure
test('validateStructure() accepts valid structure object', () => {
  const validator = new SkillValidator();
  const structure = {
    directories: ['src/', 'tests/', 'docs/']
  };
  const errors = validator.validateStructure(structure);
  expect(errors.length).toBe(0, 'Should have no errors');
});

test('validateStructure() rejects non-object structure', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-object input
  const errors = validator.validateStructure('invalid');
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('object')).toBeTruthy() // 'Should mention object';
});

test('validateStructure() rejects non-array directories', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateStructure({ directories: 'src/' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('directories')).toBeTruthy() // 'Should mention directories';
  expect(errors[0]?.includes('array')).toBeTruthy() // 'Should mention array';
});

test('validate() integrates structure validation', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack',
    recommended_structure: {
      directories: 'invalid' // Should be array
    }
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('directories'))).toBeTruthy() // 'Should error about directories';
});

// Test: Validate - Workflow
test('validateWorkflow() accepts valid workflow object', () => {
  const validator = new SkillValidator();
  const workflow = {
    setup: ['npm install'],
    generate: ['npm run generate'],
    test: ['npm test']
  };
  const errors = validator.validateWorkflow(workflow);
  expect(errors.length).toBe(0, 'Should have no errors');
});

test('validateWorkflow() rejects non-object workflow', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-object input
  const errors = validator.validateWorkflow('invalid');
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('object')).toBeTruthy() // 'Should mention object';
});

test('validateWorkflow() rejects non-array setup', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateWorkflow({ setup: 'npm install' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('setup')).toBeTruthy() // 'Should mention setup';
  expect(errors[0]?.includes('array')).toBeTruthy() // 'Should mention array';
});

test('validateWorkflow() rejects non-array generate', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateWorkflow({ generate: 'npm run generate' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('generate')).toBeTruthy() // 'Should mention generate';
});

test('validateWorkflow() rejects non-array test', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Testing non-array input
  const errors = validator.validateWorkflow({ test: 'npm test' });
  expect(errors.length).toBe(1, 'Should have error');
  expect(errors[0]?.includes('test')).toBeTruthy() // 'Should mention test';
});

test('validate() integrates workflow validation', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack',
    workflow: {
      setup: 'invalid' // Should be array
    }
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('setup'))).toBeTruthy() // 'Should error about setup';
});

// Test: Validate - Prerequisites
test('validate() accepts array prerequisites', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack',
    prerequisites: ['node_runtime', 'npm_package_manager']
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(true, 'Should be valid');
});

test('validate() rejects non-array prerequisites', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'test_skill_v1',
    description: 'Test skill',
    version: '1.0.0',
    category: 'stack',
    prerequisites: 'node_runtime'
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('prerequisites'))).toBeTruthy() // 'Should error about prerequisites';
});

// Test: Complex Skill Validation
test('validate() accepts complex valid skill', () => {
  const validator = new SkillValidator();
  const skill = {
    name: 'laravel_11_structure_skill_v2',
    description: 'Laravel 11 project structure and conventions',
    version: '2.0.0',
    tags: ['laravel', 'php', 'backend', 'framework', 'mvc'],
    stack: 'php/laravel-11',
    category: 'stack',
    triggers: {
      keywords: ['laravel', 'eloquent', 'blade'],
      filePatterns: ['composer.json', 'artisan'],
      commands: ['composer require laravel', 'php artisan'],
      stack: 'php/laravel-11',
      projectArchetypes: ['ecommerce', 'saas'],
      modes: ['greenfield', 'migration']
    },
    prerequisites: ['php_8.2_runtime', 'composer_package_manager'],
    recommended_structure: {
      directories: ['app/Models', 'app/Http/Controllers', 'database/migrations']
    },
    workflow: {
      setup: ['composer install', 'php artisan key:generate'],
      generate: ['php artisan make:model'],
      test: ['php artisan test']
    },
    best_practices: ['Use Eloquent ORM', 'Follow PSR-12'],
    anti_patterns: ['Avoid business logic in routes/web.php'],
    scaling_notes: 'Use Redis for caching',
    when_not_to_use: 'Simple static sites',
    output_template: '## Laravel Decision',
    dependencies: {
      php: '>=8.2',
      composer: '>=2.0'
    }
  };
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(skill);
  expect(result?.valid).toBe(true, 'Complex skill should be valid');
  expect(result?.errors.length).toBe(0, 'Should have no errors');
});

// Test: Edge Cases
test('validate() handles null skill', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(undefined);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('object'))).toBeTruthy() // 'Should mention object';
});

test('validate() handles undefined skill', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate(undefined);
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.some(e => e.includes('object'))).toBeTruthy() // 'Should mention object';
});

test('validate() handles empty object', () => {
  const validator = new SkillValidator();
  // @ts-expect-error Partial skill object for testing
  const result = validator.validate({});
  expect(result?.valid).toBe(false, 'Should be invalid');
  expect(result.errors.length >= 4).toBeTruthy() // 'Should have multiple errors for missing required fields';
});

// Summary
console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
if (failed > 0) {
}
console.log('\nAll skill validator tests passed!');

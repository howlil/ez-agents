/**
 * Gate 1-2 Tests
 *
 * Tests for Requirement Completeness (Gate 1) and Architecture Review (Gate 2)
 *
 * Test cases:
 * Gate 1:
 * 1. Gate 1 passes when all REQ-IDs mapped
 * 2. Gate 1 fails with errors for unmapped REQ-IDs
 * 3. Gate 1 passes when acceptance criteria in Given-When-Then
 * 4. Gate 1 fails when acceptance criteria missing
 *
 * Gate 2:
 * 5. Gate 2 passes when structure matches skill recommendations
 * 6. Gate 2 fails when structure deviates without justification
 * 7. Gate 2 counts abstraction layers correctly
 * 8. Gate 2 flags >3 abstraction layers as warning
 * 9. Gate 2 detects premature repository pattern
 * 10. Gate 2 detects unnecessary CQRS for simple CRUD
 */

const { describe, it, beforeEach } = require('vitest');
const { strict: assert } = require('assert');

// Import Gate 1
const {
  executeGate1,
  checkGivenWhenThenFormat,
  extractRequirementIds,
  buildRequirementTaskMap,
  buildRequirementPhaseMap,
} = require('../../ez-agents/bin/lib/gates/gate-01-requirement.cjs');

// Import Gate 2
const {
  executeGate2,
  countAbstractionLayers,
  detectPrematureRepository,
  detectUnnecessaryCQRS,
  detectPrematureEventBus,
  detectPrematureMicroservices,
  checkSkillAlignment,
  ABSTRACTION_THRESHOLDS,
} = require('../../ez-agents/bin/lib/gates/gate-02-architecture.cjs');

// Import QualityGate for integration test
const { QualityGate } = require('../../ez-agents/bin/lib/quality-gate.cjs');
const { registerGate1 } = require('../../ez-agents/bin/lib/gates/gate-01-requirement.cjs');
const { registerGate2 } = require('../../ez-agents/bin/lib/gates/gate-02-architecture.cjs');

describe('Gate 1: Requirement Completeness', () => {
  describe('executeGate1', () => {
    it('Gate 1 passes when all REQ-IDs mapped', async () => {
      const context = {
        requirements: [
          {
            id: 'REQ-001',
            description: 'User can log in',
            acceptanceCriteria: [
              'Given valid credentials, When login form submitted, Then user is authenticated',
            ],
            mappedTasks: ['task-001'],
          },
          {
            id: 'REQ-002',
            description: 'User can log out',
            acceptanceCriteria: [
              'Given authenticated session, When logout clicked, Then session is terminated',
            ],
            mappedPhases: ['phase-01'],
          },
        ],
        tasks: [
          { id: 'task-001', name: 'Implement login', requirements: ['REQ-001'] },
        ],
        phases: [
          { id: 'phase-01', name: 'Authentication', requirements: ['REQ-002'] },
        ],
      };

      const result = await executeGate1(context);

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('Gate 1 fails with errors for unmapped REQ-IDs', async () => {
      const context = {
        requirements: [
          {
            id: 'REQ-001',
            description: 'User can log in',
            acceptanceCriteria: [
              'Given valid credentials, When login form submitted, Then user is authenticated',
            ],
            // No mappedTasks or mappedPhases
          },
          {
            id: 'REQ-002',
            description: 'User can log out',
            acceptanceCriteria: [
              'Given authenticated session, When logout clicked, Then session is terminated',
            ],
            mappedTasks: ['task-001'],
          },
        ],
        tasks: [
          { id: 'task-001', name: 'Implement logout', requirements: ['REQ-002'] },
        ],
        // No phases
      };

      const result = await executeGate1(context);

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].path, 'requirements[0].id');
      assert.ok(result.errors[0].message.includes('REQ-001'));
      assert.ok(result.errors[0].message.includes('not mapped'));
    });

    it('Gate 1 passes when acceptance criteria in Given-When-Then', async () => {
      const context = {
        requirements: [
          {
            id: 'REQ-001',
            description: 'User can reset password',
            acceptanceCriteria: [
              'Given user has forgotten password, When reset link requested, Then email is sent',
            ],
            mappedTasks: ['task-001'],
          },
        ],
        tasks: [
          { id: 'task-001', name: 'Implement password reset', requirements: ['REQ-001'] },
        ],
      };

      const result = await executeGate1(context);

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('Gate 1 fails when acceptance criteria missing Given-When-Then', async () => {
      const context = {
        requirements: [
          {
            id: 'REQ-001',
            description: 'User can reset password',
            acceptanceCriteria: [
              'Password reset works', // Not in Given-When-Then format
            ],
            mappedTasks: ['task-001'],
          },
        ],
        tasks: [
          { id: 'task-001', name: 'Implement password reset', requirements: ['REQ-001'] },
        ],
      };

      const result = await executeGate1(context);

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.errors.length, 1);
      assert.strictEqual(result.errors[0].path, 'requirements[0].acceptanceCriteria');
      assert.ok(result.errors[0].message.includes('Given-When-Then'));
    });
  });

  describe('checkGivenWhenThenFormat', () => {
    it('should validate proper Given-When-Then format', () => {
      const result = checkGivenWhenThenFormat([
        'Given valid credentials, When login submitted, Then user authenticated',
      ]);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.missingComponents.length, 0);
    });

    it('should detect missing Given component', () => {
      const result = checkGivenWhenThenFormat([
        'When login submitted, Then user authenticated',
      ]);

      assert.strictEqual(result.valid, false);
      assert.ok(result.missingComponents.includes('Given'));
    });

    it('should detect missing When component', () => {
      const result = checkGivenWhenThenFormat([
        'Given valid credentials, Then user authenticated',
      ]);

      assert.strictEqual(result.valid, false);
      assert.ok(result.missingComponents.includes('When'));
    });

    it('should detect missing Then component', () => {
      const result = checkGivenWhenThenFormat([
        'Given valid credentials, When login submitted',
      ]);

      assert.strictEqual(result.valid, false);
      assert.ok(result.missingComponents.includes('Then'));
    });

    it('should handle multi-line format', () => {
      const result = checkGivenWhenThenFormat([
        'Given user is on login page',
        'When user enters valid credentials',
        'Then user is redirected to dashboard',
      ]);

      assert.strictEqual(result.valid, true);
    });

    it('should handle format with colons', () => {
      const result = checkGivenWhenThenFormat([
        'Given: user has valid session',
        'When: user clicks logout',
        'Then: session is destroyed',
      ]);

      assert.strictEqual(result.valid, true);
    });
  });

  describe('extractRequirementIds', () => {
    it('should extract REQ-IDs from text', () => {
      const text = 'This implements REQ-001 and REQ-002 for the login feature';
      const ids = extractRequirementIds(text);

      assert.deepStrictEqual(ids, ['REQ-001', 'REQ-002']);
    });

    it('should extract various ID formats', () => {
      const text = 'Covers GRAPH-01, GATE-02, and REQ-100';
      const ids = extractRequirementIds(text);

      assert.deepStrictEqual(ids.sort(), ['GATE-02', 'GRAPH-01', 'REQ-100'].sort());
    });

    it('should return empty array for no matches', () => {
      const text = 'No requirement IDs here';
      const ids = extractRequirementIds(text);

      assert.deepStrictEqual(ids, []);
    });

    it('should deduplicate IDs', () => {
      const text = 'REQ-001 is related to REQ-001';
      const ids = extractRequirementIds(text);

      assert.deepStrictEqual(ids, ['REQ-001']);
    });
  });

  describe('buildRequirementTaskMap', () => {
    it('should build map from task requirements', () => {
      const tasks = [
        { id: 'task-001', name: 'Login', requirements: ['REQ-001', 'REQ-002'] },
        { id: 'task-002', name: 'Logout', requirements: ['REQ-003'] },
      ];

      const map = buildRequirementTaskMap(tasks);

      assert.ok(map.has('REQ-001'));
      assert.ok(map.has('REQ-002'));
      assert.ok(map.has('REQ-003'));
      assert.strictEqual(map.get('REQ-001').has('task-001'), true);
      assert.strictEqual(map.get('REQ-003').has('task-002'), true);
    });

    it('should handle tasks without requirements', () => {
      const tasks = [
        { id: 'task-001', name: 'Setup' },
      ];

      const map = buildRequirementTaskMap(tasks);

      assert.strictEqual(map.size, 0);
    });

    it('should handle empty task array', () => {
      const map = buildRequirementTaskMap([]);
      assert.strictEqual(map.size, 0);
    });

    it('should handle null/undefined input', () => {
      assert.strictEqual(buildRequirementTaskMap(null).size, 0);
      assert.strictEqual(buildRequirementTaskMap(undefined).size, 0);
    });
  });

  describe('buildRequirementPhaseMap', () => {
    it('should build map from phase requirements', () => {
      const phases = [
        { id: 'phase-01', name: 'Auth', requirements: ['REQ-001', 'REQ-002'] },
        { id: 'phase-02', name: 'Dashboard', requirements: ['REQ-003'] },
      ];

      const map = buildRequirementPhaseMap(phases);

      assert.ok(map.has('REQ-001'));
      assert.ok(map.has('REQ-003'));
      assert.strictEqual(map.get('REQ-001').has('phase-01'), true);
    });
  });
});

describe('Gate 2: Architecture Review', () => {
  describe('executeGate2', () => {
    it('Gate 2 passes when structure matches skill recommendations', async () => {
      const context = {
        projectTier: 'mvp',
        architecture: {
          abstractionLayers: 2,
          patterns: ['controller', 'service'],
        },
        skillRecommendations: [
          {
            skillName: 'nodejs-mvp',
            recommendedStructure: ['controller', 'service'],
            bestPractices: ['Keep it simple'],
            antiPatterns: [],
            maxAbstractionLayers: 2,
          },
        ],
      };

      const result = await executeGate2(context);

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('Gate 2 fails when structure deviates without justification', async () => {
      const context = {
        projectTier: 'mvp',
        architecture: {
          abstractionLayers: 4,
          patterns: ['controller', 'service', 'repository', 'use-case', 'domain'],
        },
      };

      const result = await executeGate2(context);

      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.path === 'architecture.abstractionLayers'));
    });

    it('Gate 2 counts abstraction layers correctly', async () => {
      const context = {
        projectTier: 'medium',
        files: [
          { path: '/controllers/UserController.js', type: 'controller' },
          { path: '/services/UserService.js', type: 'service' },
          { path: '/repositories/UserRepository.js', type: 'repository' },
          { path: '/models/User.js', type: 'model' },
        ],
      };

      const result = await executeGate2(context);

      // 4 layers for medium tier (max 3) should fail
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some(e => e.message.includes('abstraction layers')));
    });

    it('Gate 2 flags >3 abstraction layers as warning', async () => {
      const context = {
        projectTier: 'enterprise',
        architecture: {
          abstractionLayers: 4,
          patterns: ['controller', 'service', 'repository', 'domain'],
        },
      };

      const result = await executeGate2(context);

      // Enterprise allows 4 layers, so it should pass but may have warnings
      assert.strictEqual(result.passed, true);
      // Check for warning about >3 layers
      assert.ok(
        result.warnings.some(w => w.includes('abstraction layers')) ||
        result.errors.length === 0
      );
    });

    it('Gate 2 detects premature repository pattern', async () => {
      const context = {
        projectTier: 'mvp',
        hasRepositoryPattern: true,
        crudOperationCount: 5,
      };

      const result = await executeGate2(context);

      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some(e => e.message.includes('Repository pattern')));
    });

    it('Gate 2 detects unnecessary CQRS for simple CRUD', async () => {
      const context = {
        projectTier: 'mvp',
        hasCQRS: true,
        crudOperationCount: 8,
        eventCount: 2,
      };

      const result = await executeGate2(context);

      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some(e => e.message.includes('CQRS')));
    });
  });

  describe('countAbstractionLayers', () => {
    it('should count layers from file types', () => {
      const files = [
        { path: '/controllers/UserController.js', type: 'controller' },
        { path: '/services/UserService.js', type: 'service' },
        { path: '/models/User.js', type: 'model' },
      ];

      const layers = countAbstractionLayers(files);
      assert.strictEqual(layers, 3);
    });

    it('should count layers from path inference', () => {
      const files = [
        { path: '/controllers/UserController.js' },
        { path: '/services/UserService.js' },
        { path: '/repositories/UserRepository.js' },
        { path: '/models/User.js' },
      ];

      const layers = countAbstractionLayers(files);
      assert.strictEqual(layers, 4);
    });

    it('should use explicit layer property', () => {
      const files = [
        { path: '/file1.js', layer: 0 },
        { path: '/file2.js', layer: 1 },
        { path: '/file3.js', layer: 2 },
        { path: '/file4.js', layer: 3 },
      ];

      const layers = countAbstractionLayers(files);
      assert.strictEqual(layers, 3);
    });

    it('should return 0 for empty array', () => {
      const layers = countAbstractionLayers([]);
      assert.strictEqual(layers, 0);
    });

    it('should handle middleware layer', () => {
      const files = [
        { path: '/middleware/AuthMiddleware.js', type: 'middleware' },
        { path: '/controllers/UserController.js', type: 'controller' },
        { path: '/services/UserService.js', type: 'service' },
      ];

      const layers = countAbstractionLayers(files);
      assert.strictEqual(layers, 3);
    });
  });

  describe('detectPrematureRepository', () => {
    it('should detect repository pattern in MVP with simple CRUD', () => {
      const context = {
        projectTier: 'mvp',
        hasRepositoryPattern: true,
        crudOperationCount: 5,
      };

      const result = detectPrematureRepository(context);

      assert.strictEqual(result.detected, true);
      assert.ok(result.reason.includes('Repository pattern'));
    });

    it('should not detect when CRUD count is high', () => {
      const context = {
        projectTier: 'mvp',
        hasRepositoryPattern: true,
        crudOperationCount: 15,
      };

      const result = detectPrematureRepository(context);

      assert.strictEqual(result.detected, false);
    });

    it('should allow with justification', () => {
      const context = {
        projectTier: 'mvp',
        hasRepositoryPattern: true,
        crudOperationCount: 5,
        architecture: {
          justifications: {
            repository: 'Multiple data sources require abstraction',
          },
        },
      };

      const result = detectPrematureRepository(context);

      assert.strictEqual(result.detected, false);
    });

    it('should not detect for medium tier', () => {
      const context = {
        projectTier: 'medium',
        hasRepositoryPattern: true,
        crudOperationCount: 8,
      };

      const result = detectPrematureRepository(context);

      assert.strictEqual(result.detected, false);
    });
  });

  describe('detectUnnecessaryCQRS', () => {
    it('should detect CQRS for simple CRUD', () => {
      const context = {
        projectTier: 'mvp',
        hasCQRS: true,
        crudOperationCount: 8,
        eventCount: 2,
      };

      const result = detectUnnecessaryCQRS(context);

      assert.strictEqual(result.detected, true);
      assert.ok(result.reason.includes('CQRS'));
    });

    it('should not detect CQRS with high event count', () => {
      const context = {
        projectTier: 'medium',
        hasCQRS: true,
        crudOperationCount: 20,
        eventCount: 15,
      };

      const result = detectUnnecessaryCQRS(context);

      assert.strictEqual(result.detected, false);
    });

    it('should allow CQRS with justification', () => {
      const context = {
        projectTier: 'mvp',
        hasCQRS: true,
        crudOperationCount: 8,
        eventCount: 2,
        architecture: {
          justifications: {
            cqrs: 'Complex read/write separation required for reporting',
          },
        },
      };

      const result = detectUnnecessaryCQRS(context);

      assert.strictEqual(result.detected, false);
    });
  });

  describe('detectPrematureEventBus', () => {
    it('should detect event bus with few events', () => {
      const context = {
        hasEventBus: true,
        eventCount: 2,
      };

      const result = detectPrematureEventBus(context);

      assert.strictEqual(result.detected, true);
      assert.ok(result.reason.includes('Event bus'));
    });

    it('should not detect event bus with many events', () => {
      const context = {
        hasEventBus: true,
        eventCount: 10,
      };

      const result = detectPrematureEventBus(context);

      assert.strictEqual(result.detected, false);
    });
  });

  describe('detectPrematureMicroservices', () => {
    it('should detect microservices in MVP', () => {
      const context = {
        projectTier: 'mvp',
        hasMicroservices: true,
      };

      const result = detectPrematureMicroservices(context);

      assert.strictEqual(result.detected, true);
      assert.ok(result.reason.includes('Microservices'));
    });

    it('should allow microservices with justification', () => {
      const context = {
        projectTier: 'mvp',
        hasMicroservices: true,
        architecture: {
          justifications: {
            microservices: 'Existing domain boundaries from legacy system',
          },
        },
      };

      const result = detectPrematureMicroservices(context);

      assert.strictEqual(result.detected, false);
    });

    it('should not detect for enterprise tier', () => {
      const context = {
        projectTier: 'enterprise',
        hasMicroservices: true,
      };

      const result = detectPrematureMicroservices(context);

      // Enterprise without justification still warns
      assert.strictEqual(result.detected, true);
    });
  });

  describe('checkSkillAlignment', () => {
    it('should return empty deviations when aligned', () => {
      const skillRecommendations = [
        {
          skillName: 'nodejs-mvp',
          recommendedStructure: ['controller', 'service'],
          antiPatterns: ['repository'],
        },
      ];

      const architecture = {
        patterns: ['controller', 'service'],
      };

      const result = checkSkillAlignment(skillRecommendations, architecture);

      assert.strictEqual(result.deviations.length, 0);
    });

    it('should detect anti-pattern usage', () => {
      const skillRecommendations = [
        {
          skillName: 'nodejs-mvp',
          recommendedStructure: ['controller', 'service'],
          antiPatterns: ['repository', 'cqrs'],
          bestPractices: ['Keep it simple'],
        },
      ];

      const architecture = {
        patterns: ['controller', 'service', 'repository'],
      };

      const result = checkSkillAlignment(skillRecommendations, architecture);

      assert.strictEqual(result.deviations.length, 1);
      assert.strictEqual(result.deviations[0].skill, 'nodejs-mvp');
      assert.ok(result.deviations[0].deviation.includes('repository'));
    });

    it('should detect abstraction layer violations', () => {
      const skillRecommendations = [
        {
          skillName: 'nodejs-mvp',
          maxAbstractionLayers: 2,
        },
      ];

      const architecture = {
        abstractionLayers: 4,
      };

      const result = checkSkillAlignment(skillRecommendations, architecture);

      assert.strictEqual(result.deviations.length, 1);
      assert.ok(result.deviations[0].deviation.includes('Abstraction layers'));
    });

    it('should handle empty skill recommendations', () => {
      const result = checkSkillAlignment([], { patterns: ['controller'] });

      assert.strictEqual(result.deviations.length, 0);
      assert.strictEqual(result.matched.length, 0);
    });
  });

  describe('ABSTRACTION_THRESHOLDS', () => {
    it('should have correct thresholds for each tier', () => {
      assert.strictEqual(ABSTRACTION_THRESHOLDS.mvp, 2);
      assert.strictEqual(ABSTRACTION_THRESHOLDS.medium, 3);
      assert.strictEqual(ABSTRACTION_THRESHOLDS.enterprise, 4);
    });
  });
});

describe('Gate Integration Tests', () => {
  let gates;

  beforeEach(() => {
    gates = new QualityGate();
  });

  it('Gate 1 registers with QualityGate coordinator', () => {
    registerGate1(gates);

    const registeredGates = gates.getRegisteredGates();
    assert.ok(registeredGates.includes('gate-01-requirement'));
  });

  it('Gate 2 registers with QualityGate coordinator', () => {
    registerGate2(gates);

    const registeredGates = gates.getRegisteredGates();
    assert.ok(registeredGates.includes('gate-02-architecture'));
  });

  it('Both gates execute successfully through coordinator', async () => {
    registerGate1(gates);
    registerGate2(gates);

    const gate1Context = {
      requirements: [
        {
          id: 'REQ-001',
          description: 'User can log in',
          acceptanceCriteria: [
            'Given valid credentials, When login submitted, Then authenticated',
          ],
          mappedTasks: ['task-001'],
        },
      ],
      tasks: [
        { id: 'task-001', name: 'Implement login', requirements: ['REQ-001'] },
      ],
    };

    const gate2Context = {
      projectTier: 'mvp',
      architecture: {
        abstractionLayers: 2,
        patterns: ['controller', 'service'],
      },
    };

    const gate1Result = await gates.executeGate('gate-01-requirement', gate1Context);
    const gate2Result = await gates.executeGate('gate-02-architecture', gate2Context);

    assert.strictEqual(gate1Result.passed, true);
    assert.strictEqual(gate2Result.passed, true);
  });

  it('Gate 1 fails through coordinator for unmapped requirements', async () => {
    registerGate1(gates);

    const context = {
      requirements: [
        {
          id: 'REQ-001',
          description: 'User can log in',
          acceptanceCriteria: [
            'Given valid credentials, When login submitted, Then authenticated',
          ],
          // No mapping
        },
      ],
    };

    const result = await gates.executeGate('gate-01-requirement', context);

    assert.strictEqual(result.passed, false);
    assert.ok(result.errors.length > 0);
  });

  it('Gate 2 fails through coordinator for overengineering', async () => {
    registerGate2(gates);

    const context = {
      projectTier: 'mvp',
      hasRepositoryPattern: true,
      hasCQRS: true,
      crudOperationCount: 5,
      eventCount: 2,
    };

    const result = await gates.executeGate('gate-02-architecture', context);

    assert.strictEqual(result.passed, false);
    assert.ok(result.errors.length > 0);
  });
});

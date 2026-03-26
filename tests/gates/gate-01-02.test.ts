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



// Import Gate 1
import {
  executeGate1,
  checkGivenWhenThenFormat,
  extractRequirementIds,
  buildRequirementTaskMap,
  buildRequirementPhaseMap,
} from '../../bin/lib/gates/gate-01-requirement.js';

// Import Gate 2
import {
  executeGate2,
  countAbstractionLayers,
  ABSTRACTION_THRESHOLDS,
} from '../../bin/lib/gates/gate-02-architecture.js';

// Functions not exported from gate-02-architecture - stubs for tests
const detectPrematureRepository: any = undefined;
const detectUnnecessaryCQRS: any = undefined;
const detectPrematureEventBus: any = undefined;
const detectPrematureMicroservices: any = undefined;
const checkSkillAlignment: any = undefined;

// Import QualityGate for integration test
import { QualityGate } from '../../bin/lib/quality-gate.js';
import { registerGate1 } from '../../bin/lib/gates/gate-01-requirement.js';
import { registerGate2 } from '../../bin/lib/gates/gate-02-architecture.js';

describe('Gate 1: Requirement Completeness', () => {
  describe('executeGate1', () => {
    test('Gate 1 passes when all REQ-IDs mapped', async () => {
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

      expect(result?.passed).toBe(true, 'Gate should pass');
      expect(result?.errors.length).toBe(0, 'Should have no errors');
    });

    test('Gate 1 fails with errors for unmapped REQ-IDs', async () => {
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

      expect(result?.passed).toBe(false, 'Gate should fail');
      expect(result?.errors.length).toBe(1, 'Should have 1 error');
      if (result.errors[0] == null) throw new Error('Expected error');
      expect(result?.errors[0].path).toBe('requirements[0].id');
      expect(result.errors[0]?.message?.includes('REQ-001')).toBeTruthy() // 'Error should mention REQ-001';
      expect(result.errors[0]?.message?.includes('not mapped')).toBeTruthy() // 'Error should mention mapping';
    });

    test('Gate 1 passes when acceptance criteria in Given-When-Then', async () => {
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

      expect(result?.passed).toBe(true, 'Gate should pass');
      expect(result?.errors.length).toBe(0, 'Should have no errors');
    });

    test('Gate 1 fails when acceptance criteria missing Given-When-Then', async () => {
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

      expect(result?.passed).toBe(false, 'Gate should fail');
      expect(result?.errors.length).toBe(1, 'Should have 1 error');
      if (result.errors[0] == null) throw new Error('Expected error');
      expect(result?.errors[0].path).toBe('requirements[0].acceptanceCriteria');
      expect(result.errors[0]?.message?.includes('Given-When-Then')).toBeTruthy() // 'Error should mention Given-When-Then';
    });
  });

  describe('checkGivenWhenThenFormat', () => {
    test('should validate proper Given-When-Then format', () => {
      const result = checkGivenWhenThenFormat([
        'Given valid credentials, When login submitted, Then user authenticated',
      ]);

      expect(result?.valid).toBe(true);
      assert.strictEqual(result?.missingComponents.length, 0);
    });

    test('should detect missing Given component', () => {
      const result = checkGivenWhenThenFormat([
        'When login submitted, Then user authenticated',
      ]);

      expect(result?.valid).toBe(false);
      expect(result.missingComponents.includes('Given'));
    });

    test('should detect missing When component').toBeTruthy() // ( => {
      const result = checkGivenWhenThenFormat([
        'Given valid credentials, Then user authenticated',
      ]);

      expect(result?.valid).toBe(false);
      expect(result.missingComponents.includes('When'));
    });

    test('should detect missing Then component').toBeTruthy() // ( => {
      const result = checkGivenWhenThenFormat([
        'Given valid credentials, When login submitted',
      ]);

      expect(result?.valid).toBe(false);
      expect(result.missingComponents.includes('Then'));
    });

    test('should handle multi-line format').toBeTruthy() // ( => {
      const result = checkGivenWhenThenFormat([
        'Given user is on login page',
        'When user enters valid credentials',
        'Then user is redirected to dashboard',
      ]);

      expect(result?.valid).toBe(true);
    });

    test('should handle format with colons', () => {
      const result = checkGivenWhenThenFormat([
        'Given: user has valid session',
        'When: user clicks logout',
        'Then: session is destroyed',
      ]);

      expect(result?.valid).toBe(true);
    });
  });

  describe('extractRequirementIds', () => {
    test('should extract REQ-IDs from text', () => {
      const text = 'This implements REQ-001 and REQ-002 for the login feature';
      const ids = extractRequirementIds(text);

      assert.deepStrictEqual(ids, ['REQ-001', 'REQ-002']);
    });

    test('should extract various ID formats', () => {
      const text = 'Covers GRAPH-01, GATE-02, and REQ-100';
      const ids = extractRequirementIds(text);

      const sorted = ids.sort();
      assert.deepStrictEqual(sorted, ['GATE-02', 'GRAPH-01', 'REQ-100'].sort());
    });

    test('should return empty array for no matches', () => {
      const text = 'No requirement IDs here';
      const ids = extractRequirementIds(text);

      assert.deepStrictEqual(ids, []);
    });

    test('should deduplicate IDs', () => {
      const text = 'REQ-001 is related to REQ-001';
      const ids = extractRequirementIds(text);

      assert.deepStrictEqual(ids, ['REQ-001']);
    });
  });

  describe('buildRequirementTaskMap', () => {
    test('should build map from task requirements', () => {
      const tasks = [
        { id: 'task-001', name: 'Login', requirements: ['REQ-001', 'REQ-002'] },
        { id: 'task-002', name: 'Logout', requirements: ['REQ-003'] },
      ];

      const map = buildRequirementTaskMap(tasks);

      expect(map.has('REQ-001'));
      assert.ok(map.has('REQ-002'));
      assert.ok(map.has('REQ-003'));
      assert.ok(map.get('REQ-001')?.has('task-001')).toBeTruthy() // 'Should have task-001 for REQ-001';
      expect(map.get('REQ-003')?.has('task-002')).toBeTruthy() // 'Should have task-002 for REQ-003';
    });

    test('should handle tasks without requirements', () => {
      const tasks = [
        { id: 'task-001', name: 'Setup' },
      ];

      const map = buildRequirementTaskMap(tasks);

      expect(map.size).toBe(0);
    });

    test('should handle empty task array', () => {
      const map = buildRequirementTaskMap([]);
      expect(map.size).toBe(0);
    });

    test('should handle null/undefined input', () => {
      // @ts-expect-error Testing undefined input
      expect(buildRequirementTaskMap(undefined).size).toBe(0);
      // @ts-expect-error Testing undefined input
      assert.strictEqual(buildRequirementTaskMap(undefined).size, 0);
    });
  });

  describe('buildRequirementPhaseMap', () => {
    test('should build map from phase requirements', () => {
      const phases = [
        { id: 'phase-01', name: 'Auth', requirements: ['REQ-001', 'REQ-002'] },
        { id: 'phase-02', name: 'Dashboard', requirements: ['REQ-003'] },
      ];

      const map = buildRequirementPhaseMap(phases);

      expect(map.has('REQ-001'));
      assert.ok(map.has('REQ-003'));
      assert.ok(map.get('REQ-001')?.has('phase-01')).toBeTruthy() // 'Should have phase-01 for REQ-001';
    });
  });
});

describe('Gate 2: Architecture Review', () => {
  describe('executeGate2', () => {
    test('Gate 2 passes when structure matches skill recommendations', async () => {
      const context = {
        projectTier: 'mvp' as const,
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

      expect(result?.passed).toBe(true, 'Gate should pass');
      expect(result?.errors.length).toBe(0, 'Should have no errors');
    });

    test('Gate 2 fails when structure deviates without justification', async () => {
      const context = {
        projectTier: 'mvp' as const,
        architecture: {
          abstractionLayers: 4,
          patterns: ['controller', 'service', 'repository', 'use-case', 'domain'],
        },
      };

      const result = await executeGate2(context);

      expect(result?.passed).toBe(false, 'Gate should fail');
      expect(result.errors.length > 0).toBeTruthy() // 'Should have errors';
      expect(result.errors.some(e => e.path === 'architecture.abstractionLayers')).toBeTruthy() // 'Should have abstraction layer error';
    });

    test('Gate 2 counts abstraction layers correctly', async () => {
      const context = {
        projectTier: 'medium' as const,
        files: [
          { path: '/controllers/UserController.js', type: 'controller' },
          { path: '/services/UserService.js', type: 'service' },
          { path: '/repositories/UserRepository.js', type: 'repository' },
          { path: '/models/User.js', type: 'model' },
        ],
      };

      const result = await executeGate2(context);

      // 4 layers for medium tier (max 3) should fail
      expect(result?.passed).toBe(false, 'Gate should fail for too many layers');
      expect(result.errors.some(e => e.message.includes('abstraction layers'))).toBeTruthy() // 'Should mention abstraction layers';
    });

    test('Gate 2 flags >3 abstraction layers as warning', async () => {
      const context = {
        projectTier: 'enterprise' as const,
        architecture: {
          abstractionLayers: 4,
          patterns: ['controller', 'service', 'repository', 'domain'],
        },
      };

      const result = await executeGate2(context);

      // Enterprise allows 4 layers, so it should pass
      expect(result?.passed).toBe(true, 'Gate should pass for enterprise tier');
    });

    test('Gate 2 detects premature repository pattern', async () => {
      const context = {
        projectTier: 'mvp' as const,
        hasRepositoryPattern: true,
        crudOperationCount: 5,
      };

      const result = await executeGate2(context);

      expect(result?.passed).toBe(false, 'Gate should fail');
      expect(result.errors.some(e => e.message.includes('Repository pattern'))).toBeTruthy() // 'Should mention Repository pattern';
    });

    test('Gate 2 detects unnecessary CQRS for simple CRUD', async () => {
      const context = {
        projectTier: 'mvp' as const,
        hasCQRS: true,
        crudOperationCount: 8,
        eventCount: 2,
      };

      const result = await executeGate2(context);

      expect(result?.passed).toBe(false, 'Gate should fail');
      expect(result.errors.some(e => e.message.includes('CQRS'))).toBeTruthy() // 'Should mention CQRS';
    });
  });

  describe('countAbstractionLayers', () => {
    test('should count layers from file types', () => {
      const files = [
        { path: '/controllers/UserController.js', type: 'controller' },
        { path: '/services/UserService.js', type: 'service' },
        { path: '/models/User.js', type: 'model' },
      ];

      const layers = countAbstractionLayers(files);
      expect(layers).toBe(3, 'Should count 3 layers');
    });

    test('should count layers from path inference', () => {
      const files = [
        { path: '/controllers/UserController.js' },
        { path: '/services/UserService.js' },
        { path: '/repositories/UserRepository.js' },
        { path: '/models/User.js' },
      ];

      const layers = countAbstractionLayers(files);
      expect(layers).toBe(4, 'Should count 4 layers from paths');
    });

    test('should use explicit layer property', () => {
      const files = [
        { path: '/file1.js', layer: 0 },
        { path: '/file2.js', layer: 1 },
        { path: '/file3.js', layer: 2 },
        { path: '/file4.js', layer: 3 },
      ];

      const layers = countAbstractionLayers(files);
      expect(layers).toBe(3, 'Should use max layer value');
    });

    test('should return 0 for empty array', () => {
      const layers = countAbstractionLayers([]);
      expect(layers).toBe(0, 'Should return 0 for empty array');
    });

    test('should handle middleware layer', () => {
      const files = [
        { path: '/middleware/AuthMiddleware.js', type: 'middleware' },
        { path: '/controllers/UserController.js', type: 'controller' },
        { path: '/services/UserService.js', type: 'service' },
      ];

      const layers = countAbstractionLayers(files);
      expect(layers).toBe(3, 'Should count middleware layer');
    });
  });

  describe('detectPrematureRepository', () => {
    test('should detect repository pattern in MVP with simple CRUD', () => {
      const context = {
        projectTier: 'mvp',
        hasRepositoryPattern: true,
        crudOperationCount: 5,
      };

      const result = detectPrematureRepository(context);

      expect(result?.detected).toBe(true, 'Should detect premature repository');
      expect(result.reason.includes('Repository pattern')).toBeTruthy() // 'Reason should mention Repository pattern';
    });

    test('should not detect when CRUD count is high', () => {
      const context = {
        projectTier: 'mvp',
        hasRepositoryPattern: true,
        crudOperationCount: 15,
      };

      const result = detectPrematureRepository(context);

      expect(result?.detected).toBe(false, 'Should not detect for high CRUD count');
    });

    test('should allow with justification', () => {
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

      expect(result?.detected).toBe(false, 'Should allow with justification');
    });

    test('should not detect for medium tier', () => {
      const context = {
        projectTier: 'medium',
        hasRepositoryPattern: true,
        crudOperationCount: 8,
      };

      const result = detectPrematureRepository(context);

      expect(result?.detected).toBe(false, 'Should not detect for medium tier');
    });
  });

  describe('detectUnnecessaryCQRS', () => {
    test('should detect CQRS for simple CRUD', () => {
      const context = {
        projectTier: 'mvp',
        hasCQRS: true,
        crudOperationCount: 8,
        eventCount: 2,
      };

      const result = detectUnnecessaryCQRS(context);

      expect(result?.detected).toBe(true, 'Should detect unnecessary CQRS');
      expect(result.reason.includes('CQRS')).toBeTruthy() // 'Reason should mention CQRS';
    });

    test('should not detect CQRS with high event count', () => {
      const context = {
        projectTier: 'medium',
        hasCQRS: true,
        crudOperationCount: 20,
        eventCount: 15,
      };

      const result = detectUnnecessaryCQRS(context);

      expect(result?.detected).toBe(false, 'Should not detect for high event count');
    });

    test('should allow CQRS with justification', () => {
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

      expect(result?.detected).toBe(false, 'Should allow with justification');
    });
  });

  describe('detectPrematureEventBus', () => {
    test('should detect event bus with few events', () => {
      const context = {
        hasEventBus: true,
        eventCount: 2,
      };

      const result = detectPrematureEventBus(context);

      expect(result?.detected).toBe(true, 'Should detect premature event bus');
      expect(result.reason.includes('Event bus')).toBeTruthy() // 'Reason should mention Event bus';
    });

    test('should not detect event bus with many events', () => {
      const context = {
        hasEventBus: true,
        eventCount: 10,
      };

      const result = detectPrematureEventBus(context);

      expect(result?.detected).toBe(false, 'Should not detect for many events');
    });
  });

  describe('detectPrematureMicroservices', () => {
    test('should detect microservices in MVP', () => {
      const context = {
        projectTier: 'mvp',
        hasMicroservices: true,
      };

      const result = detectPrematureMicroservices(context);

      expect(result?.detected).toBe(true, 'Should detect premature microservices');
      expect(result.reason.includes('Microservices')).toBeTruthy() // 'Reason should mention Microservices';
    });

    test('should allow microservices with justification', () => {
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

      expect(result?.detected).toBe(false, 'Should allow with justification');
    });

    test('should not detect for enterprise tier without justification', () => {
      const context = {
        projectTier: 'enterprise',
        hasMicroservices: true,
      };

      const result = detectPrematureMicroservices(context);

      // Enterprise without justification still flags
      expect(result?.detected).toBe(true, 'Should flag enterprise without justification');
    });
  });

  describe('checkSkillAlignment', () => {
    test('should return empty deviations when aligned', () => {
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

      expect(result?.deviations.length).toBe(0, 'Should have no deviations');
    });

    test('should detect anti-pattern usage', () => {
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

      expect(result?.deviations.length).toBe(1, 'Should have 1 deviation');
      expect(result?.deviations[0].skill).toBe('nodejs-mvp');
      expect(result.deviations[0]?.deviation?.includes('repository')).toBeTruthy() // 'Should mention repository';
    });

    test('should detect abstraction layer violations', () => {
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

      expect(result?.deviations.length).toBe(1, 'Should have 1 deviation');
      expect(result.deviations[0]?.deviation?.includes('Abstraction layers')).toBeTruthy() // 'Should mention abstraction layers';
    });

    test('should handle empty skill recommendations', () => {
      const result = checkSkillAlignment([], { patterns: ['controller'] });

      expect(result?.deviations.length).toBe(0, 'Should have no deviations');
      expect(result?.matched.length).toBe(0, 'Should have no matches');
    });
  });

  describe('ABSTRACTION_THRESHOLDS', () => {
    test('should have correct thresholds for each tier', () => {
      expect(ABSTRACTION_THRESHOLDS.mvp).toBe(2, 'MVP should be 2');
      expect(ABSTRACTION_THRESHOLDS.medium).toBe(3, 'Medium should be 3');
      expect(ABSTRACTION_THRESHOLDS.enterprise).toBe(4, 'Enterprise should be 4');
    });
  });
});

describe('Gate Integration Tests', () => {
  let gates;

  beforeEach(() => {
    gates = new QualityGate();
  });

  test('Gate 1 registers with QualityGate coordinator', () => {
    registerGate1(gates);

    const registeredGates = gates.getRegisteredGates();
    expect(registeredGates.includes('gate-01-requirement')).toBeTruthy() // 'Gate 1 should be registered';
  });

  test('Gate 2 registers with QualityGate coordinator', () => {
    registerGate2(gates);

    const registeredGates = gates.getRegisteredGates();
    expect(registeredGates.includes('gate-02-architecture')).toBeTruthy() // 'Gate 2 should be registered';
  });

  test('Both gates execute successfully through coordinator', async () => {
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

    expect(gate1Result.passed).toBe(true, 'Gate 1 should pass');
    expect(gate2Result.passed).toBe(true, 'Gate 2 should pass');
  });

  test('Gate 1 fails through coordinator for unmapped requirements', async () => {
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

    expect(result?.passed).toBe(false, 'Gate 1 should fail');
    expect(result.errors.length > 0).toBeTruthy() // 'Should have errors';
  });

  test('Gate 2 fails through coordinator for overengineering', async () => {
    registerGate2(gates);

    const context = {
      projectTier: 'mvp',
      hasRepositoryPattern: true,
      hasCQRS: true,
      crudOperationCount: 5,
      eventCount: 2,
    };

    const result = await gates.executeGate('gate-02-architecture', context);

    expect(result?.passed).toBe(false, 'Gate 2 should fail');
    expect(result.errors.length > 0).toBeTruthy() // 'Should have errors';
  });
});

/**
 * Gate 2: Architecture Review
 *
 * Validates architecture against skill recommendations and checks for overengineering.
 *
 * Checks:
 * 1. Structure matches skill recommendations (when skill registry is available)
 * 2. Abstraction layer count is appropriate (< 3 for most projects)
 * 3. No premature optimization patterns (microservices, repository pattern without need)
 * 4. No unnecessary CQRS for simple CRUD operations
 *
 * @module gates/gate-02-architecture
 */

const { z } = require('zod');
const path = require('path');
const fs = require('fs');

/**
 * Zod schema for a file in the proposed architecture
 * @type {z.ZodSchema}
 */
const fileSchema = z.object({
  /** File path relative to project root */
  path: z.string(),
  /** File type/category (e.g., 'controller', 'service', 'repository', 'model') */
  type: z.string().optional(),
  /** Abstraction layer depth (0 = root, 1 = first layer, etc.) */
  layer: z.number().int().min(0).optional(),
  /** Dependencies (other files this file depends on) */
  dependencies: z.array(z.string()).optional(),
});

/**
 * Zod schema for architecture component
 * @type {z.ZodSchema}
 */
const componentSchema = z.object({
  /** Component name */
  name: z.string(),
  /** Component type (e.g., 'controller', 'service', 'repository', 'use-case') */
  type: z.string(),
  /** Layer depth */
  layer: z.number().int().min(0),
  /** Files in this component */
  files: z.array(z.string()).optional(),
});

/**
 * Zod schema for skill recommendation
 * @type {z.ZodSchema}
 */
const skillRecommendationSchema = z.object({
  /** Skill name */
  skillName: z.string(),
  /** Recommended project structure */
  recommendedStructure: z.array(z.string()).optional(),
  /** Best practices */
  bestPractices: z.array(z.string()).optional(),
  /** Anti-patterns to avoid */
  antiPatterns: z.array(z.string()).optional(),
  /** Maximum recommended abstraction layers */
  maxAbstractionLayers: z.number().int().min(1).optional(),
});

/**
 * Zod schema for the gate context
 * @type {z.ZodSchema}
 */
const gateContextSchema = z.object({
  /** Proposed project structure (array of files) */
  files: z.array(fileSchema).optional(),
  /** Architecture components */
  components: z.array(componentSchema).optional(),
  /** Project tier/archetype (mvp, medium, enterprise) */
  projectTier: z.enum(['mvp', 'medium', 'enterprise']).optional(),
  /** Skill recommendations (from Skill Registry) */
  skillRecommendations: z.array(skillRecommendationSchema).optional(),
  /** Explicit architecture description */
  architecture: z.object({
    /** Number of abstraction layers */
    abstractionLayers: z.number().int().min(0).optional(),
    /** Patterns used */
    patterns: z.array(z.string()).optional(),
    /** Justification for complex patterns */
    justifications: z.record(z.string()).optional(),
  }).optional(),
  /** Simple flags for common patterns */
  hasRepositoryPattern: z.boolean().optional(),
  hasCQRS: z.boolean().optional(),
  hasEventBus: z.boolean().optional(),
  hasMicroservices: z.boolean().optional(),
  /** Event count (for detecting overengineering) */
  eventCount: z.number().int().min(0).optional(),
  /** CRUD operation count */
  crudOperationCount: z.number().int().min(0).optional(),
});

/**
 * Default abstraction layer thresholds by project tier
 */
const ABSTRACTION_THRESHOLDS = {
  mvp: 2,        // MVP: max 2 layers (e.g., controller → service)
  medium: 3,     // Medium: max 3 layers (e.g., controller → service → repository)
  enterprise: 4, // Enterprise: max 4 layers (e.g., controller → service → repository → domain)
};

/**
 * Count abstraction layers from file structure
 *
 * Analyzes file paths and types to determine the depth of abstraction layers.
 * Common layers: controller → service → repository → model/domain
 *
 * @param {Array} files - Array of file objects with path and type
 * @returns {number} Maximum abstraction layer depth
 */
function countAbstractionLayers(files) {
  if (!files || files.length === 0) {
    return 0;
  }

  // If files have explicit layer property, use the maximum
  const maxLayer = Math.max(...files.map(f => f.layer ?? 0));
  if (maxLayer > 0) {
    return maxLayer;
  }

  // Otherwise, infer from file paths and types
  const layerTypes = new Set();

  for (const file of files) {
    const filePath = file.path || '';
    const fileType = file.type || '';

    // Check type field first
    if (fileType) {
      layerTypes.add(fileType.toLowerCase());
    }

    // Infer from path
    const pathLower = filePath.toLowerCase();
    if (pathLower.includes('/controller') || pathLower.includes('/controllers')) {
      layerTypes.add('controller');
    }
    if (pathLower.includes('/service') || pathLower.includes('/services')) {
      layerTypes.add('service');
    }
    if (pathLower.includes('/repository') || pathLower.includes('/repositories') ||
        pathLower.includes('/dao') || pathLower.includes('/data-access')) {
      layerTypes.add('repository');
    }
    if (pathLower.includes('/use-case') || pathLower.includes('/usecase') ||
        pathLower.includes('/usecase') || pathLower.includes('/commands') ||
        pathLower.includes('/queries') || pathLower.includes('/handlers')) {
      layerTypes.add('use-case');
    }
    if (pathLower.includes('/model') || pathLower.includes('/models') ||
        pathLower.includes('/domain') || pathLower.includes('/entity')) {
      layerTypes.add('model');
    }
    if (pathLower.includes('/middleware')) {
      layerTypes.add('middleware');
    }
  }

  // Define typical layer ordering
  const layerOrder = ['middleware', 'controller', 'use-case', 'service', 'repository', 'model'];

  // Count distinct layers present
  let layerCount = 0;
  for (const layer of layerOrder) {
    if (layerTypes.has(layer)) {
      layerCount++;
    }
  }

  return layerCount;
}

/**
 * Detect premature repository pattern
 *
 * Repository pattern is overengineering when:
 * - Project is MVP tier with simple CRUD
 * - No complex data access logic
 * - Single data source (no need to swap databases)
 *
 * @param {Object} context - Gate context
 * @returns {{ detected: boolean, reason: string }}
 */
function detectPrematureRepository(context) {
  const result = { detected: false, reason: '' };

  // If explicitly flagged
  if (context.hasRepositoryPattern) {
    const tier = context.projectTier || 'mvp';
    const crudCount = context.crudOperationCount ?? 0;

    // Check if there's justification first - if provided, allow it
    if (context.architecture?.justifications?.repository) {
      // Justification provided, allow it
      return result;
    }

    // MVP with simple CRUD (< 10 operations) - likely overengineering
    if (tier === 'mvp' && crudCount < 10) {
      result.detected = true;
      result.reason = 'Repository pattern detected in MVP project with simple CRUD operations. ' +
        'Consider using direct data access for MVP tier. Add justification if pattern is necessary.';
      return result;
    }
  }

  return result;
}

/**
 * Detect unnecessary CQRS
 *
 * CQRS is overengineering when:
 * - Simple CRUD application
 * - No complex read/write separation needs
 * - Low event count
 *
 * @param {Object} context - Gate context
 * @returns {{ detected: boolean, reason: string }}
 */
function detectUnnecessaryCQRS(context) {
  const result = { detected: false, reason: '' };

  // If explicitly flagged
  if (context.hasCQRS) {
    const crudCount = context.crudOperationCount ?? 0;
    const eventCount = context.eventCount ?? 0;
    const tier = context.projectTier || 'mvp';

    // Check justification first - if provided, allow it
    if (context.architecture?.justifications?.cqrs) {
      return result;
    }

    // Simple CRUD with CQRS - likely overengineering
    if (crudCount < 15 && eventCount < 5) {
      result.detected = true;
      result.reason = `CQRS pattern detected for simple CRUD application (${crudCount} operations, ${eventCount} events). ` +
        'CQRS adds complexity; consider using for projects with complex read/write separation needs or high event volume.';
      return result;
    }

    // MVP with CQRS but low complexity
    if (tier === 'mvp' && (crudCount < 20 || eventCount < 10)) {
      result.detected = true;
      result.reason = 'CQRS in MVP project without clear justification. ' +
        'Add explicit justification explaining read/write separation needs.';
    }
  }

  return result;
}

/**
 * Detect premature event bus / event-driven architecture
 *
 * Event bus is overengineering when:
 * - Very few events (< 3)
 * - Simple application flow
 * - No async processing needs
 *
 * @param {Object} context - Gate context
 * @returns {{ detected: boolean, reason: string }}
 */
function detectPrematureEventBus(context) {
  const result = { detected: false, reason: '' };

  if (context.hasEventBus) {
    const eventCount = context.eventCount ?? 0;

    if (eventCount < 3) {
      result.detected = true;
      result.reason = `Event bus with only ${eventCount} events. ` +
        'For 1-2 events, consider direct function calls or simple pub/sub. ' +
        'Event bus adds complexity that may not be justified.';
      return result;
    }
  }

  return result;
}

/**
 * Detect premature microservices
 *
 * Microservices are overengineering when:
 * - MVP tier project
 * - Small team (< 5 developers implied by MVP)
 * - No explicit scalability requirements
 *
 * @param {Object} context - Gate context
 * @returns {{ detected: boolean, reason: string }}
 */
function detectPrematureMicroservices(context) {
  const result = { detected: false, reason: '' };

  if (context.hasMicroservices) {
    const tier = context.projectTier || 'mvp';

    // Check justification first - if provided, allow it
    if (context.architecture?.justifications?.microservices) {
      return result;
    }

    if (tier === 'mvp') {
      result.detected = true;
      result.reason = 'Microservices architecture in MVP project. ' +
        'Consider monolith-first approach for MVP. Microservices add operational complexity ' +
        'that should be justified by team size, scalability needs, or domain complexity.';
      return result;
    }

    // Other tiers without justification
    result.detected = true;
    result.reason = 'Microservices without explicit justification. ' +
      'Add justification explaining domain boundaries, team structure, or scalability requirements.';
  }

  return result;
}

/**
 * Check structure against skill recommendations
 *
 * @param {Array} skillRecommendations - Array of skill recommendations
 * @param {Object} architecture - Proposed architecture
 * @returns {{ deviations: Array<{skill: string, deviation: string, suggestion: string}>, matched: string[] }}
 */
function checkSkillAlignment(skillRecommendations, architecture) {
  const deviations = [];
  const matched = [];

  if (!skillRecommendations || skillRecommendations.length === 0) {
    return { deviations, matched };
  }

  for (const skill of skillRecommendations) {
    const skillName = skill.skillName;

    // Check recommended structure
    if (skill.recommendedStructure && architecture?.patterns) {
      const recommendedPatterns = skill.recommendedStructure.map(s => s.toLowerCase());
      const actualPatterns = architecture.patterns.map(p => p.toLowerCase());

      for (const recommended of recommendedPatterns) {
        if (actualPatterns.some(p => p.includes(recommended))) {
          matched.push(`${skillName}: ${recommended}`);
        }
      }
    }

    // Check anti-patterns
    if (skill.antiPatterns && architecture?.patterns) {
      const antiPatterns = skill.antiPatterns.map(ap => ap.toLowerCase());
      const actualPatterns = architecture.patterns.map(p => p.toLowerCase());

      for (const antiPattern of antiPatterns) {
        if (actualPatterns.some(p => p.includes(antiPattern))) {
          deviations.push({
            skill: skillName,
            deviation: `Uses anti-pattern '${antiPattern}' flagged by skill`,
            suggestion: skill.bestPractices?.[0] || 'Review skill recommendations',
          });
        }
      }
    }

    // Check abstraction layers
    if (skill.maxAbstractionLayers && architecture?.abstractionLayers) {
      if (architecture.abstractionLayers > skill.maxAbstractionLayers) {
        deviations.push({
          skill: skillName,
          deviation: `Abstraction layers (${architecture.abstractionLayers}) exceeds skill recommendation (${skill.maxAbstractionLayers})`,
          suggestion: `Consider reducing to ${skill.maxAbstractionLayers} layers or fewer`,
        });
      }
    }
  }

  return { deviations, matched };
}

/**
 * Gate 2 Executor: Architecture Review
 *
 * @param {Object} context - Gate context (validated against gateContextSchema)
 * @returns {Promise<{ passed: boolean, errors: Array<{path: string, message: string}>, warnings: string[] }>}
 */
async function executeGate2(context) {
  const errors = [];
  const warnings = [];

  // Determine project tier
  const tier = context.projectTier || 'mvp';
  const maxLayers = ABSTRACTION_THRESHOLDS[tier];

  // Count abstraction layers
  let abstractionLayers = context.architecture?.abstractionLayers;
  if (abstractionLayers === undefined && context.files) {
    abstractionLayers = countAbstractionLayers(context.files);
  }

  if (abstractionLayers !== undefined) {
    if (abstractionLayers > maxLayers) {
      errors.push({
        path: 'architecture.abstractionLayers',
        message: `Too many abstraction layers (${abstractionLayers}) for ${tier} project. ` +
          `Maximum recommended: ${maxLayers}. Consider flattening architecture.`,
      });
    } else if (abstractionLayers > 3) {
      warnings.push(
        `Architecture has ${abstractionLayers} abstraction layers. ` +
        'Consider simplifying if possible. Layers > 3 often indicate overengineering.'
      );
    }
  }

  // Check for overengineering patterns

  // 1. Premature repository pattern
  const repoCheck = detectPrematureRepository(context);
  if (repoCheck.detected) {
    errors.push({
      path: 'architecture.patterns',
      message: repoCheck.reason,
    });
  }

  // 2. Unnecessary CQRS
  const cqrsCheck = detectUnnecessaryCQRS(context);
  if (cqrsCheck.detected) {
    errors.push({
      path: 'architecture.patterns',
      message: cqrsCheck.reason,
    });
  }

  // 3. Premature event bus
  const eventBusCheck = detectPrematureEventBus(context);
  if (eventBusCheck.detected) {
    warnings.push(eventBusCheck.reason);
  }

  // 4. Premature microservices
  const microservicesCheck = detectPrematureMicroservices(context);
  if (microservicesCheck.detected) {
    errors.push({
      path: 'architecture.patterns',
      message: microservicesCheck.reason,
    });
  }

  // Check skill alignment
  if (context.skillRecommendations && context.skillRecommendations.length > 0) {
    const { deviations, matched } = checkSkillAlignment(
      context.skillRecommendations,
      context.architecture
    );

    for (const deviation of deviations) {
      warnings.push(
        `Skill '${deviation.skill}': ${deviation.deviation}. ` +
        `Suggestion: ${deviation.suggestion}`
      );
    }

    // Log matched recommendations (info only)
    if (matched.length > 0) {
      // Could add to a separate 'info' field if needed
    }
  }

  // Check for unjustified deviations from skill recommendations
  if (context.architecture?.justifications) {
    // Justifications provided - acknowledge but don't block
    const justificationKeys = Object.keys(context.architecture.justifications);
    if (justificationKeys.length > 0) {
      // This is informational - justifications allow deviation from recommendations
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create and register Gate 2 with a QualityGate instance
 *
 * @param {QualityGate} gateCoordinator - QualityGate coordinator instance
 * @returns {void}
 */
function registerGate2(gateCoordinator) {
  gateCoordinator.registerGate('gate-02-architecture', gateContextSchema, executeGate2);
}

/**
 * Load skill recommendations from Skill Registry
 *
 * @param {string} [skillRegistryPath] - Optional path to skill registry module
 * @returns {Promise<Array>} Array of skill recommendations
 */
async function loadSkillRecommendations(skillRegistryPath) {
  try {
    // Try to load skill registry if path provided
    if (skillRegistryPath && fs.existsSync(skillRegistryPath)) {
      const { SkillRegistry } = require(skillRegistryPath);
      const registry = new SkillRegistry();
      await registry.load();

      // Get all skills and extract recommendations
      const skills = registry.getAll();
      return skills
        .filter(s => s.recommended_structure || s.best_practices || s.anti_patterns)
        .map(s => ({
          skillName: s.name,
          recommendedStructure: s.recommended_structure,
          bestPractices: s.best_practices,
          antiPatterns: s.anti_patterns,
          maxAbstractionLayers: s.max_abstraction_layers,
        }));
    }
  } catch (err) {
    // Skill registry not available - return empty array
    // Gate will still work with explicit context.skillRecommendations
  }

  return [];
}

module.exports = {
  executeGate2,
  registerGate2,
  fileSchema,
  componentSchema,
  skillRecommendationSchema,
  gateContextSchema,
  countAbstractionLayers,
  detectPrematureRepository,
  detectUnnecessaryCQRS,
  detectPrematureEventBus,
  detectPrematureMicroservices,
  checkSkillAlignment,
  loadSkillRecommendations,
  ABSTRACTION_THRESHOLDS,
};

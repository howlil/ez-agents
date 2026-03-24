#!/usr/bin/env node
'use strict';

/**
 * Multi-Skill Activation System
 * 
 * Provides:
 * - Skill activation engine (3-7 skills per task)
 * - Skill combination validator
 * - Multi-skill context assembly
 * 
 * @module skill-activation
 */

const fs = require('fs');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Skill categories with activation counts
 */
const SKILL_CATEGORIES = {
  STACK: { name: 'stack', min: 1, max: 1, priority: 1 },
  ARCHITECTURE: { name: 'architecture', min: 1, max: 2, priority: 2 },
  DOMAIN: { name: 'domain', min: 1, max: 1, priority: 3 },
  OPERATIONAL: { name: 'operational', min: 0, max: 2, priority: 4 },
  CONSTRAINT: { name: 'constraint', min: 0, max: 1, priority: 5 }
};

/**
 * Minimum and maximum skills per task
 */
const MIN_SKILLS = 3;
const MAX_SKILLS = 7;

/**
 * Skill definitions by category
 */
const SKILL_DEFINITIONS = {
  // Stack skills (framework-specific)
  stack: [
    'laravel_11_structure_skill_v2',
    'nextjs_app_router_skill',
    'nestjs_architecture_skill',
    'fastapi_structure_skill',
    'spring_boot_architecture_skill',
    'react_architecture_skill',
    'flutter_architecture_skill',
    'django_architecture_skill',
    'express_js_architecture_skill',
    'vue_architecture_skill',
    'angular_architecture_skill',
    'svelte_architecture_skill'
  ],

  // Architecture skills (structural patterns)
  architecture: [
    'monolith_architecture_skill',
    'modular_monolith_skill',
    'microservices_architecture_skill',
    'event_driven_architecture_skill',
    'queue_based_architecture_skill',
    'caching_strategy_skill',
    'rbac_architecture_skill',
    'api_gateway_architecture_skill'
  ],

  // Domain skills (project-type patterns)
  domain: [
    'pos_multi_branch_skill',
    'inventory_management_skill',
    'ecommerce_cart_skill',
    'payment_gateway_skill',
    'multi_tenancy_architecture_skill',
    'subscription_billing_skill',
    'lms_course_management_skill',
    'booking_reservation_skill',
    'fintech_compliance_skill',
    'transaction_audit_skill',
    'dashboard_analytics_skill',
    'saas_metrics_skill'
  ],

  // Operational skills (task-type patterns)
  operational: [
    'bug_triage_skill',
    'refactor_planning_skill',
    'migration_planning_skill',
    'release_readiness_skill',
    'rollback_planning_skill',
    'incident_handling_skill',
    'regression_testing_skill',
    'code_review_skill'
  ],

  // Constraint skills (compliance/budget)
  constraint: [
    'gdpr_compliance_skill',
    'hipaa_compliance_skill',
    'pci_dss_compliance_skill',
    'budget_optimization_skill',
    'deadline_management_skill',
    'legacy_integration_skill'
  ]
};

/**
 * Skill prerequisites (some skills require other skills active)
 */
const SKILL_PREREQUISITES = {
  'testing_skill': ['bug_triade_skill'],
  'integration_testing_skill': ['unit_testing_skill'],
  'e2e_testing_skill': ['integration_testing_skill'],
  'microservices_architecture_skill': ['api_gateway_architecture_skill'],
  'event_driven_architecture_skill': ['queue_based_architecture_skill'],
  'payment_gateway_skill': ['security_testing_skill'],
  'multi_tenancy_architecture_skill': ['rbac_architecture_skill'],
  'fintech_compliance_skill': ['transaction_audit_skill']
};

/**
 * Skill conflicts (incompatible combinations)
 */
const SKILL_CONFLICTS = [
  ['monolith_architecture_skill', 'microservices_architecture_skill'],
  ['monolith_architecture_skill', 'event_driven_architecture_skill'],
  ['budget_optimization_skill', 'scalability_first_skill'],
  ['deadline_management_skill', 'comprehensive_testing_skill']
];

/**
 * Stack to skill mapping
 */
const STACK_SKILL_MAP = {
  'Laravel': 'laravel_11_structure_skill_v2',
  'Next.js': 'nextjs_app_router_skill',
  'NestJS': 'nestjs_architecture_skill',
  'FastAPI': 'fastapi_structure_skill',
  'Spring Boot': 'spring_boot_architecture_skill',
  'React': 'react_architecture_skill',
  'Flutter': 'flutter_architecture_skill',
  'Django': 'django_architecture_skill',
  'Express': 'express_js_architecture_skill',
  'Vue': 'vue_architecture_skill',
  'Angular': 'angular_architecture_skill',
  'Svelte': 'svelte_architecture_skill'
};

/**
 * Archetype to domain skill mapping
 */
const ARCHETYPE_SKILL_MAP = {
  'dashboard': ['dashboard_analytics_skill', 'ui_component_design_skill'],
  'POS': ['pos_multi_branch_skill', 'inventory_management_skill'],
  'SaaS': ['multi_tenancy_architecture_skill', 'subscription_billing_skill'],
  'e-commerce': ['ecommerce_cart_skill', 'payment_gateway_skill'],
  'LMS': ['lms_course_management_skill'],
  'booking': ['booking_reservation_skill'],
  'fintech': ['fintech_compliance_skill', 'transaction_audit_skill'],
  'internal_tools': ['dashboard_analytics_skill']
};

/**
 * Task type to operational skill mapping
 */
const TASK_TYPE_SKILL_MAP = {
  'feature': [],
  'bug': ['bug_triage_skill', 'regression_testing_skill'],
  'refactor': ['refactor_planning_skill', 'code_review_skill'],
  'migration': ['migration_planning_skill', 'rollback_planning_skill'],
  'incident': ['incident_handling_skill', 'rollback_planning_skill']
};

// ============================================================================
// SKILL ACTIVATION ENGINE
// ============================================================================

/**
 * Activate 3-7 skills based on context inputs
 * 
 * @param {Object} context - Context object from Context Engine
 * @param {Array} context.stack - Detected tech stack
 * @param {string} context.archetype - Project archetype
 * @param {string} context.mode - Operational mode
 * @param {Array} context.constraints - Business constraints
 * @param {Object} task - Task object
 * @param {string} task.type - Task type (feature, bug, refactor, migration, incident)
 * @returns {Object} Activation result: { skills, count, categories, log_entry }
 */
function activateSkills(context, task) {
  const activatedSkills = [];
  const categories = {};
  
  // Initialize category tracking
  for (const cat of Object.values(SKILL_CATEGORIES)) {
    categories[cat.name] = [];
  }

  // 1. Stack skill (1) - Framework-specific patterns
  if (context.stack && context.stack.length > 0) {
    const stackSkills = selectStackSkills(context.stack);
    categories.stack.push(...stackSkills);
    activatedSkills.push(...stackSkills);
  }

  // 2. Architecture skill (1-2) - Structural patterns
  const architectureSkills = selectArchitectureSkills(context);
  categories.architecture.push(...architectureSkills);
  activatedSkills.push(...architectureSkills);

  // 3. Domain skill (1) - Project-type patterns
  if (context.archetype) {
    const domainSkills = selectDomainSkills(context.archetype);
    categories.domain.push(...domainSkills);
    activatedSkills.push(...domainSkills);
  }

  // 4. Operational skill (0-2) - Task-type patterns
  if (task.type) {
    const operationalSkills = selectOperationalSkills(task.type);
    categories.operational.push(...operationalSkills);
    activatedSkills.push(...operationalSkills);
  }

  // 5. Constraint skill (0-1) - Compliance/budget patterns
  if (context.constraints && context.constraints.length > 0) {
    const constraintSkills = selectConstraintSkills(context.constraints);
    categories.constraint.push(...constraintSkills);
    activatedSkills.push(...constraintSkills);
  }

  // Enforce 3-7 skill limit
  const result = enforceSkillLimits(activatedSkills, categories);

  // Create log entry
  const logEntry = {
    task_id: task.id || Date.now().toString(),
    skills: result.skills,
    categories: result.categories,
    timestamp: new Date().toISOString(),
    context: {
      stack: context.stack,
      archetype: context.archetype,
      mode: context.mode,
      constraints: context.constraints
    }
  };

  return {
    skills: result.skills,
    count: result.skills.length,
    categories: result.categories,
    log_entry: logEntry,
    min_enforced: result.min_enforced,
    max_enforced: result.max_enforced
  };
}

/**
 * Select stack skills based on detected stack
 * 
 * @param {Array} stack - Array of stack items
 * @returns {Array} Selected stack skills
 */
function selectStackSkills(stack) {
  const skills = [];
  
  for (const item of stack) {
    if (STACK_SKILL_MAP[item]) {
      skills.push(STACK_SKILL_MAP[item]);
    }
  }
  
  // Limit to 1 stack skill (priority to first match)
  return skills.slice(0, SKILL_CATEGORIES.STACK.max);
}

/**
 * Select architecture skills based on context
 * 
 * @param {Object} context - Context object
 * @returns {Array} Selected architecture skills
 */
function selectArchitectureSkills(context) {
  const skills = [];
  
  // Default architecture skill based on mode
  if (context.mode === 'Scale-Up') {
    skills.push('microservices_architecture_skill');
    skills.push('caching_strategy_skill');
  } else if (context.mode === 'Greenfield') {
    skills.push('modular_monolith_skill');
  } else if (context.mode === 'Brownfield') {
    skills.push('monolith_architecture_skill');
  } else {
    skills.push('modular_monolith_skill');
  }
  
  // Limit to 2 architecture skills
  return skills.slice(0, SKILL_CATEGORIES.ARCHITECTURE.max);
}

/**
 * Select domain skills based on archetype
 * 
 * @param {string} archetype - Project archetype
 * @returns {Array} Selected domain skills
 */
function selectDomainSkills(archetype) {
  const skills = ARCHETYPE_SKILL_MAP[archetype] || [];
  
  // Limit to 1 domain skill
  return skills.slice(0, SKILL_CATEGORIES.DOMAIN.max);
}

/**
 * Select operational skills based on task type
 * 
 * @param {string} taskType - Task type
 * @returns {Array} Selected operational skills
 */
function selectOperationalSkills(taskType) {
  const skills = TASK_TYPE_SKILL_MAP[taskType] || [];
  
  // Limit to 2 operational skills
  return skills.slice(0, SKILL_CATEGORIES.OPERATIONAL.max);
}

/**
 * Select constraint skills based on constraints
 * 
 * @param {Array} constraints - Array of constraints
 * @returns {Array} Selected constraint skills
 */
function selectConstraintSkills(constraints) {
  const skills = [];
  
  for (const constraint of constraints) {
    if (constraint.includes('compliance') || constraint.includes('gdpr') || constraint.includes('hipaa')) {
      skills.push('gdpr_compliance_skill');
    } else if (constraint.includes('budget') || constraint.includes('cost')) {
      skills.push('budget_optimization_skill');
    } else if (constraint.includes('deadline') || constraint.includes('urgent')) {
      skills.push('deadline_management_skill');
    } else if (constraint.includes('legacy')) {
      skills.push('legacy_integration_skill');
    }
  }
  
  // Limit to 1 constraint skill
  return skills.slice(0, SKILL_CATEGORIES.CONSTRAINT.max);
}

/**
 * Enforce 3-7 skill limits
 * 
 * @param {Array} skills - All activated skills
 * @param {Object} categories - Skills by category
 * @returns {Object} Result with enforced limits
 */
function enforceSkillLimits(skills, categories) {
  let result = {
    skills: [...skills],
    categories: { ...categories },
    min_enforced: false,
    max_enforced: false
  };

  // Remove duplicates
  result.skills = [...new Set(result.skills)];

  // Enforce maximum (7 skills)
  if (result.skills.length > MAX_SKILLS) {
    result.skills = result.skills.slice(0, MAX_SKILLS);
    result.max_enforced = true;
    
    // Update categories to reflect capped skills
    for (const cat of Object.keys(categories)) {
      categories[cat] = categories[cat].filter(s => result.skills.includes(s));
    }
    result.categories = categories;
  }

  // Enforce minimum (3 skills)
  if (result.skills.length < MIN_SKILLS) {
    // Add default skills to reach minimum
    const defaultSkills = [
      'bug_triage_skill',
      'code_review_skill',
      'documentation_skill'
    ];
    
    for (const skill of defaultSkills) {
      if (result.skills.length >= MIN_SKILLS) break;
      if (!result.skills.includes(skill)) {
        result.skills.push(skill);
        result.categories.operational.push(skill);
      }
    }
    
    result.min_enforced = true;
  }

  return result;
}

// ============================================================================
// SKILL COMBINATION VALIDATOR
// ============================================================================

/**
 * Validate skill combination for coherence and conflicts
 * 
 * @param {Array} skills - Array of skill IDs to validate
 * @returns {Object} Validation result: { valid, conflicts, warnings, prerequisites }
 */
function validateSkillCombination(skills) {
  const result = {
    valid: true,
    conflicts: [],
    warnings: [],
    prerequisites: [],
    redundant: []
  };

  // Check for conflicts
  for (const [skillA, skillB] of SKILL_CONFLICTS) {
    if (skills.includes(skillA) && skills.includes(skillB)) {
      result.conflicts.push({
        skills: [skillA, skillB],
        reason: `Incompatible skills: ${skillA} conflicts with ${skillB}`
      });
      result.valid = false;
    }
  }

  // Check prerequisites
  for (const [skill, prereqs] of Object.entries(SKILL_PREREQUISITES)) {
    if (skills.includes(skill)) {
      for (const prereq of prereqs) {
        if (!skills.includes(prereq)) {
          result.prerequisites.push({
            skill,
            missing: prereq,
            message: `${skill} requires ${prereq}`
          });
          result.warnings.push(`Missing prerequisite: ${prereq} for ${skill}`);
        }
      }
    }
  }

  // Check for redundant skills
  const redundantPairs = [
    ['unit_testing_skill', 'integration_testing_skill'],
    ['laravel_11_structure_skill_v2', 'express_js_architecture_skill']
  ];

  for (const [skillA, skillB] of redundantPairs) {
    if (skills.includes(skillA) && skills.includes(skillB)) {
      result.redundant.push({
        skills: [skillA, skillB],
        reason: 'Potentially redundant skills detected',
        recommendation: 'Consider using only one'
      });
      result.warnings.push(`Redundant: ${skillA} and ${skillB}`);
    }
  }

  return result;
}

/**
 * Detect and resolve skill conflicts
 * 
 * @param {Array} skills - Array of skill IDs
 * @param {Object} context - Context for resolution
 * @returns {Object} Resolution result: { resolved_skills, removed, reason }
 */
function resolveSkillConflicts(skills, context) {
  const validation = validateSkillCombination(skills);
  
  if (validation.valid) {
    return {
      resolved_skills: skills,
      removed: [],
      reason: 'No conflicts detected'
    };
  }

  const resolvedSkills = [...skills];
  const removed = [];

  // Remove conflicting skills (keep higher priority)
  for (const conflict of validation.conflicts) {
    const [skillA, skillB] = conflict.skills;
    
    // Priority: keep skill that matches context better
    const keepSkill = determinePrioritySkill(skillA, skillB, context);
    const removeSkill = keepSkill === skillA ? skillB : skillA;
    
    const index = resolvedSkills.indexOf(removeSkill);
    if (index > -1) {
      resolvedSkills.splice(index, 1);
      removed.push({
        skill: removeSkill,
        reason: `Conflict with ${keepSkill}`
      });
    }
  }

  return {
    resolved_skills: resolvedSkills,
    removed,
    reason: `Resolved ${validation.conflicts.length} conflict(s)`
  };
}

/**
 * Determine which skill has higher priority
 * 
 * @param {string} skillA - First skill
 * @param {string} skillB - Second skill
 * @param {Object} context - Context for decision
 * @returns {string} Skill to keep
 */
function determinePrioritySkill(skillA, skillB, context) {
  // Security skills always have priority
  if (skillA.includes('security') || skillA.includes('auth')) return skillA;
  if (skillB.includes('security') || skillB.includes('auth')) return skillB;

  // Stack skills have priority over architecture
  if (skillA.includes('laravel') || skillA.includes('nextjs')) return skillA;
  if (skillB.includes('laravel') || skillB.includes('nextjs')) return skillB;

  // Default: keep first skill
  return skillA;
}

// ============================================================================
// MULTI-SKILL CONTEXT ASSEMBLY
// ============================================================================

/**
 * Assemble unified context from multiple active skills
 * 
 * @param {Array} skills - Array of activated skills
 * @param {Object} baseContext - Base context object
 * @returns {Object} Unified context with merged skill contexts
 */
function assembleSkillContext(skills, baseContext) {
  const unifiedContext = {
    ...baseContext,
    skill_contexts: {},
    merged_context: {},
    warnings: []
  };

  // Query each skill for its context requirements
  for (const skill of skills) {
    const skillContext = getSkillContext(skill);
    unifiedContext.skill_contexts[skill] = skillContext;
  }

  // Merge contexts with conflict resolution
  const merged = mergeContexts(unifiedContext.skill_contexts);
  unifiedContext.merged_context = merged.context;
  unifiedContext.warnings = merged.conflicts;

  // Check token budget
  const tokenEstimate = estimateContextTokens(unifiedContext.merged_context);
  if (tokenEstimate > 8000) { // 80% of 10k token limit
    unifiedContext.warnings.push(`Token budget warning: ${tokenEstimate} tokens estimated (80% limit: 8000)`);
  }

  return unifiedContext;
}

/**
 * Get context for a specific skill
 * 
 * @param {string} skill - Skill ID
 * @returns {Object} Skill context
 */
function getSkillContext(skill) {
  // Simplified skill context retrieval
  // In production, this would query the Skill Registry
  const contextTemplates = {
    'laravel_11_structure_skill_v2': {
      patterns: ['Service-Repository pattern', 'Form Request validation', 'Eloquent relationships'],
      conventions: ['app/Models', 'app/Http/Controllers', 'app/Http/Requests'],
      best_practices: ['Type hinting', 'Dependency injection', 'Test coverage']
    },
    'nextjs_app_router_skill': {
      patterns: ['Server Components', 'Client Components', 'Route Handlers'],
      conventions: ['app/', 'components/', 'lib/'],
      best_practices: ['Streaming', 'Suspense boundaries', 'Cache optimization']
    },
    'bug_triage_skill': {
      patterns: ['Reproduction steps', 'Expected vs actual', 'Environment details'],
      conventions: ['Issue templates', 'Bug severity classification'],
      best_practices: ['Minimal reproduction', 'Log collection', 'Screenshot attachment']
    },
    'api_design_skill': {
      patterns: ['RESTful endpoints', 'Resource naming', 'Versioning'],
      conventions: ['/api/v1/', 'JSON responses', 'HTTP status codes'],
      best_practices: ['Pagination', 'Filtering', 'Rate limiting']
    }
  };

  return contextTemplates[skill] || {
    patterns: [],
    conventions: [],
    best_practices: []
  };
}

/**
 * Merge multiple skill contexts
 * 
 * @param {Object} contexts - Object of skill contexts
 * @returns {Object} Merged context with conflicts
 */
function mergeContexts(contexts) {
  const merged = {
    patterns: [],
    conventions: [],
    best_practices: []
  };
  const conflicts = [];

  for (const [skill, context] of Object.entries(contexts)) {
    for (const [key, values] of Object.entries(context)) {
      if (Array.isArray(values)) {
        for (const value of values) {
          if (!merged[key].includes(value)) {
            merged[key].push(value);
          }
        }
      }
    }
  }

  // Detect conflicts (simplified)
  if (merged.patterns.includes('Server Components') && merged.patterns.includes('MVC pattern')) {
    conflicts.push('Pattern conflict: Server Components vs MVC');
  }

  return { context: merged, conflicts };
}

/**
 * Estimate token count for context
 * 
 * @param {Object} context - Context object
 * @returns {number} Estimated token count
 */
function estimateContextTokens(context) {
  let tokens = 0;
  
  for (const [key, values] of Object.entries(context)) {
    if (Array.isArray(values)) {
      tokens += values.join(' ').length / 4; // Rough estimate: 4 chars per token
    } else if (typeof values === 'string') {
      tokens += values.length / 4;
    }
  }
  
  return Math.round(tokens);
}

// ============================================================================
// SKILL ACTIVATION LOG
// ============================================================================

/**
 * Log skill activation to file
 * 
 * @param {Object} logEntry - Log entry from activateSkills
 * @param {string} logFilePath - Path to log file
 */
function logSkillActivation(logEntry, logFilePath) {
  try {
    let logData = { activations: [] };
    
    if (fs.existsSync(logFilePath)) {
      const content = fs.readFileSync(logFilePath, 'utf8');
      logData = JSON.parse(content);
    }

    logData.activations.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to log skill activation:', error.message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  activateSkills,
  validateSkillCombination,
  resolveSkillConflicts,
  assembleSkillContext,
  logSkillActivation,

  // Helpers
  selectStackSkills,
  selectArchitectureSkills,
  selectDomainSkills,
  selectOperationalSkills,
  selectConstraintSkills,
  enforceSkillLimits,
  getSkillContext,
  mergeContexts,
  estimateContextTokens,

  // Constants
  SKILL_CATEGORIES,
  SKILL_DEFINITIONS,
  SKILL_PREREQUISITES,
  SKILL_CONFLICTS,
  MIN_SKILLS,
  MAX_SKILLS,
  STACK_SKILL_MAP,
  ARCHETYPE_SKILL_MAP,
  TASK_TYPE_SKILL_MAP
};

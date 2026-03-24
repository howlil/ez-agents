#!/usr/bin/env node
'use strict';

/**
 * Context-Driven Skill Selection
 * 
 * Provides:
 * - Stack detection integration
 * - Archetype-based skill selection
 * - Mode and constraint filters
 * 
 * @module context-skill-selector
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Stack to skill mapping (12+ frameworks)
 */
const STACK_SKILL_MAP = {
  // Backend frameworks
  'Laravel': {
    skill: 'laravel_11_structure_skill_v2',
    category: 'stack',
    patterns: ['Service-Repository', 'Form Request', 'Eloquent ORM'],
    conventions: ['app/Models', 'app/Http/Controllers', 'resources/views']
  },
  'Next.js': {
    skill: 'nextjs_app_router_skill',
    category: 'stack',
    patterns: ['Server Components', 'Client Components', 'Route Handlers'],
    conventions: ['app/', 'components/', 'lib/']
  },
  'NestJS': {
    skill: 'nestjs_architecture_skill',
    category: 'stack',
    patterns: ['Modules', 'Controllers', 'Providers', 'Decorators'],
    conventions: ['src/modules', 'src/common', 'src/interfaces']
  },
  'FastAPI': {
    skill: 'fastapi_structure_skill',
    category: 'stack',
    patterns: ['Dependency Injection', 'Pydantic Models', 'Async Endpoints'],
    conventions: ['app/routers', 'app/models', 'app/schemas']
  },
  'Spring Boot': {
    skill: 'spring_boot_architecture_skill',
    category: 'stack',
    patterns: ['Dependency Injection', 'REST Controllers', 'JPA Repositories'],
    conventions: ['src/main/java', 'src/main/resources', 'src/test']
  },
  'Django': {
    skill: 'django_architecture_skill',
    category: 'stack',
    patterns: ['MTV Pattern', 'ORM', 'Class-Based Views'],
    conventions: ['apps/', 'templates/', 'static/']
  },
  'Express': {
    skill: 'express_js_architecture_skill',
    category: 'stack',
    patterns: ['Middleware', 'Route Handlers', 'Error Handling'],
    conventions: ['routes/', 'middleware/', 'controllers/']
  },
  
  // Frontend frameworks
  'React': {
    skill: 'react_architecture_skill',
    category: 'stack',
    patterns: ['Components', 'Hooks', 'Context API'],
    conventions: ['components/', 'hooks/', 'contexts/']
  },
  'Vue': {
    skill: 'vue_architecture_skill',
    category: 'stack',
    patterns: ['Composition API', 'Reactivity', 'Components'],
    conventions: ['components/', 'composables/', 'stores/']
  },
  'Angular': {
    skill: 'angular_architecture_skill',
    category: 'stack',
    patterns: ['Modules', 'Components', 'Services', 'Dependency Injection'],
    conventions: ['src/app/components', 'src/app/services', 'src/app/models']
  },
  'Svelte': {
    skill: 'svelte_architecture_skill',
    category: 'stack',
    patterns: ['Reactive Statements', 'Stores', 'Components'],
    conventions: ['components/', 'stores/', 'lib/']
  },
  'Flutter': {
    skill: 'flutter_architecture_skill',
    category: 'stack',
    patterns: ['Widgets', 'State Management', 'BLoC Pattern'],
    conventions: ['lib/widgets', 'lib/models', 'lib/providers']
  }
};

/**
 * Project archetype to domain skill mapping (8+ archetypes)
 */
const ARCHETYPE_SKILL_MAP = {
  'dashboard': {
    skills: ['dashboard_analytics_skill', 'ui_component_design_skill'],
    domain: 'Analytics',
    patterns: ['Data visualization', 'Real-time updates', 'Filtering']
  },
  'POS': {
    skills: ['pos_multi_branch_skill', 'inventory_management_skill'],
    domain: 'Retail',
    patterns: ['Multi-branch support', 'Inventory tracking', 'Sales processing']
  },
  'SaaS': {
    skills: ['multi_tenancy_architecture_skill', 'subscription_billing_skill'],
    domain: 'Software as a Service',
    patterns: ['Tenant isolation', 'Subscription management', 'Usage tracking']
  },
  'e-commerce': {
    skills: ['ecommerce_cart_skill', 'payment_gateway_skill'],
    domain: 'Retail',
    patterns: ['Shopping cart', 'Payment processing', 'Order management']
  },
  'LMS': {
    skills: ['lms_course_management_skill', 'progress_tracking_skill'],
    domain: 'Education',
    patterns: ['Course management', 'Student progress', 'Assessments']
  },
  'booking': {
    skills: ['booking_reservation_skill', 'calendar_management_skill'],
    domain: 'Services',
    patterns: ['Reservation system', 'Availability checking', 'Scheduling']
  },
  'fintech': {
    skills: ['fintech_compliance_skill', 'transaction_audit_skill'],
    domain: 'Finance',
    patterns: ['Compliance reporting', 'Transaction audit', 'Risk assessment']
  },
  'internal_tools': {
    skills: ['dashboard_analytics_skill', 'workflow_automation_skill'],
    domain: 'Enterprise',
    patterns: ['Admin panels', 'Data management', 'Workflow automation']
  },
  'ERP': {
    skills: ['erp_integration_skill', 'business_process_skill'],
    domain: 'Enterprise',
    patterns: ['Business processes', 'Module integration', 'Reporting']
  },
  'CMS': {
    skills: ['cms_content_management_skill', 'workflow_approval_skill'],
    domain: 'Content',
    patterns: ['Content creation', 'Approval workflows', 'Versioning']
  },
  'Medical': {
    skills: ['hipaa_compliance_skill', 'patient_records_skill'],
    domain: 'Healthcare',
    patterns: ['HIPAA compliance', 'Patient records', 'Appointment scheduling']
  },
  'Inventory': {
    skills: ['inventory_management_skill', 'supply_chain_skill'],
    domain: 'Logistics',
    patterns: ['Stock tracking', 'Reorder points', 'Supplier management']
  }
};

/**
 * Operational mode to skill adjustments
 */
const MODE_SKILL_ADJUSTMENTS = {
  'Greenfield': {
    add: ['modular_monolith_skill', 'api_design_skill'],
    remove: ['legacy_integration_skill'],
    priority: 'ideal_architecture'
  },
  'Brownfield': {
    add: ['legacy_integration_skill', 'refactor_planning_skill'],
    remove: [],
    priority: 'maintainability'
  },
  'MVP': {
    add: ['delivery_speed_skill', 'minimal_viable_skill'],
    remove: ['comprehensive_testing_skill', 'scalability_first_skill'],
    priority: 'delivery_speed'
  },
  'Scale-Up': {
    add: ['scaling_strategy_skill', 'performance_optimization_skill', 'caching_strategy_skill'],
    remove: ['minimal_viable_skill'],
    priority: 'security'
  },
  'Maintenance': {
    add: ['stability_first_skill', 'minimal_change_skill', 'regression_testing_skill'],
    remove: ['novelty_first_skill'],
    priority: 'maintainability'
  }
};

/**
 * Constraint to skill filter mapping
 */
const CONSTRAINT_SKILL_FILTER = {
  'deadline': {
    prioritize: ['delivery_speed_skill', 'minimal_viable_skill'],
    deprioritize: ['comprehensive_testing_skill', 'perfect_architecture_skill'],
    action: 'speed_up'
  },
  'compliance': {
    prioritize: ['gdpr_compliance_skill', 'security_testing_skill', 'audit_trail_skill'],
    deprioritize: ['delivery_speed_skill'],
    action: 'ensure_compliance'
  },
  'budget': {
    prioritize: ['budget_optimization_skill', 'cost_efficient_skill'],
    deprioritize: ['scalability_first_skill', 'premium_services_skill'],
    action: 'reduce_cost'
  },
  'security': {
    prioritize: ['security_testing_skill', 'authentication_architecture_skill', 'encryption_skill'],
    deprioritize: ['delivery_speed_skill'],
    action: 'ensure_security'
  },
  'legacy': {
    prioritize: ['legacy_integration_skill', 'migration_planning_skill'],
    deprioritize: ['greenfield_architecture_skill'],
    action: 'integrate_legacy'
  },
  'scalability': {
    prioritize: ['scaling_strategy_skill', 'microservices_architecture_skill', 'caching_strategy_skill'],
    deprioritize: ['monolith_architecture_skill'],
    action: 'design_for_scale'
  }
};

// ============================================================================
// STACK DETECTION INTEGRATION
// ============================================================================

/**
 * Integrate stack detection from Context Engine
 * 
 * @param {Object} context - Context object from Context Engine
 * @param {Array} context.stack - Detected tech stack
 * @param {Object} context.stackDetails - Detailed stack information
 * @returns {Object} Stack integration result: { skills, mappings, fallback }
 */
function integrateStackDetection(context) {
  const result = {
    skills: [],
    mappings: [],
    fallback: false,
    unrecognized: []
  };

  if (!context.stack || context.stack.length === 0) {
    result.fallback = true;
    result.skills.push('general_programming_skill');
    return result;
  }

  for (const stackItem of context.stack) {
    const mapping = STACK_SKILL_MAP[stackItem];
    
    if (mapping) {
      result.skills.push(mapping.skill);
      result.mappings.push({
        stack: stackItem,
        skill: mapping.skill,
        category: mapping.category,
        patterns: mapping.patterns,
        conventions: mapping.conventions
      });
    } else {
      result.unrecognized.push(stackItem);
    }
  }

  // Fallback for unrecognized stacks
  if (result.unrecognized.length > 0 && result.skills.length === 0) {
    result.fallback = true;
    result.skills.push('general_programming_skill');
  }

  return result;
}

/**
 * Get stack skill for a specific framework
 * 
 * @param {string} framework - Framework name
 * @returns {Object} Stack skill mapping or null
 */
function getStackSkill(framework) {
  return STACK_SKILL_MAP[framework] || null;
}

/**
 * Handle multi-stack projects
 * 
 * @param {Array} stack - Array of stack items
 * @returns {Object} Multi-stack result: { primary, secondary, skills }
 */
function handleMultiStack(stack) {
  if (!stack || stack.length === 0) {
    return { primary: null, secondary: [], skills: [] };
  }

  // Prioritize backend frameworks as primary
  const backendFrameworks = ['Laravel', 'Next.js', 'NestJS', 'FastAPI', 'Spring Boot', 'Django', 'Express'];
  const frontendFrameworks = ['React', 'Vue', 'Angular', 'Svelte', 'Flutter'];

  const primary = stack.find(item => backendFrameworks.includes(item)) || stack[0];
  const secondary = stack.filter(item => item !== primary);
  
  const skills = [];
  const primaryMapping = STACK_SKILL_MAP[primary];
  if (primaryMapping) {
    skills.push(primaryMapping.skill);
  }

  // Add secondary skills (limit to 2 for multi-stack)
  for (const item of secondary.slice(0, 2)) {
    const mapping = STACK_SKILL_MAP[item];
    if (mapping) {
      skills.push(mapping.skill);
    }
  }

  return { primary, secondary, skills };
}

// ============================================================================
// ARCHETYPE-BASED SKILL SELECTION
// ============================================================================

/**
 * Select skills based on project archetype
 * 
 * @param {string} archetype - Project archetype
 * @returns {Object} Archetype selection result: { skills, domain, patterns }
 */
function selectArchetypeSkills(archetype) {
  const mapping = ARCHETYPE_SKILL_MAP[archetype];
  
  if (!mapping) {
    return {
      skills: [],
      domain: 'Unknown',
      patterns: [],
      fallback: true
    };
  }

  return {
    skills: mapping.skills.slice(0, 2), // Limit to 2 domain skills
    domain: mapping.domain,
    patterns: mapping.patterns,
    fallback: false
  };
}

/**
 * Get all supported archetypes
 * 
 * @returns {Array} Array of supported archetype names
 */
function getSupportedArchetypes() {
  return Object.keys(ARCHETYPE_SKILL_MAP);
}

/**
 * Validate archetype and suggest closest match
 * 
 * @param {string} archetype - Archetype to validate
 * @returns {Object} Validation result: { valid, suggested, confidence }
 */
function validateArchetype(archetype) {
  const supported = getSupportedArchetypes();
  
  if (supported.includes(archetype)) {
    return { valid: true, suggested: archetype, confidence: 1.0 };
  }

  // Simple fuzzy match
  const archetypeLower = archetype.toLowerCase();
  for (const supportedArch of supported) {
    if (supportedArch.toLowerCase().includes(archetypeLower) || 
        archetypeLower.includes(supportedArch.toLowerCase())) {
      return { valid: false, suggested: supportedArch, confidence: 0.8 };
    }
  }

  return { valid: false, suggested: 'internal_tools', confidence: 0.5 };
}

// ============================================================================
// MODE AND CONSTRAINT FILTERS
// ============================================================================

/**
 * Apply mode-specific skill adjustments
 * 
 * @param {Array} baseSkills - Base skills from stack and archetype
 * @param {string} mode - Operational mode
 * @returns {Object} Adjusted skills result: { skills, added, removed, priority }
 */
function applyModeAdjustments(baseSkills, mode) {
  const adjustments = MODE_SKILL_ADJUSTMENTS[mode];
  
  if (!adjustments) {
    return {
      skills: baseSkills,
      added: [],
      removed: [],
      priority: 'maintainability',
      mode: mode || 'Unknown'
    };
  }

  let adjustedSkills = [...baseSkills];
  const added = [];
  const removed = [];

  // Add mode-specific skills
  for (const skill of adjustments.add) {
    if (!adjustedSkills.includes(skill)) {
      adjustedSkills.push(skill);
      added.push(skill);
    }
  }

  // Remove mode-specific skills
  for (const skill of adjustments.remove) {
    const index = adjustedSkills.indexOf(skill);
    if (index > -1) {
      adjustedSkills.splice(index, 1);
      removed.push(skill);
    }
  }

  return {
    skills: adjustedSkills,
    added,
    removed,
    priority: adjustments.priority,
    mode
  };
}

/**
 * Apply constraint filters to skill selection
 * 
 * @param {Array} skills - Current skills
 * @param {Array} constraints - Business constraints
 * @returns {Object} Filtered skills result: { skills, prioritized, deprioritized, actions }
 */
function applyConstraintFilters(skills, constraints) {
  if (!constraints || constraints.length === 0) {
    return {
      skills,
      prioritized: [],
      deprioritized: [],
      actions: []
    };
  }

  let filteredSkills = [...skills];
  const prioritized = [];
  const deprioritized = [];
  const actions = [];

  for (const constraint of constraints) {
    // Find matching constraint filter
    let constraintFilter = null;
    let matchedConstraint = null;

    for (const [key, filter] of Object.entries(CONSTRAINT_SKILL_FILTER)) {
      if (constraint.toLowerCase().includes(key)) {
        constraintFilter = filter;
        matchedConstraint = key;
        break;
      }
    }

    if (constraintFilter) {
      actions.push({
        constraint: matchedConstraint,
        original: constraint,
        action: constraintFilter.action
      });

      // Prioritize skills
      for (const skill of constraintFilter.prioritize) {
        if (!filteredSkills.includes(skill)) {
          filteredSkills.unshift(skill); // Add to front for priority
          prioritized.push(skill);
        }
      }

      // Deprioritize skills (mark for potential removal if over limit)
      for (const skill of constraintFilter.deprioritize) {
        if (filteredSkills.includes(skill)) {
          deprioritized.push(skill);
        }
      }
    }
  }

  return {
    skills: filteredSkills,
    prioritized,
    deprioritized,
    actions
  };
}

// ============================================================================
// CONTEXT-DRIVEN SKILL SELECTION (MAIN FUNCTION)
// ============================================================================

/**
 * Select skills based on full context (stack + archetype + mode + constraints)
 * 
 * @param {Object} context - Full context object
 * @param {Array} context.stack - Detected tech stack
 * @param {string} context.archetype - Project archetype
 * @param {string} context.mode - Operational mode
 * @param {Array} context.constraints - Business constraints
 * @param {Object} task - Task object
 * @param {string} task.type - Task type
 * @returns {Object} Selection result: { skills, breakdown, adjustments, log }
 */
function selectSkillsByContext(context, task) {
  const result = {
    skills: [],
    breakdown: {
      stack: [],
      archetype: [],
      mode: [],
      constraint: [],
      task: []
    },
    adjustments: {
      mode: null,
      constraint: null
    },
    log: {
      timestamp: new Date().toISOString(),
      task_id: task?.id || Date.now().toString(),
      context_summary: {}
    }
  };

  // Step 1: Stack-based skills
  const stackResult = integrateStackDetection(context);
  result.breakdown.stack = stackResult.skills;
  result.skills.push(...stackResult.skills);

  // Handle multi-stack
  if (context.stack && context.stack.length > 1) {
    const multiStackResult = handleMultiStack(context.stack);
    result.log.multi_stack = multiStackResult;
  }

  // Step 2: Archetype-based skills
  if (context.archetype) {
    const archetypeResult = selectArchetypeSkills(context.archetype);
    result.breakdown.archetype = archetypeResult.skills;
    
    // Add archetype skills that aren't already in stack skills
    for (const skill of archetypeResult.skills) {
      if (!result.skills.includes(skill)) {
        result.skills.push(skill);
      }
    }
  }

  // Step 3: Mode adjustments
  if (context.mode) {
    const modeResult = applyModeAdjustments(result.skills, context.mode);
    result.skills = modeResult.skills;
    result.adjustments.mode = {
      mode: context.mode,
      added: modeResult.added,
      removed: modeResult.removed,
      priority: modeResult.priority
    };
    result.breakdown.mode = modeResult.added;
  }

  // Step 4: Constraint filters
  if (context.constraints && context.constraints.length > 0) {
    const constraintResult = applyConstraintFilters(result.skills, context.constraints);
    result.skills = constraintResult.skills;
    result.adjustments.constraint = {
      constraints: context.constraints,
      prioritized: constraintResult.prioritized,
      deprioritized: constraintResult.deprioritized,
      actions: constraintResult.actions
    };
    result.breakdown.constraint = constraintResult.prioritized;
  }

  // Step 5: Task-type skills
  if (task?.type) {
    const taskSkills = getTaskTypeSkills(task.type);
    result.breakdown.task = taskSkills;
    
    for (const skill of taskSkills) {
      if (!result.skills.includes(skill)) {
        result.skills.push(skill);
      }
    }
  }

  // Enforce 3-7 skill limit
  result.skills = enforceSkillLimit(result.skills);

  // Create log entry
  result.log.context_summary = {
    stack_count: context.stack?.length || 0,
    archetype: context.archetype,
    mode: context.mode,
    constraints_count: context.constraints?.length || 0,
    final_skill_count: result.skills.length
  };

  return result;
}

/**
 * Get task-type skills
 * 
 * @param {string} taskType - Task type
 * @returns {Array} Task-type skills
 */
function getTaskTypeSkills(taskType) {
  const taskTypeSkillMap = {
    'feature': [],
    'bug': ['bug_triage_skill', 'regression_testing_skill'],
    'refactor': ['refactor_planning_skill', 'code_review_skill'],
    'migration': ['migration_planning_skill', 'rollback_planning_skill'],
    'incident': ['incident_handling_skill', 'rollback_planning_skill']
  };

  return taskTypeSkillMap[taskType] || [];
}

/**
 * Enforce 3-7 skill limit
 * 
 * @param {Array} skills - All skills
 * @returns {Array} Skills within limit
 */
function enforceSkillLimit(skills) {
  const MIN_SKILLS = 3;
  const MAX_SKILLS = 7;

  // Remove duplicates
  let result = [...new Set(skills)];

  // Enforce maximum
  if (result.length > MAX_SKILLS) {
    result = result.slice(0, MAX_SKILLS);
  }

  // Enforce minimum
  if (result.length < MIN_SKILLS) {
    const defaultSkills = ['bug_triage_skill', 'code_review_skill', 'documentation_skill'];
    for (const skill of defaultSkills) {
      if (result.length >= MIN_SKILLS) break;
      if (!result.includes(skill)) {
        result.push(skill);
      }
    }
  }

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  integrateStackDetection,
  selectArchetypeSkills,
  applyModeAdjustments,
  applyConstraintFilters,
  selectSkillsByContext,
  getTaskTypeSkills,
  enforceSkillLimit,

  // Helpers
  getStackSkill,
  handleMultiStack,
  getSupportedArchetypes,
  validateArchetype,

  // Constants
  STACK_SKILL_MAP,
  ARCHETYPE_SKILL_MAP,
  MODE_SKILL_ADJUSTMENTS,
  CONSTRAINT_SKILL_FILTER
};

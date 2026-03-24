#!/usr/bin/env node
'use strict';

/**
 * Skill Activation Engine
 *
 * Activates 3-7 skills per task based on context (stack, architecture, domain, operational, governance).
 * Enforces skill limits and priority-based capping.
 *
 * @module skill-activator
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Skill categories with priority weights
 * Higher priority = more likely to be retained when capping
 */
const SKILL_CATEGORIES = {
  STACK: { name: 'Stack', priority: 100, min: 1, max: 1 },
  ARCHITECTURE: { name: 'Architecture', priority: 90, min: 1, max: 2 },
  DOMAIN: { name: 'Domain', priority: 85, min: 1, max: 1 },
  OPERATIONAL: { name: 'Operational', priority: 70, min: 0, max: 2 },
  GOVERNANCE: { name: 'Governance', priority: 60, min: 0, max: 1 }
};

/**
 * Skill limits per operation mode
 */
const MODE_SKILL_LIMITS = {
  greenfield: 7,
  existing: 6,
  'rapid-mvp': 4,
  'scale-up': 6,
  maintenance: 5
};

/**
 * Skill registry cache
 */
let skillRegistryCache = null;

/**
 * Default skill mappings by context signals
 */
const CONTEXT_SKILL_MAP = {
  // Stack signals
  'laravel': 'laravel_11_structure_skill_v2',
  'laravel-11': 'laravel_11_structure_skill_v2',
  'nextjs': 'nextjs_app_router_skill',
  'next.js': 'nextjs_app_router_skill',
  'react': 'react_architecture_skill',
  'vue': 'vue_architecture_skill',
  'angular': 'angular_architecture_skill',
  'nestjs': 'nestjs_architecture_skill',
  'express': 'express_js_architecture_skill',
  'fastapi': 'fastapi_structure_skill',
  'spring-boot': 'spring_boot_architecture_skill',
  'django': 'django_architecture_skill',
  'docker': 'docker_containerization_skill',
  'kubernetes': 'kubernetes_orchestration_skill',
  'terraform': 'terraform_infrastructure_skill',

  // Architecture signals
  'monolith': 'monolith_architecture_skill',
  'modular-monolith': 'modular_monolith_skill',
  'microservices': 'microservices_architecture_skill',
  'event-driven': 'event_driven_architecture_skill',
  'repository-pattern': 'repository_pattern_skill',
  'service-layer': 'service_layer_pattern_skill',

  // Domain signals
  'saas': 'saas_multi_tenant_skill',
  'ecommerce': 'ecommerce_architecture_skill',
  'fintech': 'fintech_architecture_skill',
  'dashboard': 'dashboard_layout_skill',
  'payment': 'payment_processing_skill',

  // Operational signals
  'testing': 'testing_strategy_skill',
  'debugging': 'debugging_backend_skill',
  'refactoring': 'refactor_planning_skill',

  // Governance signals
  'security': 'security_architecture_skill',
  'accessibility': 'accessibility_wcag_skill',
  'compliance': 'compliance_automation_skill'
};

// ============================================================================
// SKILL ACTIVATION
// ============================================================================

/**
 * Activate 3-7 skills for a task based on context
 *
 * @param {string} agentType - Agent type (e.g., 'ez-backend-agent')
 * @param {Object} task - Task description
 * @param {Object} context - Task context
 * @param {Object} context.stack - Stack info { language, framework, version }
 * @param {Object} context.architecture - Architecture type
 * @param {Object} context.domain - Domain type
 * @param {Object} context.mode - Operation mode (greenfield, existing, etc.)
 * @param {Object} context.constraints - Task constraints
 * @returns {Object} Activation result: { skills, activationLog, confidence }
 */
function activateSkills(agentType, task, context = {}) {
  const { stack, architecture, domain, mode, constraints } = context;
  const skills = [];
  const activationLog = {
    taskId: task.id || generateTaskId(),
    agent: agentType,
    timestamp: new Date().toISOString(),
    context: {
      stack: stack?.framework || stack?.language || 'unknown',
      architecture: architecture || 'unknown',
      domain: domain || 'unknown',
      mode: mode || 'greenfield'
    },
    activations: []
  };

  // 1. Get agent mandatory skills
  const agentSkills = getAgentMandatorySkills(agentType);
  skills.push(...agentSkills.map(s => ({
    ...s,
    category: categorizeSkill(s.name),
    reason: 'Agent mandatory skill'
  })));

  // 2. Add context-based skills (stack, architecture, domain)
  if (stack) {
    const stackSkills = matchStackSkills(stack);
    skills.push(...stackSkills.map(s => ({
      ...s,
      category: 'Stack',
      reason: 'Stack context match'
    })));
  }

  if (architecture) {
    const archSkills = matchArchitectureSkills(architecture);
    skills.push(...archSkills.map(s => ({
      ...s,
      category: 'Architecture',
      reason: 'Architecture context match'
    })));
  }

  if (domain) {
    const domainSkills = matchDomainSkills(domain);
    skills.push(...domainSkills.map(s => ({
      ...s,
      category: 'Domain',
      reason: 'Domain context match'
    })));
  }

  // 3. Add task-specific skills (from task keywords)
  const taskSkills = extractTaskSkills(task.description || '');
  skills.push(...taskSkills.map(s => ({
    ...s,
    category: categorizeSkill(s.name),
    reason: 'Task keyword match'
  })));

  // 4. Add operational skills if needed
  if (constraints && (constraints.deadline || constraints.teamSize)) {
    const operationalSkills = matchOperationalSkills(constraints);
    skills.push(...operationalSkills.map(s => ({
      ...s,
      category: 'Operational',
      reason: 'Constraint-based activation'
    })));
  }

  // 5. Enforce 3-7 limit based on mode
  const maxSkills = MODE_SKILL_LIMITS[mode] || MODE_SKILL_LIMITS.greenfield;
  const limitedSkills = enforceLimits(skills, maxSkills);

  // 6. Ensure minimum 3 skills (pad with operational if needed)
  const finalSkills = ensureMinimumSkills(limitedSkills);

  // 7. Log activations
  for (const skill of finalSkills) {
    activationLog.activations.push({
      skillId: skill.name,
      category: skill.category,
      reason: skill.reason,
      confidence: skill.confidence || 0.9
    });
  }

  // 8. Calculate confidence score
  const confidence = calculateActivationConfidence(finalSkills, context);

  return {
    skills: finalSkills,
    activationLog,
    confidence,
    skillCount: finalSkills.length
  };
}

/**
 * Enforce skill limits (3-7 per task)
 *
 * @param {Array} skills - Array of skill objects
 * @param {number} maxSkills - Maximum skills allowed
 * @returns {Array} Limited skill array
 */
function enforceLimits(skills, maxSkills = 7) {
  if (skills.length <= maxSkills) {
    return skills;
  }

  // Group by category
  const byCategory = {};
  for (const skill of skills) {
    const category = skill.category || 'Operational';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(skill);
  }

  // Sort by priority (Stack > Architecture > Domain > Operational > Governance)
  const priorityOrder = ['Stack', 'Architecture', 'Domain', 'Operational', 'Governance'];
  const result = [];

  for (const category of priorityOrder) {
    const categorySkills = byCategory[category] || [];

    // Apply category limits
    const categoryConfig = SKILL_CATEGORIES[category.toUpperCase()];
    const maxForCategory = categoryConfig ? categoryConfig.max : 2;

    // Sort by confidence within category
    categorySkills.sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5));

    // Add top skills from this category
    const toAdd = categorySkills.slice(0, maxForCategory);
    result.push(...toAdd);

    // Check if we've reached the overall limit
    if (result.length >= maxSkills) {
      break;
    }
  }

  return result.slice(0, maxSkills);
}

/**
 * Ensure minimum 3 skills (pad with operational if needed)
 *
 * @param {Array} skills - Array of skill objects
 * @returns {Array} Skill array with at least 3 skills
 */
function ensureMinimumSkills(skills) {
  if (skills.length >= 3) {
    return skills;
  }

  // Pad with operational skills
  const operationalSkills = [
    { name: 'testing_strategy_skill', category: 'Operational', confidence: 0.7 },
    { name: 'debugging_backend_skill', category: 'Operational', confidence: 0.7 },
    { name: 'documentation_structure_skill', category: 'Operational', confidence: 0.6 }
  ];

  const existingSkillNames = new Set(skills.map(s => s.name));
  const padding = operationalSkills.filter(s => !existingSkillNames.has(s.name));

  return [...skills, ...padding].slice(0, 3);
}

/**
 * Get mandatory skills for agent type
 *
 * @param {string} agentType - Agent type
 * @returns {Array} Mandatory skills for agent
 */
function getAgentMandatorySkills(agentType) {
  const agentSkillMap = {
    'ez-architect-agent': [
      { name: 'architecture_documentation_skill', confidence: 0.95 },
      { name: 'tech_debt_analysis_skill', confidence: 0.9 }
    ],
    'ez-backend-agent': [
      { name: 'api_design_rest_skill', confidence: 0.95 },
      { name: 'testing_unit_skill', confidence: 0.9 }
    ],
    'ez-frontend-agent': [
      { name: 'component_composition_skill', confidence: 0.95 },
      { name: 'state_management_skill', confidence: 0.9 }
    ],
    'ez-qa-agent': [
      { name: 'testing_strategy_skill', confidence: 0.95 },
      { name: 'quality_gates_skill', confidence: 0.9 }
    ],
    'ez-devops-agent': [
      { name: 'cicd_pipeline_architecture_skill', confidence: 0.95 },
      { name: 'monitoring_prometheus_skill', confidence: 0.9 }
    ],
    'ez-context-manager': [
      { name: 'traceability_matrix_skill', confidence: 0.95 },
      { name: 'knowledge_management_skill', confidence: 0.9 }
    ]
  };

  return agentSkillMap[agentType] || [];
}

/**
 * Match stack skills from context
 *
 * @param {Object} stack - Stack context { language, framework, version }
 * @returns {Array} Matched stack skills
 */
function matchStackSkills(stack) {
  const skills = [];
  const framework = stack?.framework?.toLowerCase() || stack?.language?.toLowerCase() || '';

  // Direct match
  if (CONTEXT_SKILL_MAP[framework]) {
    skills.push({
      name: CONTEXT_SKILL_MAP[framework],
      confidence: 0.95
    });
  }

  // Partial match
  for (const [key, skillId] of Object.entries(CONTEXT_SKILL_MAP)) {
    if (framework.includes(key) && !skills.find(s => s.name === skillId)) {
      skills.push({ name: skillId, confidence: 0.85 });
    }
  }

  return skills;
}

/**
 * Match architecture skills from context
 *
 * @param {string} architecture - Architecture type
 * @returns {Array} Matched architecture skills
 */
function matchArchitectureSkills(architecture) {
  const skills = [];
  const arch = architecture?.toLowerCase() || '';

  if (CONTEXT_SKILL_MAP[arch]) {
    skills.push({
      name: CONTEXT_SKILL_MAP[arch],
      confidence: 0.9
    });
  }

  // Add pattern skills based on architecture
  if (arch.includes('monolith')) {
    skills.push({ name: 'modular_monolith_skill', confidence: 0.85 });
  }
  if (arch.includes('microservice')) {
    skills.push({ name: 'microservices_architecture_skill', confidence: 0.9 });
  }

  return skills;
}

/**
 * Match domain skills from context
 *
 * @param {string} domain - Domain type
 * @returns {Array} Matched domain skills
 */
function matchDomainSkills(domain) {
  const skills = [];
  const d = domain?.toLowerCase() || '';

  if (CONTEXT_SKILL_MAP[d]) {
    skills.push({
      name: CONTEXT_SKILL_MAP[d],
      confidence: 0.9
    });
  }

  // Add related domain skills
  if (d.includes('ecommerce') || d.includes('commerce')) {
    skills.push({ name: 'ecommerce_product_catalog_skill', confidence: 0.85 });
  }
  if (d.includes('fintech') || d.includes('finance') || d.includes('payment')) {
    skills.push({ name: 'payment_processing_skill', confidence: 0.85 });
  }
  if (d.includes('saas')) {
    skills.push({ name: 'saas_multi_tenant_skill', confidence: 0.9 });
  }

  return skills;
}

/**
 * Match operational skills from constraints
 *
 * @param {Object} constraints - Task constraints
 * @returns {Array} Matched operational skills
 */
function matchOperationalSkills(constraints) {
  const skills = [];

  if (constraints.deadline) {
    const deadlineWeeks = parseInt(constraints.deadline) || 4;
    if (deadlineWeeks <= 2) {
      skills.push({ name: 'rapid_delivery_skill', confidence: 0.8 });
    }
  }

  if (constraints.teamSize && constraints.teamSize <= 2) {
    skills.push({ name: 'small_team_optimization_skill', confidence: 0.75 });
  }

  if (constraints.legacySystems) {
    skills.push({ name: 'legacy_integration_skill', confidence: 0.85 });
  }

  return skills;
}

/**
 * Extract skills from task description keywords
 *
 * @param {string} description - Task description
 * @returns {Array} Extracted skills
 */
function extractTaskSkills(description) {
  const skills = [];
  const desc = description.toLowerCase();

  // Authentication keywords
  if (desc.includes('auth') || desc.includes('login') || desc.includes('jwt')) {
    skills.push({ name: 'authentication_jwt_skill', confidence: 0.85 });
  }

  // API keywords
  if (desc.includes('api') || desc.includes('endpoint') || desc.includes('rest')) {
    skills.push({ name: 'api_design_rest_skill', confidence: 0.8 });
  }

  // Testing keywords
  if (desc.includes('test') || desc.includes('spec')) {
    skills.push({ name: 'testing_unit_skill', confidence: 0.8 });
  }

  // Database keywords
  if (desc.includes('database') || desc.includes('schema') || desc.includes('model')) {
    skills.push({ name: 'database_design_skill', confidence: 0.75 });
  }

  // Performance keywords
  if (desc.includes('performance') || desc.includes('optimize') || desc.includes('cache')) {
    skills.push({ name: 'caching_strategy_skill', confidence: 0.8 });
  }

  return skills;
}

/**
 * Categorize skill by name
 *
 * @param {string} skillName - Skill name
 * @returns {string} Skill category
 */
function categorizeSkill(skillName) {
  const name = skillName.toLowerCase();

  if (name.includes('laravel') || name.includes('nextjs') || name.includes('react') ||
      name.includes('vue') || name.includes('angular') || name.includes('nestjs') ||
      name.includes('docker') || name.includes('kubernetes')) {
    return 'Stack';
  }

  if (name.includes('architecture') || name.includes('pattern') || name.includes('monolith') ||
      name.includes('microservice') || name.includes('repository') || name.includes('service_layer')) {
    return 'Architecture';
  }

  if (name.includes('ecommerce') || name.includes('saas') || name.includes('fintech') ||
      name.includes('payment') || name.includes('dashboard')) {
    return 'Domain';
  }

  if (name.includes('testing') || name.includes('debugging') || name.includes('refactor') ||
      name.includes('documentation')) {
    return 'Operational';
  }

  if (name.includes('security') || name.includes('accessibility') || name.includes('compliance') ||
      name.includes('governance')) {
    return 'Governance';
  }

  return 'Operational'; // Default
}

/**
 * Calculate activation confidence score
 *
 * @param {Array} skills - Activated skills
 * @param {Object} context - Task context
 * @returns {number} Confidence score (0-1)
 */
function calculateActivationConfidence(skills, context) {
  if (skills.length === 0) return 0;

  const avgConfidence = skills.reduce((sum, s) => sum + (s.confidence || 0.5), 0) / skills.length;

  // Boost for having skills from multiple categories
  const categories = new Set(skills.map(s => s.category));
  const categoryBonus = Math.min(categories.size / 5, 0.2); // Max 0.2 bonus

  // Boost for matching all context signals
  let contextMatchBonus = 0;
  if (context.stack) contextMatchBonus += 0.05;
  if (context.architecture) contextMatchBonus += 0.05;
  if (context.domain) contextMatchBonus += 0.05;

  return Math.min(avgConfidence + categoryBonus + contextMatchBonus, 1.0);
}

/**
 * Generate unique task ID
 *
 * @returns {string} Task ID
 */
function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log skill activation to file
 *
 * @param {Object} activationLog - Activation log object
 * @param {string} logFile - Log file path
 */
function logSkillActivation(activationLog, logFile = null) {
  const logEntry = {
    timestamp: activationLog.timestamp,
    taskId: activationLog.taskId,
    agent: activationLog.agent,
    skillCount: activationLog.activations.length,
    skills: activationLog.activations.map(a => a.skillId).join(', '),
    context: activationLog.context
  };

  // In a real implementation, this would append to a log file
  // For now, we just return the log entry
  return logEntry;
}

/**
 * Get skill activation log format
 *
 * @returns {Object} Log format schema
 */
function getActivationLogFormat() {
  return {
    taskId: 'string',
    agent: 'string',
    timestamp: 'ISO 8601',
    context: {
      stack: 'string',
      architecture: 'string',
      domain: 'string',
      mode: 'string'
    },
    activations: [
      {
        skillId: 'string',
        category: 'string',
        reason: 'string',
        confidence: 'number (0-1)'
      }
    ]
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main function
  activateSkills,

  // Helpers
  enforceLimits,
  ensureMinimumSkills,
  getAgentMandatorySkills,
  matchStackSkills,
  matchArchitectureSkills,
  matchDomainSkills,
  matchOperationalSkills,
  extractTaskSkills,
  categorizeSkill,
  calculateActivationConfidence,
  generateTaskId,
  logSkillActivation,
  getActivationLogFormat,

  // Constants
  SKILL_CATEGORIES,
  MODE_SKILL_LIMITS,
  CONTEXT_SKILL_MAP
};

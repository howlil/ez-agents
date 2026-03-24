#!/usr/bin/env node
'use strict';

/**
 * Skill Handoff Protocol
 *
 * Implements skill handoff protocol that transfers skills and context between agents
 * for continuity during sequential task execution.
 *
 * @module skill-handoff
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Handoff types
 */
const HANDOFF_TYPES = {
  SEQUENTIAL: 'sequential',    // Architect → Backend → Frontend → QA
  PARALLEL: 'parallel',        // Backend + Frontend work on same feature
  INTERRUPTED: 'interrupted'   // Agent A stops, Agent B continues (recovery)
};

/**
 * Handoff status
 */
const HANDOFF_STATUS = {
  READY: 'ready-for-handoff',
  PENDING: 'pending',
  BLOCKED: 'blocked',
  COMPLETED: 'completed'
};

/**
 * Skill memory storage key
 */
const SKILL_MEMORY_KEY = 'skill-memory';

// ============================================================================
// HANDOFF FUNCTIONS
// ============================================================================

/**
 * Create handoff record for transferring skills and context between agents
 *
 * @param {string} fromAgent - Source agent name
 * @param {string} toAgent - Target agent name
 * @param {Object} task - Task object
 * @param {Object} context - Context object
 * @returns {Object} Handoff record
 */
function createHandoff(fromAgent, toAgent, task, context) {
  const handoff = {
    id: generateHandoffId(),
    fromAgent: fromAgent,
    toAgent: toAgent,
    phase: context.phase || 'unknown',
    task: {
      id: task.id || generateTaskId(),
      description: task.description || '',
      type: task.type || 'unknown'
    },
    timestamp: new Date().toISOString(),
    context: {
      projectState: context.projectState || 'STATE.md snapshot',
      decisionsMade: context.decisionsMade || [],
      skillsActive: context.skillsActive || [],
      artifactsProduced: context.artifactsProduced || []
    },
    continuityRequirements: {
      mustMaintain: context.mustMaintain || [],
      mustNotChange: context.mustNotChange || [],
      mustValidate: context.mustValidate || []
    },
    checkpoint: {
      type: context.checkpointType || HANDOFF_TYPES.SEQUENTIAL,
      status: HANDOFF_STATUS.READY,
      verification: context.verification || {}
    },
    skillTransfer: {
      inherited: context.skillsActive || [],
      recommended: getRecommendedSkills(toAgent, context),
      consistent: getConsistentSkills(context.projectId, context.skillsActive)
    }
  };

  return handoff;
}

/**
 * Transfer skills with context from one agent to another
 *
 * @param {Array} skills - Skills to transfer
 * @param {Object} context - Context object
 * @returns {Object} Transfer result
 */
function transferSkills(skills, context) {
  const transfer = {
    timestamp: new Date().toISOString(),
    fromAgent: context.fromAgent,
    toAgent: context.toAgent,
    skillsTransferred: skills.map(s => ({
      id: s.name || s,
      category: s.category || categorizeSkill(s),
      inherited: true,
      context: {
        phase: context.phase,
        task: context.taskId,
        rationale: s.reason || 'Continuity from previous agent'
      }
    })),
    continuityRequirements: {
      mustMaintain: context.mustMaintain || [],
      mustNotChange: context.mustNotChange || []
    },
    skillMemory: {
      recorded: true,
      projectId: context.projectId,
      totalSkills: skills.length
    }
  };

  return transfer;
}

/**
 * Get skills used in project (skill memory)
 *
 * @param {string} projectId - Project ID
 * @returns {Array} Project skills history
 */
function getSkillMemory(projectId) {
  // In a real implementation, this would load from STATE.md
  // For now, return a mock structure
  return {
    projectId: projectId,
    skills: [],
    phases: [],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Record skill usage for memory tracking
 *
 * @param {string} phase - Phase identifier
 * @param {Object} task - Task object
 * @param {Array} skills - Skills used
 * @returns {Object} Record object
 */
function recordSkillUsage(phase, task, skills) {
  const record = {
    id: generateRecordId(),
    phase: phase,
    task: {
      id: task.id || generateTaskId(),
      description: task.description || ''
    },
    skills: skills.map(s => ({
      id: s.name || s,
      category: categorizeSkill(s),
      version: s.version || 'v1'
    })),
    timestamp: new Date().toISOString(),
    agent: task.assignedAgent || 'unknown'
  };

  return record;
}

/**
 * Get consistent skills for a category (skills used in previous phases)
 *
 * @param {string} projectId - Project ID
 * @param {string} skillCategory - Skill category to query
 * @returns {Array} Consistent skills
 */
function getConsistentSkills(projectId, skillCategory) {
  // In a real implementation, this would query STATE.md skill-memory
  // For now, return mock consistent skills based on category
  const consistentSkillsMap = {
    'Stack': ['laravel_11_structure_skill_v2', 'nextjs_app_router_skill'],
    'Architecture': ['modular_monolith_skill', 'repository_pattern_skill'],
    'Domain': ['saas_multi_tenant_skill', 'ecommerce_architecture_skill'],
    'Operational': ['testing_strategy_skill', 'documentation_structure_skill'],
    'Governance': ['security_architecture_skill', 'accessibility_wcag_skill']
  };

  return consistentSkillsMap[skillCategory] || [];
}

/**
 * Get recommended skills for an agent based on context
 *
 * @param {string} agentType - Target agent type
 * @param {Object} context - Context object
 * @returns {Array} Recommended skills
 */
function getRecommendedSkills(agentType, context) {
  const agentSkillRecommendations = {
    'ez-architect-agent': [
      'architecture_documentation_skill',
      'tech_debt_analysis_skill',
      'modular_monolith_skill'
    ],
    'ez-backend-agent': [
      'api_design_rest_skill',
      'repository_pattern_skill',
      'testing_unit_skill'
    ],
    'ez-frontend-agent': [
      'component_composition_skill',
      'state_management_skill',
      'accessibility_wcag_skill'
    ],
    'ez-qa-agent': [
      'testing_strategy_skill',
      'quality_gates_skill',
      'api_testing_skill'
    ],
    'ez-devops-agent': [
      'cicd_pipeline_architecture_skill',
      'docker_containerization_skill',
      'monitoring_prometheus_skill'
    ],
    'ez-context-manager': [
      'traceability_matrix_skill',
      'knowledge_management_skill',
      'documentation_structure_skill'
    ]
  };

  const baseSkills = agentSkillRecommendations[agentType] || [];

  // Add domain-specific skills from context
  if (context.domain) {
    const domainSkills = getDomainSkills(context.domain);
    baseSkills.push(...domainSkills);
  }

  return [...new Set(baseSkills)]; // Deduplicate
}

/**
 * Get domain-specific skills
 *
 * @param {string} domain - Domain type
 * @returns {Array} Domain skills
 */
function getDomainSkills(domain) {
  const domainSkillMap = {
    'saas': ['saas_multi_tenant_skill'],
    'ecommerce': ['ecommerce_product_catalog_skill'],
    'fintech': ['payment_processing_skill', 'fintech_compliance_skill'],
    'dashboard': ['dashboard_layout_skill', 'data_visualization_skill']
  };

  return domainSkillMap[domain.toLowerCase()] || [];
}

/**
 * Categorize skill by name
 *
 * @param {string|Object} skill - Skill name or object
 * @returns {string} Skill category
 */
function categorizeSkill(skill) {
  const name = typeof skill === 'string' ? skill : (skill.name || '');
  const nameLower = name.toLowerCase();

  if (nameLower.includes('laravel') || nameLower.includes('nextjs') ||
      nameLower.includes('react') || nameLower.includes('vue') ||
      nameLower.includes('docker') || nameLower.includes('kubernetes')) {
    return 'Stack';
  }

  if (nameLower.includes('architecture') || nameLower.includes('pattern') ||
      nameLower.includes('monolith') || nameLower.includes('microservice') ||
      nameLower.includes('repository') || nameLower.includes('composition')) {
    return 'Architecture';
  }

  if (nameLower.includes('ecommerce') || nameLower.includes('saas') ||
      nameLower.includes('fintech') || nameLower.includes('payment') ||
      nameLower.includes('dashboard')) {
    return 'Domain';
  }

  if (nameLower.includes('testing') || nameLower.includes('debugging') ||
      nameLower.includes('documentation') || nameLower.includes('refactor')) {
    return 'Operational';
  }

  if (nameLower.includes('security') || nameLower.includes('accessibility') ||
      nameLower.includes('compliance') || nameLower.includes('governance')) {
    return 'Governance';
  }

  return 'Operational'; // Default
}

/**
 * Validate handoff completeness
 *
 * @param {Object} handoff - Handoff record
 * @returns {Object} Validation result
 */
function validateHandoff(handoff) {
  const violations = [];
  const warnings = [];

  // Check required fields
  if (!handoff.fromAgent) {
    violations.push('Missing fromAgent');
  }
  if (!handoff.toAgent) {
    violations.push('Missing toAgent');
  }
  if (!handoff.context.skillsActive || handoff.context.skillsActive.length === 0) {
    warnings.push('No active skills transferred');
  }
  if (!handoff.context.artifactsProduced || handoff.context.artifactsProduced.length === 0) {
    warnings.push('No artifacts listed');
  }

  // Check continuity requirements
  if (!handoff.continuityRequirements.mustMaintain ||
      handoff.continuityRequirements.mustMaintain.length === 0) {
    warnings.push('No continuity requirements specified');
  }

  // Check checkpoint status
  if (handoff.checkpoint.status !== HANDOFF_STATUS.READY) {
    violations.push(`Handoff not ready: ${handoff.checkpoint.status}`);
  }

  return {
    valid: violations.length === 0,
    violations,
    warnings,
    readyForHandoff: violations.length === 0
  };
}

/**
 * Generate handoff report in markdown format
 *
 * @param {Object} handoff - Handoff record
 * @returns {string} Markdown formatted report
 */
function generateHandoffReport(handoff) {
  const lines = [
    '## Skill Handoff Record',
    '',
    `**From Agent:** ${handoff.fromAgent}`,
    `**To Agent:** ${handoff.toAgent}`,
    `**Phase:** ${handoff.phase}`,
    `**Task:** ${handoff.task.id}`,
    `**Timestamp:** ${handoff.timestamp}`,
    '',
    '### Context Transferred',
    '',
    `- **Project State:** ${handoff.context.projectState}`,
    `- **Decisions Made:** ${handoff.context.decisionsMade.length} decisions`,
    `- **Skills Active:** ${handoff.context.skillsActive.length} skills`,
    `- **Artifacts Produced:** ${handoff.context.artifactsProduced.length} artifacts`,
    '',
    '### Continuity Requirements',
    '',
    `- **Must Maintain:** ${handoff.continuityRequirements.mustMaintain.join(', ') || 'None specified'}`,
    `- **Must Not Change:** ${handoff.continuityRequirements.mustNotChange.join(', ') || 'None specified'}`,
    `- **Must Validate:** ${handoff.continuityRequirements.mustValidate.join(', ') || 'None specified'}`,
    '',
    '### Handoff Checkpoint',
    '',
    `**Type:** ${handoff.checkpoint.type}`,
    `**Status:** ${handoff.checkpoint.status}`,
    '',
    '### Skill Transfer',
    '',
    `- **Inherited Skills:** ${handoff.skillTransfer.inherited.length}`,
    `- **Recommended Skills:** ${handoff.skillTransfer.recommended.length}`,
    `- **Consistent Skills:** ${handoff.skillTransfer.consistent.length}`
  ];

  return lines.join('\n');
}

/**
 * Generate unique handoff ID
 *
 * @returns {string} Handoff ID
 */
function generateHandoffId() {
  return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique record ID
 *
 * @returns {string} Record ID
 */
function generateRecordId() {
  return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique task ID
 *
 * @returns {string} Task ID
 */
function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  createHandoff,
  transferSkills,
  getSkillMemory,
  recordSkillUsage,
  getConsistentSkills,

  // Helpers
  getRecommendedSkills,
  getDomainSkills,
  categorizeSkill,
  validateHandoff,
  generateHandoffReport,
  generateHandoffId,
  generateRecordId,
  generateTaskId,

  // Constants
  HANDOFF_TYPES,
  HANDOFF_STATUS,
  SKILL_MEMORY_KEY
};

#!/usr/bin/env node
'use strict';

/**
 * Agent Pool Registry
 *
 * Provides:
 * - Agent registry for querying and assigning agents based on task requirements
 * - Dynamic loading of agent definitions from agents/*.md files
 * - Backward compatibility with existing agent names
 *
 * @module agent-pool
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Specialist agent definitions
 */
const SPECIALIST_AGENTS = {
  'ez-architect-agent': {
    name: 'ez-architect-agent',
    displayName: 'Architect Agent',
    description: 'System design, architecture patterns, tech debt analysis, and API contract specialist',
    responsibilities: [
      'System Architecture Design',
      'API Contract Design',
      'Technology Selection',
      'Technical Debt Analysis',
      'Pattern Establishment'
    ],
    skills: [
      // Stack Skills
      'laravel_11_structure_skill_v2',
      'nextjs_app_router_skill',
      'nestjs_architecture_skill',
      // Architecture Skills
      'monolith_architecture_skill',
      'modular_monolith_skill',
      'microservices_architecture_skill',
      'event_driven_architecture_skill',
      'caching_strategy_skill',
      // Domain Skills
      'saas_multi_tenant_skill',
      'ecommerce_architecture_skill',
      'fintech_architecture_skill',
      // Operational Skills
      'refactor_planning_skill',
      'migration_planning_skill',
      'tech_debt_analysis_skill',
      // Governance Skills
      'security_architecture_skill',
      'scalability_architecture_skill'
    ],
    outputArtifacts: [
      'ARCHITECTURE.md',
      'ARCHITECTURE/',
      'ADRs/',
      'TECH-DEBT.md',
      'API-CONTRACTS.md',
      'DESIGN.md',
      'MODULES.md'
    ],
    taskTypes: ['architecture', 'api-design', 'tech-debt-analysis', 'technology-selection']
  },
  'ez-backend-agent': {
    name: 'ez-backend-agent',
    displayName: 'Backend Agent',
    description: 'API implementation, data models, business logic, and backend architecture specialist',
    responsibilities: [
      'API Implementation',
      'Data Modeling',
      'Business Logic',
      'Testing',
      'Performance Optimization'
    ],
    skills: [
      // Stack Skills
      'laravel_11_structure_skill_v2',
      'nestjs_architecture_skill',
      'express_js_architecture_skill',
      'fastapi_structure_skill',
      'spring_boot_architecture_skill',
      // Architecture Skills
      'repository_pattern_skill',
      'service_layer_pattern_skill',
      'unit_of_work_pattern_skill',
      'caching_strategy_skill',
      'api_versioning_skill',
      // Domain Skills
      'ecommerce_product_catalog_skill',
      'payment_processing_skill',
      'user_management_skill',
      // Operational Skills
      'testing_unit_skill',
      'testing_integration_skill',
      'debugging_backend_skill',
      // Governance Skills
      'security_backend_skill',
      'api_rate_limiting_skill'
    ],
    outputArtifacts: [
      'src/api/',
      'src/controllers/',
      'src/models/',
      'src/repositories/',
      'src/services/',
      'database/migrations/',
      'tests/unit/',
      'tests/integration/'
    ],
    taskTypes: ['api-implementation', 'data-modeling', 'business-logic', 'backend-testing']
  },
  'ez-frontend-agent': {
    name: 'ez-frontend-agent',
    displayName: 'Frontend Agent',
    description: 'UI components, state management, routing, and frontend architecture specialist',
    responsibilities: [
      'Component Development',
      'State Management',
      'Routing and Navigation',
      'API Integration',
      'Performance Optimization'
    ],
    skills: [
      // Stack Skills
      'nextjs_app_router_skill',
      'react_architecture_skill',
      'vue_architecture_skill',
      'angular_architecture_skill',
      'svelte_architecture_skill',
      // Architecture Skills
      'component_composition_skill',
      'state_management_skill',
      'server_components_skill',
      'micro_frontend_skill',
      // Domain Skills
      'dashboard_layout_skill',
      'ecommerce_ui_skill',
      'form_handling_skill',
      'data_visualization_skill',
      // Operational Skills
      'testing_component_skill',
      'accessibility_testing_skill',
      'performance_profiling_skill',
      // Governance Skills
      'accessibility_wcag_skill',
      'responsive_design_skill',
      'security_frontend_skill'
    ],
    outputArtifacts: [
      'src/components/',
      'src/app/',
      'src/pages/',
      'src/store/',
      'src/hooks/',
      'src/styles/',
      'tests/components/',
      'tests/e2e/'
    ],
    taskTypes: ['ui-development', 'component-creation', 'state-management', 'frontend-testing']
  },
  'ez-qa-agent': {
    name: 'ez-qa-agent',
    displayName: 'QA Agent',
    description: 'Test planning, test execution, quality reports, and quality assurance specialist',
    responsibilities: [
      'Test Planning',
      'Test Development',
      'Test Execution',
      'Quality Reporting',
      'Quality Gates'
    ],
    skills: [
      // Stack Skills
      'testing_jest_skill',
      'testing_vitest_skill',
      'testing_pytest_skill',
      'testing_phpunit_skill',
      'testing_cypress_skill',
      'testing_playwright_skill',
      // Architecture Skills
      'testing_strategy_skill',
      'test_automation_skill',
      'mocking_stubbing_skill',
      'bdd_tdd_skill',
      // Domain Skills
      'api_testing_skill',
      'ui_testing_skill',
      'performance_testing_skill',
      'security_testing_skill',
      // Operational Skills
      'regression_testing_skill',
      'exploratory_testing_skill',
      'bug_triage_skill',
      // Governance Skills
      'quality_gates_skill',
      'coverage_analysis_skill'
    ],
    outputArtifacts: [
      'TEST-PLAN.md',
      'test-plans/',
      'tests/unit/',
      'tests/integration/',
      'tests/e2e/',
      'QUALITY-REPORT.md',
      'coverage/'
    ],
    taskTypes: ['test-planning', 'test-execution', 'quality-reporting', 'quality-gates']
  },
  'ez-devops-agent': {
    name: 'ez-devops-agent',
    displayName: 'DevOps Agent',
    description: 'CI/CD, infrastructure as code, deployment, monitoring, and operations specialist',
    responsibilities: [
      'CI/CD Pipeline Design',
      'Infrastructure as Code',
      'Deployment Strategy',
      'Monitoring and Observability',
      'Security and Compliance'
    ],
    skills: [
      // Stack Skills
      'docker_containerization_skill',
      'kubernetes_orchestration_skill',
      'terraform_infrastructure_skill',
      'aws_infrastructure_skill',
      'azure_infrastructure_skill',
      // Architecture Skills
      'cicd_pipeline_architecture_skill',
      'microservices_deployment_skill',
      'serverless_architecture_skill',
      'infrastructure_scaling_skill',
      // Domain Skills
      'saas_deployment_skill',
      'ecommerce_infrastructure_skill',
      'high_availability_skill',
      // Operational Skills
      'monitoring_prometheus_skill',
      'logging_elk_skill',
      'alerting_pagerduty_skill',
      // Governance Skills
      'security_scanning_skill',
      'compliance_automation_skill',
      'cost_optimization_skill'
    ],
    outputArtifacts: [
      '.github/workflows/',
      'Dockerfile',
      'docker-compose.yml',
      'terraform/',
      'k8s/',
      'monitoring/',
      'DEPLOYMENT.md',
      'RUNBOOK.md'
    ],
    taskTypes: ['ci-cd-setup', 'infrastructure-setup', 'deployment', 'monitoring-setup']
  },
  'ez-context-manager': {
    name: 'ez-context-manager',
    displayName: 'Context Manager',
    description: 'State tracking, documentation, traceability, and knowledge synthesis specialist',
    responsibilities: [
      'State Management',
      'Documentation',
      'Traceability',
      'Knowledge Synthesis',
      'Handoff Management'
    ],
    skills: [
      // Stack Skills
      'documentation_structure_skill',
      'markdown_documentation_skill',
      'api_documentation_skill',
      'architecture_documentation_skill',
      // Architecture Skills
      'traceability_matrix_skill',
      'knowledge_management_skill',
      'information_architecture_skill',
      // Domain Skills
      'project_documentation_skill',
      'compliance_documentation_skill',
      'technical_writing_skill',
      // Operational Skills
      'state_tracking_skill',
      'version_control_skill',
      'change_tracking_skill',
      'audit_logging_skill',
      // Governance Skills
      'documentation_standards_skill',
      'knowledge_retention_skill'
    ],
    outputArtifacts: [
      'STATE.md',
      'CONTEXT.md',
      'TRACEABILITY.md',
      'KNOWLEDGE.md',
      'SUMMARY.md',
      'HANDOFFS.md',
      'SKILL-MEMORY.md'
    ],
    taskTypes: ['documentation', 'state-tracking', 'traceability', 'knowledge-synthesis', 'handoff-management']
  }
};

/**
 * Backward compatibility mapping: old agent names -> new specialist roles
 */
const BACKWARD_COMPATIBILITY_MAP = {
  'ez-planner': {
    mapsTo: 'ez-architect-agent',
    note: 'Planner enhanced with architecture skills',
    additionalSkills: ['architecture_documentation_skill', 'tech_debt_analysis_skill']
  },
  'ez-executor': {
    mapsTo: 'ez-backend-agent',
    note: 'Executor split into backend/frontend concerns',
    additionalSkills: []
  },
  'ez-verifier': {
    mapsTo: 'ez-qa-agent',
    note: 'Verifier enhanced with testing strategies',
    additionalSkills: ['testing_strategy_skill', 'quality_gates_skill']
  },
  'ez-tech-lead-agent': {
    mapsTo: 'ez-architect-agent',
    note: 'Tech Lead Agent as architecture review specialist',
    additionalSkills: ['code_review_skill', 'architecture_review_skill']
  },
  'ez-observer-agent': {
    mapsTo: 'ez-context-manager',
    note: 'Observer Agent as state tracking and documentation specialist',
    additionalSkills: ['state_tracking_skill', 'audit_logging_skill']
  },
  'ez-phase-researcher': {
    mapsTo: 'ez-context-manager',
    note: 'Phase Researcher as research aggregation specialist',
    additionalSkills: ['knowledge_synthesis_skill', 'research_aggregation_skill']
  }
};

/**
 * Skill to agent mapping for queryBySkill
 */
const SKILL_TO_AGENT_MAP = {
  // Architecture skills
  'monolith_architecture_skill': ['ez-architect-agent'],
  'modular_monolith_skill': ['ez-architect-agent'],
  'microservices_architecture_skill': ['ez-architect-agent', 'ez-devops-agent'],
  'event_driven_architecture_skill': ['ez-architect-agent'],
  'caching_strategy_skill': ['ez-architect-agent', 'ez-backend-agent'],
  'api_gateway_architecture_skill': ['ez-architect-agent'],
  'repository_pattern_skill': ['ez-backend-agent'],
  'service_layer_pattern_skill': ['ez-backend-agent'],
  'component_composition_skill': ['ez-frontend-agent'],
  'state_management_skill': ['ez-frontend-agent'],
  'testing_strategy_skill': ['ez-qa-agent'],
  'test_automation_skill': ['ez-qa-agent'],
  'cicd_pipeline_architecture_skill': ['ez-devops-agent'],
  'traceability_matrix_skill': ['ez-context-manager'],
  'knowledge_management_skill': ['ez-context-manager'],
  // Stack skills
  'laravel_11_structure_skill_v2': ['ez-backend-agent', 'ez-architect-agent'],
  'nextjs_app_router_skill': ['ez-frontend-agent', 'ez-architect-agent'],
  'nestjs_architecture_skill': ['ez-backend-agent'],
  'react_architecture_skill': ['ez-frontend-agent'],
  'vue_architecture_skill': ['ez-frontend-agent'],
  'docker_containerization_skill': ['ez-devops-agent'],
  'kubernetes_orchestration_skill': ['ez-devops-agent'],
  // Domain skills
  'saas_multi_tenant_skill': ['ez-architect-agent', 'ez-backend-agent'],
  'ecommerce_product_catalog_skill': ['ez-backend-agent'],
  'ecommerce_ui_skill': ['ez-frontend-agent'],
  'payment_processing_skill': ['ez-backend-agent'],
  'dashboard_layout_skill': ['ez-frontend-agent'],
  // Testing skills
  'testing_jest_skill': ['ez-qa-agent', 'ez-backend-agent', 'ez-frontend-agent'],
  'testing_cypress_skill': ['ez-qa-agent', 'ez-frontend-agent'],
  'testing_playwright_skill': ['ez-qa-agent', 'ez-frontend-agent'],
  'api_testing_skill': ['ez-qa-agent', 'ez-backend-agent'],
  'ui_testing_skill': ['ez-qa-agent', 'ez-frontend-agent'],
  // DevOps skills
  'terraform_infrastructure_skill': ['ez-devops-agent'],
  'aws_infrastructure_skill': ['ez-devops-agent'],
  'monitoring_prometheus_skill': ['ez-devops-agent'],
  'logging_elk_skill': ['ez-devops-agent'],
  // Documentation skills
  'documentation_structure_skill': ['ez-context-manager'],
  'markdown_documentation_skill': ['ez-context-manager'],
  'architecture_documentation_skill': ['ez-context-manager', 'ez-architect-agent']
};

// ============================================================================
// AGENT REGISTRY
// ============================================================================

/**
 * Cache for loaded agent definitions
 */
let agentCache = null;

/**
 * Load agent definitions from agents/*.md files
 *
 * @param {string} agentsDir - Directory containing agent definition files
 * @returns {Object} Agent definitions
 */
function loadAgentDefinitions(agentsDir) {
  if (agentCache) {
    return agentCache;
  }

  const agents = {};
  const agentDir = agentsDir || path.join(__dirname, '..', '..', 'agents');

  try {
    const files = fs.readdirSync(agentDir);
    const agentFiles = files.filter(f => f.endsWith('-agent.md') || f === 'ez-context-manager.md');

    for (const file of agentFiles) {
      const agentName = file.replace('.md', '');
      const filePath = path.join(agentDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Parse frontmatter and content
      const parsed = parseAgentFile(content, agentName);
      if (parsed) {
        agents[agentName] = parsed;
      }
    }

    // Merge with specialist agent definitions
    agentCache = { ...SPECIALIST_AGENTS, ...agents };
    return agentCache;
  } catch (error) {
    console.error('Error loading agent definitions:', error.message);
    // Return specialist agents as fallback
    agentCache = SPECIALIST_AGENTS;
    return agentCache;
  }
}

/**
 * Parse agent markdown file to extract metadata
 *
 * @param {string} content - File content
 * @param {string} agentName - Agent name from filename
 * @returns {Object|null} Parsed agent definition or null
 */
function parseAgentFile(content, agentName) {
  try {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    const descriptionMatch = frontmatter.match(/description:\s*(.+)/);

    return {
      name: nameMatch ? nameMatch[1].trim() : agentName,
      displayName: formatDisplayName(agentName),
      description: descriptionMatch ? descriptionMatch[1].trim() : 'Agent description not available',
      sourceFile: agentName + '.md'
    };
  } catch (error) {
    console.error(`Error parsing ${agentName}:`, error.message);
    return null;
  }
}

/**
 * Format agent name to display name
 *
 * @param {string} name - Agent name (e.g., ez-architect-agent)
 * @returns {string} Display name (e.g., Architect Agent)
 */
function formatDisplayName(name) {
  return name
    .replace(/^ez-/, '')
    .replace(/-agent$/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Agent';
}

/**
 * Get agent definition by name
 *
 * @param {string} agentName - Agent name (e.g., 'ez-architect-agent')
 * @param {Object} options - Options
 * @param {boolean} options.resolveAlias - Whether to resolve backward compatibility aliases
 * @returns {Object|null} Agent definition or null if not found
 */
function getAgent(agentName, options = {}) {
  const { resolveAlias = true } = options;

  // Check for backward compatibility
  if (resolveAlias && BACKWARD_COMPATIBILITY_MAP[agentName]) {
    const mapping = BACKWARD_COMPATIBILITY_MAP[agentName];
    const baseAgent = SPECIALIST_AGENTS[mapping.mapsTo];
    if (baseAgent) {
      return {
        ...baseAgent,
        aliasFor: agentName,
        note: mapping.note,
        additionalSkills: mapping.additionalSkills
      };
    }
  }

  // Load agents if not cached
  if (!agentCache) {
    loadAgentDefinitions();
  }

  return agentCache[agentName] || SPECIALIST_AGENTS[agentName] || null;
}

/**
 * Query agents by skill
 *
 * @param {string} skillName - Skill name to query
 * @returns {Array} Array of agent definitions that have the skill
 */
function queryBySkill(skillName) {
  const agents = [];

  // Check skill-to-agent map first
  if (SKILL_TO_AGENT_MAP[skillName]) {
    const agentNames = SKILL_TO_AGENT_MAP[skillName];
    for (const name of agentNames) {
      const agent = getAgent(name);
      if (agent) {
        agents.push(agent);
      }
    }
    return agents;
  }

  // Fallback: search all agents
  if (!agentCache) {
    loadAgentDefinitions();
  }

  for (const [name, agent] of Object.entries(agentCache)) {
    if (agent.skills && agent.skills.includes(skillName)) {
      agents.push(agent);
    }
  }

  // Also check specialist agents
  for (const [name, agent] of Object.entries(SPECIALIST_AGENTS)) {
    if (agent.skills && agent.skills.includes(skillName) && !agents.find(a => a.name === name)) {
      agents.push(agent);
    }
  }

  return agents;
}

/**
 * Get all registered agents with capabilities
 *
 * @param {Object} options - Options
 * @param {boolean} options.includeAliases - Whether to include backward compatibility aliases
 * @returns {Array} Array of all agent definitions
 */
function getAllAgents(options = {}) {
  const { includeAliases = false } = options;

  if (!agentCache) {
    loadAgentDefinitions();
  }

  const agents = Object.values(agentCache);
  const specialistAgents = Object.values(SPECIALIST_AGENTS);

  // Merge and deduplicate
  const allAgents = [...specialistAgents];
  for (const agent of agents) {
    if (!allAgents.find(a => a.name === agent.name)) {
      allAgents.push(agent);
    }
  }

  if (includeAliases) {
    // Add alias entries
    for (const [aliasName, mapping] of Object.entries(BACKWARD_COMPATIBILITY_MAP)) {
      const baseAgent = allAgents.find(a => a.name === mapping.mapsTo);
      if (baseAgent) {
        allAgents.push({
          ...baseAgent,
          name: aliasName,
          isAlias: true,
          mapsTo: mapping.mapsTo,
          note: mapping.note
        });
      }
    }
  }

  return allAgents;
}

/**
 * Assign agent to task based on task type and context
 *
 * @param {string} taskType - Task type (e.g., 'architecture', 'api-implementation')
 * @param {Object} context - Task context
 * @param {string} context.mode - Operation mode (Greenfield, Existing, MVP, Scale-up, Maintenance)
 * @param {string} context.stack - Tech stack
 * @param {string} context.domain - Domain type
 * @returns {Object} Assignment result: { agent, confidence, rationale, alternatives }
 */
function assignAgent(taskType, context = {}) {
  const { mode, stack, domain } = context;

  // Find agents that handle this task type
  const candidates = [];

  for (const [name, agent] of Object.entries(SPECIALIST_AGENTS)) {
    if (agent.taskTypes && agent.taskTypes.includes(taskType)) {
      let confidence = 0.8; // Base confidence
      const rationale = [];

      // Boost confidence for mode match
      if (mode && agent.modePreferences && agent.modePreferences.includes(mode)) {
        confidence += 0.1;
        rationale.push(`Preferred for ${mode} mode`);
      }

      // Boost confidence for stack match
      if (stack && agent.stackPreferences && agent.stackPreferences.includes(stack)) {
        confidence += 0.05;
        rationale.push(`Experienced with ${stack}`);
      }

      // Boost confidence for domain match
      if (domain && agent.domainPreferences && agent.domainPreferences.includes(domain)) {
        confidence += 0.05;
        rationale.push(`Domain expertise in ${domain}`);
      }

      candidates.push({
        name,
        agent,
        confidence: Math.min(confidence, 1.0),
        rationale: rationale.join('. ') || 'Matches task type'
      });
    }
  }

  // Sort by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  if (candidates.length === 0) {
    // Default assignment based on task type patterns
    const defaultAgent = getDefaultAgentForTaskType(taskType);
    return {
      agent: defaultAgent,
      confidence: 0.5,
      rationale: 'Default assignment based on task type pattern',
      alternatives: []
    };
  }

  const best = candidates[0];
  const alternatives = candidates.slice(1, 4).map(c => ({
    name: c.name,
    confidence: c.confidence,
    rationale: c.rationale
  }));

  return {
    agent: best.agent,
    confidence: best.confidence,
    rationale: best.rationale,
    alternatives
  };
}

/**
 * Get default agent for task type when no explicit match
 *
 * @param {string} taskType - Task type
 * @returns {Object} Default agent definition
 */
function getDefaultAgentForTaskType(taskType) {
  const taskTypePatterns = {
    'architecture': 'ez-architect-agent',
    'api-design': 'ez-architect-agent',
    'api-implementation': 'ez-backend-agent',
    'data-modeling': 'ez-backend-agent',
    'business-logic': 'ez-backend-agent',
    'ui-development': 'ez-frontend-agent',
    'component-creation': 'ez-frontend-agent',
    'state-management': 'ez-frontend-agent',
    'test-planning': 'ez-qa-agent',
    'test-execution': 'ez-qa-agent',
    'quality-reporting': 'ez-qa-agent',
    'ci-cd-setup': 'ez-devops-agent',
    'infrastructure-setup': 'ez-devops-agent',
    'deployment': 'ez-devops-agent',
    'documentation': 'ez-context-manager',
    'state-tracking': 'ez-context-manager',
    'handoff-management': 'ez-context-manager'
  };

  const defaultAgentName = taskTypePatterns[taskType] || 'ez-backend-agent';
  return SPECIALIST_AGENTS[defaultAgentName] || SPECIALIST_AGENTS['ez-backend-agent'];
}

/**
 * Resolve backward compatibility alias to specialist agent
 *
 * @param {string} aliasName - Alias name (e.g., 'ez-planner')
 * @returns {Object} Resolution result: { resolved, agent, note }
 */
function resolveAlias(aliasName) {
  const mapping = BACKWARD_COMPATIBILITY_MAP[aliasName];

  if (!mapping) {
    return {
      resolved: false,
      agent: null,
      note: 'Not an alias'
    };
  }

  const agent = getAgent(mapping.mapsTo);
  return {
    resolved: true,
    agent,
    note: mapping.note,
    additionalSkills: mapping.additionalSkills
  };
}

/**
 * Get backward compatibility mapping
 *
 * @returns {Object} Backward compatibility map
 */
function getBackwardCompatibilityMap() {
  return { ...BACKWARD_COMPATIBILITY_MAP };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  getAgent,
  queryBySkill,
  getAllAgents,
  assignAgent,
  resolveAlias,
  getBackwardCompatibilityMap,

  // Helpers
  loadAgentDefinitions,
  parseAgentFile,
  formatDisplayName,
  getDefaultAgentForTaskType,

  // Constants
  SPECIALIST_AGENTS,
  BACKWARD_COMPATIBILITY_MAP,
  SKILL_TO_AGENT_MAP
};

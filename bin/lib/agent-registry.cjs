#!/usr/bin/env node
'use strict';

/**
 * Agent Registry and Skill-Aware Assignment
 * 
 * Provides:
 * - Registry of specialist agents with skill compatibilities
 * - Agent-skill matching algorithm
 * - Task Graph integration for dependency-aware routing
 * 
 * @module agent-registry
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Agent availability status
 */
const AGENT_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline'
};

/**
 * Specialist agent definitions with responsibilities and skill compatibilities
 */
const SPECIALIST_AGENTS = {
  architect: {
    id: 'architect',
    name: 'Architecture Agent',
    description: 'System design, architecture patterns, structural decisions',
    responsibilities: [
      'System architecture design',
      'Architecture pattern selection',
      'Module boundary definition',
      'Technical debt assessment',
      'Scalability planning'
    ],
    skills: [
      'monolith_architecture_skill',
      'modular_monolith_skill',
      'microservices_architecture_skill',
      'event_driven_architecture_skill',
      'queue_based_architecture_skill',
      'caching_strategy_skill',
      'rbac_architecture_skill',
      'api_gateway_architecture_skill'
    ],
    status: AGENT_STATUS.AVAILABLE,
    currentWorkload: 0,
    maxWorkload: 3
  },
  backend: {
    id: 'backend',
    name: 'Backend Agent',
    description: 'Server-side development, APIs, databases, business logic',
    responsibilities: [
      'API design and implementation',
      'Database schema design',
      'Business logic implementation',
      'Authentication/Authorization',
      'Performance optimization'
    ],
    skills: [
      'laravel_11_structure_skill_v2',
      'nestjs_architecture_skill',
      'fastapi_structure_skill',
      'spring_boot_architecture_skill',
      'express_js_architecture_skill',
      'django_architecture_skill',
      'api_design_skill',
      'database_design_skill',
      'authentication_architecture_skill',
      'testing_skill'
    ],
    status: AGENT_STATUS.AVAILABLE,
    currentWorkload: 0,
    maxWorkload: 5
  },
  frontend: {
    id: 'frontend',
    name: 'Frontend Agent',
    description: 'Client-side development, UI/UX, state management',
    responsibilities: [
      'UI component development',
      'State management',
      'Routing and navigation',
      'Form handling',
      'Responsive design'
    ],
    skills: [
      'nextjs_app_router_skill',
      'react_architecture_skill',
      'vue_architecture_skill',
      'angular_architecture_skill',
      'svelte_architecture_skill',
      'flutter_architecture_skill',
      'ui_component_design_skill',
      'state_management_skill',
      'responsive_design_skill'
    ],
    status: AGENT_STATUS.AVAILABLE,
    currentWorkload: 0,
    maxWorkload: 5
  },
  qa: {
    id: 'qa',
    name: 'QA Agent',
    description: 'Quality assurance, testing, validation',
    responsibilities: [
      'Test strategy planning',
      'Test case creation',
      'Automated testing',
      'Quality gates enforcement',
      'Regression testing'
    ],
    skills: [
      'bug_triage_skill',
      'regression_testing_skill',
      'unit_testing_skill',
      'integration_testing_skill',
      'e2e_testing_skill',
      'performance_testing_skill',
      'security_testing_skill',
      'test_automation_skill'
    ],
    status: AGENT_STATUS.AVAILABLE,
    currentWorkload: 0,
    maxWorkload: 4
  },
  devops: {
    id: 'devops',
    name: 'DevOps Agent',
    description: 'Infrastructure, deployment, CI/CD, monitoring',
    responsibilities: [
      'Infrastructure setup',
      'CI/CD pipeline configuration',
      'Deployment automation',
      'Monitoring and alerting',
      'Performance tuning'
    ],
    skills: [
      'docker_containerization_skill',
      'kubernetes_orchestration_skill',
      'ci_cd_pipeline_skill',
      'infrastructure_as_code_skill',
      'cloud_deployment_skill',
      'monitoring_alerting_skill',
      'performance_tuning_skill',
      'rollback_planning_skill'
    ],
    status: AGENT_STATUS.AVAILABLE,
    currentWorkload: 0,
    maxWorkload: 3
  },
  context_manager: {
    id: 'context_manager',
    name: 'Context Manager Agent',
    description: 'Context aggregation, documentation, knowledge management',
    responsibilities: [
      'Context aggregation',
      'Documentation generation',
      'Knowledge base maintenance',
      'Cross-agent coordination',
      'Audit trail management'
    ],
    skills: [
      'context_aggregation_skill',
      'documentation_skill',
      'knowledge_management_skill',
      'audit_trail_skill',
      'cross_agent_coordination_skill'
    ],
    status: AGENT_STATUS.AVAILABLE,
    currentWorkload: 0,
    maxWorkload: 4
  }
};

/**
 * Generalist agent fallback
 */
const GENERALIST_AGENT = {
  id: 'generalist',
  name: 'Generalist Agent',
  description: 'General-purpose agent for tasks without specialist match',
  responsibilities: [
    'General task handling',
    'Fallback for unmatched tasks',
    'Multi-domain support'
  ],
  skills: [
    'general_programming_skill',
    'basic_testing_skill',
    'documentation_skill'
  ],
  status: AGENT_STATUS.AVAILABLE,
  currentWorkload: 0,
  maxWorkload: 10
};

// ============================================================================
// AGENT REGISTRY CLASS
// ============================================================================

/**
 * Agent Registry
 * 
 * Manages specialist agents and their skill compatibilities
 */
class AgentRegistry {
  constructor() {
    this.agents = { ...SPECIALIST_AGENTS };
    this.generalist = { ...GENERALIST_AGENT };
    this.assignmentHistory = [];
  }

  /**
   * Get all available agents
   * 
   * @returns {Array} Array of available agent objects
   */
  getAvailableAgents() {
    return Object.values(this.agents).filter(
      agent => agent.status === AGENT_STATUS.AVAILABLE && agent.currentWorkload < agent.maxWorkload
    );
  }

  /**
   * Get agent by ID
   * 
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Agent object or null if not found
   */
  getAgent(agentId) {
    if (agentId === 'generalist') {
      return this.generalist;
    }
    return this.agents[agentId] || null;
  }

  /**
   * Query agents by skill requirement
   * 
   * @param {string} skill - Required skill
   * @returns {Array} Array of agents that have the skill
   */
  queryBySkill(skill) {
    const matchingAgents = [];

    for (const agent of Object.values(this.agents)) {
      if (agent.status === AGENT_STATUS.AVAILABLE &&
          agent.currentWorkload < agent.maxWorkload &&
          agent.skills.includes(skill)) {
        matchingAgents.push(agent);
      }
    }

    // Also check generalist
    if (this.generalist.status === AGENT_STATUS.AVAILABLE &&
        this.generalist.currentWorkload < this.generalist.maxWorkload) {
      matchingAgents.push(this.generalist);
    }

    return matchingAgents;
  }

  /**
   * Update agent status
   * 
   * @param {string} agentId - Agent ID
   * @param {string} status - New status (available, busy, offline)
   * @returns {Object} Update result
   */
  updateAgentStatus(agentId, status) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (!Object.values(AGENT_STATUS).includes(status)) {
      return { success: false, error: 'Invalid status' };
    }

    agent.status = status;
    return { success: true, agent: agentId, newStatus: status };
  }

  /**
   * Assign work to agent
   * 
   * @param {string} agentId - Agent ID
   * @param {Object} task - Task object
   * @returns {Object} Assignment result
   */
  assignWork(agentId, task) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (agent.status !== AGENT_STATUS.AVAILABLE) {
      return { success: false, error: 'Agent not available', status: agent.status };
    }

    if (agent.currentWorkload >= agent.maxWorkload) {
      return { success: false, error: 'Agent at max workload' };
    }

    agent.currentWorkload++;
    
    this.assignmentHistory.push({
      agentId,
      taskId: task.id || Date.now().toString(),
      timestamp: new Date().toISOString(),
      skills: task.skills || []
    });

    return {
      success: true,
      agent: agentId,
      workload: agent.currentWorkload,
      maxWorkload: agent.maxWorkload
    };
  }

  /**
   * Release work from agent
   * 
   * @param {string} agentId - Agent ID
   * @returns {Object} Release result
   */
  releaseWork(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (agent.currentWorkload > 0) {
      agent.currentWorkload--;
    }

    return {
      success: true,
      agent: agentId,
      workload: agent.currentWorkload
    };
  }

  /**
   * Get agent workload summary
   * 
   * @returns {Object} Workload summary for all agents
   */
  getWorkloadSummary() {
    const summary = {};
    
    for (const [id, agent] of Object.entries(this.agents)) {
      summary[id] = {
        workload: agent.currentWorkload,
        maxWorkload: agent.maxWorkload,
        utilization: Math.round((agent.currentWorkload / agent.maxWorkload) * 100),
        status: agent.status
      };
    }

    summary.generalist = {
      workload: this.generalist.currentWorkload,
      maxWorkload: this.generalist.maxWorkload,
      utilization: Math.round((this.generalist.currentWorkload / this.generalist.maxWorkload) * 100),
      status: this.generalist.status
    };

    return summary;
  }

  /**
   * Get assignment history
   * 
   * @returns {Array} Array of assignment entries
   */
  getAssignmentHistory() {
    return this.assignmentHistory;
  }

  /**
   * Reset all agent workloads
   */
  reset() {
    for (const agent of Object.values(this.agents)) {
      agent.currentWorkload = 0;
      agent.status = AGENT_STATUS.AVAILABLE;
    }
    this.generalist.currentWorkload = 0;
    this.generalist.status = AGENT_STATUS.AVAILABLE;
  }
}

// ============================================================================
// AGENT-SKILL MATCHING ALGORITHM
// ============================================================================

/**
 * Match task to agent + skill combination based on context
 * 
 * @param {Object} task - Task object
 * @param {string} task.type - Task type (feature, bug, refactor, migration, incident)
 * @param {Object} context - Context object from Context Engine
 * @param {Array} context.stack - Detected tech stack
 * @param {string} context.archetype - Project archetype
 * @param {string} context.mode - Operational mode
 * @param {Array} context.constraints - Business constraints
 * @param {AgentRegistry} registry - Agent registry instance
 * @returns {Object} Match result: { agent_id, skills, confidence, rationale }
 */
function matchAgentSkill(task, context, registry) {
  const matches = [];
  
  // Score each agent based on task type, stack, archetype, and mode
  for (const agent of Object.values(registry.agents)) {
    if (agent.status !== AGENT_STATUS.AVAILABLE || agent.currentWorkload >= agent.maxWorkload) {
      continue;
    }

    const score = calculateAgentScore(agent, task, context);
    const relevantSkills = selectRelevantSkills(agent, task, context);

    if (score > 0) {
      matches.push({
        agent_id: agent.id,
        agent_name: agent.name,
        skills: relevantSkills,
        confidence: calculateConfidence(score),
        score: score,
        rationale: generateRationale(agent, task, context, relevantSkills)
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Return best match or fallback to generalist
  if (matches.length > 0) {
    return matches[0];
  }

  // Fallback to generalist
  return {
    agent_id: 'generalist',
    agent_name: 'Generalist Agent',
    skills: ['general_programming_skill'],
    confidence: 'low',
    score: 0,
    rationale: 'No specialist match found, routing to generalist',
    fallback: true
  };
}

/**
 * Calculate agent match score
 * 
 * @param {Object} agent - Agent object
 * @param {Object} task - Task object
 * @param {Object} context - Context object
 * @returns {number} Match score
 */
function calculateAgentScore(agent, task, context) {
  let score = 0;

  // Task type scoring
  const taskTypeScores = {
    architect: { feature: 2, bug: 1, refactor: 3, migration: 2, incident: 1 },
    backend: { feature: 3, bug: 3, refactor: 2, migration: 2, incident: 3 },
    frontend: { feature: 3, bug: 3, refactor: 2, migration: 1, incident: 2 },
    qa: { feature: 1, bug: 3, refactor: 1, migration: 1, incident: 2 },
    devops: { feature: 1, bug: 2, refactor: 1, migration: 3, incident: 3 },
    context_manager: { feature: 1, bug: 1, refactor: 1, migration: 1, incident: 1 }
  };

  score += taskTypeScores[agent.id]?.[task.type] || 0;

  // Stack matching
  if (context.stack) {
    const stackSkills = getStackSkills(context.stack);
    const matchingSkills = agent.skills.filter(s => stackSkills.includes(s));
    score += matchingSkills.length * 2;
  }

  // Archetype matching
  if (context.archetype) {
    const archetypeSkills = getArchetypeSkills(context.archetype);
    const matchingSkills = agent.skills.filter(s => archetypeSkills.includes(s));
    score += matchingSkills.length * 1.5;
  }

  // Mode adjustment
  if (context.mode) {
    const modeBonus = getModeBonus(agent, context.mode);
    score += modeBonus;
  }

  // Workload penalty
  const utilization = agent.currentWorkload / agent.maxWorkload;
  score *= (1 - utilization * 0.3); // Up to 30% penalty at full workload

  return score;
}

/**
 * Select relevant skills for the task
 * 
 * @param {Object} agent - Agent object
 * @param {Object} task - Task object
 * @param {Object} context - Context object
 * @returns {Array} Array of relevant skill IDs
 */
function selectRelevantSkills(agent, task, context) {
  const skills = [];

  // Stack-based skills
  if (context.stack) {
    const stackSkills = getStackSkills(context.stack);
    skills.push(...agent.skills.filter(s => stackSkills.includes(s)));
  }

  // Task-type skills
  const taskTypeSkills = getTaskTypeSkills(task.type);
  skills.push(...agent.skills.filter(s => taskTypeSkills.includes(s)));

  // Archetype skills
  if (context.archetype) {
    const archetypeSkills = getArchetypeSkills(context.archetype);
    skills.push(...agent.skills.filter(s => archetypeSkills.includes(s)));
  }

  // Limit to 7 skills (as per ORCH-03)
  return [...new Set(skills)].slice(0, 7);
}

/**
 * Get skills for a tech stack
 * 
 * @param {Array} stack - Array of stack items
 * @returns {Array} Array of skill IDs
 */
function getStackSkills(stack) {
  const stackSkillMap = {
    'Laravel': ['laravel_11_structure_skill_v2'],
    'Next.js': ['nextjs_app_router_skill'],
    'NestJS': ['nestjs_architecture_skill'],
    'FastAPI': ['fastapi_structure_skill'],
    'Spring Boot': ['spring_boot_architecture_skill'],
    'React': ['react_architecture_skill'],
    'Flutter': ['flutter_architecture_skill'],
    'Django': ['django_architecture_skill'],
    'Express': ['express_js_architecture_skill'],
    'Vue': ['vue_architecture_skill'],
    'Angular': ['angular_architecture_skill'],
    'Svelte': ['svelte_architecture_skill'],
    'PostgreSQL': ['database_design_skill'],
    'MongoDB': ['database_design_skill'],
    'MySQL': ['database_design_skill'],
    'Redis': ['caching_strategy_skill'],
    'Docker': ['docker_containerization_skill'],
    'Kubernetes': ['kubernetes_orchestration_skill']
  };

  const skills = [];
  for (const item of stack) {
    if (stackSkillMap[item]) {
      skills.push(...stackSkillMap[item]);
    }
  }
  return skills;
}

/**
 * Get skills for a project archetype
 * 
 * @param {string} archetype - Project archetype
 * @returns {Array} Array of skill IDs
 */
function getArchetypeSkills(archetype) {
  const archetypeSkillMap = {
    'dashboard': ['ui_component_design_skill', 'state_management_skill'],
    'POS': ['api_design_skill', 'database_design_skill'],
    'SaaS': ['rbac_architecture_skill', 'api_gateway_architecture_skill', 'authentication_architecture_skill'],
    'e-commerce': ['api_design_skill', 'authentication_architecture_skill', 'caching_strategy_skill'],
    'LMS': ['rbac_architecture_skill', 'api_design_skill'],
    'booking': ['api_design_skill', 'database_design_skill'],
    'fintech': ['security_testing_skill', 'authentication_architecture_skill', 'rbac_architecture_skill'],
    'internal_tools': ['ui_component_design_skill', 'api_design_skill']
  };

  return archetypeSkillMap[archetype] || [];
}

/**
 * Get skills for a task type
 * 
 * @param {string} taskType - Task type
 * @returns {Array} Array of skill IDs
 */
function getTaskTypeSkills(taskType) {
  const taskTypeSkillMap = {
    'feature': ['api_design_skill', 'ui_component_design_skill'],
    'bug': ['bug_triage_skill', 'unit_testing_skill', 'regression_testing_skill'],
    'refactor': ['unit_testing_skill', 'integration_testing_skill'],
    'migration': ['rollback_planning_skill', 'integration_testing_skill'],
    'incident': ['bug_triage_skill', 'rollback_planning_skill', 'performance_tuning_skill']
  };

  return taskTypeSkillMap[taskType] || [];
}

/**
 * Get mode bonus for agent
 * 
 * @param {Object} agent - Agent object
 * @param {string} mode - Operational mode
 * @returns {number} Mode bonus score
 */
function getModeBonus(agent, mode) {
  const modeBonuses = {
    'Greenfield': { architect: 2, backend: 1, frontend: 1 },
    'Brownfield': { architect: 1, backend: 2, qa: 1 },
    'MVP': { backend: 2, frontend: 2, devops: 1 },
    'Scale-Up': { architect: 2, devops: 2, backend: 1 },
    'Maintenance': { qa: 2, backend: 1, context_manager: 1 }
  };

  return modeBonuses[mode]?.[agent.id] || 0;
}

/**
 * Calculate confidence from score
 * 
 * @param {number} score - Match score
 * @returns {string} Confidence level
 */
function calculateConfidence(score) {
  if (score >= 8) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * Generate rationale for match
 * 
 * @param {Object} agent - Agent object
 * @param {Object} task - Task object
 * @param {Object} context - Context object
 * @param {Array} skills - Selected skills
 * @returns {string} Rationale string
 */
function generateRationale(agent, task, context, skills) {
  const reasons = [];

  reasons.push(`${agent.name} selected for ${task.type} task`);

  if (context.stack && context.stack.length > 0) {
    reasons.push(`stack: ${context.stack.join(', ')}`);
  }

  if (context.archetype) {
    reasons.push(`archetype: ${context.archetype}`);
  }

  if (context.mode) {
    reasons.push(`mode: ${context.mode}`);
  }

  if (skills.length > 0) {
    reasons.push(`${skills.length} skills activated`);
  }

  return reasons.join(' | ');
}

// ============================================================================
// TASK GRAPH INTEGRATION
// ============================================================================

/**
 * Check task dependencies and ensure skill continuity
 * 
 * @param {Object} task - Task object
 * @param {Array} dependencyTasks - Array of dependent task IDs
 * @param {AgentRegistry} registry - Agent registry instance
 * @returns {Object} Dependency check result
 */
function checkTaskDependencies(task, dependencyTasks, registry) {
  const history = registry.getAssignmentHistory();
  const relatedAssignments = history.filter(h => 
    dependencyTasks.includes(h.taskId)
  );

  if (relatedAssignments.length === 0) {
    return {
      has_dependencies: false,
      skill_continuity: null,
      recommendation: 'No related tasks found'
    };
  }

  // Get skills from related tasks
  const relatedSkills = new Set();
  const relatedAgents = new Set();

  for (const assignment of relatedAssignments) {
    assignment.skills.forEach(s => relatedSkills.add(s));
    relatedAgents.add(assignment.agentId);
  }

  // Prefer same agent for skill continuity
  const preferredAgent = relatedAgents.size === 1 ? 
    Array.from(relatedAgents)[0] : null;

  return {
    has_dependencies: true,
    related_tasks: dependencyTasks,
    related_skills: Array.from(relatedSkills),
    related_agents: Array.from(relatedAgents),
    skill_continuity: preferredAgent ? 'maintained' : 'mixed',
    recommendation: preferredAgent ? 
      `Assign to ${preferredAgent} for skill continuity` : 
      'Consider agent with overlapping skills'
  };
}

/**
 * Log assignment decision for audit trail
 * 
 * @param {Object} assignment - Assignment object
 * @param {string} logFilePath - Path to log file
 */
function logAssignmentDecision(assignment, logFilePath) {
  const fs = require('fs');
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    task_id: assignment.taskId,
    agent_id: assignment.agent_id,
    skills: assignment.skills,
    confidence: assignment.confidence,
    rationale: assignment.rationale
  };

  try {
    let logData = { assignments: [] };
    
    if (fs.existsSync(logFilePath)) {
      const content = fs.readFileSync(logFilePath, 'utf8');
      logData = JSON.parse(content);
    }

    logData.assignments.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to log assignment:', error.message);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Classes
  AgentRegistry,

  // Functions
  matchAgentSkill,
  checkTaskDependencies,
  logAssignmentDecision,

  // Constants
  AGENT_STATUS,
  SPECIALIST_AGENTS,
  GENERALIST_AGENT,

  // Helpers
  calculateAgentScore,
  selectRelevantSkills,
  getStackSkills,
  getArchetypeSkills,
  getTaskTypeSkills,
  getModeBonus,
  calculateConfidence,
  generateRationale
};

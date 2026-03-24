#!/usr/bin/env node
'use strict';

/**
 * Mode Workflow Engine
 *
 * Provides mode-specific workflow definitions with distinct steps,
 * skill limits, and gate requirements for each operation mode.
 *
 * @module mode-workflows
 */

const { MODES, MODE_CONFIGS } = require('./mode-detector.cjs');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Workflow definitions for each mode
 */
const WORKFLOWS = {
  [MODES.GREENFIELD]: {
    name: 'Greenfield Mode Workflow',
    description: 'Full freedom to choose architecture with best practices from scratch',
    steps: [
      { order: 1, agent: 'ez-architect-agent', task: 'Full architecture design' },
      { order: 2, agent: 'skill-activator', task: 'Activate 7 skills (full stack + architecture + domain)' },
      { order: 3, agent: 'ez-backend-agent', task: 'Implementation with best practices' },
      { order: 4, agent: 'ez-frontend-agent', task: 'UI implementation with best practices' },
      { order: 5, agent: 'ez-qa-agent', task: 'Full test coverage (unit + integration + E2E)' },
      { order: 6, agent: 'ez-devops-agent', task: 'Complete CI/CD + monitoring setup' },
      { order: 7, agent: 'ez-context-manager', task: 'Full documentation' }
    ],
    gateRequirements: 'all',
    skillLimit: 7,
    documentation: 'complete',
    testing: 'full-coverage'
  },
  [MODES.EXISTING]: {
    name: 'Existing Codebase Mode Workflow',
    description: 'Respect current structure with incremental improvements',
    steps: [
      { order: 1, agent: 'ez-context-manager', task: 'Analyze existing patterns' },
      { order: 2, agent: 'ez-architect-agent', task: 'Incremental design (no big rewrites)' },
      { order: 3, agent: 'skill-activator', task: 'Activate 6 skills (existing stack + consistency)' },
      { order: 4, agent: 'ez-backend-agent', task: 'Implementation matching existing patterns' },
      { order: 5, agent: 'ez-frontend-agent', task: 'UI matching existing patterns' },
      { order: 6, agent: 'ez-qa-agent', task: 'Regression tests + new feature tests' },
      { order: 7, agent: 'ez-context-manager', task: 'Update documentation' }
    ],
    gateRequirements: [1, 2, 3, 4, 5],
    skillLimit: 6,
    documentation: 'standard',
    testing: 'regression + new',
    guardrails: [
      'No breaking changes without migration plan',
      'New code matches existing patterns',
      'Refactoring requires separate task'
    ]
  },
  [MODES.RAPID_MVP]: {
    name: 'Rapid MVP Mode Workflow',
    description: 'Speed over perfection with minimal viable features',
    steps: [
      { order: 1, agent: 'ez-architect-agent', task: 'Minimal architecture (skip complex patterns)' },
      { order: 2, agent: 'skill-activator', task: 'Activate 4 skills (core stack only)' },
      { order: 3, agent: 'ez-backend-agent', task: 'Fast implementation' },
      { order: 4, agent: 'ez-frontend-agent', task: 'Minimal UI' },
      { order: 5, agent: 'ez-qa-agent', task: 'Smoke tests + critical path only' },
      { order: 6, agent: 'ez-devops-agent', task: 'Basic deployment (skip monitoring)' },
      { order: 7, agent: 'ez-context-manager', task: 'Minimal documentation + tech debt log' }
    ],
    gateRequirements: [1, 4],
    skillLimit: 4,
    documentation: 'minimal',
    testing: 'smoke-only',
    guardrails: [
      'Technical debt must be logged',
      'Minimal documentation acceptable',
      'Smoke tests only'
    ],
    tradeOffs: {
      pros: ['Fast delivery', 'Minimal overhead'],
      cons: ['Technical debt created', 'Limited test coverage', 'Minimal documentation']
    }
  },
  [MODES.SCALE_UP]: {
    name: 'Scale-up Mode Workflow',
    description: 'Performance critical with scalability patterns',
    steps: [
      { order: 1, agent: 'ez-architect-agent', task: 'Scalability review (bottleneck analysis)' },
      { order: 2, agent: 'skill-activator', task: 'Activate 6 skills (scalability + performance + monitoring)' },
      { order: 3, agent: 'ez-backend-agent', task: 'Performance-optimized implementation' },
      { order: 4, agent: 'ez-frontend-agent', task: 'Performance-optimized UI' },
      { order: 5, agent: 'ez-qa-agent', task: 'Load tests + performance benchmarks' },
      { order: 6, agent: 'ez-devops-agent', task: 'Auto-scaling + monitoring + alerting' },
      { order: 7, agent: 'ez-context-manager', task: 'Performance documentation' }
    ],
    gateRequirements: 'all',
    skillLimit: 6,
    documentation: 'complete',
    testing: 'full + load',
    guardrails: [
      'Performance budget required',
      'Load testing required',
      'Monitoring must be configured'
    ],
    focusAreas: [
      'Database query optimization',
      'Caching strategy',
      'Horizontal scaling',
      'Rate limiting',
      'Monitoring dashboards'
    ]
  },
  [MODES.MAINTENANCE]: {
    name: 'Maintenance Mode Workflow',
    description: 'Stability over new features with minimal risk changes',
    steps: [
      { order: 1, agent: 'ez-context-manager', task: 'Impact analysis' },
      { order: 2, agent: 'ez-architect-agent', task: 'Risk assessment (only for significant changes)' },
      { order: 3, agent: 'skill-activator', task: 'Activate 5 skills (stability + testing + rollback)' },
      { order: 4, agent: 'ez-backend-agent', task: 'Minimal fix' },
      { order: 5, agent: 'ez-qa-agent', task: 'Regression tests' },
      { order: 6, agent: 'ez-devops-agent', task: 'Safe deployment (rollback ready)' },
      { order: 7, agent: 'ez-context-manager', task: 'Update change log' }
    ],
    gateRequirements: [1, 3, 4, 5],
    skillLimit: 5,
    documentation: 'minimal',
    testing: 'regression-required',
    guardrails: [
      'No architectural changes without approval',
      'Rollback plan required',
      'Regression tests mandatory'
    ]
  }
};

// ============================================================================
// WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Get workflow definition for a mode
 *
 * @param {string} mode - Mode name
 * @returns {Object} Workflow definition
 */
function getWorkflow(mode) {
  return WORKFLOWS[mode] || WORKFLOWS[MODES.EXISTING];
}

/**
 * Get gate requirements for a mode
 *
 * @param {string} mode - Mode name
 * @returns {Array|string} Gate requirements
 */
function getGateRequirements(mode) {
  const workflow = getWorkflow(mode);
  return workflow ? workflow.gateRequirements : 'all';
}

/**
 * Get skill limit for a mode
 *
 * @param {string} mode - Mode name
 * @returns {number} Skill limit
 */
function getSkillLimit(mode) {
  const workflow = getWorkflow(mode);
  return workflow ? workflow.skillLimit : 5;
}

/**
 * Get guardrails for a mode
 *
 * @param {string} mode - Mode name
 * @returns {Array} Guardrails
 */
function getGuardrails(mode) {
  const workflow = getWorkflow(mode);
  return workflow ? (workflow.guardrails || []) : [];
}

/**
 * Apply mode-specific context to a task
 *
 * @param {Object} task - Task object
 * @param {string} mode - Mode name
 * @returns {Object} Task with mode context applied
 */
function applyModeContext(task, mode) {
  const workflow = getWorkflow(mode);
  const config = MODE_CONFIGS[mode];

  return {
    ...task,
    mode: mode,
    modeContext: {
      skillLimit: workflow.skillLimit,
      gateRequirements: workflow.gateRequirements,
      documentation: workflow.documentation,
      testing: workflow.testing,
      guardrails: workflow.guardrails || [],
      ceremony: config.ceremony
    }
  };
}

/**
 * Get workflow steps for a mode
 *
 * @param {string} mode - Mode name
 * @returns {Array} Workflow steps
 */
function getWorkflowSteps(mode) {
  const workflow = getWorkflow(mode);
  return workflow ? workflow.steps : [];
}

/**
 * Check if a gate is required for a mode
 *
 * @param {string} mode - Mode name
 * @param {number} gateNumber - Gate number (1-7)
 * @returns {boolean} True if gate is required
 */
function isGateRequired(mode, gateNumber) {
  const gates = getGateRequirements(mode);

  if (gates === 'all') {
    return true;
  }

  return gates.includes(gateNumber);
}

/**
 * Get mode description
 *
 * @param {string} mode - Mode name
 * @returns {string} Mode description
 */
function getModeDescription(mode) {
  const workflow = getWorkflow(mode);
  return workflow ? workflow.description : 'Unknown mode';
}

/**
 * Get all modes
 *
 * @returns {Array} All mode names
 */
function getAllModes() {
  return Object.values(MODES);
}

/**
 * Get mode comparison table
 *
 * @returns {string} Markdown comparison table
 */
function getModeComparisonTable() {
  const lines = [
    '| Mode | Skill Limit | Gates | Documentation | Testing | Ceremony |',
    '|------|-------------|-------|---------------|---------|----------|'
  ];

  for (const [mode, config] of Object.entries(MODE_CONFIGS)) {
    const gates = Array.isArray(config.gates) ? config.gates.join(', ') : config.gates;
    lines.push(
      `| ${mode} | ${config.skillLimit} | ${gates} | ${config.documentation} | ${config.testing} | ${config.ceremony} |`
    );
  }

  return lines.join('\n');
}

/**
 * Generate workflow report
 *
 * @param {string} mode - Mode name
 * @returns {string} Markdown report
 */
function generateWorkflowReport(mode) {
  const workflow = getWorkflow(mode);
  const config = MODE_CONFIGS[mode];

  if (!workflow) {
    return '## Workflow Report\n\nMode not found.';
  }

  const lines = [
    `## ${workflow.name}`,
    '',
    `**Description:** ${workflow.description}`,
    '',
    '### Configuration',
    '',
    `| Setting | Value |`,
    `|---------|-------|`,
    `| Skill Limit | ${workflow.skillLimit} |`,
    `| Gate Requirements | ${Array.isArray(workflow.gateRequirements) ? workflow.gateRequirements.join(', ') : workflow.gateRequirements} |`,
    `| Documentation | ${workflow.documentation} |`,
    `| Testing | ${workflow.testing} |`,
    '',
    '### Workflow Steps',
    '',
    '| Order | Agent | Task |',
    '|-------|-------|------|'
  ];

  for (const step of workflow.steps) {
    lines.push(`| ${step.order} | ${step.agent} | ${step.task} |`);
  }

  if (workflow.guardrails && workflow.guardrails.length > 0) {
    lines.push('', '### Guardrails', '');
    for (const guardrail of workflow.guardrails) {
      lines.push(`- ${guardrail}`);
    }
  }

  if (workflow.focusAreas && workflow.focusAreas.length > 0) {
    lines.push('', '### Focus Areas', '');
    for (const area of workflow.focusAreas) {
      lines.push(`- ${area}`);
    }
  }

  if (workflow.tradeOffs) {
    lines.push('', '### Trade-offs', '');
    lines.push('**Pros:**');
    for (const pro of workflow.tradeOffs.pros) {
      lines.push(`- ✅ ${pro}`);
    }
    lines.push('**Cons:**');
    for (const con of workflow.tradeOffs.cons) {
      lines.push(`- ⚠️ ${con}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  getWorkflow,
  getGateRequirements,
  getSkillLimit,
  getGuardrails,
  applyModeContext,

  // Helpers
  getWorkflowSteps,
  isGateRequired,
  getModeDescription,
  getAllModes,
  getModeComparisonTable,
  generateWorkflowReport,

  // Workflow definitions
  WORKFLOWS
};

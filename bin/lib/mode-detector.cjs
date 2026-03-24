#!/usr/bin/env node
'use strict';

/**
 * Mode Detection Engine
 *
 * Analyzes project context and determines appropriate operation mode.
 * Supports 5 modes: Greenfield, Existing, MVP, Scale-up, Maintenance.
 *
 * @module mode-detector
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Operation modes
 */
const MODES = {
  GREENFIELD: 'greenfield',
  EXISTING: 'existing',
  RAPID_MVP: 'rapid-mvp',
  SCALE_UP: 'scale-up',
  MAINTENANCE: 'maintenance'
};

/**
 * Mode configuration with skill limits, gate requirements, and ceremony levels
 */
const MODE_CONFIGS = {
  [MODES.GREENFIELD]: {
    ceremony: 'full',
    skillLimit: 7,
    gates: 'all', // All 7 gates
    documentation: 'complete',
    testing: 'full-coverage',
    description: 'New project with full freedom to choose architecture'
  },
  [MODES.EXISTING]: {
    ceremony: 'standard',
    skillLimit: 6,
    gates: [1, 2, 3, 4, 5], // Skip Gate 6 for small changes
    documentation: 'standard',
    testing: 'regression + new',
    patternConsistency: 'required',
    description: 'Existing codebase requiring pattern consistency'
  },
  [MODES.RAPID_MVP]: {
    ceremony: 'minimal',
    skillLimit: 4,
    gates: [1, 4], // Only requirements + security
    documentation: 'minimal',
    testing: 'smoke-only',
    techDebtLog: 'required',
    description: 'Rapid MVP with speed over perfection'
  },
  [MODES.SCALE_UP]: {
    ceremony: 'full',
    skillLimit: 6,
    gates: 'all',
    documentation: 'complete',
    testing: 'full + load',
    performanceBudget: 'required',
    loadTesting: 'required',
    description: 'Scale-up mode for high-traffic applications'
  },
  [MODES.MAINTENANCE]: {
    ceremony: 'minimal',
    skillLimit: 5,
    gates: [1, 3, 4, 5], // Skip Gate 2 for small fixes
    documentation: 'minimal',
    testing: 'regression-required',
    rollbackPlan: 'required',
    description: 'Maintenance mode for stable products'
  }
};

/**
 * Mode signals for detection
 */
const MODE_SIGNALS = {
  [MODES.GREENFIELD]: [
    'no-existing-codebase',
    'new-project',
    'full-freedom',
    'greenfield',
    'from-scratch'
  ],
  [MODES.EXISTING]: [
    'has-codebase',
    'incremental-change',
    'pattern-consistency-needed',
    'existing-project',
    'feature-addition'
  ],
  [MODES.RAPID_MVP]: [
    'deadline-critical',
    'poc',
    'minimal-features',
    'team-size-small',
    'mvp',
    'prototype',
    'demo'
  ],
  [MODES.SCALE_UP]: [
    'high-traffic',
    'performance-issue',
    'scaling-requirement',
    'growth',
    'bottleneck',
    'optimization'
  ],
  [MODES.MAINTENANCE]: [
    'stable-product',
    'bug-fix',
    'minor-improvement',
    'no-breaking-changes',
    'hotfix',
    'patch'
  ]
};

// ============================================================================
// MODE DETECTION
// ============================================================================

/**
 * Detect operation mode from project context
 *
 * @param {Object} projectContext - Project context
 * @param {Array} projectContext.signals - Context signals
 * @param {Object} projectContext.constraints - Project constraints
 * @param {string} projectContext.projectType - Project type
 * @returns {Object} Detection result: { mode, confidence, signals }
 */
function detectMode(projectContext) {
  const { signals = [], constraints = {}, projectType = '' } = projectContext;
  const scores = {};

  // Score each mode based on context signals
  for (const [mode, modeSignals] of Object.entries(MODE_SIGNALS)) {
    scores[mode] = 0;

    for (const signal of modeSignals) {
      if (signals.includes(signal)) {
        scores[mode]++;
      }
      // Also check constraint-based signals
      if (constraints.deadline && signal === 'deadline-critical') {
        const deadlineWeeks = parseInt(constraints.deadline) || 4;
        if (deadlineWeeks <= 2) {
          scores[mode]++;
        }
      }
      if (constraints.teamSize && signal === 'team-size-small') {
        if (constraints.teamSize <= 2) {
          scores[mode]++;
        }
      }
      // Check project type
      if (projectType.toLowerCase().includes(signal)) {
        scores[mode]++;
      }
    }
  }

  // Find highest scoring mode
  const sortedModes = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const detectedMode = sortedModes[0][0];
  const maxScore = sortedModes[0][1];

  // Calculate confidence
  const totalSignals = Object.keys(MODE_SIGNALS).length;
  const confidence = maxScore > 0 ? maxScore / totalSignals : 0.5;

  return {
    mode: detectedMode,
    confidence: Math.min(confidence, 1.0),
    signals: scores,
    allScores: scores
  };
}

/**
 * Get configuration for a mode
 *
 * @param {string} mode - Mode name
 * @returns {Object} Mode configuration
 */
function getModeConfig(mode) {
  return MODE_CONFIGS[mode] || MODE_CONFIGS[MODES.EXISTING];
}

/**
 * Get all mode signals
 *
 * @returns {Object} Mode signals map
 */
function getModeSignals() {
  return { ...MODE_SIGNALS };
}

/**
 * Get skill limit for mode
 *
 * @param {string} mode - Mode name
 * @returns {number} Skill limit
 */
function getSkillLimit(mode) {
  const config = MODE_CONFIGS[mode];
  return config ? config.skillLimit : 5;
}

/**
 * Get gate requirements for mode
 *
 * @param {string} mode - Mode name
 * @returns {Array|string} Gate requirements
 */
function getGateRequirements(mode) {
  const config = MODE_CONFIGS[mode];
  return config ? config.gates : 'all';
}

/**
 * Get guardrails for mode
 *
 * @param {string} mode - Mode name
 * @returns {Array} Guardrails
 */
function getGuardrails(mode) {
  const guardrails = {
    [MODES.GREENFIELD]: [],
    [MODES.EXISTING]: [
      'No breaking changes without migration plan',
      'New code matches existing patterns',
      'Refactoring requires separate task'
    ],
    [MODES.RAPID_MVP]: [
      'Technical debt must be logged',
      'Minimal documentation acceptable',
      'Smoke tests only'
    ],
    [MODES.SCALE_UP]: [
      'Performance budget required',
      'Load testing required',
      'Monitoring must be configured'
    ],
    [MODES.MAINTENANCE]: [
      'No architectural changes without approval',
      'Rollback plan required',
      'Regression tests mandatory'
    ]
  };

  return guardrails[mode] || [];
}

/**
 * Check if mode requires specific gate
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
 * Get mode from workflow type
 *
 * @param {string} workflowType - Workflow type
 * @returns {string} Mode name
 */
function getModeFromWorkflow(workflowType) {
  const workflowModeMap = {
    'new-project': MODES.GREENFIELD,
    'feature-addition': MODES.EXISTING,
    'mvp': MODES.RAPID_MVP,
    'performance-optimization': MODES.SCALE_UP,
    'bug-fix': MODES.MAINTENANCE,
    'hotfix': MODES.MAINTENANCE
  };

  return workflowModeMap[workflowType] || MODES.EXISTING;
}

/**
 * Validate mode detection
 *
 * @param {Object} detection - Detection result
 * @returns {Object} Validation result
 */
function validateModeDetection(detection) {
  const warnings = [];

  if (detection.confidence < 0.5) {
    warnings.push({
      type: 'low-confidence',
      message: `Mode detection confidence is low (${(detection.confidence * 100).toFixed(0)}%)`,
      suggestion: 'Consider manually specifying the mode'
    });
  }

  // Check for conflicting signals
  const scores = detection.allScores || {};
  const highScores = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (highScores.length > 1 && highScores[0][1] === highScores[1][1]) {
    warnings.push({
      type: 'conflicting-signals',
      message: `Multiple modes have same score: ${highScores[0][0]} and ${highScores[1][0]}`,
      suggestion: 'Review context signals and manually select mode if needed'
    });
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Generate mode detection report
 *
 * @param {Object} detection - Detection result
 * @returns {string} Markdown report
 */
function generateModeReport(detection) {
  const config = getModeConfig(detection.mode);

  const lines = [
    '## Mode Detection Report',
    '',
    `**Detected Mode:** ${detection.mode}`,
    `**Confidence:** ${(detection.confidence * 100).toFixed(0)}%`,
    '',
    '### Mode Configuration',
    '',
    `| Setting | Value |`,
    `|---------|-------|`,
    `| Ceremony | ${config.ceremony} |`,
    `| Skill Limit | ${config.skillLimit} |`,
    `| Gates | ${Array.isArray(config.gates) ? config.gates.join(', ') : config.gates} |`,
    `| Documentation | ${config.documentation} |`,
    `| Testing | ${config.testing} |`,
    '',
    '### Signal Scores',
    ''
  ];

  for (const [mode, score] of Object.entries(detection.signals)) {
    lines.push(`- **${mode}:** ${score}`);
  }

  return lines.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  detectMode,
  getModeConfig,
  getModeSignals,

  // Helpers
  getSkillLimit,
  getGateRequirements,
  getGuardrails,
  isGateRequired,
  getModeFromWorkflow,
  validateModeDetection,
  generateModeReport,

  // Constants
  MODES,
  MODE_CONFIGS,
  MODE_SIGNALS
};

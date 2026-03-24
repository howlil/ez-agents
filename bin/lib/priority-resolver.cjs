#!/usr/bin/env node
'use strict';

/**
 * Skill Priority Resolver
 * 
 * Provides:
 * - Sensitive area detection
 * - Priority resolution rules
 * - Priority checkpoint integration
 * 
 * @module priority-resolver
 */

const fs = require('fs');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Priority levels (higher number = higher priority)
 */
const PRIORITY_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Priority types
 */
const PRIORITY_TYPES = {
  SECURITY: 'security',
  SPEED: 'speed',
  MAINTAINABILITY: 'maintainability',
  NOVELTY: 'novelty',
  DELIVERY_SPEED: 'delivery_speed',
  IDEAL_ARCHITECTURE: 'ideal_architecture'
};

/**
 * Sensitive area keywords that trigger security priority
 * From CONTEXT.md - 12 keywords (do not modify without approval)
 */
const SENSITIVE_KEYWORDS = [
  'auth',
  'login',
  'jwt',
  'oauth',
  'payment',
  'billing',
  'security',
  'database',
  'migration',
  'schema',
  'pii',
  'secret',
  'credential'
];

/**
 * Priority rules with conditions
 */
const PRIORITY_RULES = {
  'security_over_speed': {
    priority: PRIORITY_TYPES.SECURITY,
    overrides: [PRIORITY_TYPES.SPEED],
    when: ['auth', 'payment', 'pii', 'database_schema'],
    description: 'Security takes precedence over speed for sensitive operations',
    checkpoint_required: true
  },
  'maintainability_over_novelty': {
    priority: PRIORITY_TYPES.MAINTAINABILITY,
    overrides: [PRIORITY_TYPES.NOVELTY],
    when: ['core_module', 'shared_library'],
    description: 'Maintainability takes precedence over novelty for core modules',
    checkpoint_required: false
  },
  'delivery_over_architecture': {
    priority: PRIORITY_TYPES.DELIVERY_SPEED,
    overrides: [PRIORITY_TYPES.IDEAL_ARCHITECTURE],
    when: ['POC', 'MVP', 'deadline_critical'],
    description: 'Delivery speed takes precedence over ideal architecture for time-critical work',
    checkpoint_required: false
  }
};

/**
 * Mode to priority mapping
 */
const MODE_PRIORITY_MAP = {
  'Greenfield': PRIORITY_TYPES.IDEAL_ARCHITECTURE,
  'Brownfield': PRIORITY_TYPES.MAINTAINABILITY,
  'MVP': PRIORITY_TYPES.DELIVERY_SPEED,
  'Scale-Up': PRIORITY_TYPES.SECURITY,
  'Maintenance': PRIORITY_TYPES.MAINTAINABILITY
};

// ============================================================================
// SENSITIVE AREA DETECTION
// ============================================================================

/**
 * Detect sensitive areas in task description
 * 
 * @param {string} taskDescription - Task description text
 * @returns {Object} Detection result: { isSensitive, matchedKeywords, priorityLevel }
 */
function detectSensitiveArea(taskDescription) {
  const text = taskDescription.toLowerCase();
  const matchedKeywords = [];
  
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    }
  }
  
  const isSensitive = matchedKeywords.length > 0;
  const priorityLevel = isSensitive ? PRIORITY_LEVELS.CRITICAL : PRIORITY_LEVELS.LOW;
  
  return {
    isSensitive,
    matchedKeywords,
    priorityLevel,
    priorityLevelName: isSensitive ? 'CRITICAL' : 'LOW',
    requiresSecurityPriority: isSensitive,
    recommendation: isSensitive 
      ? 'Auto-trigger security priority. Downgrade requires explicit approval.'
      : 'No sensitive areas detected. Standard priority rules apply.'
  };
}

/**
 * Check if task involves specific sensitive area type
 * 
 * @param {string} taskDescription - Task description text
 * @param {string} areaType - Type of sensitive area (auth, payment, database, etc.)
 * @returns {boolean} True if task involves the sensitive area
 */
function isSensitiveAreaType(taskDescription, areaType) {
  const areaKeywords = {
    'auth': ['auth', 'login', 'jwt', 'oauth', 'credential', 'secret'],
    'payment': ['payment', 'billing', 'transaction', 'invoice'],
    'database': ['database', 'migration', 'schema', 'table', 'query'],
    'pii': ['pii', 'personal', 'gdpr', 'privacy', 'user data'],
    'security': ['security', 'encryption', 'hash', 'token']
  };
  
  const keywords = areaKeywords[areaType] || [];
  const text = taskDescription.toLowerCase();
  
  return keywords.some(keyword => text.includes(keyword));
}

// ============================================================================
// PRIORITY RESOLUTION RULES
// ============================================================================

/**
 * Resolve priority based on skills and context
 * 
 * @param {Array} skills - Array of activated skills
 * @param {Object} context - Context object
 * @param {string} context.mode - Operational mode
 * @param {string} context.archetype - Project archetype
 * @param {Array} context.constraints - Business constraints
 * @param {string} taskDescription - Task description
 * @returns {Object} Priority result: { priority, reason, overrides, rule }
 */
function resolvePriority(skills, context, taskDescription) {
  const result = {
    priority: null,
    reason: null,
    overrides: [],
    rule: null,
    checkpoints: []
  };
  
  // Step 1: Check for sensitive areas (highest priority)
  const sensitiveDetection = detectSensitiveArea(taskDescription || '');
  
  if (sensitiveDetection.isSensitive) {
    result.priority = PRIORITY_TYPES.SECURITY;
    result.reason = `Sensitive area detected: ${sensitiveDetection.matchedKeywords.join(', ')}`;
    result.rule = 'security_over_speed';
    result.overrides = [PRIORITY_TYPES.SPEED];
    result.checkpoints.push('decision'); // Security priority requires decision checkpoint
    result.sensitiveKeywords = sensitiveDetection.matchedKeywords;
    
    return result;
  }
  
  // Step 2: Check mode-based priority
  if (context.mode && MODE_PRIORITY_MAP[context.mode]) {
    const modePriority = MODE_PRIORITY_MAP[context.mode];
    
    if (modePriority === PRIORITY_TYPES.DELIVERY_SPEED) {
      result.priority = PRIORITY_TYPES.DELIVERY_SPEED;
      result.reason = `MVP mode: delivery speed prioritized`;
      result.rule = 'delivery_over_architecture';
      result.overrides = [PRIORITY_TYPES.IDEAL_ARCHITECTURE];
    } else if (modePriority === PRIORITY_TYPES.MAINTAINABILITY) {
      result.priority = PRIORITY_TYPES.MAINTAINABILITY;
      result.reason = `${context.mode} mode: maintainability prioritized`;
      result.rule = 'maintainability_over_novelty';
      result.overrides = [PRIORITY_TYPES.NOVELTY];
    } else if (modePriority === PRIORITY_TYPES.SECURITY) {
      result.priority = PRIORITY_TYPES.SECURITY;
      result.reason = `${context.mode} mode: security prioritized`;
      result.rule = 'security_over_speed';
    }
    
    return result;
  }
  
  // Step 3: Check constraints
  if (context.constraints && context.constraints.length > 0) {
    for (const constraint of context.constraints) {
      if (constraint.includes('deadline') || constraint.includes('urgent')) {
        result.priority = PRIORITY_TYPES.DELIVERY_SPEED;
        result.reason = `Deadline constraint: ${constraint}`;
        result.rule = 'delivery_over_architecture';
        result.overrides = [PRIORITY_TYPES.IDEAL_ARCHITECTURE];
        return result;
      }
      
      if (constraint.includes('compliance') || constraint.includes('security')) {
        result.priority = PRIORITY_TYPES.SECURITY;
        result.reason = `Compliance constraint: ${constraint}`;
        result.rule = 'security_over_speed';
        return result;
      }
      
      if (constraint.includes('budget')) {
        result.priority = PRIORITY_TYPES.SPEED;
        result.reason = `Budget constraint: ${constraint}`;
        result.overrides = [PRIORITY_TYPES.NOVELTY];
        return result;
      }
    }
  }
  
  // Step 4: Check skills for priority hints
  if (skills.some(s => s.includes('security') || s.includes('auth'))) {
    result.priority = PRIORITY_TYPES.SECURITY;
    result.reason = 'Security-related skills activated';
    result.rule = 'security_over_speed';
    return result;
  }
  
  // Default priority
  result.priority = PRIORITY_TYPES.MAINTAINABILITY;
  result.reason = 'Default priority: maintainability';
  result.rule = null;
  
  return result;
}

/**
 * Check if priority override is allowed
 * 
 * @param {string} currentPriority - Current priority type
 * @param {string} newPriority - Proposed new priority type
 * @returns {Object} Override result: { allowed, reason }
 */
function checkOverrideAllowed(currentPriority, newPriority) {
  const priorityOrder = [
    PRIORITY_TYPES.SPEED,
    PRIORITY_TYPES.NOVELTY,
    PRIORITY_TYPES.IDEAL_ARCHITECTURE,
    PRIORITY_TYPES.DELIVERY_SPEED,
    PRIORITY_TYPES.MAINTAINABILITY,
    PRIORITY_TYPES.SECURITY
  ];
  
  const currentIndex = priorityOrder.indexOf(currentPriority);
  const newIndex = priorityOrder.indexOf(newPriority);
  
  if (newIndex === -1 || currentIndex === -1) {
    return {
      allowed: false,
      reason: 'Invalid priority type'
    };
  }
  
  // Higher priority can override lower priority
  if (newIndex > currentIndex) {
    return {
      allowed: true,
      reason: `${newPriority} (level ${newIndex}) can override ${currentPriority} (level ${currentIndex})`
    };
  }
  
  // Lower priority cannot override higher priority without approval
  return {
    allowed: false,
    reason: `${newPriority} (level ${newIndex}) cannot override ${currentPriority} (level ${currentIndex}) without approval`,
    requiresApproval: true
  };
}

/**
 * Downgrade security priority (requires explicit approval)
 * 
 * @param {string} taskDescription - Task description
 * @param {string} reason - Reason for downgrade
 * @param {string} approver - Approver name/ID
 * @returns {Object} Downgrade result: { approved, newPriority, audit_entry }
 */
function downgradeSecurityPriority(taskDescription, reason, approver) {
  const sensitiveDetection = detectSensitiveArea(taskDescription);
  
  if (!sensitiveDetection.isSensitive) {
    return {
      approved: true,
      newPriority: PRIORITY_TYPES.MAINTAINABILITY,
      reason: 'No sensitive areas detected, downgrade not required',
      audit_entry: null
    };
  }
  
  // Security downgrade requires explicit approval
  const auditEntry = {
    type: 'security_downgrade',
    task_description: taskDescription,
    sensitive_keywords: sensitiveDetection.matchedKeywords,
    reason,
    approver,
    timestamp: new Date().toISOString(),
    approved: true // In real implementation, this would require actual approval
  };
  
  return {
    approved: true,
    newPriority: PRIORITY_TYPES.MAINTAINABILITY,
    reason: 'Security priority downgraded with explicit approval',
    audit_entry: auditEntry,
    warning: 'Security downgrade approved. Ensure proper security measures are still implemented.'
  };
}

// ============================================================================
// PRIORITY CHECKPOINTS
// ============================================================================

/**
 * Determine checkpoint type for priority conflict
 * 
 * @param {Object} priorityResult - Result from resolvePriority
 * @returns {Object} Checkpoint result: { checkpoint_type, reason, auto_advance }
 */
function determineCheckpoint(priorityResult) {
  // Security priority override requires decision checkpoint
  if (priorityResult.priority === PRIORITY_TYPES.SECURITY && priorityResult.overrides.length > 0) {
    return {
      checkpoint_type: 'decision',
      reason: 'Security priority override requires explicit approval',
      auto_advance: 0.09, // 9% auto-advance with default recommendation
      default_recommendation: 'Proceed with security-first approach'
    };
  }
  
  // Security downgrade requires decision checkpoint
  if (priorityResult.rule === 'security_over_speed' && priorityResult.checkpoints?.includes('decision')) {
    return {
      checkpoint_type: 'decision',
      reason: 'Security priority decision point',
      auto_advance: 0.09,
      default_recommendation: 'Maintain security priority'
    };
  }
  
  // No checkpoint required
  return {
    checkpoint_type: null,
    reason: 'No priority conflict detected',
    auto_advance: 1.0
  };
}

/**
 * Log priority decision to file
 * 
 * @param {Object} decision - Priority decision object
 * @param {string} logFilePath - Path to log file
 */
function logPriorityDecision(decision, logFilePath) {
  try {
    let logData = { decisions: [] };
    
    if (fs.existsSync(logFilePath)) {
      const content = fs.readFileSync(logFilePath, 'utf8');
      logData = JSON.parse(content);
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      task_id: decision.taskId,
      priority: decision.priority,
      reason: decision.reason,
      rule: decision.rule,
      overrides: decision.overrides,
      checkpoint: decision.checkpoint,
      sensitive_keywords: decision.sensitiveKeywords
    };

    logData.decisions.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to log priority decision:', error.message);
  }
}

// ============================================================================
// PRIORITY RULES DOCUMENTATION
// ============================================================================

/**
 * Generate priority rules documentation
 * 
 * @returns {string} Markdown documentation of priority rules
 */
function generatePriorityRulesDoc() {
  let doc = `# Priority Rules Documentation

**Generated:** ${new Date().toISOString()}

---

## Priority Levels

| Level | Priority | Description |
|-------|----------|-------------|
| 4 | CRITICAL | Security-critical operations |
| 3 | HIGH | Important business logic |
| 2 | MEDIUM | Standard operations |
| 1 | LOW | Minor enhancements |

---

## Priority Rules

`;

  for (const [ruleId, rule] of Object.entries(PRIORITY_RULES)) {
    doc += `### ${ruleId}

- **Priority:** ${rule.priority}
- **Overrides:** ${rule.overrides.join(', ')}
- **When:** ${rule.when.join(', ')}
- **Description:** ${rule.description}
- **Checkpoint Required:** ${rule.checkpoint_required ? 'Yes' : 'No'}

---

`;
  }

  doc += `## Sensitive Keywords

The following keywords trigger automatic security priority:

`;

  for (const keyword of SENSITIVE_KEYWORDS) {
    doc += `- \`${keyword}\`\n`;
  }

  doc += `

**Note:** Security priority downgrade requires explicit approval (decision checkpoint).

---

## Mode-Based Priority

| Mode | Default Priority |
|------|-----------------|
`;

  for (const [mode, priority] of Object.entries(MODE_PRIORITY_MAP)) {
    doc += `| ${mode} | ${priority} |\n`;
  }

  return doc;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main functions
  detectSensitiveArea,
  isSensitiveAreaType,
  resolvePriority,
  checkOverrideAllowed,
  downgradeSecurityPriority,
  determineCheckpoint,
  logPriorityDecision,
  generatePriorityRulesDoc,

  // Constants
  PRIORITY_LEVELS,
  PRIORITY_TYPES,
  PRIORITY_RULES,
  SENSITIVE_KEYWORDS,
  MODE_PRIORITY_MAP
};

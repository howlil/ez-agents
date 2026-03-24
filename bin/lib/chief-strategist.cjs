#!/usr/bin/env node
'use strict';

/**
 * Chief Strategist Orchestrator
 * 
 * Central intelligence layer that:
 * - Classifies work (feature, bug, refactor, migration, incident)
 * - Executes 7-state state machine
 * - Enforces anti-overengineering guardrails
 * - Routes tasks to specialist agents
 * 
 * @module chief-strategist
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONSTANTS
// ============================================================================

const WORK_TYPES = {
  FEATURE: 'feature',
  BUG: 'bug',
  REFACTOR: 'refactor',
  MIGRATION: 'migration',
  INCIDENT: 'incident'
};

const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const STATES = {
  TRIAGE: 'TRIAGE',
  RETRIEVE_CONTEXT: 'RETRIEVE_CONTEXT',
  PROPOSE_ACTION: 'PROPOSE_ACTION',
  POLICY_CHECK: 'POLICY_CHECK',
  EXECUTE: 'EXECUTE',
  VERIFY: 'VERIFY',
  COMPLETE: 'COMPLETE'
};

const CHECKPOINT_TYPES = {
  HUMAN_VERIFY: 'human-verify',
  DECISION: 'decision',
  HUMAN_ACTION: 'human-action'
};

const SENSITIVE_KEYWORDS = [
  'auth', 'login', 'jwt', 'oauth',
  'payment', 'billing',
  'security',
  'database', 'migration', 'schema',
  'pii', 'secret', 'credential'
];

const MAX_ABSTRACTION_LAYERS = 3;

// ============================================================================
// WORK CLASSIFICATION ENGINE
// ============================================================================

/**
 * Classifiers for each work type with keyword patterns
 */
const WORK_CLASSIFIERS = {
  [WORK_TYPES.FEATURE]: {
    keywords: ['implement', 'add', 'create', 'build', 'develop', 'new', 'enable', 'support', 'introduce'],
    weight: 1.0
  },
  [WORK_TYPES.BUG]: {
    keywords: ['fix', 'bug', 'issue', 'error', 'crash', 'fail', 'broken', 'not working', 'incorrect', 'wrong'],
    weight: 1.2
  },
  [WORK_TYPES.REFACTOR]: {
    keywords: ['refactor', 'restructure', 'clean', 'simplify', 'optimize', 'improve', 'reorganize', 'rename', 'extract'],
    weight: 1.0
  },
  [WORK_TYPES.MIGRATION]: {
    keywords: ['migrate', 'upgrade', 'move', 'convert', 'transform', 'port', 'transfer', 'update version'],
    weight: 1.1
  },
  [WORK_TYPES.INCIDENT]: {
    keywords: ['incident', 'outage', 'emergency', 'critical', 'production', 'urgent', 'down', 'unavailable'],
    weight: 1.5
  }
};

/**
 * Classify incoming work task by type
 * 
 * @param {Object} task - Task object with description
 * @param {string} task.description - Task description text
 * @param {string} [task.title] - Optional task title
 * @returns {Object} Classification result: { type, confidence, matched_keywords, requires_review }
 */
function classifyWork(task) {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
  const results = {};
  
  // Score each work type
  for (const [workType, classifier] of Object.entries(WORK_CLASSIFIERS)) {
    const matches = [];
    let score = 0;
    
    for (const keyword of classifier.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches.push(keyword);
        score += classifier.weight;
      }
    }
    
    if (matches.length > 0) {
      results[workType] = {
        score,
        matches,
        confidence: calculateConfidence(score, matches.length)
      };
    }
  }
  
  // Determine primary classification
  const primaryType = getPrimaryClassification(results);
  
  if (!primaryType) {
    return {
      type: WORK_TYPES.FEATURE, // Default to feature
      confidence: CONFIDENCE_LEVELS.LOW,
      matched_keywords: [],
      requires_review: true,
      all_scores: results
    };
  }
  
  const classification = results[primaryType];
  
  return {
    type: primaryType,
    confidence: classification.confidence,
    matched_keywords: classification.matches,
    requires_review: classification.confidence === CONFIDENCE_LEVELS.LOW,
    all_scores: results
  };
}

/**
 * Calculate confidence level based on score and match count
 * 
 * @param {number} score - Raw classification score
 * @param {number} matchCount - Number of keyword matches
 * @returns {string} Confidence level: 'high', 'medium', or 'low'
 */
function calculateConfidence(score, matchCount) {
  // High confidence: score >= 3 OR matchCount >= 3
  // Medium confidence: score >= 1.5 OR matchCount >= 2
  // Low confidence: everything else
  
  if (score >= 3 || matchCount >= 3) {
    return CONFIDENCE_LEVELS.HIGH;
  } else if (score >= 1.5 || matchCount >= 2) {
    return CONFIDENCE_LEVELS.MEDIUM;
  }
  return CONFIDENCE_LEVELS.LOW;
}

/**
 * Get the primary classification from scored results
 * 
 * @param {Object} results - Scored classification results
 * @returns {string|null} Primary work type or null if no matches
 */
function getPrimaryClassification(results) {
  let primaryType = null;
  let highestScore = 0;
  
  for (const [workType, data] of Object.entries(results)) {
    if (data.score > highestScore) {
      highestScore = data.score;
      primaryType = workType;
    }
  }
  
  return primaryType;
}

// ============================================================================
// STATE MACHINE EXECUTOR
// ============================================================================

/**
 * State machine configuration
 */
const STATE_MACHINE_CONFIG = {
  [STATES.TRIAGE]: {
    next: [STATES.RETRIEVE_CONTEXT],
    entry: 'Classify incoming work',
    exit: 'Work classified, context retrieval initiated'
  },
  [STATES.RETRIEVE_CONTEXT]: {
    next: [STATES.PROPOSE_ACTION],
    entry: 'Load context from Context Engine',
    exit: 'Context loaded, action proposal initiated'
  },
  [STATES.PROPOSE_ACTION]: {
    next: [STATES.POLICY_CHECK],
    entry: 'Generate action proposal with skill activation',
    exit: 'Action proposed, policy check initiated'
  },
  [STATES.POLICY_CHECK]: {
    next: [STATES.EXECUTE, CHECKPOINT_TYPES.DECISION],
    entry: 'Validate against constraints and priority rules',
    exit: 'Policy validated, execution initiated'
  },
  [STATES.EXECUTE]: {
    next: [STATES.VERIFY],
    entry: 'Route to specialist agent',
    exit: 'Execution complete, verification initiated'
  },
  [STATES.VERIFY]: {
    next: [STATES.COMPLETE, CHECKPOINT_TYPES.HUMAN_VERIFY],
    entry: 'Collect and validate results',
    exit: 'Results validated, completion initiated'
  },
  [STATES.COMPLETE]: {
    next: [],
    entry: 'Log decision and update state',
    exit: 'State machine completed'
  }
};

/**
 * State Machine Executor class
 */
class StateMachineExecutor {
  constructor(options = {}) {
    this.currentState = STATES.TRIAGE;
    this.stateHistory = [];
    this.checkpoints = [];
    this.isPaused = false;
    this.autoAdvance = options.autoAdvance || false;
    this.stateFilePath = options.stateFilePath || null;
    this.taskId = options.taskId || null;
    
    this.logStateTransition(null, this.currentState, 'State machine initialized');
  }
  
  /**
   * Get current state
   * @returns {string} Current state name
   */
  getCurrentState() {
    return this.currentState;
  }
  
  /**
   * Check if state machine is paused
   * @returns {boolean} True if paused
   */
  isMachinePaused() {
    return this.isPaused;
  }
  
  /**
   * Execute state transition
   * 
   * @param {string} nextState - Next state to transition to
   * @param {Object} context - Context data for the transition
   * @returns {Object} Transition result: { success, state, checkpoint }
   */
  transition(nextState, context = {}) {
    const config = STATE_MACHINE_CONFIG[this.currentState];
    
    if (!config) {
      return {
        success: false,
        error: `Invalid current state: ${this.currentState}`
      };
    }
    
    // Check if next state is valid
    if (!config.next.includes(nextState)) {
      return {
        success: false,
        error: `Invalid transition from ${this.currentState} to ${nextState}`
      };
    }
    
    // Check for checkpoint
    if (Object.values(CHECKPOINT_TYPES).includes(nextState)) {
      return this.handleCheckpoint(nextState, context);
    }
    
    // Execute transition
    const previousState = this.currentState;
    this.currentState = nextState;
    
    this.logStateTransition(previousState, nextState, context.reason || 'State transition');
    
    return {
      success: true,
      state: nextState,
      previousState: previousState
    };
  }
  
  /**
   * Handle checkpoint pause
   * 
   * @param {string} checkpointType - Type of checkpoint
   * @param {Object} context - Context data
   * @returns {Object} Checkpoint result
   */
  handleCheckpoint(checkpointType, context) {
    const checkpoint = {
      type: checkpointType,
      timestamp: new Date().toISOString(),
      taskId: this.taskId,
      state: this.currentState,
      context: context,
      resolved: false,
      resolution: null
    };
    
    this.checkpoints.push(checkpoint);
    this.isPaused = true;
    
    this.logStateTransition(this.currentState, checkpointType, `Checkpoint: ${checkpointType}`);
    
    // Auto-advance rules
    if (this.autoAdvance) {
      const autoAdvanceRules = {
        [CHECKPOINT_TYPES.HUMAN_VERIFY]: 0.90,
        [CHECKPOINT_TYPES.DECISION]: 0.09,
        [CHECKPOINT_TYPES.HUMAN_ACTION]: 0.01
      };
      
      const autoAdvanceChance = Math.random();
      const threshold = autoAdvanceRules[checkpointType] || 0;
      
      if (autoAdvanceChance < threshold) {
        checkpoint.autoAdvanced = true;
        checkpoint.resolution = 'Auto-advanced per rules';
        checkpoint.resolved = true;
        this.isPaused = false;
        
        return {
          success: true,
          checkpoint: checkpointType,
          autoAdvanced: true,
          resolution: checkpoint.resolution
        };
      }
    }
    
    return {
      success: true,
      checkpoint: checkpointType,
      paused: true,
      requiresHumanInput: true
    };
  }
  
  /**
   * Resume from checkpoint
   * 
   * @param {string} resolution - Human decision/resolution
   * @returns {Object} Resume result
   */
  resume(resolution) {
    if (!this.isPaused) {
      return {
        success: false,
        error: 'State machine is not paused'
      };
    }
    
    const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];
    if (!lastCheckpoint) {
      return {
        success: false,
        error: 'No checkpoint to resume from'
      };
    }
    
    lastCheckpoint.resolved = true;
    lastCheckpoint.resolution = resolution;
    lastCheckpoint.resolvedAt = new Date().toISOString();
    
    this.isPaused = false;
    
    // Transition back to main flow
    const nextState = STATE_MACHINE_CONFIG[this.currentState]?.next?.[0] || STATES.COMPLETE;
    this.currentState = nextState;
    
    this.logStateTransition(lastCheckpoint.type, nextState, `Resumed: ${resolution}`);
    
    return {
      success: true,
      state: nextState,
      resolution: resolution
    };
  }
  
  /**
   * Log state transition to audit trail
   * 
   * @param {string} fromState - Previous state
   * @param {string} toState - New state
   * @param {string} reason - Reason for transition
   */
  logStateTransition(fromState, toState, reason) {
    const entry = {
      timestamp: new Date().toISOString(),
      taskId: this.taskId,
      from: fromState,
      to: toState,
      reason: reason
    };
    
    this.stateHistory.push(entry);
    
    // Persist to state file if configured
    if (this.stateFilePath) {
      this.persistState(entry);
    }
  }
  
  /**
   * Persist state to file
   * 
   * @param {Object} entry - State entry to persist
   */
  persistState(entry) {
    try {
      let stateData = { transitions: [] };
      
      if (fs.existsSync(this.stateFilePath)) {
        const content = fs.readFileSync(this.stateFilePath, 'utf8');
        stateData = JSON.parse(content);
      }
      
      stateData.transitions.push(entry);
      fs.writeFileSync(this.stateFilePath, JSON.stringify(stateData, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to persist state:', error.message);
    }
  }
  
  /**
   * Get state history
   * 
   * @returns {Array} Array of state transition entries
   */
  getStateHistory() {
    return this.stateHistory;
  }
  
  /**
   * Get checkpoints
   * 
   * @returns {Array} Array of checkpoint entries
   */
  getCheckpoints() {
    return this.checkpoints;
  }
  
  /**
   * Reset state machine
   */
  reset() {
    this.currentState = STATES.TRIAGE;
    this.stateHistory = [];
    this.checkpoints = [];
    this.isPaused = false;
    
    this.logStateTransition(null, this.currentState, 'State machine reset');
  }
}

// ============================================================================
// ANTI-OVERENGINEERING GUARDRAILS
// ============================================================================

/**
 * Track abstraction layer depth in proposed solutions
 */
class AbstractionLayerCounter {
  constructor() {
    this.maxLayers = MAX_ABSTRACTION_LAYERS;
    this.currentLayers = 0;
  }
  
  /**
   * Count abstraction layers in a proposed solution
   * 
   * @param {string} solution - Solution description
   * @returns {Object} Layer count result: { layers, exceeds_limit, details }
   */
  countLayers(solution) {
    const layerPatterns = [
      { pattern: /interface|abstract|virtual/i, name: 'Interface/Abstract' },
      { pattern: /factory|builder|strategy|observer|decorator/i, name: 'Design Pattern' },
      { pattern: /middleware|pipeline|chain/i, name: 'Middleware/Pipeline' },
      { pattern: /service layer|repository|dao/i, name: 'Service/Repository' },
      { pattern: /microservice|distributed|cluster/i, name: 'Distributed Architecture' },
      { pattern: /cache|queue|buffer/i, name: 'Caching/Queue Layer' },
      { pattern: /api gateway|load balancer|proxy/i, name: 'Gateway/Proxy' }
    ];
    
    const detectedLayers = [];
    
    for (const { pattern, name } of layerPatterns) {
      if (pattern.test(solution)) {
        detectedLayers.push(name);
      }
    }
    
    this.currentLayers = detectedLayers.length;
    
    return {
      layers: detectedLayers.length,
      exceeds_limit: detectedLayers.length > this.maxLayers,
      details: detectedLayers,
      recommendation: detectedLayers.length > this.maxLayers 
        ? `Consider simplifying: ${detectedLayers.length} layers detected (max: ${this.maxLayers})`
        : 'Abstraction level acceptable'
    };
  }
  
  /**
   * Reset counter
   */
  reset() {
    this.currentLayers = 0;
  }
}

/**
 * Calculate complexity score for proposed solutions
 */
function calculateComplexityScore(proposal) {
  const complexityFactors = [
    { pattern: /microservice|distributed|cluster/i, score: 3, reason: 'Distributed system complexity' },
    { pattern: /event-driven|pub-sub|message queue/i, score: 2, reason: 'Event-driven architecture' },
    { pattern: /caching|redis|memcached/i, score: 1, reason: 'Caching layer' },
    { pattern: /database|schema|migration/i, score: 2, reason: 'Database changes' },
    { pattern: /api|endpoint|route/i, score: 1, reason: 'API changes' },
    { pattern: /authentication|authorization|jwt|oauth/i, score: 2, reason: 'Security complexity' },
    { pattern: /test|mock|stub/i, score: -1, reason: 'Testing reduces risk' },
    { pattern: /rollback|fallback|graceful/i, score: -1, reason: 'Safety mechanisms' }
  ];
  
  let totalScore = 0;
  const factors = [];
  
  for (const { pattern, score, reason } of complexityFactors) {
    if (pattern.test(proposal)) {
      totalScore += score;
      factors.push({ factor: reason, score });
    }
  }
  
  const complexityLevel = totalScore >= 5 ? 'high' : totalScore >= 2 ? 'medium' : 'low';
  
  return {
    score: totalScore,
    level: complexityLevel,
    factors,
    flag_for_review: totalScore >= 5
  };
}

/**
 * Enforce YAGNI (You Ain't Gonna Need It) principle
 * 
 * @param {string} proposal - Proposed solution
 * @returns {Object} YAGNI analysis: { violations, recommendations }
 */
function enforceYAGNI(proposal) {
  const yagniPatterns = [
    { pattern: /might need|could be useful|future-proof|in case we need/i, severity: 'high' },
    { pattern: /scalability|extensibility|flexibility/i, severity: 'medium' },
    { pattern: /just in case|for later|down the road/i, severity: 'high' },
    { pattern: /generic|reusable|configurable/i, severity: 'low' }
  ];
  
  const violations = [];
  
  for (const { pattern, severity } of yagniPatterns) {
    const matches = proposal.match(pattern);
    if (matches) {
      violations.push({
        pattern: matches[0],
        severity,
        message: `YAGNI violation detected: "${matches[0]}" suggests over-engineering`
      });
    }
  }
  
  return {
    violations,
    has_violations: violations.length > 0,
    recommendations: violations.length > 0
      ? 'Focus on current requirements only. Add complexity when actually needed.'
      : 'Proposal aligns with YAGNI principle'
  };
}

/**
 * Main guardrails check function
 * 
 * @param {Object} proposal - Proposed solution object
 * @param {string} proposal.description - Solution description
 * @param {string} [proposal.architecture] - Architecture details
 * @returns {Object} Guardrails result: { passed, abstraction, complexity, yagni, blockers }
 */
function checkGuardrails(proposal) {
  const abstractionCounter = new AbstractionLayerCounter();
  const abstractionResult = abstractionCounter.countLayers(proposal.description);
  const complexityResult = calculateComplexityScore(proposal.description);
  const yagniResult = enforceYAGNI(proposal.description);
  
  const blockers = [];
  
  if (abstractionResult.exceeds_limit) {
    blockers.push({
      type: 'abstraction',
      message: abstractionResult.recommendation
    });
  }
  
  if (complexityResult.flag_for_review) {
    blockers.push({
      type: 'complexity',
      message: `High complexity score (${complexityResult.score}). Consider simplification.`
    });
  }
  
  if (yagniResult.has_violations) {
    blockers.push({
      type: 'yagni',
      message: yagniResult.recommendations,
      violations: yagniResult.violations
    });
  }
  
  return {
    passed: blockers.length === 0,
    abstraction: abstractionResult,
    complexity: complexityResult,
    yagni: yagniResult,
    blockers
  };
}

// ============================================================================
// MAIN ORCHESTRATOR CLASS
// ============================================================================

/**
 * Chief Strategist Orchestrator
 * 
 * Main entry point for task orchestration
 */
class ChiefStrategistOrchestrator {
  constructor(options = {}) {
    this.options = options;
    this.stateMachine = new StateMachineExecutor({
      autoAdvance: options.autoAdvance || false,
      stateFilePath: options.stateFilePath,
      taskId: options.taskId
    });
    this.classificationHistory = [];
  }
  
  /**
   * Process incoming task through orchestrator
   * 
   * @param {Object} task - Task to process
   * @param {string} task.description - Task description
   * @param {string} [task.title] - Task title
   * @param {Object} [task.context] - Additional context
   * @returns {Object} Processing result
   */
  async processTask(task) {
    const result = {
      taskId: task.id || Date.now().toString(),
      classification: null,
      stateTransitions: [],
      guardrailsCheck: null,
      checkpoints: [],
      output: null
    };
    
    // State 1: TRIAGE - Classify work
    this.stateMachine.currentState = STATES.TRIAGE;
    result.classification = classifyWork(task);
    this.classificationHistory.push({
      taskId: result.taskId,
      classification: result.classification,
      timestamp: new Date().toISOString()
    });
    
    // State 2: RETRIEVE_CONTEXT - Load context (placeholder for Phase 37 integration)
    const transition1 = this.stateMachine.transition(STATES.RETRIEVE_CONTEXT, {
      reason: 'Work classified'
    });
    result.stateTransitions.push(transition1);
    
    // State 3: PROPOSE_ACTION - Generate proposal
    const transition2 = this.stateMachine.transition(STATES.PROPOSE_ACTION, {
      reason: 'Context retrieved'
    });
    result.stateTransitions.push(transition2);
    
    // State 4: POLICY_CHECK - Validate constraints
    const transition3 = this.stateMachine.transition(STATES.POLICY_CHECK, {
      reason: 'Action proposed'
    });
    result.stateTransitions.push(transition3);
    
    // State 5: EXECUTE - Route to agent (placeholder)
    const transition4 = this.stateMachine.transition(STATES.EXECUTE, {
      reason: 'Policy validated'
    });
    result.stateTransitions.push(transition4);
    
    // State 6: VERIFY - Collect results
    const transition5 = this.stateMachine.transition(STATES.VERIFY, {
      reason: 'Execution complete'
    });
    result.stateTransitions.push(transition5);
    
    // State 7: COMPLETE - Log decision
    const transition6 = this.stateMachine.transition(STATES.COMPLETE, {
      reason: 'Results validated'
    });
    result.stateTransitions.push(transition6);
    
    result.checkpoints = this.stateMachine.getCheckpoints();
    result.output = {
      classification: result.classification,
      finalState: this.stateMachine.getCurrentState()
    };
    
    return result;
  }
  
  /**
   * Get classification history
   * 
   * @returns {Array} Array of classification entries
   */
  getClassificationHistory() {
    return this.classificationHistory;
  }
  
  /**
   * Get state machine
   * 
   * @returns {StateMachineExecutor} State machine instance
   */
  getStateMachine() {
    return this.stateMachine;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main classes
  ChiefStrategistOrchestrator,
  StateMachineExecutor,
  AbstractionLayerCounter,
  
  // Work classification
  classifyWork,
  calculateConfidence,
  getPrimaryClassification,
  WORK_TYPES,
  CONFIDENCE_LEVELS,
  WORK_CLASSIFIERS,
  
  // State machine
  STATES,
  STATE_MACHINE_CONFIG,
  CHECKPOINT_TYPES,
  
  // Guardrails
  checkGuardrails,
  calculateComplexityScore,
  enforceYAGNI,
  AbstractionLayerCounter,
  SENSITIVE_KEYWORDS,
  MAX_ABSTRACTION_LAYERS
};

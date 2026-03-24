#!/usr/bin/env node
'use strict';

/**
 * Skill Memory System
 * 
 * Provides:
 * - Append-only skill memory log
 * - Phase-scoped skill tracking
 * - Consistency checks across tasks
 * - Cross-agent consistency validation
 * - Hallucination guards
 * 
 * @module skill-memory
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default skill memory structure
 */
const DEFAULT_SKILL_MEMORY = {
  phase: 38,
  created_at: new Date().toISOString(),
  skill_memory: []
};

/**
 * Confidence threshold for uncertainty flagging
 */
const UNCERTAINTY_THRESHOLD = 0.7;

/**
 * Similarity threshold for consistency checks
 */
const SIMILARITY_THRESHOLD = 0.6;

// ============================================================================
// SKILL MEMORY CLASS
// ============================================================================

/**
 * Skill Memory Manager
 */
class SkillMemoryManager {
  /**
   * Create skill memory manager
   * 
   * @param {Object} options - Options
   * @param {string} options.filePath - Path to skill memory file
   * @param {number} options.phase - Phase number
   */
  constructor(options = {}) {
    this.filePath = options.filePath || '.planning/phases/38-chief-strategist-orchestrator/SKILL-MEMORY.json';
    this.phase = options.phase || 38;
    this.memory = this.loadMemory();
  }

  /**
   * Load skill memory from file
   * 
   * @returns {Object} Skill memory object
   */
  loadMemory() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to load skill memory:', error.message);
    }

    return {
      ...DEFAULT_SKILL_MEMORY,
      phase: this.phase,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Save skill memory to file
   * 
   * @returns {boolean} Success status
   */
  saveMemory() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.filePath, JSON.stringify(this.memory, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save skill memory:', error.message);
      return false;
    }
  }

  /**
   * Append skill memory entry (append-only)
   * 
   * @param {Object} entry - Memory entry
   * @param {string} entry.task_id - Task ID
   * @param {Array} entry.skills_activated - Skills activated for this task
   * @param {string} entry.priority_applied - Priority applied
   * @param {boolean} entry.tradeoff_generated - Whether trade-off was generated
   * @param {Object} [entry.context] - Additional context
   * @returns {Object} Result with entry ID
   */
  append(entry) {
    const memoryEntry = {
      task_id: entry.task_id,
      skills_activated: entry.skills_activated || [],
      priority_applied: entry.priority_applied || 'maintainability',
      tradeoff_generated: entry.tradeoff_generated || false,
      timestamp: new Date().toISOString(),
      context: entry.context || {}
    };

    this.memory.skill_memory.push(memoryEntry);
    this.saveMemory();

    return {
      success: true,
      entry_id: this.memory.skill_memory.length - 1,
      entry: memoryEntry
    };
  }

  /**
   * Query skill memory for similar tasks
   * 
   * @param {Object} query - Query parameters
   * @param {string} [query.task_type] - Task type to match
   * @param {Array} [query.skills] - Skills to match
   * @param {string} [query.context_archetype] - Archetype to match
   * @returns {Array} Matching entries
   */
  querySimilar(query) {
    const results = [];

    for (const entry of this.memory.skill_memory) {
      let score = 0;
      let matchCount = 0;

      // Match task type
      if (query.task_type && entry.context?.task_type === query.task_type) {
        score += 0.4;
        matchCount++;
      }

      // Match skills (Jaccard similarity)
      if (query.skills && entry.skills_activated.length > 0) {
        const intersection = query.skills.filter(s => entry.skills_activated.includes(s));
        const union = new Set([...query.skills, ...entry.skills_activated]).size;
        const skillSimilarity = union > 0 ? intersection.length / union : 0;
        score += skillSimilarity * 0.4;
        if (skillSimilarity > 0.5) matchCount++;
      }

      // Match archetype
      if (query.context_archetype && entry.context?.archetype === query.context_archetype) {
        score += 0.2;
        matchCount++;
      }

      if (score >= SIMILARITY_THRESHOLD) {
        results.push({
          ...entry,
          similarity_score: score,
          match_count: matchCount
        });
      }
    }

    // Sort by similarity score descending
    results.sort((a, b) => b.similarity_score - a.similarity_score);

    return results;
  }

  /**
   * Check consistency with historical skill usage
   * 
   * @param {Object} currentTask - Current task details
   * @param {string} currentTask.task_id - Task ID
   * @param {string} currentTask.task_type - Task type
   * @param {Array} currentTask.skills_activated - Skills to activate
   * @param {Object} currentTask.context - Task context
   * @returns {Object} Consistency check result
   */
  checkConsistency(currentTask) {
    const similarTasks = this.querySimilar({
      task_type: currentTask.task_type,
      skills: currentTask.skills_activated,
      context_archetype: currentTask.context?.archetype
    });

    if (similarTasks.length === 0) {
      return {
        consistent: true,
        reason: 'No similar tasks found for comparison',
        similar_tasks: [],
        skill_overlap: 0,
        recommendation: 'First task of this type - no consistency baseline'
      };
    }

    // Calculate skill overlap with similar tasks
    let totalOverlap = 0;
    const skillFrequency = {};

    for (const similar of similarTasks) {
      const overlap = currentTask.skills_activated.filter(s => 
        similar.skills_activated.includes(s)
      ).length;
      totalOverlap += overlap / currentTask.skills_activated.length;

      for (const skill of similar.skills_activated) {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      }
    }

    const avgOverlap = totalOverlap / similarTasks.length;
    const consistent = avgOverlap >= SIMILARITY_THRESHOLD;

    // Find most common skills
    const commonSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    // Find missing common skills
    const missingCommonSkills = commonSkills.filter(s => 
      !currentTask.skills_activated.includes(s)
    );

    return {
      consistent,
      reason: consistent 
        ? 'Skill activation pattern matches historical usage'
        : 'Skill activation pattern differs from historical usage',
      similar_tasks_count: similarTasks.length,
      skill_overlap: avgOverlap,
      common_skills: commonSkills,
      missing_common_skills: missingCommonSkills,
      recommendation: missingCommonSkills.length > 0
        ? `Consider adding: ${missingCommonSkills.join(', ')}`
        : 'Skill activation is consistent with historical patterns'
    };
  }

  /**
   * Get skill usage statistics
   * 
   * @returns {Object} Skill usage statistics
   */
  getSkillStats() {
    const stats = {
      total_tasks: this.memory.skill_memory.length,
      skill_frequency: {},
      priority_frequency: {},
      tradeoff_count: 0
    };

    for (const entry of this.memory.skill_memory) {
      // Count skills
      for (const skill of entry.skills_activated) {
        stats.skill_frequency[skill] = (stats.skill_frequency[skill] || 0) + 1;
      }

      // Count priorities
      const priority = entry.priority_applied;
      stats.priority_frequency[priority] = (stats.priority_frequency[priority] || 0) + 1;

      // Count trade-offs
      if (entry.tradeoff_generated) {
        stats.tradeoff_count++;
      }
    }

    return stats;
  }

  /**
   * Get memory entries by phase
   * 
   * @param {number} phase - Phase number
   * @returns {Array} Entries for the phase
   */
  getByPhase(phase) {
    return this.memory.skill_memory.filter(entry => 
      entry.phase === phase || this.phase === phase
    );
  }

  /**
   * Reset memory (for testing)
   */
  reset() {
    this.memory = {
      ...DEFAULT_SKILL_MEMORY,
      phase: this.phase,
      created_at: new Date().toISOString()
    };
    this.saveMemory();
  }
}

// ============================================================================
// CROSS-AGENT CONSISTENCY CHECKS
// ============================================================================

/**
 * Detect conflicting decisions between agents
 * 
 * @param {Array} decisions - Array of decision entries
 * @returns {Object} Conflict detection result
 */
function detectConflictingDecisions(decisions) {
  const conflicts = [];
  const decisionMap = new Map();

  for (const decision of decisions) {
    const key = decision.category || 'general';
    
    if (decisionMap.has(key)) {
      const existing = decisionMap.get(key);
      
      // Check for conflicts
      if (existing.decision !== decision.decision && 
          existing.agent_id !== decision.agent_id) {
        conflicts.push({
          category: key,
          decision_a: {
            agent: existing.agent_id,
            decision: existing.decision,
            timestamp: existing.timestamp
          },
          decision_b: {
            agent: decision.agent_id,
            decision: decision.decision,
            timestamp: decision.timestamp
          },
          conflict_type: 'conflicting_decisions',
          severity: 'high'
        });
      }
    } else {
      decisionMap.set(key, decision);
    }
  }

  return {
    has_conflicts: conflicts.length > 0,
    conflicts,
    total_decisions: decisions.length,
    unique_categories: decisionMap.size
  };
}

/**
 * Compare skill activation patterns across tasks
 * 
 * @param {Array} tasks - Array of task entries
 * @returns {Object} Pattern comparison result
 */
function compareSkillPatterns(tasks) {
  const patterns = {};

  for (const task of tasks) {
    const taskType = task.task_type || 'unknown';
    
    if (!patterns[taskType]) {
      patterns[taskType] = {
        tasks: [],
        skill_sets: []
      };
    }

    patterns[taskType].tasks.push(task.task_id);
    patterns[taskType].skill_sets.push(task.skills_activated || []);
  }

  // Analyze consistency per task type
  const analysis = {};
  for (const [taskType, data] of Object.entries(patterns)) {
    const allSkills = new Set();
    const skillCounts = {};

    for (const skillSet of data.skill_sets) {
      for (const skill of skillSet) {
        allSkills.add(skill);
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }

    // Calculate consistency score
    let consistencyScore = 0;
    for (const skill of allSkills) {
      const usageRate = skillCounts[skill] / data.skill_sets.length;
      consistencyScore += usageRate;
    }
    consistencyScore /= allSkills.size || 1;

    analysis[taskType] = {
      task_count: data.tasks.length,
      unique_skills: allSkills.size,
      skill_frequency: skillCounts,
      consistency_score: consistencyScore,
      consistent: consistencyScore >= SIMILARITY_THRESHOLD
    };
  }

  return {
    patterns: analysis,
    overall_consistency: Object.values(analysis).reduce((sum, a) => sum + a.consistency_score, 0) / Object.keys(analysis).length
  };
}

// ============================================================================
// HALLUCINATION GUARDS
// ============================================================================

/**
 * Fact-check claims against source code and project context
 * 
 * @param {Object} claim - Claim to verify
 * @param {string} claim.statement - The claim statement
 * @param {Array} claim.sources - Claimed source files
 * @param {Object} projectContext - Project context for verification
 * @returns {Object} Verification result
 */
function factCheckClaim(claim, projectContext) {
  const result = {
    claim: claim.statement,
    verified: false,
    confidence: 0,
    issues: [],
    citations: []
  };

  // Check if sources are provided
  if (!claim.sources || claim.sources.length === 0) {
    result.issues.push('No source citations provided');
    result.confidence = 0.3;
    return result;
  }

  // Verify each source citation
  for (const source of claim.sources) {
    const citation = parseCitation(source);
    
    if (!citation.file) {
      result.issues.push(`Invalid citation format: ${source}`);
      continue;
    }

    // Check if file exists in project context
    if (projectContext.files && projectContext.files.includes(citation.file)) {
      result.citations.push({
        file: citation.file,
        line: citation.line,
        verified: true
      });
      result.confidence += 0.3;
    } else {
      result.issues.push(`File not found: ${citation.file}`);
      result.citations.push({
        file: citation.file,
        line: citation.line,
        verified: false
      });
    }
  }

  result.confidence = Math.min(result.confidence, 1.0);
  result.verified = result.confidence >= UNCERTAINTY_THRESHOLD;

  return result;
}

/**
 * Parse file:line citation
 * 
 * @param {string} citation - Citation string
 * @returns {Object} Parsed citation
 */
function parseCitation(citation) {
  const match = citation.match(/^(.+?):(\d+)$/);
  if (match) {
    return {
      file: match[1],
      line: parseInt(match[2], 10)
    };
  }
  return { file: citation, line: null };
}

/**
 * Enforce citation requirements for technical assertions
 * 
 * @param {Object} output - Generated output to check
 * @returns {Object} Citation check result
 */
function enforceCitationRequirement(output) {
  const result = {
    has_assertions: false,
    assertions_with_citations: 0,
    assertions_without_citations: 0,
    missing_citations: [],
    compliant: true
  };

  // Simple pattern to detect technical assertions
  const assertionPatterns = [
    /should be (?:implemented|created|added)/i,
    /must (?:use|include|have)/i,
    /requires? (?:a|an|the)? \w+/i,
    /(?:file|module|function) `[^`]+`/i
  ];

  const citationsPattern = /`?[\w./-]+:\d+`?/g;

  const assertions = [];
  for (const pattern of assertionPatterns) {
    const matches = output.text?.match(pattern);
    if (matches) {
      assertions.push(...matches);
    }
  }

  result.has_assertions = assertions.length > 0;
  const citations = output.text?.match(citationsPattern) || [];

  if (result.has_assertions) {
    if (citations.length === 0) {
      result.assertions_without_citations = assertions.length;
      result.compliant = false;
      result.missing_citations = assertions;
    } else {
      result.assertions_with_citations = Math.min(assertions.length, citations.length);
      result.assertions_without_citations = Math.max(0, assertions.length - citations.length);
      result.compliant = result.assertions_without_citations === 0;
    }
  }

  return result;
}

/**
 * Flag low-confidence outputs for human review
 * 
 * @param {Object} output - Generated output
 * @param {number} confidence - Confidence score
 * @returns {Object} Flag result
 */
function flagUncertainty(output, confidence) {
  const needsReview = confidence < UNCERTAINTY_THRESHOLD;

  return {
    needs_review: needsReview,
    confidence,
    threshold: UNCERTAINTY_THRESHOLD,
    flag_reason: needsReview ? `Confidence ${confidence} below threshold ${UNCERTAINTY_THRESHOLD}` : null,
    recommendation: needsReview ? 'Human review recommended before proceeding' : 'Output confidence acceptable'
  };
}

/**
 * Cross-reference recommendations with actual codebase state
 * 
 * @param {Object} recommendations - Generated recommendations
 * @param {Object} codebaseState - Current codebase state
 * @returns {Object} Verification result
 */
function verifyRecommendations(recommendations, codebaseState) {
  const result = {
    total: recommendations.length,
    verified: 0,
    unverified: 0,
    issues: []
  };

  for (const rec of recommendations) {
    if (rec.requires_file && codebaseState.files) {
      if (codebaseState.files.includes(rec.requires_file)) {
        result.verified++;
      } else {
        result.unverified++;
        result.issues.push({
          recommendation: rec.text,
          issue: `Referenced file not found: ${rec.requires_file}`,
          severity: 'medium'
        });
      }
    } else {
      result.verified++;
    }
  }

  result.all_verified = result.unverified === 0;
  result.verification_rate = result.verified / result.total;

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Classes
  SkillMemoryManager,

  // Functions
  detectConflictingDecisions,
  compareSkillPatterns,
  factCheckClaim,
  enforceCitationRequirement,
  flagUncertainty,
  verifyRecommendations,
  parseCitation,

  // Constants
  DEFAULT_SKILL_MEMORY,
  UNCERTAINTY_THRESHOLD,
  SIMILARITY_THRESHOLD
};

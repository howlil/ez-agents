#!/usr/bin/env node

/**
 * Skill Resolver — Conflict resolution for competing skill recommendations
 *
 * Provides systematic conflict resolution with:
 * - Priority rules (security > speed, maintainability > novelty)
 * - Context-weighted scoring
 * - Trade-off analysis generation
 * - Escalation logic for irreconcilable conflicts
 * - Decision audit trail
 *
 * Usage:
 *   const { SkillResolver, PRIORITY_RULES } = require('./skill-resolver');
 *   const resolver = new SkillResolver({ context: { project_phase: 'MVP' } });
 *   const result = resolver.resolve(skills, context);
 */

const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Priority rules for conflict resolution
 * Higher priority value wins in conflicts
 */
const PRIORITY_RULES = {
  'security > speed': {
    higher: 'security',
    lower: 'speed',
    priority: 100,
    rationale: 'Security vulnerabilities are costly to fix post-release',
    example: "Don't skip input validation to meet deadline",
    absolute: true
  },
  'security > convenience': {
    higher: 'security',
    lower: 'convenience',
    priority: 95,
    rationale: 'User convenience should not compromise security',
    example: 'Require MFA even if adds friction',
    absolute: true
  },
  'maintainability > novelty': {
    higher: 'maintainability',
    lower: 'novelty',
    priority: 90,
    rationale: 'New tech should be proven, not just novel',
    example: 'Use stable Laravel over bleeding-edge framework',
    absolute: true
  },
  'data integrity > performance': {
    higher: 'data-integrity',
    lower: 'performance',
    priority: 95,
    rationale: 'Wrong fast answers are worse than slow correct ones',
    example: 'Use transactions even if slower',
    absolute: true
  },
  'compliance > feature completeness': {
    higher: 'compliance',
    lower: 'feature-completeness',
    priority: 100,
    rationale: 'Regulatory violations can shut down business',
    example: 'Implement GDPR consent before launching feature',
    absolute: true
  },
  'delivery speed > ideal architecture (for POC/MVP)': {
    higher: 'delivery-speed',
    lower: 'ideal-architecture',
    priority: 80,
    context: ['POC', 'MVP'],
    rationale: 'POCs need validation, not perfection',
    example: 'Monolith is fine for MVP validation',
    absolute: false
  },
  'scalability > simplicity (when scale is proven need)': {
    higher: 'scalability',
    lower: 'simplicity',
    priority: 85,
    context: ['scale-up', 'enterprise'],
    rationale: 'If you have 1M users, invest in scaling',
    example: 'Add caching layer when queries slow under load',
    absolute: false
  },
  'user experience > technical purity': {
    higher: 'user-experience',
    lower: 'technical-purity',
    priority: 75,
    rationale: 'Users do not care about clean code',
    example: 'Add denormalization for faster page loads',
    absolute: false
  }
};

/**
 * Conflict types recognized by the resolver
 */
const CONFLICT_TYPES = [
  'Security vs Speed',
  'Security vs Convenience',
  'Maintainability vs Delivery',
  'Performance vs Simplicity',
  'Data Integrity vs Performance',
  'Compliance vs Feature Completeness',
  'Ideal Architecture vs Constraints',
  'Feature Completeness vs Deadline',
  'User Experience vs Technical Purity',
  'Unknown'
];

/**
 * Skill Resolver class for conflict resolution
 */
class SkillResolver {
  /**
   * Create a SkillResolver instance
   * @param {Object} options - Resolver options
   * @param {Object} options.priorityRules - Override default priority rules
   * @param {Object} options.context - Project context for resolution
   */
  constructor(options = {}) {
    this.priorityRules = { ...PRIORITY_RULES, ...options.priorityRules };
    this.context = options.context || {};
    this.logger = logger;
    this.decisionLog = [];
  }

  /**
   * Detect conflicts between skill recommendations
   * @param {Array} skills - Array of activated skills
   * @returns {Object} { hasConflict, conflicts: [] }
   */
  detectConflict(skills) {
    const conflicts = [];
    const recommendations = this._collectRecommendations(skills);

    // Check for conflicting recommendations on same aspect
    const aspectMap = new Map();
    for (const rec of recommendations) {
      const aspect = rec.aspect;
      if (!aspectMap.has(aspect)) {
        aspectMap.set(aspect, []);
      }
      aspectMap.get(aspect).push(rec);
    }

    // Find aspects with conflicting recommendations
    for (const [aspect, recs] of aspectMap) {
      if (recs.length > 1) {
        const values = new Set(recs.map(r => r.value));
        if (values.size > 1) {
          conflicts.push({
            aspect,
            type: this._inferConflictType(recs),
            recommendations: recs,
            skills: [...new Set(recs.map(r => r.skillName))]
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Classify a conflict into a known type
   * @param {Object} conflict - Conflict object
   * @returns {string} Conflict type
   */
  classifyConflict(conflict) {
    const { type, recommendations } = conflict;

    // Check recommendation tags for conflict indicators
    const tags = recommendations.flatMap(r => r.tags || []);

    if (tags.includes('security') && (tags.includes('speed') || tags.includes('delivery'))) {
      return 'Security vs Speed';
    }
    if (tags.includes('security') && tags.includes('convenience')) {
      return 'Security vs Convenience';
    }
    if (tags.includes('maintainability') && tags.includes('delivery')) {
      return 'Maintainability vs Delivery';
    }
    if (tags.includes('performance') && tags.includes('simplicity')) {
      return 'Performance vs Simplicity';
    }
    if (tags.includes('data-integrity') && tags.includes('performance')) {
      return 'Data Integrity vs Performance';
    }
    if (tags.includes('compliance') && tags.includes('feature-completeness')) {
      return 'Compliance vs Feature Completeness';
    }
    if (tags.includes('ideal-architecture') && tags.includes('constraints')) {
      return 'Ideal Architecture vs Constraints';
    }
    if (tags.includes('user-experience') && tags.includes('technical-purity')) {
      return 'User Experience vs Technical Purity';
    }

    return type || 'Unknown';
  }

  /**
   * Apply priority rules to resolve a conflict
   * @param {Object} conflict - Classified conflict
   * @param {Object} context - Project context
   * @returns {Object} Resolution with winner and rationale
   */
  applyPriorityRules(conflict, context = {}) {
    const classification = this.classifyConflict(conflict);
    const ctx = { ...this.context, ...context };

    // Find applicable priority rule
    let applicableRule = null;
    for (const [ruleKey, rule] of Object.entries(this.priorityRules)) {
      if (this._ruleMatchesConflict(ruleKey, classification, ctx)) {
        applicableRule = { key: ruleKey, ...rule };
        break;
      }
    }

    if (!applicableRule) {
      // No applicable rule - return first recommendation as default
      return {
        winner: conflict.recommendations[0],
        rationale: 'No applicable priority rule - using default recommendation',
        rule: null,
        escalated: true
      };
    }

    // Find winning recommendation based on rule
    const winner = this._findRecommendationByPriority(
      conflict.recommendations,
      applicableRule.higher,
      ctx
    );

    return {
      winner,
      rationale: applicableRule.rationale,
      example: applicableRule.example,
      rule: applicableRule.key,
      escalated: false
    };
  }

  /**
   * Resolve conflicts between skills
   * @param {Array} skills - Array of activated skills
   * @param {Object} context - Project context
   * @returns {Object} { decision, rationale, tradeoffs, escalated }
   */
  resolve(skills, context = {}) {
    const ctx = { ...this.context, ...context };
    const conflictResult = this.detectConflict(skills);

    if (!conflictResult.hasConflict) {
      // No conflicts - return all recommendations
      return {
        decision: this._collectRecommendations(skills),
        rationale: 'No conflicts detected between skill recommendations',
        tradeoffs: [],
        escalated: false,
        conflicts: []
      };
    }

    const decisions = [];
    const tradeoffs = [];
    let escalated = false;

    for (const conflict of conflictResult.conflicts) {
      const resolution = this.applyPriorityRules(conflict, ctx);

      decisions.push({
        aspect: conflict.aspect,
        decision: resolution.winner,
        rejected: conflict.recommendations.filter(r => r !== resolution.winner)
      });

      if (resolution.escalated) {
        escalated = true;
      }

      tradeoffs.push({
        aspect: conflict.aspect,
        chosen: resolution.winner.value,
        rejected: conflict.recommendations
          .filter(r => r !== resolution.winner)
          .map(r => r.value),
        rationale: resolution.rationale
      });

      // Log decision for audit trail
      this.logDecision({
        conflict,
        resolution,
        context: ctx,
        timestamp: new Date().toISOString()
      });
    }

    return {
      decision: decisions,
      rationale: escalated
        ? 'Some conflicts required escalation due to no applicable priority rules'
        : 'All conflicts resolved using priority rules',
      tradeoffs,
      escalated,
      conflicts: conflictResult.conflicts
    };
  }

  /**
   * Log a decision for audit trail
   * @param {Object} decision - Decision object
   */
  logDecision(decision) {
    this.decisionLog.push(decision);
    this.logger.info('Conflict resolution decision logged', {
      conflictType: decision.conflict?.type,
      resolution: decision.resolution?.rule,
      escalated: decision.resolution?.escalated,
      timestamp: decision.timestamp
    });
  }

  /**
   * Get decision log
   * @returns {Array} Array of logged decisions
   */
  getDecisionLog() {
    return this.decisionLog;
  }

  /**
   * Clear decision log
   */
  clearDecisionLog() {
    this.decisionLog = [];
  }

  /**
   * Collect all recommendations from skills
   * @param {Array} skills - Array of skills
   * @returns {Array} Array of recommendations
   * @private
   */
  _collectRecommendations(skills) {
    const recommendations = [];

    for (const skill of skills) {
      if (skill.workflow) {
        for (const [phase, actions] of Object.entries(skill.workflow)) {
          if (Array.isArray(actions)) {
            for (const action of actions) {
              recommendations.push({
                skillName: skill.name,
                aspect: phase,
                value: action,
                tags: skill.tags || []
              });
            }
          }
        }
      }

      if (skill.best_practices) {
        for (const practice of skill.best_practices) {
          recommendations.push({
            skillName: skill.name,
            aspect: 'best_practice',
            value: practice,
            tags: skill.tags || []
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Infer conflict type from recommendations
   * @param {Array} recs - Recommendations
   * @returns {string} Conflict type
   * @private
   */
  _inferConflictType(recs) {
    const tags = recs.flatMap(r => r.tags || []);

    if (tags.includes('security')) return 'Security vs Speed';
    if (tags.includes('maintainability')) return 'Maintainability vs Delivery';
    if (tags.includes('performance')) return 'Performance vs Simplicity';

    return 'Unknown';
  }

  /**
   * Check if a rule matches a conflict
   * @param {string} ruleKey - Rule key
   * @param {string} conflictType - Conflict type
   * @param {Object} context - Project context
   * @returns {boolean} True if rule applies
   * @private
   */
  _ruleMatchesConflict(ruleKey, conflictType, context) {
    const rule = this.priorityRules[ruleKey];
    if (!rule) return false;

    // Check if rule has context requirements
    if (rule.context && !rule.context.includes(context.project_phase)) {
      return false;
    }

    // Check if rule matches conflict type
    const ruleMatches = ruleKey.toLowerCase().includes(conflictType.toLowerCase().split(' vs ')[0].toLowerCase());
    return ruleMatches;
  }

  /**
   * Find recommendation matching priority
   * @param {Array} recs - Recommendations
   * @param {string} priority - Priority to match
   * @param {Object} context - Project context
   * @returns {Object} Matching recommendation
   * @private
   */
  _findRecommendationByPriority(recs, priority, context) {
    for (const rec of recs) {
      if (rec.tags?.includes(priority)) {
        return rec;
      }
    }
    // Fallback to first recommendation
    return recs[0];
  }
}

module.exports = {
  SkillResolver,
  PRIORITY_RULES,
  CONFLICT_TYPES
};

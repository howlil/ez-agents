#!/usr/bin/env node

/**
 * Skill Matcher — Rule-based skill matching algorithm
 *
 * Matches context to skills using 5-rule matching:
 * - Rule 1: Stack skills (mandatory, priority 100)
 * - Rule 2: Domain skills (if project type detected, priority 90)
 * - Rule 3: Mode skills (ceremony level, priority 85)
 * - Rule 4: Constraint-based skills (deadline, team, compliance, priority 80)
 * - Rule 5: Universal skills (always activate, priority 50)
 *
 * Enforces 3-7 skill limit per task (EDGE-05 compliance)
 *
 * Usage:
 *   const { SkillMatcher, SKILL_LIMITS } = require('./skill-matcher.cjs');
 *   const matcher = new SkillMatcher(registry);
 *   const result = matcher.match(context);
 */

const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Skill activation limits (EDGE-05 compliance)
 */
const SKILL_LIMITS = {
  MIN_ACTIVE: 3,
  MAX_ACTIVE: 7,
  CRITICAL_TASK_MAX: 5,  // For security-sensitive tasks
  MVP_MODE_MAX: 4,       // Rapid MVP mode reduces complexity
};

/**
 * Skill Matcher class for matching context to skills
 */
class SkillMatcher {
  /**
   * Create a SkillMatcher instance
   * @param {Object} registry - SkillRegistry instance
   * @param {Object} options - Matcher options
   */
  constructor(registry, options = {}) {
    this.registry = registry;
    this.logger = options.logger || logger;
    this.rules = this.loadMatchingRules();
  }

  /**
   * Match context to skills
   * @param {Object} context - Matching context
   * @returns {Object} Match result: { activatedSkills, rationale, conflicts, metadata }
   */
  match(context) {
    const candidates = [];

    // Rule 1: Stack skills (mandatory)
    if (context.stack?.framework || context.stack?.language) {
      const stackSkills = this.findByStack(context.stack);
      stackSkills.forEach(skill => {
        candidates.push({ skill, priority: 100, rule: 'stack' });
      });
    }

    // Rule 2: Domain skills (if project type detected)
    if (context.projectType) {
      const domainSkills = this.findByDomain(context.projectType);
      domainSkills.forEach(skill => {
        candidates.push({ skill, priority: 90, rule: 'domain' });
      });
    }

    // Rule 3: Mode skills (ceremony level)
    if (context.mode) {
      const modeSkills = this.findByMode(context.mode);
      modeSkills.forEach(skill => {
        candidates.push({ skill, priority: 85, rule: 'mode' });
      });
    }

    // Rule 4: Constraint-based skills
    const constraintSkills = this.findByConstraints(context.constraints);
    constraintSkills.forEach(skill => {
      candidates.push({ skill, priority: 80, rule: 'constraint' });
    });

    // Rule 5: Universal skills (always activate)
    const universalSkills = this.registry.findByTag('universal');
    universalSkills.forEach(skill => {
      candidates.push({ skill, priority: 50, rule: 'universal' });
    });

    // Sort by priority and apply limits
    const sorted = candidates.sort((a, b) => b.priority - a.priority);
    const limited = this.enforceSkillLimits(sorted, context);
    const activatedSkills = limited.map(c => c.skill);

    return {
      activatedSkills,
      rationale: this.generateRationale(activatedSkills, context),
      conflicts: [], // Reserved for Phase 36 SKILL-07
      metadata: {
        totalCandidates: candidates.length,
        rulesApplied: [...new Set(candidates.map(c => c.rule))],
        limitEnforced: candidates.length > limited.length
      }
    };
  }

  /**
   * Enforce skill activation limits
   * @param {Object[]} candidates - Sorted candidate skills
   * @param {Object} context - Matching context
   * @returns {Object[]} Limited candidate array
   * @private
   */
  enforceSkillLimits(candidates, context) {
    const maxSkills = context.mode === 'rapid-mvp'
      ? SKILL_LIMITS.MVP_MODE_MAX
      : SKILL_LIMITS.MAX_ACTIVE;

    if (candidates.length > maxSkills) {
      this.logger.warn('Skill limit exceeded', {
        candidateCount: candidates.length,
        maxSkills,
        mode: context.mode,
        skills: candidates.slice(0, maxSkills).map(c => c.skill.name)
      });
    }

    return candidates.slice(0, maxSkills);
  }

  /**
   * Generate rationale for skill activation
   * @param {Object[]} skills - Activated skills
   * @param {Object} context - Matching context
   * @returns {string} Rationale string
   * @private
   */
  generateRationale(skills, context) {
    const categories = {};
    skills.forEach(skill => {
      const cat = skill.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(skill.name);
    });

    const parts = [];
    if (categories.stack) parts.push(`stack: ${categories.stack.join(', ')}`);
    if (categories.domain) parts.push(`domain: ${categories.domain.join(', ')}`);
    if (categories.mode) parts.push(`mode: ${categories.mode.join(', ')}`);
    if (categories.constraint) parts.push(`constraint: ${categories.constraint.join(', ')}`);
    if (categories.universal) parts.push(`universal: ${categories.universal.join(', ')}`);

    return `Activated ${skills.length} skills based on ${context.mode || 'default'} mode: ${parts.join('; ')}`;
  }

  /**
   * Find skills by stack
   * @param {Object|string} stack - Stack identifier
   * @returns {Object[]} Matching skills
   */
  findByStack(stack) {
    return this.registry.findByStack(stack);
  }

  /**
   * Find skills by domain/project type
   * @param {string} projectType - Project type
   * @returns {Object[]} Matching skills
   */
  findByDomain(projectType) {
    return this.registry.findByTag(projectType);
  }

  /**
   * Find skills by mode
   * @param {string} mode - Mode identifier
   * @returns {Object[]} Matching skills
   */
  findByMode(mode) {
    return this.registry.findByTag(mode);
  }

  /**
   * Find skills by constraints
   * @param {Object} constraints - Constraint object
   * @returns {Object[]} Matching skills
   * @private
   */
  findByConstraints(constraints) {
    const skills = [];
    if (!constraints) return skills;

    // Deadline-based skills
    if (constraints.deadline === '2-weeks' || constraints.deadline === '1-week') {
      const rapid = this.registry.get('rapid_delivery_skill_v1');
      if (rapid) skills.push(rapid);
    }

    // Compliance-based skills
    if (constraints.compliance?.includes('hipaa')) {
      const hipaa = this.registry.get('hipaa_compliance_skill_v1');
      if (hipaa) skills.push(hipaa);
    }

    // Team size skills
    if (constraints.teamSize === 1) {
      const solo = this.registry.get('solo_developer_skill_v1');
      if (solo) skills.push(solo);
    }

    return skills;
  }

  /**
   * Load matching rules configuration
   * @returns {Object} Rules configuration
   * @private
   */
  loadMatchingRules() {
    return {
      stack: { priority: 100, required: true },
      domain: { priority: 90, required: false },
      mode: { priority: 85, required: false },
      constraint: { priority: 80, required: false },
      universal: { priority: 50, required: true }
    };
  }
}

module.exports = {
  SkillMatcher,
  SKILL_LIMITS
};

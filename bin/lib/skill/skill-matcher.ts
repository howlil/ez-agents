
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
 *   import { SkillMatcher, SKILL_LIMITS } from './skill/index.js';
 *   const matcher = new SkillMatcher(registry);
 *   const result = matcher.match(context);
 */

import { defaultLogger as logger } from '../logger/index.js';
import type { SkillRegistry, Skill } from './skill/index.js';

/**
 * Skill activation limits (EDGE-05 compliance)
 */
export const SKILL_LIMITS = {
  MIN_ACTIVE: 3,
  MAX_ACTIVE: 7,
  CRITICAL_TASK_MAX: 5, // For security-sensitive tasks
  MVP_MODE_MAX: 4 // Rapid MVP mode reduces complexity
} as const;

/**
 * Match result structure
 */
export interface MatchResult {
  activatedSkills: Skill[];
  rationale: string;
  conflicts: string[];
  metadata: {
    totalCandidates: number;
    rulesApplied: string[];
    limitEnforced: boolean;
  };
}

/**
 * Candidate skill with priority
 */
interface SkillCandidate {
  skill: Skill;
  priority: number;
  rule: string;
}

/**
 * Matching context
 */
export interface MatchContext {
  stack?: { language?: string; framework?: string; version?: string };
  projectType?: string;
  mode?: string;
  constraints?: {
    deadline?: string;
    teamSize?: number;
    compliance?: string[];
    legacySystems?: string[];
  };
  taskDescription?: string;
  codebaseFiles?: string[];
  executedCommands?: string[];
  [key: string]: unknown;
}

/**
 * Skill Matcher class for matching context to skills
 */
export class SkillMatcher {
  private registry: SkillRegistry;
  private logger: typeof logger;

  /**
   * Create a SkillMatcher instance
   * @param registry - SkillRegistry instance
   * @param options - Matcher options
   */
  constructor(
    registry: SkillRegistry,
    options: { logger?: typeof logger } = {}
  ) {
    this.registry = registry;
    this.logger = options.logger || logger;
  }

  /**
   * Match context to skills
   * @param context - Matching context
   * @returns Match result: { activatedSkills, rationale, conflicts, metadata }
   */
  match(context: MatchContext): MatchResult {
    const candidates: SkillCandidate[] = [];

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
        rulesApplied: Array.from(new Set(candidates.map(c => c.rule))),
        limitEnforced: candidates.length > limited.length
      }
    };
  }

  /**
   * Enforce skill activation limits
   * @param candidates - Sorted candidate skills
   * @param context - Matching context
   * @returns Limited candidate array
   * @private
   */
  private enforceSkillLimits(
    candidates: SkillCandidate[],
    context: MatchContext
  ): SkillCandidate[] {
    const maxSkills =
      context.mode === 'rapid-mvp'
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
   * @param skills - Activated skills
   * @param context - Matching context
   * @returns Rationale string
   * @private
   */
  private generateRationale(skills: Skill[], context: MatchContext): string {
    const categories: Record<string, string[]> = {};
    skills.forEach(skill => {
      const cat = skill.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat]?.push(skill.name);
    });

    const parts: string[] = [];
    if (categories.stack)
      parts.push(`stack: ${categories.stack.join(', ')}`);
    if (categories.domain)
      parts.push(`domain: ${categories.domain.join(', ')}`);
    if (categories.mode) parts.push(`mode: ${categories.mode.join(', ')}`);
    if (categories.constraint)
      parts.push(`constraint: ${categories.constraint.join(', ')}`);
    if (categories.universal)
      parts.push(`universal: ${categories.universal.join(', ')}`);

    return `Activated ${skills.length} skills based on ${context.mode || 'default'} mode: ${parts.join('; ')}`;
  }

  /**
   * Find skills by stack
   * @param stack - Stack identifier
   * @returns Matching skills
   */
  findByStack(stack: { language?: string; framework?: string } | string): Skill[] {
    return this.registry.findByStack(stack as { language: string; framework: string } | string);
  }

  /**
   * Find skills by domain/project type
   * @param projectType - Project type
   * @returns Matching skills
   */
  findByDomain(projectType: string): Skill[] {
    return this.registry.findByTag(projectType);
  }

  /**
   * Find skills by mode
   * @param mode - Mode identifier
   * @returns Matching skills
   */
  findByMode(mode: string): Skill[] {
    return this.registry.findByTag(mode);
  }

  /**
   * Find skills by constraints
   * @param constraints - Constraint object
   * @returns Matching skills
   * @private
   */
  private findByConstraints(
    constraints?: {
      deadline?: string;
      teamSize?: number;
      compliance?: string[];
      legacySystems?: string[];
    }
  ): Skill[] {
    const skills: Skill[] = [];
    if (!constraints) return skills;

    // Deadline-based skills
    if (
      constraints.deadline === '2-weeks' ||
      constraints.deadline === '1-week'
    ) {
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
}

#!/usr/bin/env node

/**
 * Skill Validator — Schema validation for skill metadata
 *
 * Validates skill objects against SKILL-01 metadata schema:
 * - Required fields: name, description, version, category
 * - Category validation: stack, architecture, domain, operational, governance
 * - Tag validation against ALLOWED_TAGS list (50+ tags)
 * - Triggers structure validation
 * - Workflow and recommended_structure validation
 *
 * Usage:
 *   import { SkillValidator, SKILL_SCHEMA, ALLOWED_TAGS } from './skill-validator.js';
 *   const validator = new SkillValidator();
 *   const { valid, errors } = validator.validate(skill);
 */

import { defaultLogger as logger } from './logger.js';
import type { Skill, SkillTriggers, SkillStructure } from './skill-registry.js';

/**
 * Allowed tags for skills (50+ tags from research section 7.1)
 */
export const ALLOWED_TAGS = [
  // Stack tags (12 frameworks)
  'laravel',
  'nextjs',
  'nestjs',
  'react',
  'vue',
  'angular',
  'flutter',
  'django',
  'express',
  'svelte',
  'fastapi',
  'spring-boot',
  // Language tags
  'php',
  'javascript',
  'typescript',
  'python',
  'java',
  'dart',
  // Architecture tags
  'monolith',
  'microservices',
  'event-driven',
  'queue-based',
  'caching',
  'rbac',
  'api-gateway',
  // Domain tags
  'pos',
  'ecommerce',
  'saas',
  'lms',
  'booking',
  'fintech',
  'inventory',
  'dashboard',
  'cms',
  'erp',
  // Operational tags
  'bug-triage',
  'refactor',
  'migration',
  'release',
  'rollback',
  'incident',
  'testing',
  'code-review',
  // Additional tags
  'backend',
  'frontend',
  'fullstack',
  'mobile',
  'framework',
  'mvc',
  'mvt',
  'hooks',
  'composition-api',
  'standalone',
  'async',
  'middleware',
  'modular',
  'bloc',
  'universal'
] as const;

/**
 * Skill metadata schema definition
 */
export const SKILL_SCHEMA = {
  required: ['name', 'description', 'version', 'category'] as const,
  optional: [
    'tags',
    'stack',
    'category',
    'triggers',
    'prerequisites',
    'recommended_structure',
    'workflow',
    'best_practices',
    'anti_patterns',
    'scaling_notes',
    'when_not_to_use',
    'output_template',
    'dependencies'
  ] as const,
  categories: [
    'stack',
    'architecture',
    'domain',
    'operational',
    'governance'
  ] as const
} as const;

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Skill Validator class for validating skill metadata
 */
export class SkillValidator {
  /**
   * Validate a skill object
   * @param skill - Skill object to validate
   * @returns Validation result: { valid, errors }
   */
  validate(skill: Skill): ValidationResult {
    const errors: string[] = [];

    if (!skill || typeof skill !== 'object') {
      return { valid: false, errors: ['Skill must be an object'] };
    }

    // Check required fields
    for (const field of SKILL_SCHEMA.required) {
      if (
        skill[field] === undefined ||
        skill[field] === null ||
        skill[field] === ''
      ) {
        errors.push(`Required field missing: ${field}`);
      }
    }

    // Validate category
    if (
      skill.category &&
      !SKILL_SCHEMA.categories.includes(skill.category as typeof SKILL_SCHEMA.categories[number])
    ) {
      errors.push(
        `Invalid category: ${skill.category}. Must be one of: ${SKILL_SCHEMA.categories.join(', ')}`
      );
    }

    // Validate tags
    if (skill.tags) {
      const tagErrors = this.validateTags(skill.tags);
      errors.push(...tagErrors);
    }

    // Validate triggers
    if (skill.triggers) {
      const triggerErrors = this.validateTriggers(skill.triggers);
      errors.push(...triggerErrors);
    }

    // Validate recommended_structure
    if (skill.recommended_structure) {
      const structureErrors = this.validateStructure(skill.recommended_structure);
      errors.push(...structureErrors);
    }

    // Validate workflow
    if (skill.workflow) {
      const workflowErrors = this.validateWorkflow(skill.workflow);
      errors.push(...workflowErrors);
    }

    // Validate prerequisites
    if (skill.prerequisites && !Array.isArray(skill.prerequisites)) {
      errors.push('prerequisites must be an array');
    }

    if (errors.length > 0) {
      logger.warn('Skill validation failed', {
        skillName: skill.name,
        errorCount: errors.length,
        errors
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate tags array
   * @param tags - Tags to validate
   * @returns Array of error messages
   */
  validateTags(tags: string[]): string[] {
    const errors: string[] = [];

    if (!Array.isArray(tags)) {
      return ['tags must be an array'];
    }

    for (const tag of tags) {
      if (typeof tag !== 'string') {
        errors.push(`Tag must be a string: ${tag}`);
      } else if (!ALLOWED_TAGS.includes(tag as typeof ALLOWED_TAGS[number])) {
        errors.push(
          `Invalid tag: ${tag}. Allowed tags: ${ALLOWED_TAGS.slice(0, 10).join(', ')}... (total ${ALLOWED_TAGS.length})`
        );
      }
    }

    return errors;
  }

  /**
   * Validate triggers object
   * @param triggers - Triggers object to validate
   * @returns Array of error messages
   */
  validateTriggers(triggers: SkillTriggers): string[] {
    const errors: string[] = [];

    if (typeof triggers !== 'object') {
      return ['triggers must be an object'];
    }

    // Validate keywords
    if (triggers.keywords !== undefined) {
      if (!Array.isArray(triggers.keywords)) {
        errors.push('triggers.keywords must be an array');
      }
    }

    // Validate filePatterns
    if (triggers.filePatterns !== undefined) {
      if (!Array.isArray(triggers.filePatterns)) {
        errors.push('triggers.filePatterns must be an array');
      }
    }

    // Validate commands
    if (triggers.commands !== undefined) {
      if (!Array.isArray(triggers.commands)) {
        errors.push('triggers.commands must be an array');
      }
    }

    // Validate stack
    if (triggers.stack !== undefined) {
      if (typeof triggers.stack !== 'string') {
        errors.push('triggers.stack must be a string');
      }
    }

    // Validate projectArchetypes
    if (triggers.projectArchetypes !== undefined) {
      if (!Array.isArray(triggers.projectArchetypes)) {
        errors.push('triggers.projectArchetypes must be an array');
      }
    }

    // Validate modes
    if (triggers.modes !== undefined) {
      if (!Array.isArray(triggers.modes)) {
        errors.push('triggers.modes must be an array');
      }
    }

    return errors;
  }

  /**
   * Validate recommended_structure object
   * @param structure - Structure object to validate
   * @returns Array of error messages
   */
  validateStructure(structure: SkillStructure): string[] {
    const errors: string[] = [];

    if (typeof structure !== 'object') {
      return ['recommended_structure must be an object'];
    }

    // Validate directories
    if (structure.directories !== undefined) {
      if (!Array.isArray(structure.directories)) {
        errors.push('recommended_structure.directories must be an array');
      }
    }

    return errors;
  }

  /**
   * Validate workflow object
   * @param workflow - Workflow object to validate
   * @returns Array of error messages
   */
  validateWorkflow(workflow: Record<string, string[]>): string[] {
    const errors: string[] = [];

    if (typeof workflow !== 'object') {
      return ['workflow must be an object'];
    }

    // Validate setup
    if (workflow.setup !== undefined) {
      if (!Array.isArray(workflow.setup)) {
        errors.push('workflow.setup must be an array');
      }
    }

    // Validate generate
    if (workflow.generate !== undefined) {
      if (!Array.isArray(workflow.generate)) {
        errors.push('workflow.generate must be an array');
      }
    }

    // Validate test
    if (workflow.test !== undefined) {
      if (!Array.isArray(workflow.test)) {
        errors.push('workflow.test must be an array');
      }
    }

    return errors;
  }
}

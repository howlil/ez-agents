/**
 * Skill System Module
 * 
 * Handles skill registry, matching, resolution, triggers, and validation.
 */

export { SkillRegistry } from './skill-registry.js';
export type { Skill } from './skill-registry.js';

export { SkillMatcher } from './skill-matcher.js';
export type { MatchResult } from './skill-matcher.js';

export { SkillResolver } from './skill-resolver.js';

export { SkillTriggerEvaluator, checkTriggers, activateSkillsByTriggers } from './skill-triggers.js';
export type { TriggerContext, TriggerEvaluationResult } from './skill-triggers.js';

export { SkillValidator } from './skill-validator.js';
export type { ValidationResult } from './skill-validator.js';

export { SkillContextResolver, validateContext } from './skill-context.js';
export type { ContextSchema, ContextValidationResult } from './skill-context.js';

export { SkillVersionResolver } from './skill-versioning.js';
export type { VersionInfo, UpdateResult } from './skill-versioning.js';

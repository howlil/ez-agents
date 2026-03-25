/**
 * Skill Adapter Interface
 *
 * Defines a common contract for skill adapters, normalizing different
 * external tool/API interfaces to a unified skill contract.
 *
 * @example
 * ```typescript
 * const adapter = new GitHubSkillAdapter(apiKey);
 * const result = await adapter.execute({ task: 'Get repo info', variables: { repo: 'user/repo' } });
 * ```
 */

/**
 * Skill context for execution
 */
export interface SkillContext {
  /**
   * Task description to execute
   */
  task: string;

  /**
   * Optional files to operate on
   */
  files?: string[];

  /**
   * Optional variables for the skill
   */
  variables?: Record<string, string>;

  /**
   * Additional context (extensible)
   */
  [key: string]: unknown;
}

/**
 * Skill execution result
 */
export interface SkillResult {
  /**
   * Whether the skill execution was successful
   */
  success: boolean;

  /**
   * Optional output from the skill
   */
  output?: string;

  /**
   * Optional error message if failed
   */
  error?: string;
}

/**
 * Validation result for skill validation
 */
export interface ValidationResult {
  /**
   * Whether the skill is valid
   */
  valid: boolean;

  /**
   * Array of error messages
   */
  errors: string[];

  /**
   * Array of warning messages
   */
  warnings: string[];
}

/**
 * Skill Adapter interface
 *
 * All skill adapters must implement this interface
 * to ensure interchangeability across the codebase.
 */
export interface SkillAdapter {
  /**
   * Get the skill name
   * @returns Skill identifier
   */
  getName(): string;

  /**
   * Get the skill description
   * @returns Human-readable description of what the skill does
   */
  getDescription(): string;

  /**
   * Get triggers that activate this skill
   * @returns Array of trigger keywords/patterns
   */
  getTriggers(): string[];

  /**
   * Execute the skill with the given context
   * @param context - Skill execution context
   * @returns Skill execution result
   */
  execute(context: SkillContext): Promise<SkillResult>;

  /**
   * Validate the skill configuration and prerequisites
   * @returns Validation result with errors and warnings
   */
  validate(): Promise<ValidationResult>;
}

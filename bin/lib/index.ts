/**
 * EZ Lib Index — Central export for all EZ libraries
 *
 * Provides single import point for all utility modules.
 *
 * Usage:
 *   import * as lib from './index.js';
 *   import { Logger, GitUtils } from './index.js';
 *
 * @module ez-lib
 */

// ============================================================================
// CORE INFRASTRUCTURE (stays in root)
// ============================================================================
export {
  MODEL_PROFILES,
  toPosixPath,
  output,
  error,
  safeReadFile,
  loadConfig,
  isGitIgnored,
  execGit,
  escapeRegex,
  normalizePhaseName,
  comparePhaseNum,
  getArchivedPhaseDirs,
  getMilestoneInfo,
  getMilestonePhaseFilter,
  generateSlugInternal,
  resolveModelInternal,
  type ModelProfile,
  type ArchivedPhaseDir,
  type Config,
  type MilestoneInfo,
} from './core.js';

export * from './type-utils.js';

export { LockfileValidator } from './lockfile-validator.js';
export { TierManager } from './tier-manager.js';

// ============================================================================
// MODULE CATEGORIES (organized by domain)
// ============================================================================

// Context Management
export * from './context/index.js';

// Session Management
export * from './session/index.js';

// Skill System
export * from './skill/index.js';

// State Management
export * from './state/index.js';

// Phase & Milestone
export * from './phase/index.js';

// Quality Gates
export * from './quality/index.js';

// File System
export * from './file/index.js';

// Git Operations
export * from './git/index.js';

// Error Handling
export * from './error/index.js';

// Recovery & Backup
export * from './recovery/index.js';

// Security
export * from './security/index.js';

// Model & Adapters
export * from './model/index.js';

// Code Analysis
export * from './analyzer/index.js';

// Detection
export * from './detector/index.js';

// Reporting
export * from './reporter/index.js';

// Cost Tracking
export * from './cost/index.js';

// Execution
export * from './executor/index.js';

// Planning
export * from './planning/index.js';

// Logging
export * from './logger/index.js';

// Learning
export * from './learning/index.js';

// Workflow
export * from './workflow/index.js';

// Package Manager
export * from './package-manager/index.js';

// Business Logic
export * from './business/index.js';

// Initialization
export * from './init/index.js';

// CLI
export * from './cli/index.js';

// Utils
export * from './utils/index.js';

// ============================================================================
// SUB-MODULES (with their own structure)
// ============================================================================

// Adapters (Model Provider & Skill adapters)
export * from './adapters/index.js';

// Commands (CLI commands)
export * from './commands/index.js';

// Config (Configuration system)
export * from './config/index.js';

// Decorators (TypeScript decorators)
export * from './decorators/index.js';

// Deploy (Deployment system)
export * from './deploy/index.js';

// Factories (Agent factories)
export * from './factories/index.js';

// FinOps (Financial operations)
export * from './finops/index.js';

// Gates (Quality gates)
export * from './gates/index.js';

// Orchestration (Agent orchestration)
export * from './orchestration/index.js';

// Perf (Performance monitoring)
export * from './perf/index.js';

// Services (Service layer)
export * from './services/index.js';

// Strategies (Strategy pattern implementations)
export * from './strategies/index.js';

// ============================================================================
// DEPRECATED - Backward compatibility aliases
// ============================================================================

// These will be removed in future versions - use categorized exports above

// Logger (backward compat)
export { Logger as LegacyLogger, defaultLogger } from './logger/index.js';

// State (backward compat)
export { StateData as LegacyStateData } from './state/index.js';

// Session (backward compat)
export { SessionManager as LegacySessionManager } from './session/index.js';

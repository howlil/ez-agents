/**
 * EZ Lib Index — Central export for all EZ libraries
 *
 * Provides single import point for all utility modules.
 *
 * Usage:
 *   import * as lib from './index.js';
 *   import { Logger, GitUtils } from './index.js';
 */

// ─── Core Infrastructure ─────────────────────────────────────────────────────
export {
  MODEL_PROFILES,
  getModelForAgent,
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
  findPhase,
  getArchivedPhaseDirs,
  getMilestoneInfo,
  getMilestonePhaseFilter,
  generateSlugInternal,
  resolveModelInternal,
  type ModelProfile,
  type PhaseInfo as CorePhaseInfo,
  type ArchivedPhaseDir,
  type Config,
  type MilestoneInfo,
} from './core.js';

export { Logger, defaultLogger } from './logger.js';

// ─── State & Session Management ──────────────────────────────────────────────
export { StateData, MetricOptions as StateMetricOptions, DecisionOptions } from './state.js';
export { stateLoad, stateGet, statePatch, stateUpdate, stateAdvancePlan, stateRecordMetric } from './state.js';
export { SessionManager, type SessionState as SessionManagerState, type SessionExport as SessionManagerExport } from './session-manager.js';
export { SessionChain, type SessionMetadata, type SessionContext, type SessionState as SessionChainState, type Session, type SessionManagerLike, type ChainRepairResult } from './session-chain.js';
export * from './session-errors.js';
export { SessionExport } from './session-export.js';
export { SessionImport } from './session-import.js';
export { LockState, type LockInfo } from './lock-state.js';

// ─── Skill System ────────────────────────────────────────────────────────────
export { SkillRegistry, type Skill } from './skill-registry.js';
export { SkillMatcher, type MatchResult } from './skill-matcher.js';
export { SkillResolver } from './skill-resolver.js';
export { checkTriggers, activateSkillsByTriggers, type TriggerContext } from './skill-triggers.js';
export { SkillValidator, type ValidationResult } from './skill-validator.js';
export { type ContextSchema, type ContextValidationResult } from './skill-context.js';
export { SkillVersionResolver, type VersionInfo, type UpdateResult } from './skill-versioning.js';

// ─── Context Management ──────────────────────────────────────────────────────
export { ContextManager, type ContextSource, type ScoringStats, type CompressionStats, type DedupStats, type ContextMetadataOutput, type ContextOptions, type ContextResult } from './context-manager.js';
export { ContextCache, type CacheEntry, type CacheEntryInput, type CacheStats } from './context-cache.js';
export { ContextCompressor, type CompressionResult, type CompressionOptions } from './context-compressor.js';
export { ContextDeduplicator } from './context-deduplicator.js';
export { ContextMetadataTracker, type ContextMetadata, type MetadataStats } from './context-metadata-tracker.js';
export { ContextRelevanceScorer, type ScoringWeights, type ScoringOptions, type ScoredFile, type ScoreResult, type ContextItem } from './context-relevance-scorer.js';
// Context errors (excluding SecurityScanError to avoid conflict with security-errors)
export { ContextAccessError, URLFetchError, FileAccessError, type SeverityLevel as ContextSeverityLevel, type ContextErrorType, type SecurityFinding, type BaseContextError, type ContextAccessErrorData, type URLFetchErrorData, type FileAccessErrorData, type SecurityScanErrorData, type ContextError } from './context-errors.js';

// ─── Phase & Milestone ───────────────────────────────────────────────────────
export { type PhaseStatus } from './phase.js';
export { PhaseInfo as RoadmapPhaseInfo, RoadmapAnalysis } from './roadmap.js';
export { roadmapGetPhase, roadmapAnalyze, roadmapUpdatePlanProgress, roadmapUpdatePhaseStatus } from './roadmap.js';
export { Milestone, type MilestoneCompleteOptions, type RequirementsCompleteResult, type MilestoneCompleteResult } from './milestone.js';
export { requirementsMarkComplete, milestoneComplete } from './milestone.js';

// ─── Quality Gates ───────────────────────────────────────────────────────────
export { QualityGate, type GateDefinition, type GateExecutorResult, type GateStatus } from './quality-gate.js';

// ─── File System & Path Utilities ────────────────────────────────────────────
export { FileAccessService } from './file-access.js';
export { withLock, isLocked, ifUnlocked, type LockOptions, type LockRelease } from './file-lock.js';
export { TempResourceType, type TempResource, type TempFileOptions, type TempFileResult, createTempDir, createTempFile, createTempFileWithCleanup, writeToTemp, readFromTemp, cleanupTemp, cleanupAll, getTrackedTemps, generateSecureSuffix, isPathSafe as tempFileIsPathSafe } from './temp-file.js';
export { normalizePath, isPathSafe, validatePathExists, safeReadFile as safePathReadFile, toPosixPath as safePathToPosix } from './safe-path.js';

// ─── Git & Security ──────────────────────────────────────────────────────────
export { isGitRepo, getGitStatus, getGitDiff, gitAdd, gitCommit, getCurrentBranch, createBranch, type GitStatus, type GitDiffResult, type GitCommitOptions } from './git-utils.js';
export { GitWorkflowEngine } from './git-workflow-engine.js';
// Git errors
export { GitWorkflowError, BranchExistsError, BranchNotFoundError, MergeConflictError, ValidationFailedError, type GitErrorOptions, type GitErrorData } from './git-errors.js';
// Security errors (excluding SecurityScanError to avoid conflict with context-errors)
export { SecurityOpsError, SecurityProviderError, SecurityComplianceError, SecurityAuditError, type SecurityErrorContext, type SecurityErrorData } from './security-errors.js';

// ─── Error Handling & Recovery ───────────────────────────────────────────────
export { ErrorCache } from './error-cache.js';
export { getErrorCode, getAllCodes, getSeverity, getAllSeverities, lookupByCode, isValidCode, type ErrorCodeDefinition, type ErrorCodeLookupResult, type ErrorCategory, ERROR_CODES, SEVERITY } from './error-registry.js';
export { CrashRecovery, type LockData, type LockStatus, type ActiveLock } from './crash-recovery.js';
export { RecoveryManager, type BackupOptions, type BackupMetadata, type VerificationResult } from './recovery-manager.js';
export { BackupService, type BackupResult, type FileInfo, type ManifestFileEntry, type BackupManifest, type BackupInfo, type RetentionSettings } from './backup-service.js';

// ─── Reliability & Concurrency ───────────────────────────────────────────────
export { retry, type RetryOptions, type RetryableError } from './retry.js';
export { auditExec, type AuditEntry, type AuditExecOptions } from './audit-exec.js';

// ─── Planning & Config ───────────────────────────────────────────────────────
export { safePlanningWrite, safePlanningWriteSync } from './planning-write.js';
export { ensureConfigSection, configSet, configGet } from './config.js';
export { extractFrontmatter, reconstructFrontmatter, type FrontmatterData } from './frontmatter.js';

// ─── Model & Adapters ────────────────────────────────────────────────────────
export { getModelForAgent as getModelProvider, getModelConfig, getApiKey, resolveModel } from './model-provider.js';
export { mapToolName, parseToolCall, formatToolResult, isToolSupported, type ToolName, type ToolCall } from './assistant-adapter.js';

// ─── Lock & Validator ────────────────────────────────────────────────────────
export { LockState as LockStateClass } from './lock-state.js';
export { LockfileValidator } from './lockfile-validator.js';

// ─── FP (Functional Programming) ─────────────────────────────────────────────
export * from './fp/index.js';

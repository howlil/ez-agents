#!/usr/bin/env node

/**
 * EZ Lib Index — Central export for all EZ libraries
 * 
 * Provides single import point for all utility modules.
 * 
 * Usage:
 *   const lib = require('./index.cjs');
 *   const logger = new lib.Logger();
 *   const git = new lib.GitUtils(process.cwd());
 */

const path = require('path');
const fs = require('fs');

// Core utilities
const Logger = require('./logger.cjs');
const LoggerInstance = new Logger();

// File system
const fsUtils = require('./fs-utils.cjs');

// Security
const safeExec = require('./safe-exec.cjs');
const safePath = require('./safe-path.cjs');
const auth = require('./auth.cjs');
const auditExec = require('./audit-exec.cjs');

// Git
const GitUtils = require('./git-utils.cjs');
const GitWorkflowEngine = require('./git-workflow-engine.cjs');
const GitErrors = require('./git-errors.cjs');

// Reliability
const retry = require('./retry.cjs');
const CircuitBreaker = require('./circuit-breaker.cjs');

// Concurrency
const fileLock = require('./file-lock.cjs');
const tempFile = require('./temp-file.cjs');

// Health & Testing
const healthCheck = require('./health-check.cjs');
const timeoutExec = require('./timeout-exec.cjs');

// Multi-model
const modelProvider = require('./model-provider.cjs');

// Adapters
const assistantAdapter = require('./assistant-adapter.cjs');

// Package Manager
const PackageManagerService = require('./package-manager-service.cjs');
const PackageManagerDetector = require('./package-manager-detector.cjs');
const PackageManagerExecutor = require('./package-manager-executor.cjs');
const LockfileValidator = require('./lockfile-validator.cjs');

// BDD & Requirements (Phase 30)
const bddValidator = require('./bdd-validator.cjs');

// Discussion Synthesis (Phase 31)
const discussionSynthesizer = require('./discussion-synthesizer.cjs');

// Tier Management & Release Validation (Phase 32-33)
const TierManager = require('./tier-manager.cjs');
const ReleaseValidator = require('./release-validator.cjs');

// Context Optimization (Phase 43)
const ContextRelevanceScorer = require('./context-relevance-scorer.cjs');
const ContextCompressor = require('./context-compressor.cjs');
const ContextDeduplicator = require('./context-deduplicator.cjs');
const ContextMetadataTracker = require('./context-metadata-tracker.cjs');
const ContextManager = require('./context-manager.cjs');

// Analytics
const AnalyticsCollector = require('./analytics/analytics-collector.cjs');
const AnalyticsReporter = require('./analytics/analytics-reporter.cjs');
const CohortAnalyzer = require('./analytics/cohort-analyzer.cjs');
const FunnelAnalyzer = require('./analytics/funnel-analyzer.cjs');
const NpsTracker = require('./analytics/nps-tracker.cjs');

// Deploy
const DeployAuditLog = require('./deploy/deploy-audit-log.cjs');
const DeployDetector = require('./deploy/deploy-detector.cjs');
const DeployEnvManager = require('./deploy/deploy-env-manager.cjs');
const DeployHealthCheck = require('./deploy/deploy-health-check.cjs');
const DeployPreFlight = require('./deploy/deploy-pre-flight.cjs');
const DeployRollback = require('./deploy/deploy-rollback.cjs');
const DeployRunner = require('./deploy/deploy-runner.cjs');
const DeployStatus = require('./deploy/deploy-status.cjs');

// FinOps
const BudgetEnforcer = require('./finops/budget-enforcer.cjs');
const CostReporter = require('./finops/cost-reporter.cjs');
const FinopsAnalyzer = require('./finops/finops-analyzer.cjs');
const SpotManager = require('./finops/spot-manager.cjs');

// Gates
const Gate01Requirement = require('./gates/gate-01-requirement.cjs');
const Gate02Architecture = require('./gates/gate-02-architecture.cjs');
const Gate03Code = require('./gates/gate-03-code.cjs');
const Gate04Security = require('./gates/gate-04-security.cjs');

// Perf
const ApiMonitor = require('./perf/api-monitor.cjs');
const DbOptimizer = require('./perf/db-optimizer.cjs');
const FrontendPerformance = require('./perf/frontend-performance.cjs');
const PerfAnalyzer = require('./perf/perf-analyzer.cjs');
const PerfBaseline = require('./perf/perf-baseline.cjs');
const PerfReporter = require('./perf/perf-reporter.cjs');
const RegressionDetector = require('./perf/regression-detector.cjs');

// Standalone analyzers
const ArchetypeDetector = require('./archetype-detector.cjs');
const BackupService = require('./backup-service.cjs');
const BusinessFlowMapper = require('./business-flow-mapper.cjs');
const CodeComplexityAnalyzer = require('./code-complexity-analyzer.cjs');
const CodebaseAnalyzer = require('./codebase-analyzer.cjs');
const ConstraintExtractor = require('./constraint-extractor.cjs');
const DependencyGraph = require('./dependency-graph.cjs');
const FrameworkDetector = require('./framework-detector.cjs');
const LogRotation = require('./log-rotation.cjs');
const RecoveryManager = require('./recovery-manager.cjs');
const SkillTriggers = require('./skill-triggers.cjs');
const SkillValidator = require('./skill-validator.cjs');
const SkillVersioning = require('./skill-versioning.cjs');
const StackDetector = require('./stack-detector.cjs');
const TechDebtAnalyzer = require('./tech-debt-analyzer.cjs');
const TradeoffAnalyzer = require('./tradeoff-analyzer.cjs');
const QualityGate = require('./quality-gate.cjs');

module.exports = {
  // Core
  Logger,
  logger: LoggerInstance,
  
  // File system
  ...fsUtils,
  
  // Security
  ...safeExec,
  ...safePath,
  ...auth,
  ...auditExec,
  
  // Git
  GitUtils,
  GitWorkflowEngine,
  GitErrors,
  
  // Reliability
  ...retry,
  CircuitBreaker,
  
  // Concurrency
  ...fileLock,
  ...tempFile,
  
  // Health & Testing
  ...healthCheck,
  ...timeoutExec,
  
  // Multi-model
  ...modelProvider,
  
  // Adapters
  ...assistantAdapter,

  // Package Manager
  PackageManagerService,
  PackageManagerDetector,
  PackageManagerExecutor,
  LockfileValidator,

  // BDD & Requirements (Phase 30)
  ...bddValidator,

  // Discussion Synthesis (Phase 31)
  ...discussionSynthesizer,

  // Tier Management & Release (Phase 32-33)
  TierManager,
  ReleaseValidator,

  // Context Optimization (Phase 43)
  ContextRelevanceScorer,
  ContextCompressor,
  ContextDeduplicator,
  ContextMetadataTracker,
  ContextManager,

  // Analytics
  AnalyticsCollector,
  AnalyticsReporter,
  CohortAnalyzer,
  FunnelAnalyzer,
  NpsTracker,

  // Deploy
  DeployAuditLog,
  DeployDetector,
  DeployEnvManager,
  DeployHealthCheck,
  DeployPreFlight,
  DeployRollback,
  DeployRunner,
  DeployStatus,

  // FinOps
  BudgetEnforcer,
  CostReporter,
  FinopsAnalyzer,
  SpotManager,

  // Gates
  Gate01Requirement,
  Gate02Architecture,
  Gate03Code,
  Gate04Security,

  // Perf
  ApiMonitor,
  DbOptimizer,
  FrontendPerformance,
  PerfAnalyzer,
  PerfBaseline,
  PerfReporter,
  RegressionDetector,

  // Standalone analyzers
  ArchetypeDetector,
  BackupService,
  BusinessFlowMapper,
  CodeComplexityAnalyzer,
  CodebaseAnalyzer,
  ConstraintExtractor,
  DependencyGraph,
  FrameworkDetector,
  LogRotation,
  RecoveryManager,
  SkillTriggers,
  SkillValidator,
  SkillVersioning,
  StackDetector,
  TechDebtAnalyzer,
  TradeoffAnalyzer,
  QualityGate,

  // Version info
  version: '3.0.0',
  
  /**
   * Get health status of all modules
   */
  getHealthStatus() {
    return {
      version: this.version,
      nodeVersion: process.version,
      platform: process.platform,
      modules: {
        logger: 'ok',
        fsUtils: 'ok',
        safeExec: 'ok',
        safePath: 'ok',
        auth: auth.isKeychainAvailable() ? 'keychain' : 'fallback',
        gitUtils: 'ok',
        gitWorkflowEngine: 'ok',
        gitErrors: 'ok',
        retry: 'ok',
        circuitBreaker: 'ok',
        fileLock: 'ok',
        tempFile: 'ok',
        modelProvider: 'ok',
        assistantAdapter: 'ok'
      }
    };
  }
};

/**
 * Context Module
 *
 * Single-pass context optimization with transparent reasoning.
 * Consolidates context gathering, scoring, and optimization.
 */

// Core optimizer
export { ContextOptimizer } from './context-optimizer.js';
export type { ContextSource, ScoredFile, ContextResult, ContextOptions } from './context-optimizer.js';

// Context slicer
export { ContextSlicer, ContextTier } from './context-slicer.js';
export type {
  SlicedContextResult,
  SlicerConfig,
  SliceOptions,
  TieredSources
} from './context-slicer.js';

// Token tracker
export { TokenTracker } from './token-tracker.js';
export type { TokenUsage, PhaseTokenSummary } from './token-tracker.js';

// Errors
export * from './context-errors.js';

// Backward compatibility (used by strategies)
export { ContextRelevanceScorer } from './context-relevance-scorer.js';
export type { ScoringOptions, ScoreResult } from './context-relevance-scorer.js';

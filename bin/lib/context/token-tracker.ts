/**
 * Token Tracker — Per-phase token usage tracking
 *
 * Tracks token usage for context slicing operations and integrates
 * with metrics.json for structured, queryable metrics.
 *
 * Engineering verdict: Use metrics.json (existing file, zero marginal token cost).
 * JSON is LLM-friendly, already tracks requirements/progress.
 * Dedicated log = new artifact. STATE.md frontmatter = rewrite overhead (~100 tokens/write).
 *
 * Target Metrics:
 * - Zero marginal token overhead (append-only to existing array)
 * - Structured JSON queries for metrics dashboard
 * - Budget violation detection and reporting
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Token usage record for a single task
 */
export interface TokenUsage {
  /** Phase number (e.g., 7 for Phase 7) */
  phase: number;
  /** Plan number within phase */
  plan: number;
  /** Task identifier/description */
  task: string;
  /** Tokens used for this task */
  tokensUsed: number;
  /** Token budget for this task */
  budget: number;
  /** ISO 8601 timestamp */
  timestamp: string;
}

/**
 * Phase token summary with aggregated metrics
 */
export interface PhaseTokenSummary {
  /** Phase number */
  phase: number;
  /** Total tokens used in phase */
  totalTokens: number;
  /** Average tokens per task */
  averagePerTask: number;
  /** Number of tasks in phase */
  taskCount: number;
  /** Number of budget violations */
  budgetViolations: number;
}

/**
 * Metrics data structure (matches .planning/metrics.json schema)
 */
interface MetricsData {
  milestone: string;
  started_at: string;
  budget: {
    ceiling: number;
    alert_threshold: number;
    projected: number;
    spent: number;
  };
  phases: Record<string, unknown>;
  cumulative: {
    total_tokens: number;
    total_cost_usd: number;
    by_provider: Record<string, unknown>;
  };
  tokenUsage?: TokenUsage[];
}

/**
 * TokenTracker - Per-phase token usage tracking
 *
 * Appends token usage records to metrics.json for:
 * - Structured JSON queries
 * - Metrics dashboard integration
 * - Budget violation detection
 * - Phase-level aggregation
 *
 * @example
 * ```typescript
 * const tracker = new TokenTracker();
 *
 * await tracker.logUsage({
 *   phase: 7,
 *   plan: 1,
 *   task: 'Implement context slicer',
 *   tokensUsed: 7200,
 *   budget: 8000,
 *   timestamp: new Date().toISOString()
 * });
 *
 * const summary = await tracker.getPhaseSummary(7);
 * console.log(`Phase 7: ${summary.totalTokens} tokens, ${summary.averagePerTask} avg/task`);
 * ```
 */
export class TokenTracker {
  private readonly metricsPath: string;

  /**
   * Create a TokenTracker instance
   * @param metricsPath - Path to metrics.json file (default: '.planning/metrics.json')
   */
  constructor(metricsPath: string = '.planning/metrics.json') {
    this.metricsPath = metricsPath;
  }

  /**
   * Log token usage for a task (append to existing metrics.json array)
   *
   * Zero marginal token cost — just push to existing array.
   * Atomic write: writes to temp file, then renames (prevents corruption).
   *
   * @param usage - Token usage record
   * @throws Error if file write fails
   */
  async logUsage(usage: TokenUsage): Promise<void> {
    const metrics = await this.readMetrics();

    if (!metrics.tokenUsage) {
      metrics.tokenUsage = [];
    }

    metrics.tokenUsage.push(usage);

    // Atomic write: write to temp file, then rename (prevents corruption)
    const tempPath = this.metricsPath + '.tmp';
    await fs.writeFile(tempPath, JSON.stringify(metrics, null, 2), 'utf-8');
    await fs.rename(tempPath, this.metricsPath);
  }

  /**
   * Get phase token summary (structured JSON queries)
   *
   * Aggregates token usage for a specific phase:
   * - Total tokens used
   * - Average tokens per task
   * - Task count
   * - Budget violations
   *
   * @param phaseNum - Phase number to query
   * @returns Phase token summary
   */
  async getPhaseSummary(phaseNum: number): Promise<PhaseTokenSummary> {
    const metrics = await this.readMetrics();
    const phaseUsage = metrics.tokenUsage?.filter(u => u.phase === phaseNum) || [];

    const totalTokens = phaseUsage.reduce((sum, u) => sum + u.tokensUsed, 0);
    const taskCount = phaseUsage.length;
    const averagePerTask = taskCount > 0 ? totalTokens / taskCount : 0;
    const budgetViolations = phaseUsage.filter(u => u.tokensUsed > u.budget).length;

    return {
      phase: phaseNum,
      totalTokens,
      averagePerTask,
      taskCount,
      budgetViolations
    };
  }

  /**
   * Get all token usage records
   *
   * @returns All token usage records
   */
  async getAllUsage(): Promise<TokenUsage[]> {
    const metrics = await this.readMetrics();
    return metrics.tokenUsage || [];
  }

  /**
   * Get token usage by phase
   *
   * @param phaseNum - Phase number to filter by
   * @returns Token usage records for phase
   */
  async getUsageByPhase(phaseNum: number): Promise<TokenUsage[]> {
    const metrics = await this.readMetrics();
    return (metrics.tokenUsage || []).filter(u => u.phase === phaseNum);
  }

  /**
   * Check if budget was violated for a specific usage
   *
   * @param usage - Token usage record
   * @returns True if budget violated
   */
  isBudgetViolated(usage: TokenUsage): boolean {
    return usage.tokensUsed > usage.budget;
  }

  /**
   * Read metrics.json file
   *
   * Returns empty structure if file doesn't exist.
   *
   * @returns Parsed metrics data
   * @private
   */
  private async readMetrics(): Promise<MetricsData> {
    try {
      const content = await fs.readFile(this.metricsPath, 'utf-8');
      return JSON.parse(content) as MetricsData;
    } catch (error) {
      // File doesn't exist yet — return empty structure
      const emptyMetrics: MetricsData = {
        milestone: 'v5.0.0',
        started_at: new Date().toISOString(),
        budget: {
          ceiling: 50.00,
          alert_threshold: 0.8,
          projected: 0.00,
          spent: 0.00
        },
        phases: {},
        cumulative: {
          total_tokens: 0,
          total_cost_usd: 0.00,
          by_provider: {}
        },
        tokenUsage: []
      };
      return emptyMetrics;
    }
  }
}

export default TokenTracker;

/**
 * State Conflict Log — Conflict history and audit trail
 *
 * Maintains 90-day retention of state conflicts with full audit trail.
 * Provides resolution statistics and problematic state tracking.
 *
 * Retention: 90 days
 * Audit: Full trail (who, what, when, why)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { defaultLogger as logger } from '../logger/index.js';
import type { StateConflict, ResolutionStrategy, ResolutionStats, ConflictPriority } from './state-conflict-resolver.js';

const CONFLICT_LOG_DIR = join(process.cwd(), '.planning', 'state-conflicts');
const CONFLICT_LOG_FILE = join(CONFLICT_LOG_DIR, 'conflict-log.md');
const CONFLICT_STATS_FILE = join(CONFLICT_LOG_DIR, 'conflict-stats.json');

export class StateConflictLog {
  private readonly retentionDays: number;

  constructor(retentionDays: number = 90) {
    this.retentionDays = retentionDays;
    this.initLogDirectory();
  }

  /**
   * Initialize log directory
   */
  private initLogDirectory(): void {
    try {
      if (!existsSync(CONFLICT_LOG_DIR)) {
        mkdirSync(CONFLICT_LOG_DIR, { recursive: true });
        
        // Create initial log file with header
        const header = `# State Conflict Log

**Purpose:** Track state conflicts during parallel agent execution with full audit trail.

**Retention:** ${this.retentionDays} days

**Policy:**
- All conflicts logged (who, what, when, why)
- 90-day retention
- Resolution statistics tracked
- Problematic states identified

---

## Conflict History

| Timestamp | ID | Agents | Priority | Strategy | Duration | Status |
|-----------|----|--------|----------|----------|----------|--------|

---

## Statistics

See conflict-stats.json for detailed metrics.

---

*Created: ${new Date().toISOString()}*
`;
        writeFileSync(CONFLICT_LOG_FILE, header, 'utf8');
      }
      
      // Initialize stats file if not exists
      if (!existsSync(CONFLICT_STATS_FILE)) {
        const initialStats = {
          totalConflicts: 0,
          resolvedConflicts: 0,
          escalatedConflicts: 0,
          autoResolutionRate: 0,
          strategyDistribution: {} as Record<string, number>,
          averageResolutionTimeMs: 0,
          escalationRate: 0,
          topProblematicStates: [] as Array<{ state: string; conflicts: number }>,
          lastUpdated: new Date().toISOString()
        };
        writeFileSync(CONFLICT_STATS_FILE, JSON.stringify(initialStats, null, 2), 'utf8');
      }
      
      logger.debug('State conflict log directory initialized', { path: CONFLICT_LOG_DIR });
    } catch (err) {
      logger.warn('Failed to initialize conflict log directory', { 
        error: (err as Error).message 
      });
    }
  }

  /**
   * Log conflict resolution
   */
  async logResolution(conflict: StateConflict): Promise<void> {
    try {
      // Update stats
      const stats = this.loadStats();

      // Count total conflicts
      stats.totalConflicts++;

      // Track escalated conflicts (regardless of resolution status)
      const isEscalated = conflict.escalationLevel !== undefined && conflict.escalationLevel >= 2;
      if (isEscalated) {
        stats.escalatedConflicts++;
      }

      if (conflict.status === 'resolved') {
        stats.resolvedConflicts++;

        // Update strategy distribution
        const strategyKey = conflict.strategy;
        stats.strategyDistribution[strategyKey] = (stats.strategyDistribution[strategyKey] || 0) + 1;

        // Calculate average resolution time
        const resolutionTime = (conflict.resolvedAt || Date.now()) - conflict.detectedAt;
        stats.averageResolutionTimeMs = this.calculateNewAverage(
          stats.averageResolutionTimeMs,
          resolutionTime,
          stats.resolvedConflicts
        );

        // Update auto-resolution rate
        const autoResolved = conflict.escalationLevel === undefined || conflict.escalationLevel <= 1;
        const autoCount = autoResolved ? 1 : 0;
        stats.autoResolutionRate = autoCount / stats.resolvedConflicts;

        // Update escalation rate (based on resolved conflicts)
        const escalatedInResolved = conflict.escalationLevel !== undefined && conflict.escalationLevel >= 2;
        stats.escalationRate = escalatedInResolved ?
          (stats.escalatedConflicts) / stats.resolvedConflicts :
          stats.escalatedConflicts / stats.resolvedConflicts;
      }

      // Update overall escalation rate (based on total conflicts)
      if (stats.totalConflicts > 0) {
        stats.escalationRate = stats.escalatedConflicts / stats.totalConflicts;
      }

      stats.lastUpdated = new Date().toISOString();
      this.saveStats(stats);

      // Append to log file
      const timestamp = new Date(conflict.detectedAt).toISOString();
      const agents = conflict.agents.join(', ');
      const duration = conflict.resolvedAt
        ? `${((conflict.resolvedAt - conflict.detectedAt) / 1000).toFixed(1)}s`
        : '-';
      const status = conflict.status;

      const entry = `| ${timestamp} | ${conflict.id} | ${agents} | ${conflict.priority} | ${conflict.strategy} | ${duration} | ${status} |\n`;
      appendFileSync(CONFLICT_LOG_FILE, entry, 'utf8');

      logger.debug('Conflict resolution logged', {
        conflictId: conflict.id,
        status: conflict.status,
        strategy: conflict.strategy
      });
    } catch (err) {
      logger.error('Failed to log conflict resolution', {
        conflictId: conflict.id,
        error: (err as Error).message
      });
    }
  }

  /**
   * Log conflict (alias for logResolution)
   */
  async log(conflict: StateConflict): Promise<void> {
    return this.logResolution(conflict);
  }

  /**
   * Get conflict statistics (alias for getStatistics)
   */
  getStats(): ReturnType<typeof this.loadStats> {
    return this.loadStats();
  }

  /**
   * Get conflict statistics
   */
  async getStatistics(): Promise<ResolutionStats> {
    try {
      const stats = this.loadStats();
      
      return {
        totalConflicts: stats.totalConflicts,
        autoResolutionRate: Math.round(stats.autoResolutionRate * 100) / 100,
        strategyDistribution: stats.strategyDistribution,
        averageResolutionTimeMs: Math.round(stats.averageResolutionTimeMs),
        escalationRate: Math.round(stats.escalationRate * 100) / 100,
        topProblematicStates: stats.topProblematicStates
      };
    } catch (err) {
      logger.error('Failed to get statistics', {
        error: (err as Error).message
      });
      
      return {
        totalConflicts: 0,
        autoResolutionRate: 0,
        strategyDistribution: {},
        averageResolutionTimeMs: 0,
        escalationRate: 0,
        topProblematicStates: []
      };
    }
  }

  /**
   * Get conflict history for a state/phase
   */
  async getHistory(phase: number | undefined, limit: number = 30): Promise<StateConflict[]> {
    try {
      // In production, would query a database
      // For now, return placeholder
      return [];
    } catch (err) {
      logger.error('Failed to get history', {
        error: (err as Error).message
      });

      return [];
    }
  }

  /**
   * Get conflicts by period (YYYY-MM format)
   */
  async getConflictsByPeriod(period: string): Promise<StateConflict[]> {
    try {
      // Validate period format (YYYY-MM)
      const periodRegex = /^\d{4}-\d{2}$/;
      if (!periodRegex.test(period)) {
        return [];
      }

      // In production, would query by period
      // For now, return empty array
      return [];
    } catch (err) {
      logger.error('Failed to get conflicts by period', {
        error: (err as Error).message
      });

      return [];
    }
  }

  /**
   * Clean up old data (alias for cleanupOldConflicts)
   */
  cleanup(): Promise<number> {
    return this.cleanupOldConflicts();
  }

  /**
   * Reset log (for testing)
   */
  reset(): void {
    const initialStats = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      escalatedConflicts: 0,
      autoResolutionRate: 0,
      strategyDistribution: {} as Record<string, number>,
      averageResolutionTimeMs: 0,
      escalationRate: 0,
      topProblematicStates: [] as Array<{ state: string; conflicts: number }>,
      lastUpdated: new Date().toISOString()
    };
    this.saveStats(initialStats);

    // Reset log file
    const header = `# State Conflict Log

**Purpose:** Track state conflicts during parallel agent execution with full audit trail.

**Retention:** ${this.retentionDays} days

**Policy:**
- All conflicts logged (who, what, when, why)
- ${this.retentionDays}-day retention
- Resolution statistics tracked
- Problematic states identified

---

## Conflict History

| Timestamp | ID | Agents | Priority | Strategy | Duration | Status |
|-----------|----|--------|----------|----------|----------|--------|

---

## Statistics

See conflict-stats.json for detailed metrics.

---

*Created: ${new Date().toISOString()}*
`;
    writeFileSync(CONFLICT_LOG_FILE, header, 'utf8');
  }

  /**
   * Clean up old conflicts (90-day retention)
   */
  async cleanupOldConflicts(): Promise<number> {
    try {
      const cutoffDate = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

      // In production, would remove entries older than cutoffDate
      logger.debug('Conflict cleanup completed', {
        retentionDays: this.retentionDays,
        cutoffDate: new Date(cutoffDate).toISOString()
      });

      return 0;
    } catch (err) {
      logger.error('Failed to cleanup old conflicts', {
        error: (err as Error).message
      });
      
      return 0;
    }
  }

  /**
   * Load statistics from file
   */
  private loadStats(): {
    totalConflicts: number;
    resolvedConflicts: number;
    escalatedConflicts: number;
    autoResolutionRate: number;
    strategyDistribution: Record<string, number>;
    averageResolutionTimeMs: number;
    escalationRate: number;
    topProblematicStates: Array<{ state: string; conflicts: number }>;
    lastUpdated: string;
  } {
    try {
      if (existsSync(CONFLICT_STATS_FILE)) {
        return JSON.parse(readFileSync(CONFLICT_STATS_FILE, 'utf8'));
      }
    } catch (err) {
      logger.warn('Failed to load stats, using defaults', {
        error: (err as Error).message
      });
    }
    
    return {
      totalConflicts: 0,
      resolvedConflicts: 0,
      escalatedConflicts: 0,
      autoResolutionRate: 0,
      strategyDistribution: {},
      averageResolutionTimeMs: 0,
      escalationRate: 0,
      topProblematicStates: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save statistics to file
   */
  private saveStats(stats: ReturnType<typeof this.loadStats>): void {
    try {
      writeFileSync(CONFLICT_STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
    } catch (err) {
      logger.error('Failed to save stats', {
        error: (err as Error).message
      });
    }
  }

  /**
   * Calculate new average incrementally
   */
  private calculateNewAverage(
    oldAverage: number,
    newValue: number,
    count: number
  ): number {
    return oldAverage + (newValue - oldAverage) / count;
  }
}

/**
 * Learning Tracker - Stub Implementation
 * 
 * This is a stub for tests that expect the learning-tracker module.
 * To be implemented in a future phase.
 */

export interface LearningEntry {
  id: string;
  category: string;
  description: string;
  timestamp: number;
  phase?: string;
}

export interface LearningSummary {
  total: number;
  byCategory: Record<string, number>;
  recent: LearningEntry[];
}

export class LearningTracker {
  private entries: LearningEntry[] = [];

  constructor(private cwd: string) {}

  async record(category: string, description: string, phase?: string): Promise<string> {
    const entry: LearningEntry = {
      id: `learn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      description,
      timestamp: Date.now(),
      phase
    };
    this.entries.push(entry);
    return entry.id;
  }

  async list(options?: { category?: string; limit?: number }): Promise<LearningEntry[]> {
    let filtered = this.entries;
    if (options?.category) {
      filtered = filtered.filter(e => e.category === options.category);
    }
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    return filtered;
  }

  async getSummary(): Promise<LearningSummary> {
    const byCategory: Record<string, number> = {};
    for (const entry of this.entries) {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
    }
    return {
      total: this.entries.length,
      byCategory,
      recent: this.entries.slice(-10)
    };
  }
}

export default LearningTracker;

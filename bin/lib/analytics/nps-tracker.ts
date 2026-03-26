/**
 * NPS Tracker — NPS survey prompt and score tracking
 * Calculates Net Promoter Score from user responses
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * NPS score category
 */
export type NpsCategory = 'promoter' | 'passive' | 'detractor';

/**
 * NPS response data
 */
export interface NpsResponse {
  /** User ID */
  userId?: string;
  /** Score value (0-10) */
  score: number;
  /** Optional feedback */
  feedback?: string;
  /** Score category */
  category?: NpsCategory;
  /** Timestamp of response */
  timestamp?: string | number;
  /** Optional metadata */
  [key: string]: unknown;
}

/**
 * NPS score entry
 */
export interface NpsScoreEntry {
  /** Score value (0-10) */
  score: number;
  /** Score category */
  category: NpsCategory;
  /** Timestamp of score */
  timestamp: string;
  /** Optional metadata */
  [key: string]: unknown;
}

/**
 * NPS calculation result
 */
export interface NpsResult {
  /** Net Promoter Score (-100 to 100) */
  nps: number;
  /** Number of promoters (9-10) */
  promoters: number;
  /** Number of passives (7-8) */
  passives: number;
  /** Number of detractors (0-6) */
  detractors: number;
  /** Total number of responses */
  total: number;
  /** Total responses */
  totalResponses?: number;
}

/**
 * NPS trend entry
 */
export interface NpsTrendEntry {
  /** Timestamp */
  timestamp: string;
  /** NPS score at this point */
  nps: number;
  /** Total responses at this point */
  total: number;
}

/**
 * NPS trend result
 */
export interface NpsTrend {
  /** Trend periods */
  periods: NpsTrendEntry[];
  /** Trend direction */
  direction: 'improving' | 'declining' | 'stable';
}

/**
 * Trend options
 */
export interface TrendOptions {
  /** Number of days per period */
  periodDays?: number;
}

export class NpsTracker {
  private readonly cwd: string;
  private readonly scoresPath: string;
  private readonly npsPath: string;

  constructor(cwd?: string) {
    this.cwd = cwd || process.cwd();
    this.scoresPath = path.join(this.cwd, '.planning', 'analytics', 'nps-scores.json');
    this.npsPath = path.join(this.cwd, '.planning', 'nps.json');
    this.ensureFile();
  }

  /**
   * Record an NPS score (legacy method)
   * @param score - Score 0-10
   * @param metadata - Optional metadata
   */
  recordScore(score: number, metadata: Record<string, unknown> = {}): void {
    if (score < 0 || score > 10) {
      throw new Error('NPS score must be between 0 and 10');
    }

    const data: NpsScoreEntry = {
      score,
      category: this.categorizeScore(score),
      timestamp: new Date().toISOString(),
      ...metadata
    };

    const scores = this.getScores();
    scores.push(data);
    fs.writeFileSync(this.scoresPath, JSON.stringify(scores, null, 2), 'utf8');
  }

  /**
   * Record an NPS response with categorization
   * @param response - Response object with userId, score, feedback
   */
  async recordResponse(response: NpsResponse): Promise<void> {
    if (response.score < 0 || response.score > 10) {
      throw new Error('NPS score must be between 0 and 10');
    }

    const data: NpsResponse = {
      ...response,
      category: this.categorizeScore(response.score),
      timestamp: response.timestamp || Date.now()
    };

    const npsData = this.getNpsData();
    npsData.responses.push(data);
    fs.writeFileSync(this.npsPath, JSON.stringify(npsData, null, 2), 'utf8');
  }

  /**
   * Calculate current NPS (legacy method)
   * @returns NPS result { score, promoters, passives, detractors }
   */
  calculateNPS(): NpsResult {
    const scores = this.getScores();
    if (scores.length === 0) {
      return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    }

    const promoters = scores.filter(s => s.score >= 9).length;
    const passives = scores.filter(s => s.score >= 7 && s.score <= 8).length;
    const detractors = scores.filter(s => s.score <= 6).length;
    const total = scores.length;

    const nps = Math.round(((promoters - detractors) / total) * 100);

    return { nps, promoters, passives, detractors, total };
  }

  /**
   * Calculate NPS score from recorded responses
   * @returns NPS result with nps, promoters, passives, detractors, totalResponses
   */
  calculateScore(): NpsResult {
    const npsData = this.getNpsData();
    const responses = npsData.responses || [];
    
    if (responses.length === 0) {
      return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0, totalResponses: 0 };
    }

    const promoters = responses.filter(r => r.score >= 9).length;
    const passives = responses.filter(r => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter(r => r.score <= 6).length;
    const total = responses.length;

    const nps = Math.round(((promoters / total) * 100) - ((detractors / total) * 100));

    return { nps, promoters, passives, detractors, total, totalResponses: total };
  }

  /**
   * Get NPS trend over time (legacy method)
   * @returns Trend data
   */
  getTrend(): NpsTrendEntry[] {
    const scores = this.getScores();
    const trend: NpsTrendEntry[] = [];
    const cumulative: NpsScoreEntry[] = [];

    for (const score of scores) {
      cumulative.push(score);
      const nps = this.calculateNPSFromScores(cumulative);
      trend.push({
        timestamp: score.timestamp,
        nps: nps.nps,
        total: cumulative.length
      });
    }

    return trend;
  }

  /**
   * Get NPS trend with period options
   * @param options - Trend options with periodDays
   * @returns Trend result with periods and direction
   */
  getTrendWithOptions(options?: TrendOptions): NpsTrend {
    const npsData = this.getNpsData();
    const responses = npsData.responses || [];
    const periodDays = options?.periodDays || 7;
    
    // Group responses by period
    const periods: NpsTrendEntry[] = [];
    const now = Date.now();
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    
    // Sort responses by timestamp
    const sorted = [...responses].sort((a, b) => {
      const tsA = typeof a.timestamp === 'number' ? a.timestamp : Date.parse(String(a.timestamp));
      const tsB = typeof b.timestamp === 'number' ? b.timestamp : Date.parse(String(b.timestamp));
      return tsA - tsB;
    });

    // Calculate cumulative NPS for each response
    let cumulative: NpsResponse[] = [];
    for (const response of sorted) {
      cumulative.push(response);
      const promoters = cumulative.filter(r => r.score >= 9).length;
      const detractors = cumulative.filter(r => r.score <= 6).length;
      const total = cumulative.length;
      const nps = Math.round(((promoters / total) * 100) - ((detractors / total) * 100));
      
      periods.push({
        timestamp: String(response.timestamp),
        nps,
        total
      });
    }

    // Determine direction
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (periods.length >= 2) {
      const firstNps = periods[0]?.nps || 0;
      const lastNps = periods[periods.length - 1]?.nps || 0;
      if (lastNps > firstNps) {
        direction = 'improving';
      } else if (lastNps < firstNps) {
        direction = 'declining';
      }
    }

    return { periods, direction };
  }

  /**
   * Categorize score
   * @param score - Score 0-10
   * @returns Category
   */
  private categorizeScore(score: number): NpsCategory {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  }

  /**
   * Calculate NPS from array of scores
   * @param scores - Array of score objects
   * @returns NPS result
   */
  private calculateNPSFromScores(scores: NpsScoreEntry[]): NpsResult {
    const promoters = scores.filter(s => s.score >= 9).length;
    const detractors = scores.filter(s => s.score <= 6).length;
    const total = scores.length;
    return { nps: Math.round(((promoters - detractors) / total) * 100), promoters, passives: 0, detractors, total };
  }

  /**
   * Get all scores (legacy)
   * @returns All scores
   */
  getScores(): NpsScoreEntry[] {
    if (!fs.existsSync(this.scoresPath)) return [];
    return JSON.parse(fs.readFileSync(this.scoresPath, 'utf8'));
  }

  /**
   * Get NPS data with responses
   * @returns NPS data object
   */
  getNpsData(): { responses: NpsResponse[] } {
    if (!fs.existsSync(this.npsPath)) {
      return { responses: [] };
    }
    const data = JSON.parse(fs.readFileSync(this.npsPath, 'utf8'));
    return data || { responses: [] };
  }

  /**
   * Ensure files exist
   */
  private ensureFile(): void {
    // Ensure analytics directory
    const scoresDir = path.dirname(this.scoresPath);
    if (!fs.existsSync(scoresDir)) {
      fs.mkdirSync(scoresDir, { recursive: true });
    }
    if (!fs.existsSync(this.scoresPath)) {
      fs.writeFileSync(this.scoresPath, '[]', 'utf8');
    }
    
    // Ensure nps.json directory
    const npsDir = path.dirname(this.npsPath);
    if (!fs.existsSync(npsDir)) {
      fs.mkdirSync(npsDir, { recursive: true });
    }
    if (!fs.existsSync(this.npsPath)) {
      fs.writeFileSync(this.npsPath, JSON.stringify({ responses: [] }, null, 2), 'utf8');
    }
  }
}

/**
 * Record an NPS score
 * @param score - Score 0-10
 * @param metadata - Metadata
 * @param cwd - Working directory
 */
export function recordScore(score: number, metadata: Record<string, unknown> = {}, cwd?: string): void {
  const tracker = new NpsTracker(cwd);
  return tracker.recordScore(score, metadata);
}

/**
 * Calculate current NPS
 * @param cwd - Working directory
 * @returns NPS result
 */
export function calculateNPS(cwd?: string): NpsResult {
  const tracker = new NpsTracker(cwd);
  return tracker.calculateNPS();
}

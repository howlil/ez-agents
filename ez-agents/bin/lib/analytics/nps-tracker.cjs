/**
 * NPS Tracker — NPS survey prompt and score tracking
 * Calculates Net Promoter Score from user responses
 */

const fs = require('fs');
const path = require('path');

class NpsTracker {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.scoresPath = path.join(this.cwd, '.planning', 'analytics', 'nps-scores.json');
    this.ensureFile();
  }

  /**
   * Record an NPS score
   * @param {number} score - Score 0-10
   * @param {Object} metadata - Optional metadata
   */
  recordScore(score, metadata = {}) {
    if (score < 0 || score > 10) {
      throw new Error('NPS score must be between 0 and 10');
    }

    const data = {
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
   * Calculate current NPS
   * @returns {Object} NPS result { score, promoters, passives, detractors }
   */
  calculateNPS() {
    const scores = this.getScores();
    if (scores.length === 0) {
      return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    }

    const promoters = scores.filter(s => s.score >= 9).length;
    const passives = scores.filter(s => s.score >= 7 && s.score <= 8).length;
    const detractors = scores.filter(s => s.score <= 6).length;
    const total = scores.length;

    const nps = Math.round(((promoters - detractors) / total) * 100);

    return { score: nps, promoters, passives, detractors, total };
  }

  /**
   * Get NPS trend over time
   * @returns {Array} Trend data
   */
  getTrend() {
    const scores = this.getScores();
    const trend = [];
    let cumulative = [];

    for (const score of scores) {
      cumulative.push(score);
      const nps = this.calculateNPSFromScores(cumulative);
      trend.push({
        timestamp: score.timestamp,
        nps: nps.score,
        total: cumulative.length
      });
    }

    return trend;
  }

  /**
   * Categorize score
   * @param {number} score - Score 0-10
   * @returns {string} Category
   */
  categorizeScore(score) {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  }

  /**
   * Calculate NPS from array of scores
   * @param {Array} scores - Array of score objects
   * @returns {Object} NPS result
   */
  calculateNPSFromScores(scores) {
    const promoters = scores.filter(s => s.score >= 9).length;
    const detractors = scores.filter(s => s.score <= 6).length;
    const total = scores.length;
    return { score: Math.round(((promoters - detractors) / total) * 100) };
  }

  /**
   * Get all scores
   * @returns {Array} All scores
   */
  getScores() {
    if (!fs.existsSync(this.scoresPath)) return [];
    return JSON.parse(fs.readFileSync(this.scoresPath, 'utf8'));
  }

  /**
   * Ensure scores file exists
   */
  ensureFile() {
    const dir = path.dirname(this.scoresPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.scoresPath)) {
      fs.writeFileSync(this.scoresPath, '[]', 'utf8');
    }
  }
}

/**
 * Record an NPS score
 * @param {number} score - Score 0-10
 * @param {Object} metadata - Metadata
 * @param {string} cwd - Working directory
 */
function recordScore(score, metadata = {}, cwd) {
  const tracker = new NpsTracker(cwd);
  return tracker.recordScore(score, metadata);
}

/**
 * Calculate current NPS
 * @param {string} cwd - Working directory
 * @returns {Object} NPS result
 */
function calculateNPS(cwd) {
  const tracker = new NpsTracker(cwd);
  return tracker.calculateNPS();
}

module.exports = { NpsTracker, recordScore, calculateNPS };

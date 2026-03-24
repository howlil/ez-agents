/**
 * Spot Manager — Spot/preemptible instance management recommendations
 * Analyzes workload patterns and recommends spot vs on-demand instances
 */

const fs = require('fs');
const path = require('path');

class SpotManager {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.recommendationsPath = path.join(this.cwd, '.planning', 'finops', 'spot-recommendations.json');
  }

  /**
   * Analyze workload for spot instance suitability
   * @param {Object} workload - Workload characteristics
   * @returns {Object} Spot recommendations
   */
  analyzeWorkload(workload = {}) {
    const recommendations = {
      timestamp: new Date().toISOString(),
      workloads: [],
      totalPotentialSavings: 0
    };

    for (const [name, characteristics] of Object.entries(workload)) {
      const suitability = this.calculateSpotSuitability(characteristics);
      const savings = this.calculateSavings(characteristics.cost, suitability);

      recommendations.workloads.push({
        name,
        spotSuitable: suitability.score >= 70,
        suitabilityScore: suitability.score,
        reasons: suitability.reasons,
        currentCost: characteristics.cost,
        potentialSavings: savings,
        recommendation: suitability.score >= 70 ? 'Use spot instances' : 'Use on-demand'
      });

      recommendations.totalPotentialSavings += savings;
    }

    return recommendations;
  }

  /**
   * Calculate spot suitability score
   * @param {Object} characteristics - Workload characteristics
   * @returns {Object} Suitability analysis
   */
  calculateSpotSuitability(characteristics) {
    let score = 50; // Base score
    const reasons = [];

    // Fault tolerant workloads are good for spot
    if (characteristics.faultTolerant) {
      score += 30;
      reasons.push('Fault tolerant workload');
    }

    // Batch processing is good for spot
    if (characteristics.batchProcessing) {
      score += 20;
      reasons.push('Batch processing workload');
    }

    // Stateful workloads are bad for spot
    if (characteristics.stateful) {
      score -= 20;
      reasons.push('Stateful workload (checkpointing recommended)');
    }

    // Time-sensitive workloads are bad for spot
    if (characteristics.timeSensitive) {
      score -= 30;
      reasons.push('Time-sensitive workload');
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      reasons
    };
  }

  /**
   * Calculate potential savings from spot
   * @param {number} currentCost - Current on-demand cost
   * @param {number} suitability - Suitability score
   * @returns {number} Potential savings
   */
  calculateSavings(currentCost, suitability) {
    // Spot instances typically 60-90% cheaper
    const savingsRate = 0.7;
    return Math.round(currentCost * savingsRate * (suitability / 100));
  }

  /**
   * Save recommendations
   * @param {Object} recommendations - Recommendations to save
   */
  saveRecommendations(recommendations) {
    fs.writeFileSync(this.recommendationsPath, JSON.stringify(recommendations, null, 2), 'utf8');
  }
}

/**
 * Analyze workload for spot suitability
 * @param {Object} workload - Workload characteristics
 * @param {string} cwd - Working directory
 * @returns {Object} Spot recommendations
 */
function analyzeWorkload(workload = {}, cwd) {
  const manager = new SpotManager(cwd);
  return manager.analyzeWorkload(workload);
}

module.exports = { SpotManager, analyzeWorkload };

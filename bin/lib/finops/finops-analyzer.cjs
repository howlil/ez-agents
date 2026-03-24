/**
 * FinOps Analyzer — Cloud resource cost analysis and rightsizing recommendations
 * Analyzes resource usage and provides cost optimization recommendations
 */

const fs = require('fs');
const path = require('path');

class FinopsAnalyzer {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.costsPath = path.join(this.cwd, '.planning', 'finops', 'costs.json');
    this.ensureFile();
  }

  /**
   * Analyze cloud resource costs
   * @param {Object} resources - Resource usage data
   * @returns {Object} Cost analysis with recommendations
   */
  analyzeCosts(resources = {}) {
    const analysis = {
      timestamp: new Date().toISOString(),
      totalCost: 0,
      byResource: {},
      byCategory: {},
      recommendations: []
    };

    // Analyze each resource
    for (const [name, resource] of Object.entries(resources)) {
      const cost = resource.cost || 0;
      const category = resource.category || 'other';

      analysis.totalCost += cost;
      analysis.byResource[name] = cost;

      if (!analysis.byCategory[category]) {
        analysis.byCategory[category] = 0;
      }
      analysis.byCategory[category] += cost;

      // Generate rightsizing recommendations
      if (resource.utilization < 30) {
        analysis.recommendations.push({
          resource: name,
          type: 'rightsize',
          reason: `Low utilization (${resource.utilization}%)`,
          suggestion: 'Downsize instance or consolidate workloads',
          potentialSavings: Math.round(cost * 0.4)
        });
      }
    }

    return analysis;
  }

  /**
   * Get cost trend over time
   * @returns {Array} Cost trend data
   */
  getTrend() {
    if (!fs.existsSync(this.costsPath)) return [];
    const costs = JSON.parse(fs.readFileSync(this.costsPath, 'utf8'));
    return costs.trend || [];
  }

  /**
   * Save cost data
   * @param {Object} costData - Cost data to save
   */
  saveCostData(costData) {
    const data = {
      timestamp: new Date().toISOString(),
      ...costData
    };

    let existing = { trend: [] };
    if (fs.existsSync(this.costsPath)) {
      existing = JSON.parse(fs.readFileSync(this.costsPath, 'utf8'));
    }

    existing.trend.push(data);
    fs.writeFileSync(this.costsPath, JSON.stringify(existing, null, 2), 'utf8');
  }

  /**
   * Ensure costs file exists
   */
  ensureFile() {
    const dir = path.dirname(this.costsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.costsPath)) {
      fs.writeFileSync(this.costsPath, '{"trend":[]}', 'utf8');
    }
  }
}

/**
 * Analyze cloud resource costs
 * @param {Object} resources - Resource usage data
 * @param {string} cwd - Working directory
 * @returns {Object} Cost analysis
 */
function analyzeCosts(resources = {}, cwd) {
  const analyzer = new FinopsAnalyzer(cwd);
  return analyzer.analyzeCosts(resources);
}

module.exports = { FinopsAnalyzer, analyzeCosts };

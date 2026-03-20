/**
 * Cost Estimator — Cloud cost estimation using Infracost
 *
 * Estimates monthly costs for infrastructure deployments.
 * Integrates with Infracost for accurate pricing.
 *
 * Usage:
 *   const CostEstimator = require('./cost-estimator.cjs');
 *   const estimator = new CostEstimator(process.cwd());
 *   const result = estimator.estimate({ path: 'infrastructure' });
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const Logger = require('./logger.cjs');

class CostEstimator {
  constructor(cwd, options = {}) {
    this.cwd = cwd || process.cwd();
    this.options = options;
    this.logger = new Logger();
    
    // Default pricing estimates (fallback when Infracost unavailable)
    this.defaultPricing = {
      't3.small': 0.0416,
      't3.medium': 0.0832,
      't3.large': 0.1664,
      't3.xlarge': 0.3328,
      'm5.large': 0.192,
      'm5.xlarge': 0.384,
      'r5.large': 0.252,
      'r5.xlarge': 0.504,
      'gp3': 0.08, // per GB-month
      'io1': 0.125, // per GB-month
      'nat-gateway': 0.045, // per hour
      'load-balancer-alb': 0.0225, // per hour
      'load-balancer-nlb': 0.0225, // per hour
      'cloudfront': 0.085, // per GB
      'rds-postgres': 0.17, // per hour for db.t3.medium
      'rds-mysql': 0.15, // per hour for db.t3.medium
      'data-transfer': 0.09 // per GB
    };
  }

  /**
   * Estimate infrastructure costs
   * @param {object} options - Estimation options
   * @param {string} options.path - Path to infrastructure code
   * @param {boolean} options.detailed - Include detailed breakdown
   * @returns {object} - Cost estimation result
   */
  estimate({ path: infraPath, detailed = false } = {}) {
    this.logger.log('INFO', 'Estimating infrastructure costs', { infraPath, detailed });

    const fullPath = path.isAbsolute(infraPath) ? infraPath : path.join(this.cwd, infraPath);

    try {
      // Try Infracost first
      const infracostResult = this._runInfracost(fullPath);
      if (infracostResult) {
        return infracostResult;
      }
    } catch (err) {
      this.logger.log('WARN', 'Infracost unavailable, using fallback estimation');
    }

    // Fallback: estimate from config files
    return this._estimateFromConfig(fullPath, detailed);
  }

  _runInfracost(infraPath) {
    try {
      const result = execSync(`infracost breakdown --path "${infraPath}" --format json`, {
        cwd: this.cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const report = JSON.parse(result);
      const totalCost = parseFloat(report.totalMonthlyCost) || 0;

      return {
        monthlyCost: totalCost,
        currency: 'USD',
        tool: 'infracost',
        breakdown: report.projects?.[0]?.breakdown || [],
        summary: {
          totalResources: report.totalResources,
          supportedResources: report.supportedResourceCount,
          unsupportedResources: report.unsupportedResourceCount
        }
      };
    } catch (err) {
      if (err.message.includes('infracost')) {
        return null; // Infracost not installed
      }
      throw err;
    }
  }

  _estimateFromConfig(infraPath, detailed) {
    let totalMonthly = 0;
    const breakdown = [];

    // Read environment configs
    const envs = ['dev', 'staging', 'prod'];
    const envCosts = {};

    for (const env of envs) {
      const configPath = path.join(infraPath, 'environments', env, 'config.json');
      if (!fs.existsSync(configPath)) continue;

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      let envMonthly = 0;

      // Estimate compute costs
      if (config.instanceType) {
        const hourlyRate = this.defaultPricing[config.instanceType] || 0.1;
        const monthlyCompute = hourlyRate * 730 * config.minCapacity; // 730 hours/month
        envMonthly += monthlyCompute;
        
        if (detailed) {
          breakdown.push({
            resource: `EC2 (${config.instanceType})`,
            environment: env,
            quantity: config.minCapacity,
            unit: 'instances',
            monthlyCost: monthlyCompute
          });
        }
      }

      // Estimate database costs
      if (config.backupRetention) {
        const dbMonthly = 50 * config.backupRetention; // Base DB cost + backup
        envMonthly += dbMonthly;
        
        if (detailed) {
          breakdown.push({
            resource: 'RDS',
            environment: env,
            quantity: 1,
            unit: 'instance',
            monthlyCost: dbMonthly
          });
        }
      }

      // Estimate load balancer costs
      const lbMonthly = 0.0225 * 730; // ALB hourly * hours
      envMonthly += lbMonthly;

      // Estimate NAT Gateway costs
      if (config.multiAz) {
        const natMonthly = 0.045 * 730 * 2; // 2 AZs
        envMonthly += natMonthly;
      }

      envCosts[env] = Math.round(envMonthly * 100) / 100;
      totalMonthly += envMonthly;
    }

    return {
      monthlyCost: Math.round(totalMonthly * 100) / 100,
      currency: 'USD',
      tool: 'fallback-estimator',
      environments: envCosts,
      breakdown: detailed ? breakdown : undefined,
      note: 'Estimates based on default pricing. Use Infracost for accurate pricing.'
    };
  }

  /**
   * Compare costs across environments
   * @param {string[]} environments - Environment names to compare
   * @returns {object} - Cost comparison result
   */
  compareEnvironments(environments = ['dev', 'staging', 'prod']) {
    const infraPath = path.join(this.cwd, 'infrastructure');
    const comparison = [];

    for (const env of environments) {
      const configPath = path.join(infraPath, 'environments', env, 'config.json');
      if (!fs.existsSync(configPath)) continue;

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const estimate = this.estimate({ path: 'infrastructure' });
      
      comparison.push({
        environment: env,
        monthlyCost: estimate.environments?.[env] || 0,
        instanceType: config.instanceType,
        minCapacity: config.minCapacity,
        maxCapacity: config.maxCapacity,
        multiAz: config.multiAz
      });
    }

    const totalMonthly = comparison.reduce((sum, c) => sum + c.monthlyCost, 0);

    return {
      environments: comparison,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      currency: 'USD'
    };
  }

  /**
   * Generate cost optimization recommendations
   * @param {object} estimate - Cost estimation result
   * @returns {string[]} - Recommendations
   */
  getRecommendations(estimate) {
    const recommendations = [];

    if (estimate.monthlyCost > 1000) {
      recommendations.push('Consider Reserved Instances for predictable workloads (up to 72% savings)');
    }

    if (estimate.environments) {
      const prodCost = estimate.environments.prod || 0;
      const devCost = estimate.environments.dev || 0;
      
      if (prodCost > 0 && devCost / prodCost > 0.5) {
        recommendations.push('Dev environment costs are high relative to prod - consider smaller instances');
      }
    }

    recommendations.push('Enable Cost Explorer for detailed cost analysis');
    recommendations.push('Set up billing alerts at 50%, 80%, and 100% of budget');

    return recommendations;
  }
}

module.exports = CostEstimator;

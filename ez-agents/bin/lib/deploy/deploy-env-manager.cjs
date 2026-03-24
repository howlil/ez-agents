/**
 * Deploy Env Manager — Multi-environment deploy config
 * Manages dev/staging/prod environment configurations
 */

const fs = require('fs');
const path = require('path');

class DeployEnvManager {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.configPath = path.join(this.cwd, '.planning', 'deploy-config.json');
  }

  /**
   * Get environment configuration
   * @param {string} env - Environment name (dev, staging, prod)
   * @returns {Object} Environment config
   */
  getEnvConfig(env) {
    const config = this.loadConfig();
    const defaultConfig = {
      env: 'dev',
      platform: 'vercel',
      url: null,
      requiredVars: []
    };

    return config.environments?.[env] || { ...defaultConfig, env };
  }

  /**
   * Set environment configuration
   * @param {string} env - Environment name
   * @param {Object} config - Configuration to set
   */
  setEnv(env, config) {
    const current = this.loadConfig();
    if (!current.environments) current.environments = {};
    current.environments[env] = { ...current.environments[env], ...config };
    this.saveConfig(current);
  }

  /**
   * List all configured environments
   * @returns {Array} Array of environment names
   */
  listEnvs() {
    const config = this.loadConfig();
    return Object.keys(config.environments || {});
  }

  /**
   * Validate environment has required variables
   * @param {string} env - Environment name
   * @returns {Object} Validation result { valid, missing }
   */
  validateEnv(env) {
    const config = this.getEnvConfig(env);
    const missing = [];

    for (const envVar of config.requiredVars || []) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Load config from file
   * @returns {Object} Config
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      return { environments: {} };
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  /**
   * Save config to file
   * @param {Object} config - Config to save
   */
  saveConfig(config) {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
  }
}

/**
 * Get environment configuration
 * @param {string} env - Environment name
 * @param {string} cwd - Working directory
 * @returns {Object} Environment config
 */
function getEnvConfig(env, cwd) {
  const manager = new DeployEnvManager(cwd);
  return manager.getEnvConfig(env);
}

module.exports = { DeployEnvManager, getEnvConfig };

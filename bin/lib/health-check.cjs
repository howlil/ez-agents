#!/usr/bin/env node

/**
 * EZ Health Check — Health monitoring for EZ workflow
 * 
 * Validates EZ environment and configuration
 * Used by workflows to detect failures and use fallback functions
 * 
 * Usage:
 *   const HealthCheck = require('./health-check.cjs');
 *   const health = new HealthCheck();
 *   const result = health.runAll();
 */

const fs = require('fs');
const path = require('path');

class HealthCheck {
  /**
   * Create a HealthCheck instance
   */
  constructor() {
    this.issues = [];
    this.warnings = [];
  }

  /**
   * Check Node.js version (must be >= 16)
   * @returns {boolean} - True if version is acceptable
   */
  checkNodeVersion() {
    try {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      if (major < 16) {
        this.issues.push(`Node.js version ${version} is below required 16.x`);
        return false;
      }
      return true;
    } catch (err) {
      this.issues.push('Cannot determine Node.js version');
      return false;
    }
  }

  /**
   * Check if .planning directory exists
   * @returns {boolean} - True if exists
   */
  checkPlanningDirectory() {
    const planningDir = '.planning';
    if (!fs.existsSync(planningDir)) {
      this.warnings.push('.planning directory does not exist');
      return false;
    }
    return true;
  }

  /**
   * Check if config.json exists and is valid JSON
   * @returns {boolean} - True if exists and valid
   */
  checkConfigFile() {
    const configPath = '.planning/config.json';
    if (!fs.existsSync(configPath)) {
      this.warnings.push('config.json not found');
      return false;
    }
    try {
      JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return true;
    } catch (err) {
      this.issues.push('config.json is invalid JSON');
      return false;
    }
  }

  /**
   * Check if STATE.md exists
   * @returns {boolean} - True if exists
   */
  checkStateFile() {
    const statePath = '.planning/STATE.md';
    if (!fs.existsSync(statePath)) {
      this.warnings.push('STATE.md not found');
      return false;
    }
    return true;
  }

  /**
   * Check if ROADMAP.md exists
   * @returns {boolean} - True if exists
   */
  checkRoadmapFile() {
    const roadmapPath = '.planning/ROADMAP.md';
    if (!fs.existsSync(roadmapPath)) {
      this.warnings.push('ROADMAP.md not found');
      return false;
    }
    return true;
  }

  /**
   * Check if PROJECT.md exists
   * @returns {boolean} - True if exists
   */
  checkProjectFile() {
    const projectPath = '.planning/PROJECT.md';
    if (!fs.existsSync(projectPath)) {
      this.warnings.push('PROJECT.md not found');
      return false;
    }
    return true;
  }

  /**
   * Check if REQUIREMENTS.md exists
   * @returns {boolean} - True if exists
   */
  checkRequirementsFile() {
    const reqPath = '.planning/REQUIREMENTS.md';
    if (!fs.existsSync(reqPath)) {
      this.warnings.push('REQUIREMENTS.md not found');
      return false;
    }
    return true;
  }

  /**
   * Check if git is available in PATH
   * @returns {boolean} - True if git is available
   */
  checkGitAvailability() {
    try {
      const { execSync } = require('child_process');
      execSync('git --version', { stdio: 'ignore', timeout: 5000 });
      return true;
    } catch (err) {
      this.warnings.push('git is not available in PATH');
      return false;
    }
  }

  /**
   * Check if required API keys are configured
   * @returns {Object} - { ok: boolean, missing: string[] }
   */
  checkApiKeys() {
    const missing = [];
    const requiredKeys = ['ANTHROPIC_API_KEY'];

    for (const key of requiredKeys) {
      if (!process.env[key]) {
        // Also check ~/.ez/ directory
        const homeDir = require('os').homedir();
        const keyPath = path.join(homeDir, '.ez', key.toLowerCase().replace('_api_key', ''));
        if (!fs.existsSync(keyPath)) {
          missing.push(key);
        }
      }
    }

    if (missing.length > 0) {
      return { ok: false, missing };
    }
    return { ok: true };
  }

  /**
   * Check if npm dependencies are installed
   * @returns {Object} - { ok: boolean, missing: string[] }
   */
  checkDependencies() {
    const missing = [];
    const requiredDeps = ['proper-lockfile', 'semver'];

    for (const dep of requiredDeps) {
      try {
        require.resolve(dep);
      } catch (err) {
        missing.push(dep);
      }
    }

    if (missing.length > 0) {
      return { ok: false, missing };
    }
    return { ok: true };
  }

  /**
   * Run all health checks
   * @returns {Object} - Health status object
   */
  runAll() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      node_version: process.version,
      checks: {
        node_version: this.checkNodeVersion(),
        planning_dir: this.checkPlanningDirectory(),
        config_file: this.checkConfigFile(),
        state_file: this.checkStateFile(),
        roadmap_file: this.checkRoadmapFile(),
        project_file: this.checkProjectFile(),
        requirements_file: this.checkRequirementsFile(),
        git: this.checkGitAvailability(),
        api_keys: this.checkApiKeys(),
        dependencies: this.checkDependencies()
      },
      issues: this.issues,
      warnings: this.warnings
    };

    if (this.issues.length > 0) {
      results.status = 'unhealthy';
    } else if (this.warnings.length > 0) {
      results.status = 'degraded';
    }

    return results;
  }
}

module.exports = HealthCheck;

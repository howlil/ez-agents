/**
 * Deploy Detector — Detects target deployment environment
 * Checks config files (vercel.json, fly.toml, Procfile) and git remotes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeployDetector {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
  }

  /**
   * Detect deployment environment from config files and git remotes
   * @returns {Object} Detection result { platform, confidence, source }
   */
  detect() {
    // Check for platform config files (high confidence)
    const configChecks = [
      { file: 'vercel.json', platform: 'vercel', confidence: 'high' },
      { file: 'fly.toml', platform: 'fly.io', confidence: 'high' },
      { file: 'Procfile', platform: 'heroku', confidence: 'high' },
      { file: 'railway.json', platform: 'railway', confidence: 'high' }
    ];

    for (const check of configChecks) {
      if (fs.existsSync(path.join(this.cwd, check.file))) {
        return {
          platform: check.platform,
          confidence: check.confidence,
          source: check.file
        };
      }
    }

    // Fallback: check git remotes (medium confidence)
    try {
      const remotes = execSync('git remote -v', { cwd: this.cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      
      if (remotes.includes('vercel.com')) {
        return { platform: 'vercel', confidence: 'medium', source: 'git-remote' };
      }
      if (remotes.includes('fly.dev')) {
        return { platform: 'fly.io', confidence: 'medium', source: 'git-remote' };
      }
      if (remotes.includes('heroku.com')) {
        return { platform: 'heroku', confidence: 'medium', source: 'git-remote' };
      }
    } catch (e) {
      // No git or no remotes
    }

    return { platform: 'unknown', confidence: 'none', source: 'none' };
  }
}

/**
 * Detect deployment environment
 * @param {string} cwd - Working directory
 * @returns {Object} Detection result
 */
function detect(cwd) {
  const detector = new DeployDetector(cwd);
  return detector.detect();
}

module.exports = { DeployDetector, detect };

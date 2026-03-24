#!/usr/bin/env node

/**
 * Tier Manager — Multi-tier release strategy management
 *
 * Manages MVP / Medium / Enterprise tier definitions, validation,
 * and promotion logic for /ez:release workflows.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// Tier Definitions
// ─────────────────────────────────────────────

const TIER_DEFINITIONS = {
  mvp: {
    name: 'MVP',
    label: 'Minimum Viable Product',
    moscow_scope: ['must'],
    coverage_threshold: 60,
    git_strategy: 'trunk',
    checklist_count: 6,
    rollback_window_minutes: 30,
    description: 'Core @must features only. Ship in hours.'
  },
  medium: {
    name: 'Medium',
    label: 'Production Ready',
    moscow_scope: ['must', 'should'],
    coverage_threshold: 80,
    git_strategy: 'github-flow',
    checklist_count: 18,
    rollback_window_minutes: 15,
    description: 'Must + Should features. Real users, proper testing.'
  },
  enterprise: {
    name: 'Enterprise',
    label: 'Compliance Grade',
    moscow_scope: ['must', 'should', 'could'],
    coverage_threshold: 95,
    git_strategy: 'gitflow',
    checklist_count: 30,
    rollback_window_minutes: 5,
    description: 'All MoSCoW priorities. Regulated industries, enterprise customers.'
  }
};

const TIER_ORDER = ['mvp', 'medium', 'enterprise'];

// ─────────────────────────────────────────────
// Tier Accessors
// ─────────────────────────────────────────────

/**
 * Get tier definition
 * @param {string} tier - 'mvp' | 'medium' | 'enterprise'
 * @returns {object}
 */
function getTier(tier) {
  const def = TIER_DEFINITIONS[tier.toLowerCase()];
  if (!def) {
    throw new Error(`Unknown tier: ${tier}. Must be one of: ${TIER_ORDER.join(', ')}`);
  }
  return { ...def, id: tier.toLowerCase() };
}

/**
 * Get all tier definitions
 * @returns {object[]}
 */
function getAllTiers() {
  return TIER_ORDER.map(t => ({ id: t, ...TIER_DEFINITIONS[t] }));
}

/**
 * Check if a tier is valid
 * @param {string} tier
 * @returns {boolean}
 */
function isValidTier(tier) {
  return TIER_ORDER.includes(tier.toLowerCase());
}

/**
 * Get the tier index (0=mvp, 1=medium, 2=enterprise)
 * @param {string} tier
 * @returns {number}
 */
function getTierIndex(tier) {
  return TIER_ORDER.indexOf(tier.toLowerCase());
}

/**
 * Check if target tier is a promotion from current tier
 * @param {string} current
 * @param {string} target
 * @returns {boolean}
 */
function isPromotion(current, target) {
  return getTierIndex(target) > getTierIndex(current);
}

/**
 * Get the tier below (for prerequisite checking)
 * @param {string} tier
 * @returns {string|null}
 */
function getPreviousTier(tier) {
  const idx = getTierIndex(tier);
  return idx > 0 ? TIER_ORDER[idx - 1] : null;
}

// ─────────────────────────────────────────────
// Git Strategy
// ─────────────────────────────────────────────

/**
 * Get git strategy for a tier
 * @param {string} tier
 * @returns {{ strategy: string, releaseBranchPrefix: string, targetBranch: string, syncBranch: string|null }}
 */
function getGitStrategy(tier) {
  const def = getTier(tier);

  const strategies = {
    trunk: {
      strategy: 'trunk',
      releaseBranchPrefix: null,
      targetBranch: 'main',
      syncBranch: null,
      description: 'Tag directly on main. No release branch.'
    },
    'github-flow': {
      strategy: 'github-flow',
      releaseBranchPrefix: 'release',
      targetBranch: 'main',
      syncBranch: null,
      description: 'release/vX.Y.Z branch → PR → main'
    },
    gitflow: {
      strategy: 'gitflow',
      releaseBranchPrefix: 'release',
      targetBranch: 'main',
      syncBranch: 'develop',
      description: 'release/vX.Y.Z from develop → main → tag → sync develop'
    }
  };

  return strategies[def.git_strategy];
}

/**
 * Generate release branch name for version
 * @param {string} tier
 * @param {string} version - semver without 'v' prefix
 * @returns {string|null}
 */
function getReleaseBranchName(tier, version) {
  const strategy = getGitStrategy(tier);
  if (!strategy.releaseBranchPrefix) return null; // trunk-based
  return `${strategy.releaseBranchPrefix}/v${version}`;
}

/**
 * Generate hotfix branch name
 * @param {string} name - slug for the fix
 * @returns {string}
 */
function getHotfixBranchName(name) {
  const slug = name.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').toLowerCase();
  return `hotfix/${slug}`;
}

// ─────────────────────────────────────────────
// Coverage Validation
// ─────────────────────────────────────────────

/**
 * Check if coverage meets tier threshold
 * @param {string} tier
 * @param {number} coveragePct
 * @returns {{ passes: boolean, threshold: number, actual: number, gap: number }}
 */
function checkCoverage(tier, coveragePct) {
  const def = getTier(tier);
  const passes = coveragePct >= def.coverage_threshold;
  return {
    passes,
    threshold: def.coverage_threshold,
    actual: coveragePct,
    gap: passes ? 0 : def.coverage_threshold - coveragePct
  };
}

// ─────────────────────────────────────────────
// Feature Flag Helpers
// ─────────────────────────────────────────────

/**
 * Get feature flags that should be enabled for a tier
 * MVP: only must features (all other flags = false)
 * Medium: must + should
 * Enterprise: all
 *
 * @param {string} tier
 * @returns {{ enabled_moscow: string[], disabled_moscow: string[] }}
 */
function getFeatureFlagConfig(tier) {
  const def = getTier(tier);
  const all = ['must', 'should', 'could'];
  const enabled = def.moscow_scope;
  const disabled = all.filter(m => !enabled.includes(m));

  return {
    enabled_moscow: enabled,
    disabled_moscow: disabled,
    flag_config: {
      ENABLE_SHOULD_FEATURES: enabled.includes('should'),
      ENABLE_COULD_FEATURES: enabled.includes('could')
    }
  };
}

// ─────────────────────────────────────────────
// Config Integration
// ─────────────────────────────────────────────

/**
 * Build release config section for .planning/config.json
 * @param {string} currentTier
 * @returns {object}
 */
function buildReleaseConfig(currentTier = 'mvp') {
  return {
    tier: currentTier,
    tiers: {
      mvp: {
        moscow_scope: TIER_DEFINITIONS.mvp.moscow_scope,
        coverage: TIER_DEFINITIONS.mvp.coverage_threshold,
        git: TIER_DEFINITIONS.mvp.git_strategy,
        checklist_items: TIER_DEFINITIONS.mvp.checklist_count
      },
      medium: {
        moscow_scope: TIER_DEFINITIONS.medium.moscow_scope,
        coverage: TIER_DEFINITIONS.medium.coverage_threshold,
        git: TIER_DEFINITIONS.medium.git_strategy,
        checklist_items: TIER_DEFINITIONS.medium.checklist_count
      },
      enterprise: {
        moscow_scope: TIER_DEFINITIONS.enterprise.moscow_scope,
        coverage: TIER_DEFINITIONS.enterprise.coverage_threshold,
        git: TIER_DEFINITIONS.enterprise.git_strategy,
        checklist_items: TIER_DEFINITIONS.enterprise.checklist_count
      }
    }
  };
}

/**
 * Load current tier from config.json
 * @param {string} configPath - Path to .planning/config.json
 * @returns {string}
 */
function loadCurrentTier(configPath) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return (config.release && config.release.tier) || 'mvp';
  } catch {
    return 'mvp';
  }
}

/**
 * Save current tier to config.json
 * @param {string} configPath
 * @param {string} tier
 */
function saveCurrentTier(configPath, tier) {
  if (!isValidTier(tier)) throw new Error(`Invalid tier: ${tier}`);

  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    // file doesn't exist yet
  }

  if (!config.release) config.release = {};
  config.release.tier = tier.toLowerCase();
  if (!config.release.tiers) {
    config.release = { ...config.release, ...buildReleaseConfig(tier) };
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

// ─────────────────────────────────────────────
// Validation Summary
// ─────────────────────────────────────────────

/**
 * Generate a tier validation summary
 * @param {string} tier
 * @param {object} checks - { coverage: number, secretsFound: number, auditPassed: boolean }
 * @returns {{ valid: boolean, tier: string, blockers: string[], warnings: string[], summary: string }}
 */
function validateRelease(tier, checks = {}) {
  const def = getTier(tier);
  const blockers = [];
  const warnings = [];

  // Coverage check
  if (checks.coverage !== undefined) {
    const cov = checkCoverage(tier, checks.coverage);
    if (!cov.passes) {
      warnings.push(`Coverage ${checks.coverage}% is below ${tier} threshold (${def.coverage_threshold}%)`);
    }
  }

  // Security checks
  if (checks.secretsFound > 0) {
    blockers.push(`${checks.secretsFound} potential secret(s) found in committed files`);
  }
  if (checks.auditPassed === false) {
    blockers.push('npm audit found critical vulnerabilities');
  }
  if (checks.hasProdTodos) {
    warnings.push('Production TODO/FIXME comments found in src/');
  }

  const valid = blockers.length === 0;

  return {
    valid,
    tier,
    tierDef: def,
    blockers,
    warnings,
    summary: valid
      ? `${def.name} release validated (${warnings.length} warnings)`
      : `${def.name} release BLOCKED (${blockers.length} blockers)`
  };
}

// ─────────────────────────────────────────────
// CLI Interface
// ─────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];

  try {
    if (cmd === 'get') {
      const tier = args[1];
      if (!tier) { console.error('Usage: tier-manager.cjs get <tier>'); process.exit(1); }
      console.log(JSON.stringify(getTier(tier), null, 2));
    } else if (cmd === 'all') {
      console.log(JSON.stringify(getAllTiers(), null, 2));
    } else if (cmd === 'git-strategy') {
      const tier = args[1];
      if (!tier) { console.error('Usage: tier-manager.cjs git-strategy <tier>'); process.exit(1); }
      console.log(JSON.stringify(getGitStrategy(tier), null, 2));
    } else if (cmd === 'release-branch') {
      const tier = args[1];
      const version = args[2];
      if (!tier || !version) { console.error('Usage: tier-manager.cjs release-branch <tier> <version>'); process.exit(1); }
      const branch = getReleaseBranchName(tier, version);
      console.log(JSON.stringify({ branch }));
    } else if (cmd === 'check-coverage') {
      const tier = args[1];
      const coverage = parseFloat(args[2]);
      if (!tier || isNaN(coverage)) { console.error('Usage: tier-manager.cjs check-coverage <tier> <pct>'); process.exit(1); }
      console.log(JSON.stringify(checkCoverage(tier, coverage), null, 2));
    } else if (cmd === 'build-config') {
      const tier = args[1] || 'mvp';
      console.log(JSON.stringify(buildReleaseConfig(tier), null, 2));
    } else if (cmd === 'load-tier') {
      const configPath = args[1] || '.planning/config.json';
      console.log(JSON.stringify({ tier: loadCurrentTier(configPath) }));
    } else if (cmd === 'save-tier') {
      const tier = args[1];
      const configPath = args[2] || '.planning/config.json';
      if (!tier) { console.error('Usage: tier-manager.cjs save-tier <tier> [config-path]'); process.exit(1); }
      saveCurrentTier(configPath, tier);
      console.log(JSON.stringify({ saved: true, tier }));
    } else if (cmd === 'validate') {
      const tier = args[1];
      if (!tier) { console.error('Usage: tier-manager.cjs validate <tier> [--coverage N]'); process.exit(1); }
      const coverageIdx = args.indexOf('--coverage');
      const checks = {
        coverage: coverageIdx !== -1 ? parseFloat(args[coverageIdx + 1]) : undefined
      };
      console.log(JSON.stringify(validateRelease(tier, checks), null, 2));
    } else {
      console.error(`Unknown command: ${cmd}`);
      console.error('Commands: get, all, git-strategy, release-branch, check-coverage, build-config, load-tier, save-tier, validate');
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  getTier,
  getAllTiers,
  isValidTier,
  getTierIndex,
  isPromotion,
  getPreviousTier,
  getGitStrategy,
  getReleaseBranchName,
  getHotfixBranchName,
  checkCoverage,
  getFeatureFlagConfig,
  buildReleaseConfig,
  loadCurrentTier,
  saveCurrentTier,
  validateRelease,
  TIER_DEFINITIONS,
  TIER_ORDER
};

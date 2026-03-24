#!/usr/bin/env node

/**
 * Skill Versioning — Version management and changelog tracking
 *
 * Provides:
 * - Side-by-side version storage (laravel_skill_v1/, laravel_skill_v2/)
 * - VERSIONS.md changelog tracking
 * - Version resolution strategies (explicit, latest stable, project lock)
 * - Skill update function with changelog append
 *
 * Usage:
 *   const { SkillVersionResolver, updateSkill } = require('./skill-versioning.cjs');
 *   const resolver = new SkillVersionResolver(registry);
 *   const skill = resolver.resolve('laravel_11_structure_skill');
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Skill Version Resolver class for managing skill versions
 */
class SkillVersionResolver {
  /**
   * Create a SkillVersionResolver instance
   * @param {Object} registry - SkillRegistry instance
   * @param {Object} options - Resolver options
   */
  constructor(registry, options = {}) {
    this.registry = registry;
    this.skillsBase = options.skillsBase || path.join(__dirname, '../../skills');
    this.logger = options.logger || logger;
  }

  /**
   * Resolve a skill to a specific version
   * @param {string} skillName - Skill name (with or without version)
   * @param {Object} context - Resolution context
   * @returns {Object} Resolved skill object
   */
  resolve(skillName, context = {}) {
    // Strategy 1: Explicit version request
    if (skillName.includes('_v')) {
      const skill = this.registry.get(skillName);
      if (skill) {
        this.logger.debug('Resolved explicit version', { skillName });
        return skill;
      }
      throw new Error(`Skill version not found: ${skillName}`);
    }

    // Strategy 2: Project-specific version lock
    const lockedVersion = context.projectConfig?.skillVersions?.[skillName];
    if (lockedVersion) {
      const versionedName = `${skillName}_v${lockedVersion}`;
      const skill = this.registry.get(versionedName);
      if (skill) {
        this.logger.info('Using locked version', {
          skillName,
          lockedVersion,
          versionedName
        });
        return skill;
      }
    }

    // Strategy 3: Latest stable version (default)
    const allVersions = this.getAllVersions(skillName);
    const latest = this.getLatestStable(allVersions);
    if (latest) {
      this.logger.debug('Resolved to latest version', {
        skillName,
        version: latest.version,
        name: latest.name
      });
      return latest;
    }

    throw new Error(`No versions found for skill: ${skillName}`);
  }

  /**
   * Get all versions of a skill
   * @param {string} skillName - Base skill name
   * @returns {Object[]} Array of version objects
   */
  getAllVersions(skillName) {
    const versions = [];
    const category = this._getCategoryForSkill(skillName);
    const skillDir = path.join(this.skillsBase, category, skillName);

    if (!fs.existsSync(skillDir)) {
      return versions;
    }

    // Find all versioned directories
    const entries = fs.readdirSync(skillDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.match(/_v(\d+)$/)) {
        const skillPath = path.join(skillDir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf8');
          const { extractFrontmatter } = require('./frontmatter.cjs');
          const frontmatter = extractFrontmatter(content);
          versions.push({
            name: entry.name,
            version: frontmatter.version || '1.0.0',
            deprecated: frontmatter.deprecated || false,
            path: skillPath
          });
        }
      }
    }

    return versions;
  }

  /**
   * Get latest stable version from versions array
   * @param {Object[]} versions - Array of version objects
   * @returns {Object|null} Latest stable version or null
   */
  getLatestStable(versions) {
    const stableVersions = versions.filter(v => !v.deprecated);

    if (stableVersions.length === 0) {
      return null;
    }

    // Sort by version number (extract from name: _v1, _v2, etc.)
    stableVersions.sort((a, b) => {
      const aMatch = a.name.match(/_v(\d+)$/);
      const bMatch = b.name.match(/_v(\d+)$/);
      const aVersion = aMatch ? parseInt(aMatch[1], 10) : 0;
      const bVersion = bMatch ? parseInt(bMatch[1], 10) : 0;
      return bVersion - aVersion;
    });

    return stableVersions[0];
  }

  /**
   * Parse version from skill name
   * @param {string} skillName - Skill name
   * @returns {Object} Parsed version info: { baseName, version, fullName }
   */
  parseVersionFromName(skillName) {
    const match = skillName.match(/^(.+)_v(\d+)$/);
    if (match) {
      return {
        baseName: match[1],
        version: parseInt(match[2], 10),
        fullName: skillName
      };
    }
    return {
      baseName: skillName,
      version: null,
      fullName: skillName
    };
  }

  /**
   * Infer category from skill name
   * @param {string} skillName - Skill name
   * @returns {string} Category
   * @private
   */
  _getCategoryForSkill(skillName) {
    if (skillName.includes('laravel') || skillName.includes('django') ||
        skillName.includes('nextjs') || skillName.includes('react') ||
        skillName.includes('vue') || skillName.includes('angular') ||
        skillName.includes('nestjs') || skillName.includes('fastapi') ||
        skillName.includes('spring') || skillName.includes('flutter') ||
        skillName.includes('express') || skillName.includes('svelte')) {
      return 'stack';
    }
    if (skillName.includes('monolith') || skillName.includes('microservices')) {
      return 'architecture';
    }
    if (skillName.includes('pos') || skillName.includes('ecommerce')) {
      return 'domain';
    }
    if (skillName.includes('bug') || skillName.includes('rollback')) {
      return 'operational';
    }
    return 'stack'; // Default
  }
}

/**
 * Update a skill to a new version
 * @param {string} skillName - Base skill name
 * @param {number} newVersion - New version number
 * @param {Object} changes - Changelog changes
 * @returns {Promise<Object>} Update result
 */
async function updateSkill(skillName, newVersion, changes) {
  const skillsBase = path.join(__dirname, '../../skills');
  const category = inferCategory(skillName);
  const skillBaseDir = path.join(skillsBase, category, skillName);

  // Get previous version
  const previousVersion = await getPreviousVersion(skillName, category);
  if (!previousVersion) {
    throw new Error(`No previous version found for ${skillName}`);
  }

  // Create new version directory
  const newVersionDir = path.join(skillBaseDir, `${skillName}_v${newVersion}`);
  const previousVersionDir = path.join(skillBaseDir, `${skillName}_v${previousVersion}`);

  if (!fs.existsSync(previousVersionDir)) {
    throw new Error(`Previous version directory not found: ${previousVersionDir}`);
  }

  // Copy previous version as base
  fs.mkdirSync(newVersionDir, { recursive: true });
  fs.cpSync(previousVersionDir, newVersionDir, { recursive: true });

  // Update SKILL.md version field
  const skillPath = path.join(newVersionDir, 'SKILL.md');
  let content = fs.readFileSync(skillPath, 'utf8');
  const { spliceFrontmatter, extractFrontmatter } = require('./frontmatter.cjs');
  const frontmatter = extractFrontmatter(content);
  frontmatter.version = `${newVersion}.0.0`;
  content = spliceFrontmatter(content, frontmatter);
  fs.writeFileSync(skillPath, content);

  // Append to VERSIONS.md
  const versionsPath = path.join(skillBaseDir, 'VERSIONS.md');
  const changelogEntry = formatChangelogEntry(newVersion, changes);
  if (fs.existsSync(versionsPath)) {
    fs.appendFileSync(versionsPath, '\n' + changelogEntry);
  } else {
    fs.writeFileSync(versionsPath, `# ${skillName} Versions\n\n` + changelogEntry);
  }

  // Log for audit trail
  logger.info('Skill updated', {
    skillName,
    newVersion,
    changes,
    timestamp: new Date().toISOString()
  });

  return {
    skillName,
    newVersion,
    directory: newVersionDir,
    previousVersion
  };
}

/**
 * Format changelog entry
 * @param {number} version - Version number
 * @param {Object} changes - Changes object
 * @returns {string} Formatted changelog entry
 */
function formatChangelogEntry(version, changes) {
  const date = new Date().toISOString().split('T')[0];
  let entry = `## v${version}.0.0 (${date})\n`;

  if (changes.breaking) {
    entry += '**Breaking Changes:**\n';
    changes.breaking.forEach(change => entry += `- ${change}\n`);
    entry += '\n';
  }

  if (changes.added) {
    entry += '**Added:**\n';
    changes.added.forEach(change => entry += `- ${change}\n`);
    entry += '\n';
  }

  if (changes.changed) {
    entry += '**Changed:**\n';
    changes.changed.forEach(change => entry += `- ${change}\n`);
    entry += '\n';
  }

  if (changes.deprecated) {
    entry += '**Deprecated:**\n';
    changes.deprecated.forEach(change => entry += `- ${change}\n`);
    entry += '\n';
  }

  if (changes.removed) {
    entry += '**Removed:**\n';
    changes.removed.forEach(change => entry += `- ${change}\n`);
    entry += '\n';
  }

  if (changes.fixed) {
    entry += '**Fixed:**\n';
    changes.fixed.forEach(change => entry += `- ${change}\n`);
    entry += '\n';
  }

  if (changes.migration) {
    entry += '**Migration Guide:**\n';
    changes.migration.forEach(step => entry += `${step}\n`);
    entry += '\n';
  }

  return entry;
}

/**
 * Infer category from skill name
 * @param {string} skillName - Skill name
 * @returns {string} Category
 */
function inferCategory(skillName) {
  if (skillName.includes('laravel') || skillName.includes('django') ||
      skillName.includes('nextjs') || skillName.includes('react')) {
    return 'stack';
  }
  return 'stack';
}

/**
 * Get previous version number
 * @param {string} skillName - Skill name
 * @param {string} category - Category
 * @returns {Promise<number|null>} Previous version number
 */
async function getPreviousVersion(skillName, category) {
  const skillsBase = path.join(__dirname, '../../skills');
  const skillBaseDir = path.join(skillsBase, category, skillName);

  if (!fs.existsSync(skillBaseDir)) {
    return null;
  }

  const entries = fs.readdirSync(skillBaseDir, { withFileTypes: true });
  const versions = entries
    .filter(e => e.isDirectory() && e.name.match(/_v(\d+)$/))
    .map(e => parseInt(e.name.match(/_v(\d+)$/)[1], 10))
    .sort((a, b) => b - a);

  return versions[0] || null;
}

module.exports = {
  SkillVersionResolver,
  updateSkill,
  formatChangelogEntry,
  inferCategory,
  getPreviousVersion
};

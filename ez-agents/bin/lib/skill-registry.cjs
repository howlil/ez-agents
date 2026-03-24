#!/usr/bin/env node

/**
 * Skill Registry — Core module for loading, indexing, and searching skills
 *
 * Provides file-based skill registry with:
 * - Load skills from global and local directories
 * - Get skill by name
 * - Filter by tag, category, or stack
 * - Search across name, description, and tags
 * - Lazy loading with cache (LazySkillRegistry subclass)
 *
 * Usage:
 *   const { SkillRegistry, LazySkillRegistry } = require('./skill-registry.cjs');
 *   const registry = new SkillRegistry();
 *   await registry.load();
 *   const skill = registry.get('laravel_11_structure_skill_v2');
 */

const fs = require('fs');
const path = require('path');
const { extractFrontmatter } = require('./frontmatter.cjs');
const { safeReadFile } = require('./safe-path.cjs');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Skill Registry class for managing skills
 */
class SkillRegistry {
  /**
   * Create a SkillRegistry instance
   * @param {Object} options - Registry options
   * @param {string} options.globalPath - Global skills directory (default: skills/)
   * @param {string} options.localPath - Local project skills directory (default: .planning/skills)
   */
  constructor(options = {}) {
    this.globalSkillsPath = options.globalPath || path.join(__dirname, '../../skills');
    this.localSkillsPath = options.localPath || '.planning/skills';
    this.skills = new Map();
    this.loaded = false;
    this.logger = logger;
  }

  /**
   * Load skills from global and local directories
   * @returns {Promise<SkillRegistry>} this for chaining
   */
  async load() {
    // Load global skills
    await this._loadFromPath(this.globalSkillsPath, 'global');

    // Load local project skills (override global)
    if (fs.existsSync(this.localSkillsPath)) {
      await this._loadFromPath(this.localSkillsPath, 'local');
    }

    this.loaded = true;
    this.logger.info('Skill registry loaded', {
      skillCount: this.skills.size,
      globalPath: this.globalSkillsPath,
      localPath: this.localSkillsPath
    });

    return this;
  }

  /**
   * Load skills from a specific path
   * @param {string} basePath - Base directory to scan
   * @param {string} scope - Scope identifier ('global' or 'local')
   * @private
   */
  _loadFromPath(basePath, scope) {
    if (!fs.existsSync(basePath)) {
      this.logger.debug('Skills path does not exist', { basePath });
      return;
    }

    // Read category directories
    const categories = ['stack', 'architecture', 'domain', 'operational', 'governance'];

    for (const category of categories) {
      const categoryPath = path.join(basePath, category);
      if (!fs.existsSync(categoryPath)) continue;

      // Get skill group directories (e.g., 'laravel', 'react', etc.)
      const skillGroups = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const group of skillGroups) {
        const groupPath = path.join(categoryPath, group);
        
        // Check for versioned skill directories within the group
        const skillVersions = fs.readdirSync(groupPath, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => d.name);

        for (const versionDir of skillVersions) {
          const skillPath = path.join(groupPath, versionDir, 'SKILL.md');
          if (fs.existsSync(skillPath)) {
            try {
              const content = fs.readFileSync(skillPath, 'utf8');
              const skill = this._parseSkill(skillPath, content, scope);
              // Local skills override global skills with same name
              this.skills.set(skill.name, skill);
            } catch (err) {
              this.logger.error('Failed to load skill', {
                skillPath,
                error: err.message
              });
            }
          }
        }
      }
    }
  }

  /**
   * Parse skill metadata from SKILL.md content
   * @param {string} filePath - Path to SKILL.md file
   * @param {string} content - File content
   * @param {string} scope - Scope identifier
   * @returns {Object} Parsed skill object
   * @private
   */
  _parseSkill(filePath, content, scope) {
    const frontmatter = extractFrontmatter(content);
    const body = content.replace(/^---[\s\S]+?\n---/, '').trim();

    return {
      name: frontmatter.name,
      description: frontmatter.description,
      version: frontmatter.version || '1.0.0',
      tags: frontmatter.tags || [],
      stack: frontmatter.stack,
      category: frontmatter.category,
      triggers: frontmatter.triggers,
      prerequisites: frontmatter.prerequisites || [],
      recommended_structure: frontmatter.recommended_structure,
      workflow: frontmatter.workflow,
      best_practices: frontmatter.best_practices || [],
      anti_patterns: frontmatter.anti_patterns || [],
      scaling_notes: frontmatter.scaling_notes,
      when_not_to_use: frontmatter.when_not_to_use,
      output_template: frontmatter.output_template,
      dependencies: frontmatter.dependencies,
      scope,
      path: filePath,
      body
    };
  }

  /**
   * Get a skill by name
   * @param {string} name - Skill name
   * @returns {Object|undefined} Skill object or undefined
   */
  get(name) {
    return this.skills.get(name);
  }

  /**
   * Get all skills
   * @returns {Object[]} Array of all skill objects
   */
  getAll() {
    return Array.from(this.skills.values());
  }

  /**
   * Find skills by tag
   * @param {string} tag - Tag to filter by
   * @returns {Object[]} Array of matching skills
   */
  findByTag(tag) {
    return this.getAll().filter(s => s.tags?.includes(tag));
  }

  /**
   * Find skills by category
   * @param {string} category - Category to filter by
   * @returns {Object[]} Array of matching skills
   */
  findByCategory(category) {
    return this.getAll().filter(s => s.category === category);
  }

  /**
   * Find skills by stack identifier
   * @param {string|Object} stack - Stack identifier (string or object with language/framework)
   * @returns {Object[]} Array of matching skills
   */
  findByStack(stack) {
    return this.getAll().filter(s => {
      if (!s.stack) return false;

      if (typeof stack === 'string') {
        return s.stack === stack;
      }

      if (typeof stack === 'object') {
        // Support object format: { language: 'php', framework: 'laravel' }
        const stackStr = `${stack.language}/${stack.framework}`;
        return s.stack.includes(stackStr);
      }

      return false;
    });
  }

  /**
   * Search skills by keyword
   * @param {string} query - Search query
   * @returns {Object[]} Array of matching skills
   */
  search(query) {
    const q = query.toLowerCase();
    return this.getAll().filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  /**
   * Clear all loaded skills
   */
  clear() {
    this.skills.clear();
    this.loaded = false;
  }
}

/**
 * Lazy Skill Registry with caching
 * Extends SkillRegistry with TTL-based caching for better performance
 */
class LazySkillRegistry extends SkillRegistry {
  /**
   * Create a LazySkillRegistry instance
   * @param {Object} options - Registry options
   * @param {number} options.cacheTTL - Cache TTL in milliseconds (default: 5 minutes)
   */
  constructor(options = {}) {
    super(options);
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000; // 5 minutes
    this.cacheTimestamps = new Map();
  }

  /**
   * Get a skill by name with caching
   * @param {string} name - Skill name
   * @returns {Object|undefined} Skill object or undefined
   */
  get(name) {
    // Check cache first
    const cached = this._getFromCache(name);
    if (cached) {
      return cached;
    }

    // Load from parent if not in cache
    const skill = super.get(name);
    if (skill) {
      this._setInCache(name, skill);
    }

    return skill;
  }

  /**
   * Get all skills with caching
   * @returns {Object[]} Array of all skill objects
   */
  getAll() {
    const cached = this._getFromCache('__all__');
    if (cached) {
      return cached;
    }

    const skills = super.getAll();
    this._setInCache('__all__', skills);
    return skills;
  }

  /**
   * Get item from cache with TTL check
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/missing
   * @private
   */
  _getFromCache(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return null;

    const age = Date.now() - timestamp;
    if (age > this.cacheTTL) {
      // Cache expired
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Set item in cache with timestamp
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @private
   */
  _setInCache(key, value) {
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Clear all skills and cache
   */
  clear() {
    super.clear();
    this.clearCache();
  }
}

module.exports = {
  SkillRegistry,
  LazySkillRegistry
};

#!/usr/bin/env node

/**
 * Context Manager
 *
 * Orchestrates context gathering from files and URLs.
 * Aggregates content, tracks sources, and updates STATE.md with context metadata.
 * Enhanced with context optimization: scoring, compression, deduplication, and metadata tracking.
 */

const fs = require('fs');
const path = require('path');
const FileAccessService = require('./file-access.cjs');
const URLFetchService = require('./url-fetch.cjs');
const ContentSecurityScanner = require('./content-scanner.cjs');
const ContextCache = require('./context-cache.cjs');
const { SecurityScanError, FileAccessError, URLFetchError } = require('./context-errors.cjs');
const ContextRelevanceScorer = require('./context-relevance-scorer.cjs');
const ContextCompressor = require('./context-compressor.cjs');
const ContextDeduplicator = require('./context-deduplicator.cjs');
const ContextMetadataTracker = require('./context-metadata-tracker.cjs');

class ContextManager {
  /**
   * Create a new ContextManager instance
   * @param {string} cwd - Current working directory
   */
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.sources = [];
    this.cache = new ContextCache();
    this.fileAccess = new FileAccessService(this.cwd);
    this.urlFetch = new URLFetchService();
    this.scanner = new ContentSecurityScanner();
    this.scorer = null;
    this.compressor = new ContextCompressor();
    this.deduplicator = new ContextDeduplicator({ enableFuzzyMatch: true });
    this.metadataTracker = new ContextMetadataTracker(this.cwd);
  }

  /**
   * Request context from files and URLs
   * @param {{files?: string[], urls?: string[], task?: string, enableScoring?: boolean, minScore?: number, maxFiles?: number, enableCompression?: boolean, enableDeduplication?: boolean, taskId?: string}} options - Context options
   * @returns {{context: string, sources: Array, errors: Array, scoringStats?: Object, compressionStats?: Object, dedupStats?: Object, metadata?: Object}} - Aggregated context with optimization stats
   */
  async requestContext(options = {}) {
    const {
      files = [],
      urls = [],
      task,
      enableScoring = false,
      minScore = 0.1,
      maxFiles = 20,
      enableCompression = false,
      enableDeduplication = false,
      taskId
    } = options;

    const contextParts = [];
    const sources = [];
    const errors = [];
    let scoringStats = null;
    let compressionStats = null;
    let dedupStats = null;

    // Gather all files from patterns
    let allFiles = [];
    for (const pattern of files) {
      try {
        const fileResults = this.fileAccess.readFiles(pattern);
        for (const file of fileResults) {
          allFiles.push({
            path: file.path,
            content: file.content
          });
        }
      } catch (err) {
        errors.push({
          source: pattern,
          type: 'file',
          message: err.message
        });
      }
    }

    // Step 1: Score files if task provided and scoring enabled
    let filesToProcess = allFiles;
    if (task && enableScoring && allFiles.length > 0) {
      this.scorer = new ContextRelevanceScorer(task, { minScore, maxFiles });
      const scoredFiles = this.scorer.scoreFiles(allFiles.map(f => f.path));
      const scoredPaths = new Set(scoredFiles.map(f => f.path));

      // Filter to scored files and attach scores
      filesToProcess = allFiles
        .filter(f => scoredPaths.has(f.path))
        .map(f => {
          const scored = scoredFiles.find(s => s.path === f.path);
          return {
            path: f.path,
            content: f.content,
            score: scored ? scored.score : 0,
            breakdown: scored ? scored.breakdown : null
          };
        });

      // Calculate scoring stats
      const avgScore = filesToProcess.length > 0
        ? filesToProcess.reduce((sum, f) => sum + f.score, 0) / filesToProcess.length
        : 0;

      scoringStats = {
        enabled: true,
        minScore,
        avgScore: Math.round(avgScore * 100) / 100,
        filteredCount: allFiles.length - filesToProcess.length
      };
    }

    // Step 2: Deduplicate files if enabled
    let uniqueFiles = filesToProcess;
    if (enableDeduplication && filesToProcess.length > 0) {
      const result = this.deduplicator.deduplicateFiles(filesToProcess);
      uniqueFiles = result.unique;
      dedupStats = this.deduplicator.getStats();
    }

    // Step 3: Compress files if enabled
    const processedFiles = [];
    for (const file of uniqueFiles) {
      let content = file.content;
      let compressionInfo = null;

      if (enableCompression) {
        const result = this.compressor.compressFile(file.path, content);
        if (result.compressed) {
          content = result.content;
          compressionInfo = {
            method: result.method,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            reduction: result.reduction
          };
        }
      }

      processedFiles.push({
        ...file,
        content,
        compression: compressionInfo
      });
    }

    if (enableCompression) {
      compressionStats = this.compressor.getStats();
    }

    // Build context from processed files
    for (const file of processedFiles) {
      contextParts.push(`## File: ${file.path}\n\n${file.content}`);
      const source = {
        type: 'file',
        source: file.path,
        timestamp: new Date().toISOString(),
        size: file.content.length,
        score: file.score,
        compression: file.compression
      };
      sources.push(source);
      this.trackSources([source]);
    }

    // Process URLs (unchanged)
    for (const url of urls) {
      try {
        const confirmed = await URLFetchService.confirmUrlFetch(url);
        if (!confirmed) {
          errors.push({
            source: url,
            type: 'url',
            message: 'User declined to fetch URL'
          });
          continue;
        }

        const result = await this.urlFetch.fetchUrl(url);
        const scanResult = this.scanner.scan(result.content, result.contentType);
        if (!scanResult.safe) {
          throw new SecurityScanError(scanResult.findings);
        }

        contextParts.push(`## URL: ${url}\n\n${result.content}`);

        const source = {
          type: 'url',
          source: url,
          timestamp: new Date().toISOString(),
          contentType: result.contentType,
          size: result.content.length
        };
        sources.push(source);
        this.trackSources([source]);
        this.cache.set(url, result.content, {
          type: 'url',
          contentType: result.contentType
        });
      } catch (err) {
        errors.push({
          source: url,
          type: 'url',
          message: err.message
        });
      }
    }

    // Build metadata if taskId provided
    let metadata = null;
    if (taskId) {
      metadata = this.metadataTracker.createMetadata(
        {
          context: contextParts.join('\n\n---\n\n'),
          sources,
          scoringStats,
          compressionStats,
          dedupStats
        },
        { taskId, task: task || '' }
      );
      this.metadataTracker.saveMetadata(metadata);
    }

    return {
      context: contextParts.join('\n\n---\n\n'),
      sources,
      errors,
      scoringStats,
      compressionStats,
      dedupStats,
      metadata
    };
  }

  /**
   * Track source metadata (with deduplication)
   * @param {Array} sources - Array of source objects
   */
  trackSources(sources) {
    for (const source of sources) {
      // Check for duplicates (same type and source)
      const isDuplicate = this.sources.some(
        s => s.type === source.type && s.source === source.source
      );
      
      if (!isDuplicate) {
        this.sources.push(source);
      }
    }
  }

  /**
   * Update STATE.md with context sources
   * Creates or appends to the Context Sources section
   */
  updateStateMd() {
    const statePath = path.join(this.cwd, '.planning', 'STATE.md');
    
    // Ensure .planning directory exists
    const planningDir = path.join(this.cwd, '.planning');
    if (!fs.existsSync(planningDir)) {
      fs.mkdirSync(planningDir, { recursive: true });
    }

    let content = '';
    
    // Read existing content or start fresh
    if (fs.existsSync(statePath)) {
      content = fs.readFileSync(statePath, 'utf-8');
    } else {
      content = '# Project State\n\n';
    }

    // Build the context sources table
    const tableHeader = '| Source | Type | Timestamp |\n|--------|------|-----------|';
    const tableRows = this.sources.map(s => 
      `| ${s.source} | ${s.type.toUpperCase()} | ${s.timestamp} |`
    );
    
    const contextSection = `\n## Context Sources\n\n${tableHeader}\n${tableRows.join('\n')}\n`;

    // Check if Context Sources section already exists
    const sectionRegex = /## Context Sources\n[\s\S]*?(?=\n## |\n$|$)/i;
    const existingSection = content.match(sectionRegex);

    if (existingSection) {
      // Replace existing section
      content = content.replace(sectionRegex, contextSection);
    } else {
      // Append new section
      content = content.trimEnd() + '\n' + contextSection;
    }

    // Write back to STATE.md
    fs.writeFileSync(statePath, content, 'utf-8');
  }

  /**
   * Get all tracked sources
   * @returns {Array} - Array of source objects
   */
  getSources() {
    return [...this.sources];
  }

  /**
   * Get cached content for a URL
   * @param {string} key - Cache key (URL)
   * @returns {{content: string, timestamp: number, type: string}|undefined}
   */
  getCached(key) {
    return this.cache.get(key);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {{size: number, keys: Array<string>}}
   */
  getCacheStats() {
    return this.cache.stats();
  }
}

module.exports = ContextManager;

/**
 * Dependency Graph — Automated dependency analysis using madge
 * 
 * Provides:
 * - build(rootPath, entryPoint): Creates dependency graph using madge for JS/TS files
 * - detectCircular(): Returns array of circular dependency paths
 * - getNodes(), getEdges(), getOrphanFiles(), getLeafFiles(): Graph accessors
 */

const path = require('path');
const fs = require('fs');

class DependencyGraph {
  constructor(rootPath, options = {}) {
    this.rootPath = rootPath;
    this.options = {
      entry: options.entry || null,
      detectCircular: options.detectCircular !== false,
      includeNpm: options.includeNpm || false,
      tsConfig: options.tsConfig || 'tsconfig.json',
      fileExtensions: options.fileExtensions || ['.ts', '.tsx', '.js', '.jsx'],
      ...options
    };
    this.nodes = [];
    this.edges = {};
    this.circular = [];
    this.orphan = [];
    this.leafs = [];
    this.graph = null;
  }

  /**
   * Build dependency graph from root path
   * @param {string} rootPath - Root directory to analyze
   * @param {string} entryPoint - Optional entry point file
   * @returns {Promise<object>} Graph object with nodes, edges, circular, orphan, leafs
   */
  async build(rootPath = this.rootPath, entryPoint = this.options.entry) {
    try {
      const madge = require('madge');

      const config = {
        entry: entryPoint || undefined,
        detectCircular: this.options.detectCircular,
        includeNpm: this.options.includeNpm,
        tsConfig: path.join(rootPath, this.options.tsConfig),
        fileExtensions: this.options.fileExtensions,
        extensions: this.options.fileExtensions.map(ext => ext.replace('.', ''))
      };

      // Find source files
      const srcDir = path.join(rootPath, 'src');
      const appDir = path.join(rootPath, 'app');
      const libDir = path.join(rootPath, 'lib');

      let searchPath = rootPath;
      if (fs.existsSync(srcDir)) {
        searchPath = srcDir;
      } else if (fs.existsSync(appDir)) {
        searchPath = appDir;
      } else if (fs.existsSync(libDir)) {
        searchPath = libDir;
      }

      // Build glob pattern
      const patterns = this.options.fileExtensions
        .flatMap(ext => [
          path.join(searchPath, `**/*${ext}`),
          path.join(rootPath, `bin/**/*${ext}`),
          path.join(rootPath, 'commands/**/*${ext}')
        ]);

      // Filter to existing paths
      const existingPatterns = patterns.filter(p => {
        // Simple check - madge will handle the actual globbing
        return true;
      });

      // Use madge to analyze dependencies
      const depGraph = await madge(existingPatterns.length > 0 ? existingPatterns : searchPath, {
        ...config,
        tsConfig: fs.existsSync(config.tsConfig) ? config.tsConfig : undefined
      });

      this.nodes = depGraph.nodes();
      this.edges = depGraph.dependencies();
      this.circular = this.options.detectCircular ? depGraph.circular() : [];
      this.orphan = depGraph.orphan();
      this.leafs = depGraph.leafs();
      this.graph = depGraph;

      return {
        nodes: this.nodes,
        edges: this.edges,
        circular: this.circular,
        orphan: this.orphan,
        leafs: this.leafs
      };
    } catch (err) {
      // If madge fails, create a basic graph from file system
      console.warn(`Warning: Madge analysis failed (${err.message}), using fallback file-based analysis`);
      return this._buildFallback(rootPath);
    }
  }

  /**
   * Detect circular dependencies
   * @returns {Array} Array of circular dependency paths
   */
  detectCircular() {
    return this.circular;
  }

  /**
   * Get all nodes (files) in the graph
   * @returns {Array} Array of file paths
   */
  getNodes() {
    return this.nodes;
  }

  /**
   * Get all edges (import relationships) in the graph
   * @returns {object} Object mapping file paths to their dependencies
   */
  getEdges() {
    return this.edges;
  }

  /**
   * Get orphan files (files with no imports/exports)
   * @returns {Array} Array of orphan file paths
   */
  getOrphanFiles() {
    return this.orphan;
  }

  /**
   * Get leaf files (files not imported by others)
   * @returns {Array} Array of leaf file paths
   */
  getLeafFiles() {
    return this.leafs;
  }

  /**
   * Get dependency count for a file
   * @param {string} filePath - File path
   * @returns {number} Number of dependencies
   */
  getDependencyCount(filePath) {
    return this.edges[filePath] ? this.edges[filePath].length : 0;
  }

  /**
   * Get dependent count (how many files depend on this file)
   * @param {string} filePath - File path
   * @returns {number} Number of files that depend on this file
   */
  getDependentCount(filePath) {
    let count = 0;
    for (const deps of Object.values(this.edges)) {
      if (deps.includes(filePath)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get most depended upon files (hubs)
   * @param {number} limit - Maximum number of results
   * @returns {Array} Array of {file, count} objects
   */
  getHubFiles(limit = 10) {
    const counts = {};
    for (const deps of Object.values(this.edges)) {
      for (const dep of deps) {
        counts[dep] = (counts[dep] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get most dependent files (files with many dependencies)
   * @param {number} limit - Maximum number of results
   * @returns {Array} Array of {file, count} objects
   */
  getMostDependentFiles(limit = 10) {
    return Object.entries(this.edges)
      .map(([file, deps]) => ({ file, count: deps.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Fallback graph builder when madge fails
   * @private
   */
  _buildFallback(rootPath) {
    const result = {
      nodes: [],
      edges: {},
      circular: [],
      orphan: [],
      leafs: []
    };

    try {
      // Simple file-based analysis
      const files = this._getAllSourceFiles(rootPath);
      result.nodes = files;

      // Create basic edges from import statements
      for (const file of files) {
        const imports = this._extractImports(file);
        result.edges[file] = imports.filter(imp => files.includes(imp));
      }

      // Find orphans (no imports and not imported)
      const importedFiles = new Set();
      for (const deps of Object.values(result.edges)) {
        for (const dep of deps) {
          importedFiles.add(dep);
        }
      }

      result.orphan = files.filter(file => {
        const hasImports = result.edges[file] && result.edges[file].length > 0;
        const isImported = importedFiles.has(file);
        return !hasImports && !isImported;
      });

      // Find leafs (not imported by others)
      result.leafs = files.filter(file => !importedFiles.has(file));

      this.nodes = result.nodes;
      this.edges = result.edges;
      this.orphan = result.orphan;
      this.leafs = result.leafs;

      return result;
    } catch (err) {
      console.warn(`Warning: Fallback graph building failed: ${err.message}`);
      return result;
    }
  }

  /**
   * Get all source files in directory
   * @private
   */
  _getAllSourceFiles(dir, files = []) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          this._getAllSourceFiles(fullPath, files);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (this.options.fileExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      // Ignore errors
    }
    return files;
  }

  /**
   * Extract imports from a file
   * @private
   */
  _extractImports(filePath) {
    const imports = [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /(?:import|require)\s*[\s\S]*?['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Only include relative imports
        if (importPath.startsWith('.')) {
          const resolved = path.resolve(path.dirname(filePath), importPath);
          // Try to find the actual file
          for (const ext of this.options.fileExtensions) {
            const withExt = resolved + ext;
            if (fs.existsSync(withExt)) {
              imports.push(withExt);
              break;
            }
          }
          // Also check index files
          for (const ext of this.options.fileExtensions) {
            const indexPath = path.join(resolved, `index${ext}`);
            if (fs.existsSync(indexPath)) {
              imports.push(indexPath);
              break;
            }
          }
        }
      }
    } catch (err) {
      // Ignore errors
    }
    return imports;
  }
}

module.exports = { DependencyGraph };

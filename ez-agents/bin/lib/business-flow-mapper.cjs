/**
 * Business Flow Mapper — Analyzes user journeys, data flow, and integration points
 *
 * Provides:
 * - map(rootPath, stack): Identifies user journeys from route/file structure
 * - analyzeDataFlow(rootPath): Traces data flow through imports and function calls
 * - findIntegrationPoints(stack): Identifies external API integrations from dependencies
 */

const fs = require('fs');
const path = require('path');

class BusinessFlowMapper {
  constructor(rootPath) {
    this.rootPath = rootPath;
  }

  /**
   * Map business flows from codebase structure
   * @param {string} rootPath - Root directory to analyze
   * @param {object} stack - Stack object from StackDetector
   * @returns {object} Object with journeys and entryPoints
   */
  map(rootPath = this.rootPath, stack = {}) {
    const routes = this._findRoutes(rootPath);
    const journeys = this._extractJourneys(routes, stack);
    const entryPoints = this._findEntryPoints(rootPath);

    return {
      journeys,
      entryPoints,
      routes
    };
  }

  /**
   * Analyze data flow through the codebase
   * @param {string} rootPath - Root directory to analyze
   * @returns {object} Object with flows and dataStores
   */
  analyzeDataFlow(rootPath = this.rootPath) {
    const sourceFiles = this._getSourceFiles(rootPath);
    const flows = this._traceDataFlow(sourceFiles, rootPath);
    const dataStores = this._findDataStores(sourceFiles, rootPath);

    return {
      flows,
      dataStores
    };
  }

  /**
   * Find integration points from stack dependencies
   * @param {object} stack - Stack object from StackDetector
   * @returns {object} Object with integrations array
   */
  findIntegrationPoints(stack = {}) {
    const integrations = [];
    const frameworks = stack.frameworks || [];
    const infrastructure = stack.infrastructure || [];
    const databases = stack.databases || [];

    // Payment integrations
    if (frameworks.includes('Stripe') || infrastructure.some(i => i.includes('Stripe'))) {
      integrations.push({
        name: 'Stripe',
        type: 'payment',
        purpose: 'Payment processing and subscriptions'
      });
    }

    // Cloud integrations
    if (infrastructure.some(i => i.includes('AWS'))) {
      integrations.push({
        name: 'AWS',
        type: 'cloud',
        purpose: 'Cloud infrastructure and services'
      });
    }
    if (infrastructure.some(i => i.includes('Azure'))) {
      integrations.push({
        name: 'Azure',
        type: 'cloud',
        purpose: 'Cloud infrastructure and services'
      });
    }
    if (infrastructure.some(i => i.includes('Google Cloud'))) {
      integrations.push({
        name: 'Google Cloud',
        type: 'cloud',
        purpose: 'Cloud infrastructure and services'
      });
    }

    // Monitoring integrations
    if (infrastructure.some(i => i.includes('Sentry'))) {
      integrations.push({
        name: 'Sentry',
        type: 'monitoring',
        purpose: 'Error tracking and monitoring'
      });
    }
    if (infrastructure.some(i => i.includes('Datadog'))) {
      integrations.push({
        name: 'Datadog',
        type: 'monitoring',
        purpose: 'Infrastructure and application monitoring'
      });
    }

    // Email integrations
    if (infrastructure.some(i => i.includes('SendGrid') || i.includes('Mailgun'))) {
      integrations.push({
        name: 'Email Service',
        type: 'communication',
        purpose: 'Transactional email delivery'
      });
    }

    // Database integrations
    for (const db of databases) {
      integrations.push({
        name: db,
        type: 'database',
        purpose: 'Data persistence'
      });
    }

    // Auth integrations
    if (frameworks.includes('NextAuth.js') || frameworks.includes('Auth.js')) {
      integrations.push({
        name: 'NextAuth.js',
        type: 'authentication',
        purpose: 'User authentication and authorization'
      });
    }

    return {
      integrations
    };
  }

  /**
   * Find route files in the codebase
   * @private
   */
  _findRoutes(rootPath) {
    const routes = [];
    const routePatterns = [
      'src/pages',
      'src/app',
      'src/routes',
      'pages',
      'app',
      'routes',
      'src/controllers',
      'controllers'
    ];

    for (const pattern of routePatterns) {
      const routeDir = path.join(rootPath, pattern);
      if (fs.existsSync(routeDir)) {
        this._collectRoutes(routeDir, routes, pattern);
      }
    }

    return routes;
  }

  /**
   * Collect routes from directory
   * @private
   */
  _collectRoutes(dir, routes, basePath, depth = 0) {
    if (depth > 5) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this._collectRoutes(fullPath, routes, basePath, depth + 1);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const relativePath = path.relative(path.join(this.rootPath, basePath), fullPath);
          const routePath = this._fileToRoute(relativePath);
          routes.push({
            path: routePath,
            file: fullPath,
            name: path.basename(entry.name, path.extname(entry.name))
          });
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }

  /**
   * Convert file path to route path
   * @private
   */
  _fileToRoute(filePath) {
    let route = filePath
      .replace(/^(page|route|layout)\./, '')
      .replace(/\.tsx?$/, '')
      .replace(/\.jsx?$/, '')
      .replace(/\\/g, '/')
      .replace(/\/index$/, '')
      .replace(/\[(\w+)\]/g, ':$1');

    return '/' + route;
  }

  /**
   * Extract user journeys from routes
   * @private
   */
  _extractJourneys(routes, stack) {
    const journeys = [];

    // Group routes by prefix to identify journeys
    const routeGroups = {};
    for (const route of routes) {
      const parts = route.path.split('/').filter(p => p && !p.startsWith(':'));
      if (parts.length > 0) {
        const prefix = parts[0];
        if (!routeGroups[prefix]) {
          routeGroups[prefix] = [];
        }
        routeGroups[prefix].push(route);
      }
    }

    // Create journeys from route groups
    for (const [prefix, groupRoutes] of Object.entries(routeGroups)) {
      const journey = {
        name: this._capitalize(prefix),
        path: `/${prefix}`,
        components: groupRoutes.map(r => r.name),
        routes: groupRoutes.map(r => r.path)
      };

      // Enhance with stack-specific info
      if (stack.frameworks?.includes('Next.js')) {
        journey.framework = 'Next.js Pages/App Router';
      } else if (stack.frameworks?.includes('React')) {
        journey.framework = 'React Router';
      }

      journeys.push(journey);
    }

    return journeys;
  }

  /**
   * Find entry points in the codebase
   * @private
   */
  _findEntryPoints(rootPath) {
    const entryPoints = [];
    const entryPatterns = [
      'src/index.ts',
      'src/index.tsx',
      'src/index.js',
      'src/main.ts',
      'src/main.tsx',
      'src/app.tsx',
      'src/app.ts',
      'index.ts',
      'index.tsx',
      'index.js',
      'main.ts',
      'app.tsx'
    ];

    for (const pattern of entryPatterns) {
      const entryPath = path.join(rootPath, pattern);
      if (fs.existsSync(entryPath)) {
        entryPoints.push(entryPath);
      }
    }

    return entryPoints;
  }

  /**
   * Trace data flow through source files
   * @private
   */
  _traceDataFlow(sourceFiles, rootPath) {
    const flows = [];

    for (const file of sourceFiles.slice(0, 50)) { // Limit to 50 files
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Look for data flow patterns
        const importMatches = content.match(/import\s+.*?\s+from\s+['"](.+?)['"]/g) || [];
        const exportMatches = content.match(/export\s+(default\s+)?(function|class|const|let|var)/g) || [];

        if (importMatches.length > 0 || exportMatches.length > 0) {
          flows.push({
            file,
            imports: importMatches.length,
            exports: exportMatches.length,
            transformations: this._detectTransformations(content)
          });
        }
      } catch (err) {
        // Ignore read errors
      }
    }

    return flows;
  }

  /**
   * Detect data transformations in code
   * @private
   */
  _detectTransformations(content) {
    const transformations = [];

    // Look for common transformation patterns
    const patterns = {
      map: /\.map\(/,
      filter: /\.filter\(/,
      reduce: /\.reduce\(/,
      transform: /\.transform\(/,
      parse: /\.parse\(|JSON\.parse/,
      stringify: /\.stringify\(|JSON\.stringify/
    };

    for (const [name, regex] of Object.entries(patterns)) {
      if (regex.test(content)) {
        transformations.push(name);
      }
    }

    return transformations;
  }

  /**
   * Find data stores in the codebase
   * @private
   */
  _findDataStores(sourceFiles, rootPath) {
    const dataStores = [];

    // Look for store patterns
    const storePatterns = [
      'src/stores',
      'src/store',
      'stores',
      'store',
      'src/models',
      'models',
      'src/db',
      'db',
      'src/database',
      'database'
    ];

    for (const pattern of storePatterns) {
      const storePath = path.join(rootPath, pattern);
      if (fs.existsSync(storePath)) {
        dataStores.push({
          type: 'store',
          path: storePath,
          name: pattern.split('/').pop()
        });
      }
    }

    return dataStores;
  }

  /**
   * Get source files from directory
   * @private
   */
  _getSourceFiles(rootPath) {
    const files = [];
    const srcDir = path.join(rootPath, 'src');

    if (fs.existsSync(srcDir)) {
      this._collectSourceFiles(srcDir, files);
    } else {
      this._collectSourceFiles(rootPath, files);
    }

    return files;
  }

  /**
   * Collect source files from directory
   * @private
   */
  _collectSourceFiles(dir, files, depth = 0) {
    if (depth > 5 || dir.includes('node_modules') || dir.includes('dist') || dir.includes('build')) {
      return;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this._collectSourceFiles(fullPath, files, depth + 1);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }

  /**
   * Capitalize first letter
   * @private
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = { BusinessFlowMapper };

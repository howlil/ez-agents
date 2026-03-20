/**
 * Stack Detector — Automated technology stack detection from package manifests and config files
 * 
 * Provides:
 * - detect(rootPath): Returns languages, runtime, packageManager, frameworks, databases, infrastructure
 * - detectPackageManifests(rootPath): Finds and parses manifest files
 * - detectPackageManager(rootPath): Delegates to PackageManagerDetector
 * - detectFrameworks(dependencies): Maps package names to framework names
 * - detectDatabases(dependencies): Maps ORM/db packages to database names
 * - detectInfrastructure(dependencies): Maps cloud/monitoring/testing packages
 */

const fs = require('fs');
const path = require('path');
const PackageManagerDetector = require('./package-manager-detector.cjs');

class StackDetector {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.pmDetector = new PackageManagerDetector(rootPath);
  }

  /**
   * Detect technology stack from root path
   * @param {string} rootPath - Root directory to analyze
   * @returns {object} Stack object with language, runtime, packageManager, frameworks, databases, infrastructure
   */
  detect(rootPath = this.rootPath) {
    const manifests = this.detectPackageManifests(rootPath);
    const packageManager = this.detectPackageManager(rootPath);

    let result = {
      language: 'unknown',
      runtime: 'unknown',
      packageManager,
      frameworks: [],
      databases: [],
      infrastructure: [],
      manifests
    };

    // Parse package.json if exists
    if (manifests.node) {
      const pkgPath = path.join(rootPath, manifests.node);
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const dependencies = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies
        };

        result.language = 'javascript';
        result.runtime = 'node';
        result.runtimeVersion = pkg.engines?.node || '>=16.0.0';
        result.frameworks = this.detectFrameworks(dependencies);
        result.databases = this.detectDatabases(dependencies);
        result.infrastructure = this.detectInfrastructure(dependencies);
      } catch (err) {
        // Ignore parse errors
      }
    }

    // Check for other languages
    if (manifests.python) {
      result.language = 'python';
      result.runtime = 'python';
    }
    if (manifests.ruby) {
      result.language = 'ruby';
      result.runtime = 'ruby';
    }
    if (manifests.php) {
      result.language = 'php';
      result.runtime = 'php';
    }
    if (manifests.java) {
      result.language = 'java';
      result.runtime = 'jvm';
    }
    if (manifests.go) {
      result.language = 'go';
      result.runtime = 'go';
    }
    if (manifests.rust) {
      result.language = 'rust';
      result.runtime = 'rust';
    }

    return result;
  }

  /**
   * Detect package manifests in root path
   * @param {string} rootPath - Root directory to analyze
   * @returns {object} Object with found manifest files
   */
  detectPackageManifests(rootPath = this.rootPath) {
    const manifests = {};

    const manifestMap = {
      node: ['package.json'],
      python: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
      ruby: ['Gemfile'],
      php: ['composer.json'],
      java: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
      go: ['go.mod'],
      rust: ['Cargo.toml']
    };

    for (const [lang, files] of Object.entries(manifestMap)) {
      for (const file of files) {
        const fullPath = path.join(rootPath, file);
        if (fs.existsSync(fullPath)) {
          manifests[lang] = file;
          break;
        }
      }
    }

    return manifests;
  }

  /**
   * Detect package manager
   * @param {string} rootPath - Root directory to analyze
   * @returns {string} Package manager name (npm, yarn, pnpm)
   */
  detectPackageManager(rootPath = this.rootPath) {
    const result = this.pmDetector.detect();
    if (result && typeof result === 'object' && result.manager) {
      return result.manager;
    }
    return result || 'npm';
  }

  /**
   * Detect frameworks from dependencies
   * @param {object} dependencies - Dependencies object from package.json
   * @returns {Array} Array of framework names
   */
  detectFrameworks(dependencies = {}) {
    const frameworkMap = {
      // Frontend
      'react': 'React',
      'next': 'Next.js',
      'vue': 'Vue.js',
      'nuxt': 'Nuxt.js',
      '@angular/core': 'Angular',
      'svelte': 'Svelte',
      'solid-js': 'SolidJS',
      // Backend
      'express': 'Express',
      'fastify': 'Fastify',
      '@nestjs/core': 'NestJS',
      'nest': 'NestJS',
      'koa': 'Koa',
      'hapi': 'Hapi',
      '@hapi/hapi': 'Hapi',
      // Full-stack
      'remix': 'Remix',
      // Mobile
      'react-native': 'React Native',
      // Python
      'django': 'Django',
      'flask': 'Flask',
      'fastapi': 'FastAPI',
      // Ruby
      'rails': 'Ruby on Rails',
      'sinatra': 'Sinatra',
      // PHP
      'laravel/framework': 'Laravel',
      'symfony': 'Symfony',
      // Java
      'spring-boot': 'Spring Boot',
      'quarkus': 'Quarkus',
      // Build/Dev
      'vite': 'Vite',
      'webpack': 'Webpack',
      'rollup': 'Rollup',
      'parcel': 'Parcel',
      // CSS
      'tailwindcss': 'Tailwind CSS',
      'bootstrap': 'Bootstrap',
      '@mui/material': 'Material-UI',
      '@chakra-ui/react': 'Chakra UI',
      'antd': 'Ant Design'
    };

    const detected = [];
    for (const [pkg, name] of Object.entries(frameworkMap)) {
      if (dependencies[pkg]) {
        detected.push(name);
      }
    }

    return detected;
  }

  /**
   * Detect databases from dependencies
   * @param {object} dependencies - Dependencies object from package.json
   * @returns {Array} Array of database names
   */
  detectDatabases(dependencies = {}) {
    const dbMap = {
      'pg': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mysql2': 'MySQL',
      'mysql': 'MySQL',
      'sqlite3': 'SQLite',
      'better-sqlite3': 'SQLite',
      'mssql': 'SQL Server',
      'tedious': 'SQL Server',
      'oracledb': 'Oracle',
      'mongoose': 'MongoDB',
      'mongodb': 'MongoDB',
      'redis': 'Redis',
      'ioredis': 'Redis',
      'prisma': 'Prisma (ORM)',
      '@prisma/client': 'Prisma',
      'typeorm': 'TypeORM',
      'sequelize': 'Sequelize',
      'knex': 'Knex.js',
      'drizzle-orm': 'Drizzle ORM',
      'objection': 'Objection.js',
      'bookshelf': 'Bookshelf',
      'waterline': 'Waterline',
      'rethinkdb': 'RethinkDB',
      'cassandra-driver': 'Cassandra',
      'neo4j-driver': 'Neo4j'
    };

    const detected = [];
    for (const [pkg, name] of Object.entries(dbMap)) {
      if (dependencies[pkg]) {
        detected.push(name);
      }
    }

    return detected;
  }

  /**
   * Detect infrastructure from dependencies
   * @param {object} dependencies - Dependencies object from package.json
   * @returns {Array} Array of infrastructure names
   */
  detectInfrastructure(dependencies = {}) {
    const infraMap = {
      // Cloud
      '@aws-sdk/*': 'AWS SDK',
      '@aws-sdk': 'AWS SDK',
      'aws-sdk': 'AWS SDK v2',
      '@azure/*': 'Azure SDK',
      '@azure': 'Azure SDK',
      '@google-cloud/*': 'Google Cloud SDK',
      // Serverless
      'serverless': 'Serverless Framework',
      // Containers
      'dockerode': 'Docker',
      '@docker/cli': 'Docker',
      // Monitoring/Logging
      'winston': 'Winston (logging)',
      'pino': 'Pino (logging)',
      'bunyan': 'Bunyan (logging)',
      '@sentry/node': 'Sentry',
      '@sentry/*': 'Sentry',
      'datadog-metrics': 'Datadog',
      'newrelic': 'New Relic',
      // Testing
      'jest': 'Jest',
      'vitest': 'Vitest',
      'mocha': 'Mocha',
      'chai': 'Chai',
      'cypress': 'Cypress',
      'playwright': 'Playwright',
      '@testing-library/*': 'Testing Library',
      '@testing-library': 'Testing Library',
      'puppeteer': 'Puppeteer',
      // CI/CD
      'semantic-release': 'Semantic Release',
      // Auth
      'next-auth': 'NextAuth.js',
      '@auth/core': 'Auth.js',
      'passport': 'Passport',
      'jsonwebtoken': 'JWT',
      'bcrypt': 'bcrypt',
      'argon2': 'Argon2'
    };

    const detected = [];
    for (const [pkg, name] of Object.entries(infraMap)) {
      const pattern = pkg.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (Object.keys(dependencies).some(k => regex.test(k) || k.startsWith(pkg.replace('/*', '')))) {
        if (!detected.includes(name)) {
          detected.push(name);
        }
      }
    }

    return detected;
  }

  /**
   * Detect languages from file structure
   * @param {object} structure - Structure object from CodebaseAnalyzer
   * @returns {object} Object with language counts
   */
  detectLanguages(structure) {
    const languageDetectors = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.rb': 'ruby',
      '.go': 'go',
      '.java': 'java',
      '.php': 'php',
      '.rs': 'rust',
      '.cs': 'csharp',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.clj': 'clojure',
      '.ex': 'elixir',
      '.exs': 'elixir',
      '.erl': 'erlang',
      '.hs': 'haskell',
      '.ml': 'ocaml',
      '.r': 'r',
      '.R': 'r',
      '.sql': 'sql',
      '.sh': 'shell',
      '.bash': 'shell'
    };

    const languages = {};
    const files = structure?.files || [];

    for (const file of files) {
      const ext = path.extname(file);
      const lang = languageDetectors[ext] || 'unknown';
      languages[lang] = (languages[lang] || 0) + 1;
    }

    return languages;
  }

  /**
   * Detect config files in root path
   * @param {string} rootPath - Root directory to analyze
   * @returns {object} Object with found config files
   */
  detectConfigFiles(rootPath = this.rootPath) {
    const configPatterns = {
      typescript: 'tsconfig.json',
      jsconfig: 'jsconfig.json',
      vite: 'vite.config.js',
      webpack: 'webpack.config.js',
      rollup: 'rollup.config.js',
      eslint: '.eslintrc.js',
      prettier: '.prettierrc',
      next: 'next.config.js',
      nuxt: 'nuxt.config.js',
      remix: 'remix.config.js',
      prisma: 'prisma/schema.prisma',
      jest: 'jest.config.js',
      vitest: 'vitest.config.js',
      cypress: 'cypress.config.js',
      docker: 'Dockerfile',
      dockerCompose: 'docker-compose.yml',
      serverless: 'serverless.yml',
      vercel: 'vercel.json',
      netlify: 'netlify.toml',
      heroku: 'Procfile',
      github: '.github/workflows',
      gitlab: '.gitlab-ci.yml',
      circle: '.circleci/config.yml'
    };

    const configs = {};
    for (const [key, pattern] of Object.entries(configPatterns)) {
      const fullPath = path.join(rootPath, pattern);
      if (fs.existsSync(fullPath)) {
        configs[key] = {
          path: fullPath,
          exists: true
        };
      }
    }

    return configs;
  }
}

module.exports = { StackDetector };

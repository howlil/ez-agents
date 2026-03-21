/**
 * Project Reporter — Aggregates codebase mapping, stack detection, and tech debt analysis
 *
 * Provides:
 * - generate(structure, stack, techDebt): Aggregates all analysis into unified report
 * - buildArchitectureOverview(structure, stack): Creates architecture summary section
 * - buildPainPoints(techDebt): Creates prioritized issues section
 * - buildRecommendations(techDebt, stack): Creates actionable recommendations section
 */

const path = require('path');

class ProjectReporter {
  constructor(rootPath) {
    this.rootPath = rootPath;
  }

  /**
   * Generate comprehensive project report
   * @param {object} structure - Structure from CodebaseAnalyzer
   * @param {object} stack - Stack from StackDetector
   * @param {object} techDebt - Tech debt from TechDebtAnalyzer
   * @returns {string} Markdown report
   */
  generate(structure, stack, techDebt) {
    const sections = [
      this.buildHeader(),
      this.buildFileStructureSummary(structure),
      this.buildTechStackSummary(stack),
      this.buildArchitectureOverview(structure, stack),
      this.buildPainPoints(techDebt),
      this.buildRecommendations(techDebt, stack)
    ];

    return sections.filter(s => s).join('\n\n');
  }

  /**
   * Build report header
   * @private
   */
  buildHeader() {
    const date = new Date().toISOString().split('T')[0];
    return `# Project Analysis Report

**Generated:** ${date}
**Analysis Depth:** Standard

---

## Executive Summary

This report provides a comprehensive analysis of the codebase including file structure, technology stack, architecture patterns, pain points, and actionable recommendations.
`;
  }

  /**
   * Build architecture overview section
   * @param {object} structure - Structure from CodebaseAnalyzer
   * @param {object} stack - Stack from StackDetector
   * @returns {string} Markdown section
   */
  buildArchitectureOverview(structure, stack) {
    const pattern = this._detectPattern(structure, stack);
    const layers = this._describeLayers(structure);
    const dataFlow = this._describeDataFlow(structure);
    const entryPoints = structure.entryPoints || [];
    const errorHandling = this._detectErrorHandling(structure);

    return `## Architecture Overview

### Pattern

**Detected Pattern:** ${pattern}

### Layers

${layers}

### Data Flow

${dataFlow}

### Entry Points

${entryPoints.length > 0 ? entryPoints.map(ep => `- \`${ep}\``).join('\n') : '- No explicit entry points detected'}

### Error Handling

${errorHandling}
`;
  }

  /**
   * Build pain points section
   * @param {object} techDebt - Tech debt analysis
   * @returns {string} Markdown section
   */
  buildPainPoints(techDebt) {
    const findings = techDebt.findings || [];
    
    // Group by severity
    const bySeverity = {
      Critical: [],
      High: [],
      Medium: [],
      Low: []
    };

    for (const finding of findings) {
      const severity = finding.severity || 'Medium';
      if (bySeverity[severity]) {
        bySeverity[severity].push(finding);
      }
    }

    let section = `## Pain Points

**Total Issues:** ${findings.length}

`;

    // Critical Issues
    if (bySeverity.Critical.length > 0) {
      section += `### **Critical** Issues (${bySeverity.Critical.length})\n\n`;
      for (const issue of bySeverity.Critical.slice(0, 5)) {
        section += `- **${issue.file || 'Unknown'}** (line ${issue.line || '?'})\n`;
        section += `  - ${issue.description || issue.content || issue.message}\n`;
        section += `  - **Impact:** Requires immediate attention\n\n`;
      }
    }

    // High Priority
    if (bySeverity.High.length > 0) {
      section += `### **High** Priority (${bySeverity.High.length})\n\n`;
      for (const issue of bySeverity.High.slice(0, 5)) {
        section += `- **${issue.file || 'Unknown'}**\n`;
        section += `  - ${issue.description || issue.content || issue.message}\n\n`;
      }
    }

    // Medium Priority
    if (bySeverity.Medium.length > 0) {
      section += `### **Medium** Priority (${bySeverity.Medium.length})\n\n`;
      section += `- ${bySeverity.Medium.length} medium priority issues identified\n`;
      section += `- Review and address in upcoming sprints\n\n`;
    }

    // Low Priority
    if (bySeverity.Low.length > 0) {
      section += `### **Low** Priority (${bySeverity.Low.length})\n\n`;
      section += `- ${bySeverity.Low.length} low priority issues identified\n`;
      section += `- Address as time permits\n\n`;
    }

    if (findings.length === 0) {
      section += '*No significant pain points identified.*\n\n';
    }

    return section;
  }

  /**
   * Build recommendations section
   * @param {object} techDebt - Tech debt analysis
   * @param {object} stack - Stack from StackDetector
   * @returns {string} Markdown section
   */
  buildRecommendations(techDebt, stack) {
    const recommendations = [];
    const findings = techDebt.findings || [];

    // Generate recommendations based on findings
    const criticalFindings = findings.filter(f => f.severity === 'Critical');
    const highFindings = findings.filter(f => f.severity === 'High');
    const largeFiles = findings.filter(f => f.type === 'large_file');
    const complexityIssues = findings.filter(f => f.type === 'complexity');

    // Critical issues → Immediate action
    if (criticalFindings.length > 0) {
      recommendations.push({
        title: 'Address Critical Issues Immediately',
        issue: `${criticalFindings.length} critical issues require immediate attention`,
        files: [...new Set(criticalFindings.map(f => f.file).filter(Boolean))],
        approach: 'Review and fix critical issues including deprecated code, security vulnerabilities, and breaking bugs',
        effort: 'High'
      });
    }

    // Large files → Refactoring
    if (largeFiles.length > 0) {
      recommendations.push({
        title: 'Refactor Large Files',
        issue: `${largeFiles.length} files exceed recommended size thresholds`,
        files: largeFiles.slice(0, 5).map(f => f.file),
        approach: 'Split large files into smaller, focused modules. Target files with >500 lines.',
        effort: 'Medium'
      });
    }

    // Complexity issues → Simplification
    if (complexityIssues.length > 0) {
      recommendations.push({
        title: 'Reduce Code Complexity',
        issue: `${complexityIssues.length} functions/files have high complexity`,
        files: [...new Set(complexityIssues.map(f => f.file).filter(Boolean))],
        approach: 'Extract helper functions, reduce nesting, and simplify conditional logic',
        effort: 'Medium'
      });
    }

    // High priority findings
    if (highFindings.length > 5) {
      recommendations.push({
        title: 'Address High Priority Tech Debt',
        issue: `${highFindings.length} high priority issues identified`,
        files: [...new Set(highFindings.map(f => f.file).filter(Boolean))],
        approach: 'Create tickets for high priority issues and address in next sprint',
        effort: 'Medium'
      });
    }

    // Stack-specific recommendations
    if (stack.frameworks?.includes('Next.js')) {
      recommendations.push({
        title: 'Optimize Next.js Configuration',
        issue: 'Ensure optimal Next.js setup for production',
        files: ['next.config.js', 'package.json'],
        approach: 'Review Next.js configuration for performance optimizations, image optimization, and caching',
        effort: 'Low'
      });
    }

    let section = `## Recommendations

`;

    if (recommendations.length === 0) {
      section += '*No specific recommendations at this time. Continue following best practices.*\n\n';
    } else {
      for (const rec of recommendations) {
        section += `### ${rec.title}\n\n`;
        section += `- **Issue:** ${rec.issue}\n`;
        section += `- **Files:** ${rec.files.length > 0 ? rec.files.map(f => `\`${f}\``).join(', ') : 'N/A'}\n`;
        section += `- **Fix approach:** ${rec.approach}\n`;
        section += `- **Effort:** ${rec.effort}\n\n`;
      }
    }

    return section;
  }

  /**
   * Build file structure summary section
   * @param {object} structure - Structure from CodebaseAnalyzer
   * @returns {string} Markdown section
   */
  buildFileStructureSummary(structure) {
    const directories = structure.directories || [];
    const entryPoints = structure.entryPoints || [];
    const configFiles = structure.configFiles || [];
    const modules = structure.modules || [];

    let section = `## File Structure

### Directory Layout

\`\`\`
${this._buildDirectoryTree(structure)}
\`\`\`

### Directory Purposes

`;

    // Group directories by depth
    const topDirs = directories.filter(d => d.depth === 1).slice(0, 10);
    for (const dir of topDirs) {
      const name = path.basename(dir.path);
      const purpose = this._describeDirectoryPurpose(name);
      section += `- **${name}** — ${purpose}\n`;
    }

    section += `\n### Key Files\n\n`;

    if (entryPoints.length > 0) {
      section += '**Entry Points:**\n\n';
      for (const ep of entryPoints.slice(0, 5)) {
        section += `- \`${ep}\`\n`;
      }
      section += '\n';
    }

    if (configFiles.length > 0) {
      section += '**Configuration Files:**\n\n';
      for (const cf of configFiles.slice(0, 10)) {
        const name = path.basename(cf);
        section += `- \`${name}\`\n`;
      }
      section += '\n';
    }

    if (modules.length > 0) {
      section += '**Module Boundaries:**\n\n';
      for (const mod of modules.slice(0, 10)) {
        section += `- **${mod.name}** (${mod.fileCount} files) — \`${mod.path}\`\n`;
      }
    }

    return section;
  }

  /**
   * Build technology stack summary section
   * @param {object} stack - Stack from StackDetector
   * @returns {string} Markdown section
   */
  buildTechStackSummary(stack) {
    const language = stack.language || 'Unknown';
    const runtime = stack.runtime || 'Unknown';
    const packageManager = stack.packageManager || 'Unknown';
    const frameworks = stack.frameworks || [];
    const databases = stack.databases || [];
    const infrastructure = stack.infrastructure || [];

    return `## Technology Stack

### Languages

- **Primary:** ${language}
- **Runtime:** ${runtime}

### Package Manager

- **Manager:** ${packageManager}

### Frameworks

${frameworks.length > 0 ? frameworks.map(f => `- ${f}`).join('\n') : '- No major frameworks detected'}

### Databases

${databases.length > 0 ? databases.map(d => `- ${d}`).join('\n') : '- No databases detected'}

### Infrastructure

${infrastructure.length > 0 ? infrastructure.map(i => `- ${i}`).join('\n') : '- No infrastructure tools detected'}
`;
  }

  /**
   * Detect architectural pattern from structure
   * @private
   */
  _detectPattern(structure, stack) {
    const directories = structure.directories || [];
    const dirNames = directories.map(d => path.basename(d.path).toLowerCase());

    if (dirNames.includes('components') && dirNames.includes('pages')) {
      return stack.frameworks?.includes('Next.js') ? 'Next.js Pages/App Router' : 'React Component-based';
    }
    if (dirNames.includes('controllers') && dirNames.includes('models') && dirNames.includes('routes')) {
      return 'MVC (Model-View-Controller)';
    }
    if (dirNames.includes('services') && dirNames.includes('handlers')) {
      return 'Service-Oriented';
    }
    if (dirNames.includes('features') || dirNames.includes('modules')) {
      return 'Feature-based / Domain-driven';
    }
    return 'Standard Layered Architecture';
  }

  /**
   * Describe layers in the architecture
   * @private
   */
  _describeLayers(structure) {
    const directories = structure.directories || [];
    const layers = [];

    const layerPatterns = {
      'Presentation': ['components', 'pages', 'views', 'ui'],
      'Business Logic': ['services', 'domain', 'usecases'],
      'Data Access': ['models', 'repositories', 'dal'],
      'Routing': ['routes', 'controllers', 'handlers'],
      'Utilities': ['utils', 'helpers', 'lib']
    };

    for (const [layer, patterns] of Object.entries(layerPatterns)) {
      const matching = directories.filter(d => 
        patterns.some(p => path.basename(d.path).toLowerCase().includes(p))
      );
      if (matching.length > 0) {
        layers.push(`- **${layer}:** ${matching.map(m => path.basename(m.path)).join(', ')}`);
      }
    }

    return layers.length > 0 ? layers.join('\n') : '- Standard layer structure detected';
  }

  /**
   * Describe data flow
   * @private
   */
  _describeDataFlow(structure) {
    const modules = structure.modules || [];
    
    if (modules.length > 0) {
      const hasServices = modules.some(m => m.name === 'services');
      const hasModels = modules.some(m => m.name === 'models');
      const hasControllers = modules.some(m => m.name === 'controllers');

      if (hasControllers && hasServices && hasModels) {
        return 'Controllers → Services → Models → Database';
      }
      if (hasServices && hasModels) {
        return 'Components → Services → Models';
      }
    }

    return 'Standard request-response flow';
  }

  /**
   * Detect error handling patterns
   * @private
   */
  _detectErrorHandling(structure) {
    const files = structure.files || [];
    const errorFiles = files.filter(f => 
      f.toLowerCase().includes('error') || 
      f.toLowerCase().includes('exception')
    );

    if (errorFiles.length > 0) {
      return `Dedicated error handling modules found (${errorFiles.length} files)`;
    }

    return 'Standard try-catch error handling expected';
  }

  /**
   * Build ASCII directory tree
   * @private
   */
  _buildDirectoryTree(structure) {
    const directories = structure.directories || [];
    const lines = [];
    
    const rootName = path.basename(structure.root) || 'project';
    lines.push(rootName + '/');

    const topDirs = directories.filter(d => d.depth === 1).slice(0, 15);
    for (let i = 0; i < topDirs.length; i++) {
      const dir = topDirs[i];
      const isLast = i === topDirs.length - 1;
      const prefix = isLast ? '└── ' : '├── ';
      const name = path.basename(dir.path);
      lines.push(prefix + name + '/');
    }

    if (directories.filter(d => d.depth === 1).length > 15) {
      lines.push('└── ...');
    }

    return lines.join('\n');
  }

  /**
   * Describe directory purpose
   * @private
   */
  _describeDirectoryPurpose(name) {
    const purposes = {
      src: 'Main source code directory',
      components: 'Reusable UI components',
      pages: 'Page components and routes',
      services: 'Business logic and external API calls',
      models: 'Data models and database schemas',
      controllers: 'Request handlers and route logic',
      routes: 'Route definitions',
      utils: 'Utility functions and helpers',
      helpers: 'Helper functions',
      lib: 'Library code and shared utilities',
      hooks: 'Custom React hooks',
      stores: 'State management stores',
      api: 'API client and endpoints',
      types: 'TypeScript type definitions',
      styles: 'CSS and styling files',
      assets: 'Static assets (images, fonts)',
      tests: 'Test files',
      __tests__: 'Test files',
      config: 'Configuration files',
      docs: 'Documentation'
    };

    return purposes[name.toLowerCase()] || 'Application code';
  }
}

module.exports = { ProjectReporter };

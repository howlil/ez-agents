#!/usr/bin/env node
'use strict';

/**
 * Skill Consistency Validator
 *
 * Validates agent output against skill best practices and detects anti-patterns.
 * Provides validation reports with severity levels (error, warning, info).
 *
 * @module skill-consistency-validator
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Validation severity levels
 */
const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Validation rules per skill
 * Each skill has best_practices (must have) and anti_patterns (must not have)
 */
const VALIDATION_RULES = {
  // Stack Skills
  'laravel_11_structure_skill_v2': {
    best_practices: [
      'app/Models/ directory for Eloquent models',
      'app/Http/Controllers/ for controllers',
      'routes/api.php for API routes',
      'Service classes in app/Services/',
      'Repository pattern in app/Repositories/'
    ],
    anti_patterns: [
      'Business logic in routes/web.php',
      'Direct DB::query() calls in controllers',
      'Fat controllers (>200 lines)',
      'N+1 queries without eager loading'
    ]
  },

  'nextjs_app_router_skill': {
    best_practices: [
      'app/ directory structure for routes',
      'Server Components by default',
      'use client directive for client components',
      'Loading states with loading.tsx',
      'Error boundaries with error.tsx'
    ],
    anti_patterns: [
      'useState in Server Components',
      'Direct database calls in client components',
      'Missing loading states',
      'window/document access in Server Components'
    ]
  },

  'react_architecture_skill': {
    best_practices: [
      'Component composition over inheritance',
      'Custom hooks for reusable logic',
      'Prop drilling avoidance (Context or state management)',
      'Keys on list items'
    ],
    anti_patterns: [
      'Direct DOM manipulation',
      'setState in render',
      'Missing keys in lists',
      'Props mutation'
    ]
  },

  // Architecture Skills
  'modular_monolith_skill': {
    best_practices: [
      'Module boundaries clearly defined',
      'Inter-module communication via interfaces',
      'Shared kernel for common types',
      'Module per business capability'
    ],
    anti_patterns: [
      'Circular dependencies between modules',
      'Direct imports across module boundaries',
      'Shared database tables between modules',
      'God modules (>5000 lines)'
    ]
  },

  'microservices_architecture_skill': {
    best_practices: [
      'Service per business capability',
      'Database per service',
      'API Gateway for external communication',
      'Event-driven communication between services'
    ],
    anti_patterns: [
      'Distributed monolith (tight coupling)',
      'Shared database between services',
      'Synchronous calls in critical paths',
      'Missing circuit breakers'
    ]
  },

  'repository_pattern_skill': {
    best_practices: [
      'Interface for repository contract',
      'Entity aggregation in repository',
      'Unit of Work for transactions',
      'Specification pattern for complex queries'
    ],
    anti_patterns: [
      'Leaking ORM specifics through interface',
      'Multiple repositories per entity',
      'Business logic in repository',
      'Direct ORM usage outside repository'
    ]
  },

  'service_layer_pattern_skill': {
    best_practices: [
      'Business logic in service layer',
      'Transaction management in services',
      'Domain events from services',
      'Dependency injection for dependencies'
    ],
    anti_patterns: [
      'Direct controller to repository calls',
      'Multiple services modifying same entity',
      'Circular service dependencies',
      'God services (>1000 lines)'
    ]
  },

  'component_composition_skill': {
    best_practices: [
      'Small, focused components',
      'Composition via children prop',
      'Render props for flexibility',
      'Compound components for complex UIs'
    ],
    anti_patterns: [
      'Large components (>300 lines)',
      'Multiple responsibilities per component',
      'Deep nesting (>5 levels)',
      'Prop drilling through multiple levels'
    ]
  },

  'state_management_skill': {
    best_practices: [
      'Single source of truth',
      'Immutable state updates',
      'Derived state computed, not stored',
      'Normalize nested state'
    ],
    anti_patterns: [
      'Duplicate state sources',
      'Direct state mutation',
      'Storing derived values',
      'Excessive state slices'
    ]
  },

  // Domain Skills
  'authentication_jwt_skill': {
    best_practices: [
      'Password hashing with bcrypt/argon2',
      'Token expiration configured',
      'Refresh token rotation',
      'Rate limiting on auth endpoints'
    ],
    anti_patterns: [
      'Hardcoded secrets',
      'Tokens in localStorage',
      'Missing rate limiting',
      'Synchronous token generation',
      'JWT without expiration'
    ]
  },

  'saas_multi_tenant_skill': {
    best_practices: [
      'Tenant isolation at database level',
      'Tenant context in all queries',
      'Tenant-aware caching',
      'Row Level Security (RLS) for shared DB'
    ],
    anti_patterns: [
      'Missing tenant filter in queries',
      'Shared cache keys between tenants',
      'Tenant ID in client-side state only',
      'Cross-tenant data access'
    ]
  },

  'ecommerce_product_catalog_skill': {
    best_practices: [
      'Product variants support',
      'Inventory tracking',
      'Price history tracking',
      'Category hierarchy'
    ],
    anti_patterns: [
      'Hardcoded product types',
      'Missing inventory checks',
      'Price without currency',
      'No soft delete for products'
    ]
  },

  'payment_processing_skill': {
    best_practices: [
      'Idempotent payment operations',
      'Payment state machine',
      'Webhook signature verification',
      'PCI-DSS compliance measures'
    ],
    anti_patterns: [
      'Storing raw card numbers',
      'Missing idempotency keys',
      'No webhook retry handling',
      'Synchronous payment processing'
    ]
  },

  'dashboard_layout_skill': {
    best_practices: [
      'Grid-based layout',
      'Responsive breakpoints',
      'Widget-based architecture',
      'Lazy loading for charts'
    ],
    anti_patterns: [
      'Fixed pixel widths',
      'All data loaded upfront',
      'No loading states',
      'Non-responsive design'
    ]
  },

  // Testing Skills
  'testing_strategy_skill': {
    best_practices: [
      'Test pyramid (70% unit, 20% integration, 10% E2E)',
      'Test isolation (no shared state)',
      'Descriptive test names',
      'Arrange-Act-Assert pattern'
    ],
    anti_patterns: [
      'Test interdependencies',
      'Testing implementation details',
      'Missing assertions',
      'Flaky tests'
    ]
  },

  'testing_unit_skill': {
    best_practices: [
      'One assertion per test',
      'Mock external dependencies',
      'Test edge cases',
      'Fast execution (<10ms per test)'
    ],
    anti_patterns: [
      'Multiple assertions per test',
      'Real database calls',
      'Testing private methods',
      'Slow tests (>100ms)'
    ]
  },

  'testing_integration_skill': {
    best_practices: [
      'Test API contracts',
      'Use test database',
      'Clean up after tests',
      'Test error scenarios'
    ],
    anti_patterns: [
      'Testing against production',
      'Missing test data cleanup',
      'No error case testing',
      'Flaky network dependencies'
    ]
  },

  // DevOps Skills
  'docker_containerization_skill': {
    best_practices: [
      'Multi-stage builds',
      'Non-root user',
      '.dockerignore file',
      'Specific base image versions'
    ],
    anti_patterns: [
      'Running as root',
      'Using latest tag',
      'Large image size (>500MB)',
      'Hardcoded secrets in Dockerfile'
    ]
  },

  'kubernetes_orchestration_skill': {
    best_practices: [
      'Resource limits defined',
      'Health checks (liveness/readiness)',
      'Pod disruption budgets',
      'Horizontal Pod Autoscaler'
    ],
    anti_patterns: [
      'No resource limits',
      'Missing health checks',
      'Single replica deployments',
      'Hardcoded configuration'
    ]
  },

  'cicd_pipeline_architecture_skill': {
    best_practices: [
      'Pipeline as code',
      'Parallel test execution',
      'Artifact versioning',
      'Deployment gates'
    ],
    anti_patterns: [
      'Manual steps in CI',
      'No test parallelization',
      'Missing artifact versioning',
      'Direct production deployments'
    ]
  },

  // Governance Skills
  'security_architecture_skill': {
    best_practices: [
      'Input validation on all endpoints',
      'Output encoding',
      'Authentication on protected routes',
      'Authorization checks'
    ],
    anti_patterns: [
      'SQL injection vulnerabilities',
      'XSS vulnerabilities',
      'Missing authentication',
      'Hardcoded credentials'
    ]
  },

  'accessibility_wcag_skill': {
    best_practices: [
      'Semantic HTML',
      'ARIA labels where needed',
      'Keyboard navigation',
      'Color contrast compliance (WCAG 2.1 AA)'
    ],
    anti_patterns: [
      'Missing alt text',
      'Non-semantic div soup',
      'Mouse-only interactions',
      'Low contrast text'
    ]
  },

  'api_rate_limiting_skill': {
    best_practices: [
      'Rate limit headers (X-RateLimit-*)',
      'Sliding window algorithm',
      'Different limits per endpoint',
      'Graceful degradation'
    ],
    anti_patterns: [
      'No rate limit headers',
      'Fixed window (allows bursts)',
      'Same limit for all endpoints',
      'Hard failures on limit exceeded'
    ]
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate agent output against skill best practices
 *
 * @param {string} output - Agent output text
 * @param {Array} activatedSkills - Array of activated skill objects
 * @returns {Object} Validation report: { valid, violations, skillsValidated, errors, warnings }
 */
function validateOutput(output, activatedSkills) {
  const violations = [];
  let skillsValidated = 0;

  for (const skill of activatedSkills) {
    const skillId = skill.name || skill;
    const skillDef = VALIDATION_RULES[skillId];

    if (!skillDef) {
      // Skill not in validation rules - skip
      continue;
    }

    skillsValidated++;

    // Check best practices adherence
    for (const practice of skillDef.best_practices) {
      if (!outputMatchesPractice(output, practice, skillId)) {
        violations.push({
          skill: skillId,
          type: 'best_practice',
          practice: practice,
          severity: SEVERITY.WARNING,
          message: `Output does not follow best practice: ${practice}`
        });
      }
    }

    // Check anti-patterns avoided
    for (const antiPattern of skillDef.anti_patterns) {
      if (outputContainsAntiPattern(output, antiPattern, skillId)) {
        violations.push({
          skill: skillId,
          type: 'anti_pattern',
          antiPattern: antiPattern,
          severity: SEVERITY.ERROR,
          message: `Anti-pattern detected: ${antiPattern}`
        });
      }
    }
  }

  const errors = violations.filter(v => v.severity === SEVERITY.ERROR).length;
  const warnings = violations.filter(v => v.severity === SEVERITY.WARNING).length;

  return {
    valid: errors === 0,
    violations,
    skillsValidated,
    errors,
    warnings
  };
}

/**
 * Check if output matches a best practice
 *
 * @param {string} output - Agent output text
 * @param {string} practice - Best practice description
 * @param {string} skillId - Skill ID for context
 * @returns {boolean} True if output matches practice
 */
function outputMatchesPractice(output, practice, skillId) {
  const outputLower = output.toLowerCase();

  // Practice matching rules (simplified pattern matching)
  const practicePatterns = {
    // Laravel patterns
    'app/Models/': outputLower.includes('app/models/') || outputLower.includes('app/Models/'),
    'app/Http/Controllers/': outputLower.includes('app/http/controllers/') || outputLower.includes('app/Http/Controllers/'),
    'routes/api.php': outputLower.includes('routes/api.php'),
    'app/Services/': outputLower.includes('app/services/') || outputLower.includes('app/Services/'),
    'app/Repositories/': outputLower.includes('app/repositories/') || outputLower.includes('app/Repositories/'),

    // Next.js patterns
    'app/ directory': outputLower.includes('app/') && outputLower.includes('directory'),
    'Server Components': outputLower.includes('server component'),
    'use client': outputLower.includes("'use client'") || outputLower.includes('"use client"'),
    'loading.tsx': outputLower.includes('loading.tsx') || outputLower.includes('loading state'),
    'error.tsx': outputLower.includes('error.tsx') || outputLower.includes('error boundary'),

    // Architecture patterns
    'Module boundaries': outputLower.includes('module boundary') || outputLower.includes('module boundaries'),
    'interfaces': outputLower.includes('interface') || outputLower.includes('contract'),
    'Shared kernel': outputLower.includes('shared kernel') || outputLower.includes('shared types'),
    'Database per service': outputLower.includes('database per service') || outputLower.includes('separate database'),
    'API Gateway': outputLower.includes('api gateway') || outputLower.includes('gateway'),

    // Security patterns
    'Password hashing': outputLower.includes('bcrypt') || outputLower.includes('argon2') || outputLower.includes('hash'),
    'Token expiration': outputLower.includes('expir') || outputLower.includes('ttl'),
    'Refresh token': outputLower.includes('refresh token'),
    'Rate limiting': outputLower.includes('rate limit') || outputLower.includes('throttl'),
    'Input validation': outputLower.includes('validat') || outputLower.includes('sanitize'),
    'Authentication': outputLower.includes('auth') || outputLower.includes('middleware'),

    // Testing patterns
    'Test pyramid': outputLower.includes('test pyramid') || outputLower.includes('unit') && outputLower.includes('integration'),
    'Test isolation': outputLower.includes('isolat') || outputLower.includes('independent'),
    'Mock': outputLower.includes('mock') || outputLower.includes('stub'),
    'One assertion': outputLower.includes('one assertion') || outputLower.includes('single assertion'),

    // Docker patterns
    'Multi-stage': outputLower.includes('multi-stage') || outputLower.includes('multistage') || outputLower.includes('AS builder'),
    'Non-root': outputLower.includes('non-root') || outputLower.includes('USER ') || outputLower.includes('adduser'),
    '.dockerignore': outputLower.includes('.dockerignore'),
    'Specific version': outputLower.includes(':') && !outputLower.includes(':latest'),

    // Accessibility patterns
    'Semantic HTML': outputLower.includes('semantic') || outputLower.includes('<button') || outputLower.includes('<nav'),
    'ARIA': outputLower.includes('aria-') || outputLower.includes('accessibility'),
    'Keyboard': outputLower.includes('keyboard') || outputLower.includes('tabindex'),
    'contrast': outputLower.includes('contrast') || outputLower.includes('wcag'),

    // Default: check if practice keywords appear in output
    'default': (practice) => outputLower.includes(practice.toLowerCase().split(' ')[0])
  };

  // Try to match practice to pattern
  for (const [key, value] of Object.entries(practicePatterns)) {
    if (practice.toLowerCase().includes(key.toLowerCase()) && key !== 'default') {
      return value;
    }
  }

  // Default: check if any keyword from practice appears in output
  const keywords = practice.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  return keywords.some(keyword => outputLower.includes(keyword));
}

/**
 * Check if output contains an anti-pattern
 *
 * @param {string} output - Agent output text
 * @param {string} antiPattern - Anti-pattern description
 * @param {string} skillId - Skill ID for context
 * @returns {boolean} True if output contains anti-pattern
 */
function outputContainsAntiPattern(output, antiPattern, skillId) {
  const outputLower = output.toLowerCase();
  const antiPatternLower = antiPattern.toLowerCase();

  // Anti-pattern detection rules
  const antiPatterns = {
    'Business logic in routes': outputLower.includes('business logic') && outputLower.includes('route'),
    'Direct DB::query()': outputLower.includes('db::query') || outputLower.includes('raw query'),
    'Fat controllers': outputLower.includes('fat controller') || outputLower.includes('large controller'),
    'N+1 queries': outputLower.includes('n+1') || outputLower.includes('n + 1'),
    'useState in Server': outputLower.includes('usestate') && outputLower.includes('server component'),
    'Direct database calls in client': outputLower.includes('database') && outputLower.includes('client component'),
    'Missing loading': outputLower.includes('missing loading') || (!outputLower.includes('loading') && !outputLower.includes('skeleton')),
    'Circular dependencies': outputLower.includes('circular') && outputLower.includes('depend'),
    'Direct imports across module': outputLower.includes('direct import') && outputLower.includes('module'),
    'Shared database': outputLower.includes('shared database') || outputLower.includes('shared table'),
    'Distributed monolith': outputLower.includes('distributed monolith'),
    'Synchronous calls': outputLower.includes('synchronous') && outputLower.includes('call'),
    'Missing circuit': outputLower.includes('missing circuit') || (!outputLower.includes('circuit breaker') && !outputLower.includes('retry')),
    'Leaking ORM': outputLower.includes('orm') && outputLower.includes('interface'),
    'Direct controller to repository': outputLower.includes('controller') && outputLower.includes('repository') && outputLower.includes('direct'),
    'God services': outputLower.includes('god service') || outputLower.includes('large service'),
    'Direct DOM': outputLower.includes('direct dom') || outputLower.includes('document.getelement'),
    'setState in render': outputLower.includes('setstate') && outputLower.includes('render'),
    'Missing keys': outputLower.includes('missing key') || (!outputLower.includes('key=') && outputLower.includes('map')),
    'Props mutation': outputLower.includes('props') && outputLower.includes('mutat'),
    'Duplicate state': outputLower.includes('duplicate state') || outputLower.includes('multiple sources'),
    'Direct state mutation': outputLower.includes('direct mutation') || outputLower.includes('state.mutate'),
    'Hardcoded secrets': outputLower.includes('hardcoded secret') || outputLower.includes('secret = ') || outputLower.includes('api_key = '),
    'Tokens in localStorage': outputLower.includes('localstorage') && outputLower.includes('token'),
    'Missing rate limiting': outputLower.includes('missing rate') || (!outputLower.includes('rate limit') && !outputLower.includes('throttl')),
    'Missing tenant filter': outputLower.includes('missing tenant') || (!outputLower.includes('tenant_id') && !outputLower.includes('tenant filter')),
    'Storing raw card': outputLower.includes('raw card') || outputLower.includes('card number') && outputLower.includes('store'),
    'Missing idempotency': outputLower.includes('missing idempotency') || (!outputLower.includes('idempotency') && !outputLower.includes('idempotent')),
    'No webhook retry': outputLower.includes('no webhook') || (!outputLower.includes('retry') && outputLower.includes('webhook')),
    'Running as root': outputLower.includes('root') && outputLower.includes('user'),
    'Using latest tag': outputLower.includes(':latest'),
    'Large image': outputLower.includes('large image') || outputLower.includes('>500mb'),
    'No resource limits': outputLower.includes('no resource') || (!outputLower.includes('resources') && !outputLower.includes('limits')),
    'Missing health checks': outputLower.includes('missing health') || (!outputLower.includes('liveness') && !outputLower.includes('readiness')),
    'Single replica': outputLower.includes('single replica') || outputLower.includes('replicas: 1'),
    'Manual steps': outputLower.includes('manual step') || outputLower.includes('manually'),
    'No test parallelization': outputLower.includes('no test') && outputLower.includes('parallel'),
    'Direct production': outputLower.includes('direct production') || outputLower.includes('deploy to production'),
    'SQL injection': outputLower.includes('sql injection') || outputLower.includes('sql inject'),
    'XSS': outputLower.includes('xss') || outputLower.includes('cross-site'),
    'Missing authentication': outputLower.includes('missing auth') || (!outputLower.includes('auth') && !outputLower.includes('middleware')),
    'Missing alt': outputLower.includes('missing alt') || (!outputLower.includes('alt=') && outputLower.includes('img')),
    'Non-semantic': outputLower.includes('non-semantic') || outputLower.includes('div soup'),
    'Mouse-only': outputLower.includes('mouse-only') || outputLower.includes('click only'),
    'Low contrast': outputLower.includes('low contrast')
  };

  // Check for exact anti-pattern match
  for (const [key, value] of Object.entries(antiPatterns)) {
    if (antiPatternLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default: check if anti-pattern keywords appear in output
  const keywords = antiPatternLower.split(/\s+/).filter(w => w.length > 3);
  return keywords.every(keyword => outputLower.includes(keyword));
}

/**
 * Check best practices for a specific skill
 *
 * @param {string} output - Agent output text
 * @param {string} skillId - Skill ID
 * @returns {Object} Check result: { valid, violations }
 */
function checkBestPractices(output, skillId) {
  const skillDef = VALIDATION_RULES[skillId];
  const violations = [];

  if (!skillDef) {
    return { valid: true, violations: [], message: 'No rules defined for skill' };
  }

  for (const practice of skillDef.best_practices) {
    if (!outputMatchesPractice(output, practice, skillId)) {
      violations.push({
        skill: skillId,
        type: 'best_practice',
        practice: practice,
        severity: SEVERITY.WARNING,
        message: `Output does not follow best practice: ${practice}`
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Detect anti-patterns for a specific skill
 *
 * @param {string} output - Agent output text
 * @param {string} skillId - Skill ID
 * @returns {Object} Detection result: { hasAntiPatterns, violations }
 */
function detectAntiPatterns(output, skillId) {
  const skillDef = VALIDATION_RULES[skillId];
  const violations = [];

  if (!skillDef) {
    return { hasAntiPatterns: false, violations: [], message: 'No rules defined for skill' };
  }

  for (const antiPattern of skillDef.anti_patterns) {
    if (outputContainsAntiPattern(output, antiPattern, skillId)) {
      violations.push({
        skill: skillId,
        type: 'anti_pattern',
        antiPattern: antiPattern,
        severity: SEVERITY.ERROR,
        message: `Anti-pattern detected: ${antiPattern}`
      });
    }
  }

  return {
    hasAntiPatterns: violations.length > 0,
    violations
  };
}

/**
 * Generate validation report in markdown format
 *
 * @param {Object} report - Validation report object
 * @returns {string} Markdown formatted report
 */
function generateValidationReport(report) {
  const lines = [
    '## Skill Consistency Validation Report',
    '',
    `**Status:** ${report.valid ? '✅ PASS' : '❌ FAIL'}`,
    `**Skills Validated:** ${report.skillsValidated}`,
    `**Errors:** ${report.errors}`,
    `**Warnings:** ${report.warnings}`,
    ''
  ];

  if (report.violations.length > 0) {
    lines.push('### Violations', '');

    // Group by severity
    const errors = report.violations.filter(v => v.severity === SEVERITY.ERROR);
    const warnings = report.violations.filter(v => v.severity === SEVERITY.WARNING);

    if (errors.length > 0) {
      lines.push('#### Errors', '');
      for (const error of errors) {
        lines.push(`- **${error.skill}:** ${error.message}`);
      }
      lines.push('');
    }

    if (warnings.length > 0) {
      lines.push('#### Warnings', '');
      for (const warning of warnings) {
        lines.push(`- **${warning.skill}:** ${warning.message}`);
      }
      lines.push('');
    }
  } else {
    lines.push('### All validations passed ✅', '');
  }

  return lines.join('\n');
}

/**
 * Get validation rules for a skill
 *
 * @param {string} skillId - Skill ID
 * @returns {Object|null} Validation rules or null
 */
function getValidationRules(skillId) {
  return VALIDATION_RULES[skillId] || null;
}

/**
 * Get all validation rules
 *
 * @returns {Object} All validation rules
 */
function getAllValidationRules() {
  return { ...VALIDATION_RULES };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main validation function
  validateOutput,

  // Specific checks
  checkBestPractices,
  detectAntiPatterns,

  // Report generation
  generateValidationReport,

  // Rule access
  getValidationRules,
  getAllValidationRules,

  // Constants
  SEVERITY,
  VALIDATION_RULES
};

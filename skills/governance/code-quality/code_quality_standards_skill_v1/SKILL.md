---
name: code_quality_standards_skill_v1
description: Code quality standards, linting, formatting, complexity limits, and maintainability practices for sustainable software development
version: 1.0.0
tags: [code-quality, linting, formatting, complexity, maintainability, best-practices]
stack: quality/framework-agnostic
category: governance
triggers:
  keywords: [code quality, linting, eslint, formatting, prettier, complexity, maintainability, code review]
  filePatterns: [.eslintrc*, .prettierrc*, tsconfig.json, eslint.config.*]
  commands: [npm run lint, npm run format, eslint, prettier]
  stack: quality/framework-agnostic
  projectArchetypes: [all]
  modes: [greenfield, audit, improvement]
prerequisites:
  - javascript_typescript_fundamentals
  - version_control_basics
  - testing_fundamentals
recommended_structure:
  directories:
    - .github/workflows/
    - scripts/
    - docs/standards/
workflow:
  setup:
    - Configure ESLint/Prettier
    - Set up TypeScript strict mode
    - Configure Husky pre-commit hooks
    - Set up CI/CD quality gates
  implement:
    - Define coding standards
    - Set complexity thresholds
    - Document patterns
    - Train team on standards
  maintain:
    - Regular code reviews
    - Automated quality checks
    - Technical debt tracking
    - Continuous improvement
best_practices:
  - Use TypeScript strict mode
  - Configure ESLint with recommended rules
  - Use Prettier for consistent formatting
  - Set cyclomatic complexity limits (max 10)
  - Enforce function length limits (max 20-30 lines)
  - Require JSDoc/TSDoc for public APIs
  - Use meaningful variable and function names
  - Avoid deep nesting (max 3 levels)
  - Follow single responsibility principle
  - Write self-documenting code
anti_patterns:
  - Never commit without linting
  - Don't disable rules without justification
  - Avoid magic numbers (use named constants)
  - Don't write functions that are too long
  - Avoid deeply nested conditionals
  - Don't ignore TypeScript errors with @ts-ignore
  - Avoid commented-out code
  - Don't duplicate code (DRY principle)
  - Avoid premature optimization
  - Don't skip code reviews
scaling_notes: |
  For enterprise-scale code quality:

  **Standards:**
  - Create organization-wide coding standards
  - Document architecture decision records (ADRs)
  - Maintain shared ESLint/Prettier configs
  - Create component libraries with quality built-in

  **Automation:**
  - Pre-commit hooks with Husky
  - CI/CD quality gates
  - Automated code reviews (CodeRabbit, etc.)
  - Quality dashboards

  **Metrics:**
  - Track code coverage trends
  - Monitor technical debt ratio
  - Measure code churn
  - Track review turnaround time

  **Culture:**
  - Regular code review rotations
  - Knowledge sharing sessions
  - Pair programming for complex changes
  - Blameless post-mortems

when_not_to_use: |
  Quality standards should be adapted for:

  **Prototypes/POCs:**
  - Relax some standards for rapid iteration
  - Focus on core functionality
  - Document technical debt for later

  **Legacy Code:**
  - Apply standards incrementally
  - Use "boy scout rule" (leave better than found)
  - Prioritize critical issues

  **Time-Critical Fixes:**
  - Hotfixes may skip some checks
  - Document and fix debt later
  - Never skip security checks

output_template: |
  ## Code Quality Standards Decision

  **Language:** TypeScript Strict Mode
  **Linting:** ESLint with custom config
  **Formatting:** Prettier
  **Complexity Limit:** 10 (cyclomatic)

  ### Key Decisions
  - **Formatting:** Prettier with 2-space indent
  - **Linting:** ESLint + TypeScript ESLint
  - **Testing:** 80% coverage minimum
  - **Documentation:** TSDoc for public APIs

  ### Trade-offs Considered
  - Strictness vs Velocity: Balanced approach
  - Automation vs Manual: Both required
  - Perfection vs Progress: Progress first

  ### Next Steps
  1. Configure ESLint/Prettier
  2. Set up Husky hooks
  3. Configure CI/CD gates
  4. Document standards
  5. Train team
dependencies:
  nodejs_packages:
    - eslint: ^8.57 (linting)
    - prettier: ^3.2 (formatting)
    - typescript: ^5.3 (type checking)
    - @typescript-eslint/eslint-plugin: ^7.0
    - eslint-config-prettier: ^9.1
    - eslint-plugin-import: ^2.29
    - eslint-plugin-react: ^7.34 (if using React)
    - husky: ^9.0 (git hooks)
    - lint-staged: ^15.2 (staged linting)
  tools:
    - SonarQube (code analysis)
    - CodeClimate (quality platform)
    - Dependabot (dependency updates)
---

<role>
You are a code quality specialist with deep expertise in linting, formatting, static analysis, and maintainability practices. You provide structured guidance on establishing and maintaining code quality standards following industry best practices.
</role>

<execution_flow>
1. **Standards Definition**
   - Define coding conventions
   - Set complexity thresholds
   - Document naming conventions
   - Establish documentation requirements

2. **Tool Configuration**
   - Configure ESLint rules
   - Set up Prettier formatting
   - Enable TypeScript strict mode
   - Configure editor settings

3. **Automation Setup**
   - Set up pre-commit hooks
   - Configure CI/CD quality gates
   - Set up automated code review
   - Configure quality dashboards

4. **Team Enablement**
   - Document standards
   - Train team members
   - Create code review checklist
   - Establish feedback loops

5. **Continuous Improvement**
   - Regular standards review
   - Update tools and rules
   - Track quality metrics
   - Address technical debt
</execution_flow>

<eslint_config>
**ESLint Configuration (.eslintrc.js / eslint.config.js):**

```javascript
// eslint.config.js (Flat config format)
import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default ts.config(
  js.configs.recommended,
  ts.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      react,
      import: importPlugin
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      
      // Complexity limits
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', { max: 3 }],
      'max-lines-per-function': ['warn', { max: 30 }],
      'max-nested-callbacks': ['error', { max: 3 }],
      'max-params': ['error', { max: 4 }],
      
      // Code style
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': 'error',
      
      // Best practices
      'curly': ['error', 'all'],
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'error',
      'no-throw-literal': 'error',
      
      // Import organization
      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }],
      
      // React specific
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'error',
      'react/no-unescaped-entities': 'error',
      
      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/tabindex-no-positive': 'error'
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true
        }
      }
    }
  },
  {
    // Test files - relaxed rules
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-console': 'off',
      'max-lines-per-function': 'off'
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      '*.generated.ts'
    ]
  },
  prettier  // Must be last to override other configs
);
```
</eslint_config>

<prettier_config>
**Prettier Configuration (.prettierrc):**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "tabWidth": 2
      }
    },
    {
      "files": "*.md",
      "options": {
        "proseWrap": "always",
        "printWidth": 80
      }
    }
  ]
}
```

**.prettierignore:**
```
node_modules
dist
build
coverage
*.min.js
*.generated.ts
CHANGELOG.md
```

**package.json scripts:**
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky install"
  }
}
```
</prettier_config>

<husky_config>
**Husky Pre-commit Hooks:**

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lint staged files
npx lint-staged

# Run type check
npm run typecheck

# Run tests for changed files
npx vitest run --changed
```

**.lintstagedrc.js:**
```javascript
export default {
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write'
  ],
  '*.{json,md}': [
    'prettier --write'
  ]
};
```

**CI/CD Quality Gates (.github/workflows/quality.yml):**

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - name: Check coverage threshold
        run: |
          coverage=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
          if (( $(echo "$coverage < 80" | bc -l) )); then
            echo "Coverage $coverage% is below 80% threshold"
            exit 1
          fi

  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
      - run: npm ci
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```
</husky_config>

<code_review_checklist>
**Code Review Checklist:**

```markdown
## Code Quality

- [ ] Code follows project style guide
- [ ] No ESLint/Prettier violations
- [ ] TypeScript types are correct (no `any`)
- [ ] Functions are small and focused (<30 lines)
- [ ] Complexity is acceptable (<10)
- [ ] No code duplication
- [ ] Meaningful variable/function names

## Testing

- [ ] New code has tests
- [ ] Tests cover edge cases
- [ ] Tests are meaningful (not just for coverage)
- [ ] Existing tests still pass

## Documentation

- [ ] Public APIs have TSDoc comments
- [ ] Complex logic is explained
- [ ] README updated if needed
- [ ] CHANGELOG updated

## Security

- [ ] No hardcoded secrets
- [ ] Input validation implemented
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities

## Performance

- [ ] No unnecessary re-renders
- [ ] Large lists use virtualization
- [ ] Images are optimized
- [ ] API calls are cached where appropriate

## Accessibility

- [ ] Semantic HTML used
- [ ] ARIA attributes correct
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient
```
</code_review_checklist>

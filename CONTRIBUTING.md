# Contributing to EZ Agents

Thank you for your interest in contributing to EZ Agents! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Onboarding Guide](#onboarding-guide)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in EZ Agents a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- Node.js >= 16.7.0
- npm >= 7.0.0
- Git
- One of: Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Qwen Code, Kimi Code

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/ez-agents.git
cd ez-agents
git remote add upstream https://github.com/howlil/ez-agents.git
```

### Install Dependencies

```bash
npm install
```

### Build Hooks

```bash
npm run build:hooks
```

### Verify Setup

```bash
npm test
```

---

## Development Setup

### Local Development

```bash
# Install globally for testing
npm install -g .

# Configure for local AI tool
ez-agents --claude --local
# or
ez-agents --opencode --local
```

### Directory Structure

```
ez-agents/
├── bin/              # CLI entry points and library modules
├── commands/ez/      # User-facing slash commands
├── agents/           # Specialist agent definitions
├── skills/           # Skill registry
├── ez-agents/        # Runtime workflows and templates
├── tests/            # Test files
├── docs/             # Documentation
├── .github/          # GitHub workflows and templates
└── scripts/          # Build and utility scripts
```

### Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Set your API keys
ANTHROPIC_API_KEY=your_key_here
DASHSCOPE_API_KEY=your_key_here
```

---

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**

```markdown
**Description**
A clear and concise description of what the bug is.

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., Windows 11, macOS Sonoma, Ubuntu 22.04]
- Node.js version: [e.g., v20.11.0]
- EZ Agents version: [e.g., 3.7.0]
- AI Provider: [e.g., Claude Code, Qwen Code]

**Additional Context**
Add any other context about the problem here.
```

### Suggesting Features

Feature suggestions are tracked as GitHub issues. When creating a feature suggestion:

**Feature Request Template:**

```markdown
**Problem Statement**
Is your feature request related to a problem? A clear and concise description of what the problem is.

**Proposed Solution**
A clear and concise description of what you want to happen.

**Alternatives Considered**
A clear and concise description of any alternative solutions or features you've considered.

**Use Case**
How would this feature be used? Who would use it?

**Additional Context**
Add any other context, mockups, or examples about the feature request here.
```

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these issues:

- `good first issue` - Issues that require minimal context and are ideal for first-time contributors
- `help wanted` - Issues that need extra help
- `documentation` - Documentation improvements

---

## Coding Standards

### JavaScript Style Guide

- Use CommonJS modules (`require`/`module.exports`) for compatibility
- Use `const` for constants, `let` for variables that change
- Avoid `var` unless function scoping is specifically needed
- Use single quotes for strings
- Include semicolons
- Maximum line length: 100 characters
- Use 2-space indentation

### File Naming

- Library modules: `*.cjs` (e.g., `core.cjs`, `config.cjs`)
- Test files: `*.test.cjs` (e.g., `core.test.cjs`)
- Agent definitions: `ez-*.md` (e.g., `ez-planner.md`)
- Documentation: `*.md` with uppercase (e.g., `USER-GUIDE.md`)

### Code Organization

```javascript
// 1. Built-in modules
const fs = require('fs');
const path = require('path');

// 2. Third-party modules
const micromatch = require('micromatch');

// 3. Local modules
const core = require('./lib/core.cjs');
const logger = require('./lib/logger.cjs');

// 4. Constants
const MAX_RETRIES = 3;
const TIMEOUT = 30000;

// 5. Class/function definitions
class MyClass {
  // Implementation
}

module.exports = MyClass;
```

### JSDoc Comments

```javascript
/**
 * Execute a phase with the specified agent
 * @param {string} phaseNumber - The phase number to execute
 * @param {Object} options - Execution options
 * @param {string} [options.agent='ez-executor'] - Agent to use
 * @param {boolean} [options.verbose=false] - Enable verbose logging
 * @returns {Promise<Object>} Execution result with status and output
 * @throws {Error} If phase execution fails
 * @example
 * const result = await executePhase('1', { verbose: true });
 */
async function executePhase(phaseNumber, options = {}) {
  // Implementation
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
node --test tests/core.test.cjs

# Run tests matching pattern
node --test --test-name-pattern="config"
```

### Writing Tests

```javascript
const { test, describe } = require('node:test');
const assert = require('node:assert');
const core = require('../bin/lib/core.cjs');

describe('Core Module', () => {
  test('should initialize correctly', () => {
    const result = core.init();
    assert.strictEqual(result.status, 'ready');
  });

  test('should handle errors gracefully', async () => {
    await assert.rejects(
      async () => core.execute('invalid-command'),
      {
        name: 'Error',
        message: /Invalid command/
      }
    );
  });
});
```

### Test Coverage Requirements

- Minimum 70% code coverage (enforced in CI)
- All critical paths must be tested
- Error cases must have test coverage
- Integration tests for cross-module interactions

---

## Submitting Changes

### Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-123
   ```

2. **Make your changes**
   - Follow coding standards
   - Add/update tests
   - Update documentation
   - Use conventional commits

3. **Run tests and linting**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Use the PR template
   - Link related issues
   - Request reviews from maintainers

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `chore`: Build/config changes
- `ci`: CI/CD changes
- `security`: Security fixes

**Examples:**
```
feat(planner): add wave-based parallel execution

Implemented task dependency graph for parallel execution.

Closes #123

fix(executor): handle context window overflow

Added automatic summarization when approaching limits.

BREAKING CHANGE: Context manager API changed
```

### Code Review Process

1. **Automated Checks**: CI must pass (tests, linting, security)
2. **Code Owner Review**: At least one code owner must approve
3. **Additional Review**: Second approval recommended for major changes
4. **Address Feedback**: Make requested changes and push updates
5. **Merge**: Maintainer merges after approvals

**Review Response Times:**
- First review: Within 24 hours
- Follow-up: Within 12 hours
- Critical fixes: Within 4 hours

---

## Onboarding Guide

### Week 1: Getting Familiar

**Day 1-2: Setup & Orientation**
- [ ] Complete development setup
- [ ] Read README.md and USER-GUIDE.md
- [ ] Run EZ Agents locally
- [ ] Explore codebase structure

**Day 3-4: Understanding the System**
- [ ] Read LEAN-GUIDE.md
- [ ] Review agent definitions in `agents/`
- [ ] Understand the Chief Strategist pattern
- [ ] Run through a sample project

**Day 5: First Contribution**
- [ ] Pick a `good first issue`
- [ ] Create a branch
- [ ] Make a small change
- [ ] Submit your first PR

### Week 2: Deep Dive

**Study Areas:**
- [ ] Core orchestration logic (`bin/lib/core.cjs`)
- [ ] Phase workflow implementation
- [ ] Agent communication patterns
- [ ] Context management system

**Hands-On:**
- [ ] Fix a bug
- [ ] Add a test
- [ ] Improve documentation
- [ ] Review someone else's PR

### Week 3: Contributing

**Goals:**
- [ ] Complete a feature from start to finish
- [ ] Understand the release process
- [ ] Participate in code reviews
- [ ] Help answer questions in discussions

### Resources

**Documentation:**
- [User Guide](docs/USER-GUIDE.md)
- [Lean Guide](docs/LEAN-GUIDE.md)
- [Workflows](docs/WORKFLOWS.md)
- [Provider Behaviors](docs/PROVIDER-BEHAVIORS.md)

**Code References:**
- [Core Module](bin/lib/core.cjs)
- [Commands](bin/lib/commands.cjs)
- [Config](bin/lib/config.cjs)

**People:**
- Tech Lead: @howlil
- Core Contributors: See [Contributors](https://github.com/howlil/ez-agents/graphs/contributors)

---

## Questions?

- **General Questions:** Use [GitHub Discussions](https://github.com/howlil/ez-agents/discussions)
- **Bug Reports:** Use [GitHub Issues](https://github.com/howlil/ez-agents/issues)
- **Security Issues:** Email security@howlil.com (do not open public issue)

---

## License

By contributing to EZ Agents, you agree that your contributions will be licensed under the MIT License.

# TypeScript Migration Guide

**Version:** 5.0.0
**Date:** 2026-03-25
**Project:** ez-agents

---

## v5.0.0 Migration Complete (2026-03-25)

### What Changed

- ✅ All 135+ JavaScript files migrated to TypeScript
- ✅ 100% type coverage with zero `any` types in core library
- ✅ Complete TSDoc documentation for all APIs
- ✅ Pure ESM output with type declarations

### Migration Summary

| Phase | Files Migrated | Lines of Code | Status |
|-------|---------------|---------------|--------|
| Phase 1 | 8 | 2,111 | ✅ Complete |
| Phase 2 | 8 | 1,060 | ✅ Complete |
| Phase 3 | 5 | 935 | ✅ Complete |
| Phase 4 | 1 | ~100 | ✅ Complete |
| Phase 5 | 1 | ~400 | ✅ Complete |
| Phase 6 | 105 | ~10,000 | ✅ Complete |
| Phase 8 | 7 | ~5,000 | ✅ Complete |
| **Total** | **135** | **~19,606** | **✅ Complete** |

### Breaking Changes

None. v5.0.0 maintains full backward compatibility with v4.0.0 APIs.

### Upgrade Guide

1. Update package version:
```bash
npm install @howlil/ez-agents@^5.0.0
```

2. Update imports (if using CommonJS):
```javascript
// Before (v4.x)
const { createAgent } = require('@howlil/ez-agents');

// After (v5.x)
import { createAgent } from '@howlil/ez-agents';
// or
const { createAgent } = require('@howlil/ez-agents'); // Still works with ESM interop
```

3. Enjoy type safety! TypeScript types are included automatically.

### Type Definitions

v5.0.0 includes complete TypeScript type definitions out of the box. No need to install `@types/` packages.

```typescript
import { createAgent, createPhase } from '@howlil/ez-agents';

// Full type inference
const agent = createAgent({
  name: 'my-agent',
  model: 'qwen',
  // ... TypeScript validates all options
});
```

---

## Overview

The ez-agents codebase has been migrated from JavaScript (CommonJS) to TypeScript with ES Modules. This guide helps you understand the changes and upgrade your existing code.

---

## What Changed

### Module System

**Before (CommonJS):**
```javascript
const { safeExec } = require('./safe-exec.cjs');
const result = await safeExec('git', ['status']);
```

**After (ESM with TypeScript):**
```typescript
import { safeExec } from './safe-exec.js';
const result = await safeExec('git', ['status']);
```

### New FP Utilities

New functional programming utilities are available:

```typescript
import { pipe, map, filter, memoize, update } from './fp/index.js';

// Pipeline pattern
const processUsers = pipe(
  filter(user => user.active),
  map(user => user.email),
  map(email => email.toLowerCase())
);

// Immutable updates
const newState = update(state, { count: state.count + 1 });

// Memoization
const expensive = memoize((data) => {
  // Expensive computation
  return result;
}, { maxAge: 60000 });
```

---

## Breaking Changes

### Import Paths

All imports now use `.js` extension instead of `.cjs`:

**Before:**
```javascript
require('./module.cjs');
```

**After:**
```typescript
import { something } from './module.js';
```

### Default Exports

Some modules now use named exports instead of default exports:

**Before:**
```javascript
const Logger = require('./logger.cjs');
const logger = new Logger();
```

**After:**
```typescript
import { Logger, defaultLogger } from './logger.js';
const logger = new Logger();
// Or use the default instance
import { defaultLogger as logger } from './logger.js';
```

---

## Upgrade Path

### Step 1: Update Import Statements

Replace all `.cjs` imports with `.js`:

```bash
# Find all .cjs imports
grep -r "require.*\.cjs" your-code/

# Replace with .js imports
# Before: require('./module.cjs')
# After: import { ... } from './module.js'
```

### Step 2: Update for Named Exports

Check for modules that changed from default to named exports:

```typescript
// Before
const core = require('./core.cjs');
const result = core.loadConfig(cwd);

// After
import { loadConfig } from './core.js';
const result = loadConfig(cwd);
```

### Step 3: Add Type Annotations (Optional)

If you're using TypeScript in your code:

```typescript
import { Config } from './core.js';

function getConfig(): Config {
  return loadConfig(process.cwd());
}
```

---

## Code Migration Examples

### Example 1: Command Execution

**Before:**
```javascript
const { safeExec } = require('./bin/lib/safe-exec.cjs');

async function getStatus() {
  const output = await safeExec('git', ['status']);
  return output;
}
```

**After:**
```typescript
import { safeExec } from './bin/lib/safe-exec.js';

async function getStatus(): Promise<string> {
  const output = await safeExec('git', ['status']);
  return output;
}
```

### Example 2: State Management

**Before:**
```javascript
const { loadConfig } = require('./bin/lib/core.cjs');

function init(cwd) {
  const config = loadConfig(cwd);
  console.log(config.model_profile);
}
```

**After:**
```typescript
import { loadConfig, Config } from './bin/lib/core.js';

function init(cwd: string): Config {
  const config = loadConfig(cwd);
  console.log(config.model_profile);
  return config;
}
```

### Example 3: Using FP Utilities

**Before:**
```javascript
const users = [{ active: true }, { active: false }, { active: true }];

// Manual filtering and mapping
const emails = users
  .filter(u => u.active)
  .map(u => u.email);
```

**After:**
```typescript
import { pipe, filter, map } from './bin/lib/fp/transform.js';

const users = [{ active: true }, { active: false }, { active: true }];

// Using FP pipeline
const activeEmails = pipe(
  filter((u: User) => u.active),
  map((u: User) => u.email)
)(users);
```

---

## Module Reference

### Phase 1: Foundation

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `safe-path.js` | Path traversal protection | `normalizePath`, `isPathSafe`, `safeReadFile` |
| `logger.js` | Structured logging | `Logger`, `defaultLogger` |
| `core.js` | Shared utilities | `loadConfig`, `findPhase`, `MODEL_PROFILES` |
| `config.js` | Config CRUD | `ensureConfigSection`, `configSet`, `configGet` |
| `frontmatter.js` | YAML parsing | `extractFrontmatter`, `reconstructFrontmatter` |
| `state.js` | STATE.md operations | `stateLoad`, `stateGet`, `stateUpdate` |
| `phase.js` | Phase CRUD | `phasesList`, `findPhaseCmd`, `phaseNextDecimal` |
| `roadmap.js` | ROADMAP.md operations | `roadmapGetPhase`, `roadmapAnalyze` |

### Phase 2: Core Library

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `planning-write.js` | Safe .planning writes | `safePlanningWrite`, `safePlanningWriteSync` |
| `safe-exec.js` | Command execution | `safeExec`, `safeExecJSON`, `auditExec` |
| `error-cache.js` | Error deduplication | `ErrorCache` |
| `file-lock.js` | File locking | `withLock`, `isLocked`, `ifUnlocked` |
| `session-manager.js` | Session management | `SessionManager` |
| `git-utils.js` | Git operations | `getGitStatus`, `gitCommit`, `getCurrentBranch` |
| `model-provider.js` | Multi-model API | `getModelForAgent`, `MODEL_PROFILES` |
| `assistant-adapter.js` | Tool mapping | `TOOL_MAPPINGS`, `mapToolName` |

### Phase 3: FP Utilities

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `fp/transform.js` | Data transformation | `map`, `filter`, `reduce`, `unique`, `compact` |
| `fp/pipe.js` | Function composition | `pipe`, `compose`, `tap`, `curry` |
| `fp/memoize.js` | Caching | `memoize`, `memoizeAsync`, `debounce`, `throttle` |
| `fp/immutable.js` | Immutable operations | `update`, `merge`, `append`, `remove`, `lens` |

---

## Troubleshooting

### Error: Cannot find module

**Problem:** Import path uses old `.cjs` extension.

**Solution:** Update to `.js` extension:
```typescript
// Wrong
import { x } from './module.cjs';

// Correct
import { x } from './module.js';
```

### Error: Module has no default export

**Problem:** Module uses named exports only.

**Solution:** Use named imports:
```typescript
// Wrong
import Logger from './logger.js';

// Correct
import { Logger } from './logger.js';
```

### Error: Type errors in TypeScript

**Problem:** Type mismatch or missing types.

**Solution:** Check the type definitions in the source files or add type annotations:
```typescript
import { Config } from './core.js';

function getConfig(): Config {
  return loadConfig(process.cwd());
}
```

---

## Getting Help

- **API Documentation:** See `docs/api/` for generated TSDoc
- **Examples:** Check `tests/` for usage examples
- **Issues:** Report issues on GitHub

---

*Last updated: 2026-03-25*

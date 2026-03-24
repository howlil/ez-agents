# Quality Gate Implementation Guide

This guide explains how to implement quality gates using the Quality Gate Coordinator.

## Overview

The Quality Gate Coordinator provides a central registry and execution engine for quality gates. Each gate:

1. **Validates input** using Zod schemas
2. **Executes checks** via a custom executor function
3. **Returns structured results** with pass/fail status, errors, and warnings
4. **Supports bypass** with mandatory audit trail

## API Reference

### `registerGate(id, schema, executor)`

Registers a new quality gate.

**Parameters:**
- `id` (string): Unique gate identifier (e.g., `"requirement-completeness"`)
- `schema` (ZodSchema): Zod schema for validating gate context
- `executor` (Function): Async function that executes the gate logic

**Example:**
```javascript
const { QualityGate, z } = require('./quality-gate.cjs');

const gates = new QualityGate();

gates.registerGate(
  'requirement-completeness',
  z.object({
    requirements: z.array(z.object({
      id: z.string(),
      description: z.string(),
      acceptanceCriteria: z.array(z.string()),
    })),
  }),
  async (context) => {
    const errors = [];
    const warnings = [];

    for (const req of context.requirements) {
      if (!req.id || req.id.length === 0) {
        errors.push({ path: 'requirements[].id', message: 'Requirement ID is required' });
      }
      if (req.acceptanceCriteria.length === 0) {
        warnings.push(`Requirement ${req.id} has no acceptance criteria`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }
);
```

### `executeGate(id, context)`

Executes a registered gate with the provided context.

**Parameters:**
- `id` (string): Gate identifier
- `context` (any): Context data to validate and pass to executor

**Returns:** `Promise<ExecutionResult>`
```javascript
{
  passed: boolean,
  errors: Array<{ path: string, message: string }>,
  warnings: Array<string>,
}
```

**Example:**
```javascript
const result = await gates.executeGate('requirement-completeness', {
  requirements: [
    {
      id: 'REQ-001',
      description: 'User can log in',
      acceptanceCriteria: ['Given valid credentials', 'When login form submitted', 'Then user is authenticated'],
    },
  ],
});

if (result.passed) {
  console.log('Gate passed!');
} else {
  console.error('Gate failed:', result.errors);
}
```

### `bypassGate(id, reason)`

Bypasses a gate with a mandatory audit reason.

**Parameters:**
- `id` (string): Gate identifier
- `reason` (string): Non-empty reason for bypass (logged to audit trail)

**Example:**
```javascript
// Bypass with explicit reason (required)
gates.bypassGate('security-baseline', 'MVP tier - security audit deferred to Phase 40');

// This will throw an error (empty reason not allowed)
gates.bypassGate('security-baseline', ''); // Error!
```

### `getGateStatus(id)`

Returns the current status of a gate.

**Parameters:**
- `id` (string): Gate identifier

**Returns:** `GateStatus`
```javascript
{
  state: 'registered' | 'passed' | 'failed' | 'bypassed',
  id: string,
  registeredAt?: Date,
  executedAt?: Date,
  bypassedAt?: Date,
  bypassReason?: string,
  errors?: Array<{ path: string, message: string }>,
  warnings?: Array<string>,
}
```

**Example:**
```javascript
const status = gates.getGateStatus('requirement-completeness');
console.log(`Gate state: ${status.state}`);
```

## Gate Implementation Patterns

### Pattern 1: Simple Validation Gate

```javascript
gates.registerGate(
  'plan-completeness',
  z.object({
    tasks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      action: z.string(),
    })),
  }),
  async (context) => {
    const errors = [];

    if (context.tasks.length === 0) {
      errors.push({ path: 'tasks', message: 'At least one task is required' });
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
    };
  }
);
```

### Pattern 2: Multi-Check Gate

```javascript
gates.registerGate(
  'code-quality',
  z.object({
    files: z.array(z.string()),
    metrics: z.object({
      complexity: z.number(),
      coverage: z.number(),
    }),
  }),
  async (context) => {
    const errors = [];
    const warnings = [];

    // Check 1: Complexity threshold
    if (context.metrics.complexity > 10) {
      errors.push({ path: 'metrics.complexity', message: 'Cyclomatic complexity exceeds threshold (10)' });
    }

    // Check 2: Test coverage
    if (context.metrics.coverage < 80) {
      warnings.push(`Test coverage is ${context.metrics.coverage}%, recommended: 80%`);
    }

    // Check 3: File count
    if (context.files.length > 50) {
      warnings.push(`Large change set: ${context.files.length} files modified`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }
);
```

### Pattern 3: External Tool Integration Gate

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

gates.registerGate(
  'security-scan',
  z.object({
    projectPath: z.string(),
  }),
  async (context) => {
    const errors = [];
    const warnings = [];

    try {
      // Run npm audit
      const { stdout } = await execAsync('npm audit --json', {
        cwd: context.projectPath,
      });
      const audit = JSON.parse(stdout);

      if (audit.metadata.vulnerabilities.critical > 0) {
        errors.push({
          path: 'dependencies',
          message: `Found ${audit.metadata.vulnerabilities.critical} critical vulnerabilities`,
        });
      }

      if (audit.metadata.vulnerabilities.high > 0) {
        warnings.push(`Found ${audit.metadata.vulnerabilities.high} high severity vulnerabilities`);
      }
    } catch (err) {
      if (err.stdout) {
        const audit = JSON.parse(err.stdout);
        if (audit.metadata.vulnerabilities.total > 0) {
          warnings.push(`npm audit found ${audit.metadata.vulnerabilities.total} vulnerabilities`);
        }
      } else {
        warnings.push('Could not run npm audit');
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }
);
```

## Audit Trail

All gate bypasses are logged to `.planning/gate-audit.json`:

```json
[
  {
    "gateId": "security-baseline",
    "action": "bypass",
    "reason": "MVP tier - security audit deferred to Phase 40",
    "timestamp": "2026-03-21T10:30:00.000Z"
  }
]
```

## Error Handling

### Schema Validation Errors

When context fails schema validation, errors include field paths:

```javascript
const result = await gates.executeGate('requirement-completeness', {
  requirements: [
    { id: '', description: 'Test' }, // Missing ID
  ],
});

// result.errors:
// [
//   { path: 'requirements.0.id', message: 'Required' },
// ]
```

### Executor Errors

If the executor throws an exception, it's caught and returned as an error:

```javascript
gates.registerGate(
  'flaky-gate',
  z.object({}),
  async () => {
    throw new Error('Something went wrong');
  }
);

const result = await gates.executeGate('flaky-gate', {});
// result.passed: false
// result.errors: [{ path: 'executor', message: 'Something went wrong' }]
```

### Unregistered Gate

Executing an unregistered gate throws an error:

```javascript
await gates.executeGate('nonexistent-gate', {});
// Throws: Error: Gate not registered: nonexistent-gate
```

## Best Practices

1. **Use descriptive gate IDs**: `requirement-completeness` not `gate1`
2. **Define strict schemas**: Validate all required fields with Zod
3. **Return structured errors**: Include field paths for easy debugging
4. **Use warnings for non-blocking issues**: Distinguish between errors (block) and warnings (inform)
5. **Document bypass reasons**: Always provide clear, actionable bypass reasons
6. **Keep executors focused**: Each gate should check one quality dimension
7. **Test gates independently**: Write unit tests for each gate executor

## Integration with Phase Execution

```javascript
const { QualityGate, z } = require('./quality-gate.cjs');

async function executePhase(phasePlan) {
  const gates = new QualityGate();

  // Register gates
  gates.registerGate(/* ... */);

  // Execute pre-execution gates
  const preCheck = await gates.executeGate('plan-completeness', phasePlan);
  if (!preCheck.passed) {
    throw new Error(`Pre-check failed: ${JSON.stringify(preCheck.errors)}`);
  }

  // Execute phase tasks...

  // Execute post-execution gates
  const postCheck = await gates.executeGate('verification-complete', {
    tasks: phasePlan.tasks,
    summaries: taskSummaries,
  });

  if (!postCheck.passed) {
    // Trigger gap closure workflow
    console.error('Post-check failed:', postCheck.errors);
  }

  return postCheck;
}
```

## See Also

- Phase 34-03: Gate 1-2 Implementation (Requirement Completeness, Architecture Review)
- Phase 34-04: Gate 3-4 Implementation (Code Quality, Security Baseline)
- Phase 40: Gates 5-7 (Testing, Documentation, Release)

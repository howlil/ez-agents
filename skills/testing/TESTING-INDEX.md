# Testing Skills Index

**Version:** 1.0
**Category:** testing

## Overview

Testing skills provide comprehensive guidance on software testing strategies, frameworks, and best practices for ensuring code quality and reliability.

## Available Testing Skills

| Skill | Directory | Focus Area |
|-------|-----------|------------|
| **Unit Testing** | `unit-testing/unit_testing_skill_v1/` | Individual component testing |
| **Integration Testing** | `integration-testing/integration_testing_skill_v1/` | Component interaction testing |
| **E2E Testing** | `e2e-testing/e2e_testing_skill_v1/` | End-to-end user flow testing |
| **Component Testing** | `component-testing/component_testing_skill_v1/` | UI component testing |
| **Performance Testing** | `performance-testing/performance_testing_skill_v1/` | Load and stress testing |
| **Contract Testing** | `contract-testing/contract_testing_skill_v1/` | API contract verification |

## Testing Pyramid

```
        /\
       /  \
      / E2E \      (Few - Slow, Comprehensive)
     /--------\
    /Integration\   (Some - Medium speed)
   /--------------\
  /     Unit       \  (Many - Fast, Isolated)
 /------------------\
```

## Usage

```javascript
const { SkillRegistry } = require('./ez-agents/bin/lib/skill-registry');
const registry = new SkillRegistry();
await registry.load();

// Get all testing skills
const testingSkills = registry.findByCategory('testing');

// Get specific skill
const unitTestingSkill = registry.get('unit_testing_skill_v1');
```

## Related Categories

- **Operational Skills**: `skills/operational/OPERATIONAL-INDEX.md`
- **Governance Skills**: `skills/governance/GOVERNANCE-INDEX.md`
- **Stack Skills**: `skills/stack/README.md`

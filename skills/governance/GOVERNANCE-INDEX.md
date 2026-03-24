# Governance Skills

## Overview

Governance skills provide decision-making frameworks, priority rules, and quality gates for systematic conflict resolution and architectural governance.

Governance skills are activated based on:
- Conflict detection between skill recommendations
- Quality gate validation requirements
- Decision-making scenarios requiring trade-off analysis

## Available Governance Skills

| Skill | Directory | Activation Trigger | Key Components |
|-------|-----------|-------------------|----------------|
| **Conflict Resolution** | `conflict-resolution/conflict_resolution_v1/` | Conflicting recommendations | Priority rules, Resolution algorithm, Escalation triggers |

## Activation Triggers

| Trigger | Governance Skill |
|---------|-----------------|
| "conflict", "decision", "trade-off" | Conflict Resolution |
| Quality gate validation | Conflict Resolution |
| Multiple skill recommendations | Conflict Resolution |

## Usage Examples

### Using SkillRegistry

```javascript
const { SkillRegistry } = require('./ez-agents/bin/lib/skill-registry');
const registry = new SkillRegistry();
await registry.load();

// Get all governance skills
const governanceSkills = registry.findByCategory('governance');

// Get specific skill
const conflictSkill = registry.get('conflict_resolution_v1');
```

### Using SkillResolver

```javascript
const { SkillResolver } = require('./ez-agents/bin/lib/skill-resolver');
const resolver = new SkillResolver({
  context: { project_phase: 'MVP' }
});

const result = resolver.resolve(skills, context);
// Returns: { decision, rationale, tradeoffs, escalated }
```

## Governance Skill Structure

Each governance skill includes:

- **Priority Rules**: Decision hierarchy
- **Conflict Types**: Recognized conflict patterns
- **Resolution Algorithm**: Step-by-step process
- **Escalation Triggers**: When to escalate
- **Examples**: Real-world scenarios

## Version History

- **v1.0.0** (2026-03-21): Initial governance skills created in Phase 36

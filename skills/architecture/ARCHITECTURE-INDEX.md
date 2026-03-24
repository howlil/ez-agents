# Architecture Pattern Skills

## Overview

Architecture pattern skills provide guidance on system design patterns and structural decisions. These skills help select appropriate architecture patterns based on team size, complexity, scale, and business requirements.

## Architecture Patterns

The following 8 architecture patterns are available:

1. **Monolith** - Single deployable unit with all components together
   - Best for: MVP, startups, simple domains, small teams
   - Skill: `skills/architecture/monolith/monolith_v1/SKILL.md`

2. **Modular Monolith** - Single deployable unit with clear module boundaries
   - Best for: Growing teams, complex domains, preparing for microservices
   - Skill: `skills/architecture/modular-monolith/modular_monolith_v1/SKILL.md`

3. **Microservices** - Independently deployable services
   - Best for: Large teams, multiple products, proven scaling needs
   - Skill: `skills/architecture/microservices/microservices_v1/SKILL.md`

4. **Event-Driven** - Components communicate via events
   - Best for: Real-time systems, async workflows, decoupled systems
   - Skill: `skills/architecture/event-driven/event_driven_v1/SKILL.md`

5. **Queue-Based Async** - Background job processing with queues
   - Best for: Heavy workloads, email processing, reports
   - Skill: `skills/architecture/queue-based-async/queue_based_async_v1/SKILL.md`

6. **Multi-Layer Caching** - CDN, application, and database caching
   - Best for: High-read, low-write systems, performance-critical apps
   - Skill: `skills/architecture/caching-strategy/caching_strategy_v1/SKILL.md`

7. **RBAC and Authorization** - Role-based access control
   - Best for: Multi-tenant systems, enterprise applications
   - Skill: `skills/architecture/rbac-authorization/rbac_authorization_v1/SKILL.md`

8. **API Gateway** - Single entry point for all clients
   - Best for: Microservices, mobile backends, multi-client systems
   - Skill: `skills/architecture/api-gateway/api_gateway_v1/SKILL.md`

## Decision Tree for Pattern Selection

### Team Size
- **< 5 developers**: Monolith
- **5-12 developers**: Modular Monolith
- **> 12 developers**: Microservices (if complexity warrants)

### Complexity
- **Simple CRUD**: Monolith
- **Complex domain with clear boundaries**: Modular Monolith
- **Multiple bounded contexts**: Microservices

### Scale Requirements
- **< 10K concurrent users**: Monolith or Modular Monolith
- **10K-100K concurrent users**: Modular Monolith with caching
- **> 100K concurrent users**: Microservices with API Gateway

### Real-Time Needs
- **Minimal**: Monolith
- **Async workflows**: Queue-Based Async
- **Real-time event propagation**: Event-Driven

### Security Requirements
- **Basic auth**: Monolith
- **Multi-tenant, enterprise**: RBAC pattern
- **Multiple client types**: API Gateway

## Usage Examples

### Using SkillRegistry

```javascript
const { SkillRegistry } = require('./ez-agents/bin/lib/skill-registry');
const registry = new SkillRegistry();
await registry.load();

// Get all architecture skills
const architectureSkills = registry.findByCategory('architecture');

// Get specific pattern
const monolithSkill = registry.get('monolith_v1');

// Search by tag
const scalablePatterns = registry.findByTag('scalable');
```

### Pattern Selection by Project Context

```javascript
// For MVP startup
const mvpContext = {
  teamSize: 'small',
  complexity: 'simple',
  scale: 'low',
  deadline: 'tight'
};
// Recommended: Monolith

// For enterprise platform
const enterpriseContext = {
  teamSize: 'large',
  complexity: 'complex',
  scale: 'high',
  compliance: 'required'
};
// Recommended: Microservices + API Gateway + RBAC
```

## Integration with Context Engine

Architecture skills are activated by CTXE-06 (Context Engine) based on:
- Project scale indicators
- Team size constraints
- Complexity signals
- Performance requirements

## Related Categories

- **Domain Skills**: `skills/domain/DOMAIN-INDEX.md`
- **Operational Skills**: `skills/operational/OPERATIONAL-INDEX.md`
- **Governance Skills**: `skills/governance/GOVERNANCE-INDEX.md`

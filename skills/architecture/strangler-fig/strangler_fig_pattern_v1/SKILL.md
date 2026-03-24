---
name: strangler_fig_pattern_v1
description: Strangler Fig pattern for incrementally migrating legacy systems to modern architecture
version: 1.0.0
tags: [strangler-fig, migration, legacy, incremental, modernization]
category: architecture
triggers:
  keywords: [strangler fig, legacy migration, incremental migration, system modernization]
  projectArchetypes: [legacy-modernization, migration, enterprise]
prerequisites:
  - architecture_basics
  - api_gateway_concepts
  - risk_management
workflow:
  setup:
    - Identify migration candidates
    - Define strangulation boundaries
    - Setup routing layer
    - Create migration plan
  execute:
    - Implement new functionality
    - Route traffic gradually
    - Monitor both systems
    - Decommission legacy pieces
  complete:
    - Full traffic migration
    - Legacy system retirement
    - Documentation update
best_practices:
  - Start with low-risk components
  - Use API gateway for routing
  - Implement feature flags
  - Monitor both systems in parallel
  - Migrate data incrementally
  - Keep legacy system running
  - Test thoroughly before cutover
  - Document migration progress
  - Plan rollback for each step
  - Communicate with stakeholders
anti_patterns:
  - Never migrate everything at once
  - Don't skip monitoring
  - Avoid big bang rewrites
  - Don't ignore data migration
  - Never skip rollback plan
  - Don't migrate without tests
  - Avoid changing business logic during migration
  - Don't forget to decommission legacy
scaling_notes: |
  Strangler Fig Scaling:
  - Start with edge features
  - Migrate core gradually
  - Use automated testing
  - Plan for 6-18 month migration
when_not_to_use: |
  Not for: Greenfield projects, systems planned for sunset, very small systems
output_template: |
  ## Strangler Fig Migration Plan
  **Legacy System:** {description}
  **Migration Strategy:** {incremental by feature | incremental by layer}
  **Routing:** {API Gateway, reverse proxy}
  **Timeline:** {estimated duration}
dependencies:
  - api_gateway: "Kong, AWS API Gateway, etc."
  - feature_flags: "LaunchDarkly, etc."
---

<role>
Migration Architect specializing in legacy system modernization.
Focus on risk reduction, incremental progress, and business continuity.
</role>

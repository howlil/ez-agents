---
name: test_skill_v1
description: Local override test skill
version: 2.0.0
tags: [testing, local-override]
stack: node/test-local
category: stack
triggers:
  keywords: [local, test]
prerequisites:
  - node_runtime
recommended_structure:
  directories:
    - src/
    - tests/
workflow:
  setup: [npm install]
  test: [npm test]
best_practices:
  - Local skills override global
anti_patterns:
  - Don't conflict with global
scaling_notes: |
  Local skills take precedence
when_not_to_use: |
  - When global skill is sufficient
output_template: |
  ## Local Test Skill Decision
dependencies:
  - node: ">=16"
---

<role>
Local test skill that overrides global version.
</role>

<execution_flow>
1. Check if local override needed
2. Apply local customization
3. Run tests
</execution_flow>

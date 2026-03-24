---
name: test_skill_v1
description: Test skill for unit testing
version: 1.0.0
tags: [testing, backend]
stack: node/test
category: stack
triggers:
  keywords: [test, testing]
  filePatterns: [test.js]
prerequisites:
  - node_runtime
recommended_structure:
  directories:
    - src/
    - tests/
workflow:
  setup: [npm install]
  generate: [npm run generate]
  test: [npm test]
best_practices:
  - Write tests first
  - Keep tests isolated
anti_patterns:
  - Don't skip tests
scaling_notes: |
  For large test suites, run in parallel
when_not_to_use: |
  - Production code without tests
output_template: |
  ## Test Skill Decision
dependencies:
  - node: ">=16"
---

<role>
Test skill body for unit testing purposes.
</role>

<execution_flow>
1. Setup test environment
2. Run tests
3. Validate results
</execution_flow>

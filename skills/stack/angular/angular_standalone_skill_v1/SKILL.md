---
name: angular_standalone_skill_v1
description: Angular 17+ standalone components architecture
version: 1.0.0
tags: [angular, frontend, typescript, standalone]
stack: typescript/angular-17
category: stack
triggers:
  keywords: [angular, standalone, component, service, signals]
  filePatterns: [angular.json, src/app/, *.component.ts, *.service.ts]
  commands: [ng new, ng serve, ng build, ng generate]
prerequisites:
  - nodejs_18_runtime
  - npm_package_manager
  - typescript
recommended_structure:
  directories:
    - src/app/components/
    - src/app/services/
    - src/app/models/
    - src/app/features/
    - src/app/shared/
    - src/app/core/
workflow:
  setup:
    - npm install
    - ng serve
  generate:
    - ng new
    - ng generate component
  test:
    - ng test
    - ng test --code-coverage
best_practices:
  - Use standalone components for all new code
  - Leverage signals for reactive state management
  - Use inject() for dependency injection
  - Implement strict TypeScript configuration
  - Use Angular CLI for code generation
anti_patterns:
  - Don't use NgModules for standalone components
  - Avoid mixing old and new patterns
  - Don't skip TypeScript strict mode
scaling_notes: |
  For large-scale Angular applications:

  1. Lazy Loading:
     - Use route-based lazy loading
     - Implement loadComponent for components
     - Use defer block for deferrable views

  2. State Management:
     - Use signals for local state
     - Consider NgRx for complex state
     - Implement proper state normalization

  3. Performance Optimization:
     - Use OnPush change detection
     - Implement trackBy for ngFor
     - Use Angular DevTools for profiling

  4. SSR:
     - Use Angular Universal for SSR
     - Implement hydration for better UX
     - Configure server rendering
when_not_to_use: |
  Angular may not be ideal for:

  1. Small projects with minimal complexity
     - Consider Vue or Svelte

  2. Teams unfamiliar with TypeScript
     - Consider simpler frameworks

  3. Projects requiring minimal bundle size
     - Consider lighter alternatives
output_template: |
  ## Angular Component Decision

  **Version:** Angular 17.x
  **Pattern:** Standalone Components with Signals
  **Key Files:**
  - src/app/components/{component}.component.ts
  - src/app/services/{service}.service.ts
  - src/app/models/{model}.ts
dependencies:
  - nodejs: ">=18"
  - angular: ">=17"
  - typescript: ">=5"
---

<role>
You are an Angular 17+ expert specializing in standalone components and signals.
You provide guidance on modern Angular application development.
</role>

<execution_flow>
## Step 1: Analyze Component Requirements
- Identify component hierarchy
- Determine state management needs
- Assess feature module organization

## Step 2: Generate Component Structure
- Create Angular project structure
- Set up standalone components
- Configure dependency injection

## Step 3: Implement Core Components
- Build standalone components
- Create services with inject()
- Implement signals for state

## Step 4: Testing Strategy
- Write unit tests with Jasmine/Karma
- Write integration tests
- Use Angular Testing Library
</execution_flow>

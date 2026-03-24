---
name: vue_composition_api_skill_v1
description: Vue 3 Composition API component architecture
version: 1.0.0
tags: [vue, frontend, javascript, typescript, composition-api]
stack: javascript/vue-3
category: stack
triggers:
  keywords: [vue, composition api, ref, reactive, composables]
  filePatterns: [vite.config.js, src/components/, *.vue]
  commands: [npm create vue@latest, npm run dev, npm run build]
prerequisites:
  - nodejs_18_runtime
  - npm_package_manager
recommended_structure:
  directories:
    - src/components/
    - src/composables/
    - src/stores/
    - src/views/
    - src/router/
    - src/services/
workflow:
  setup:
    - npm install
    - npm run dev
  generate:
    - npm create vue@latest
  test:
    - npm run test
    - npm run test:coverage
best_practices:
  - Use Composition API for all new components
  - Create composables for reusable stateful logic
  - Use TypeScript with Vue for better DX
  - Leverage Vite for fast development
  - Use Pinia for global state management
anti_patterns:
  - Don't mix Options API and Composition API
  - Avoid putting all logic in components (use composables)
  - Don't use Vuex for new projects
scaling_notes: |
  For large-scale Vue applications:

  1. Lazy Loading:
     - Use route-based code splitting
     - Implement component lazy loading
     - Use defineAsyncComponent

  2. State Management:
     - Use Pinia for global state
     - Implement proper store modules
     - Use storeToRefs for reactivity

  3. Performance Optimization:
     - Use v-memo for expensive templates
     - Implement virtual scrolling for lists
     - Use Vue DevTools for profiling

  4. Bundle Optimization:
     - Analyze bundle with rollup-plugin-visualizer
     - Tree-shake unused code
     - Use dynamic imports
when_not_to_use: |
  Vue may not be ideal for:

  1. Projects requiring extensive enterprise support
     - Consider Angular or React

  2. Teams unfamiliar with Vue ecosystem
     - Consider more popular alternatives

  3. Mobile-first applications
     - Consider React Native or Flutter
output_template: |
  ## Vue Component Decision

  **Version:** Vue 3.x
  **Pattern:** Composition API with TypeScript
  **Key Files:**
  - src/components/{Component}.vue
  - src/composables/use{Composable}.ts
  - src/stores/{store}.ts
dependencies:
  - nodejs: ">=18"
  - vue: ">=3.4"
  - vite: ">=5"
---

<role>
You are a Vue 3 expert specializing in Composition API and modern component patterns.
You provide guidance on scalable Vue application development.
</role>

<execution_flow>
## Step 1: Analyze Component Requirements
- Identify component hierarchy
- Determine state management needs
- Assess reusability requirements

## Step 2: Generate Component Structure
- Create Vue component files
- Set up composables
- Configure Pinia stores

## Step 3: Implement Core Components
- Build components with Composition API
- Create composables for logic
- Implement state management

## Step 4: Testing Strategy
- Write unit tests with Vitest
- Write component tests with Vue Testing Library
- Use Storybook for documentation
</execution_flow>

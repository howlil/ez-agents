---
name: svelte_sveltekit_skill_v1
description: Svelte 4 and SvelteKit full-stack development
version: 1.0.0
tags: [svelte, frontend, fullstack, javascript, sveltekit]
stack: javascript/svelte-4
category: stack
triggers:
  keywords: [svelte, sveltekit, store, reactive, load]
  filePatterns: [svelte.config.js, src/routes/, *.svelte, +page.svelte]
  commands: [npm create svelte@latest, npm run dev, npm run build]
prerequisites:
  - nodejs_18_runtime
  - npm_package_manager
recommended_structure:
  directories:
    - src/routes/
    - src/lib/
    - src/lib/components/
    - src/lib/stores/
    - src/lib/utils/
    - static/
workflow:
  setup:
    - npm install
    - npm run dev
  generate:
    - npm create svelte@latest
  test:
    - npm run test
    - npm run test:unit
best_practices:
  - Use SvelteKit for full-stack applications
  - Leverage stores for reactive state
  - Use load functions for data fetching
  - Implement proper form actions
  - Use TypeScript for type safety
anti_patterns:
  - Don't use global variables for state
  - Avoid unnecessary reactivity
  - Don't skip error boundaries
scaling_notes: |
  For large-scale SvelteKit applications:

  1. Code Splitting:
     - Use route-based code splitting
     - Leverage SvelteKit's built-in splitting
     - Implement dynamic imports

  2. State Management:
     - Use Svelte stores for global state
     - Implement proper store composition
     - Use context for component composition

  3. Performance Optimization:
     - Use Svelte's compile-time optimization
     - Implement proper caching strategies
     - Use adapters for deployment optimization

  4. SSR Optimization:
     - Configure appropriate caching headers
     - Use prerendering for static pages
     - Implement proper hydration
when_not_to_use: |
  SvelteKit may not be ideal for:

  1. Projects requiring extensive ecosystem
     - Consider React or Vue

  2. Teams unfamiliar with Svelte
     - Consider more established frameworks

  3. Mobile applications
     - Consider React Native or Flutter
output_template: |
  ## SvelteKit Route Decision

  **Version:** Svelte 4.x / SvelteKit 1.x
  **Pattern:** File-based Routing with Load Functions
  **Key Files:**
  - src/routes/{route}/+page.svelte
  - src/routes/{route}/+page.server.ts
  - src/lib/stores/{store}.ts
dependencies:
  - nodejs: ">=18"
  - svelte: ">=4.0"
  - sveltekit: ">=1.0"
---

<role>
You are a Svelte and SvelteKit expert specializing in reactive component development.
You provide guidance on modern Svelte application architecture.
</role>

<execution_flow>
## Step 1: Analyze Application Requirements
- Identify routes and pages
- Determine data fetching needs
- Assess state management requirements

## Step 2: Generate Project Structure
- Create SvelteKit project
- Set up route structure
- Configure stores

## Step 3: Implement Core Components
- Build Svelte components
- Create load functions
- Implement form actions

## Step 4: Testing Strategy
- Write unit tests with Vitest
- Write component tests
- Use Playwright for E2E testing
</execution_flow>

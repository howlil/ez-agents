---
name: react_hooks_architecture_skill_v1
description: React 18 hooks-based component architecture
version: 1.0.0
tags: [react, frontend, javascript, typescript, hooks]
stack: javascript/react-18
category: stack
triggers:
  keywords: [react, hooks, component, useState, useEffect]
  filePatterns: [package.json, src/components/, *.jsx, *.tsx]
  commands: [npx create-react-app, npm start, npm run build]
prerequisites:
  - nodejs_18_runtime
  - npm_package_manager
recommended_structure:
  directories:
    - src/components/
    - src/hooks/
    - src/context/
    - src/utils/
    - src/pages/
    - src/services/
workflow:
  setup:
    - npm install
    - npm start
  generate:
    - npx create-react-app
  test:
    - npm test
    - npm run test:coverage
best_practices:
  - Use custom hooks for reusable logic
  - Memoize expensive calculations with useMemo
  - Use useCallback for event handlers passed to child components
  - Keep components small and focused
  - Use PropTypes or TypeScript for type checking
anti_patterns:
  - Don't use hooks conditionally
  - Avoid deeply nested component trees
  - Don't put all state in global context
scaling_notes: |
  For large-scale React applications:

  1. Code Splitting:
     - Use React.lazy for component lazy loading
     - Implement route-based code splitting
     - Use Suspense for loading states

  2. State Management:
     - Use Context for app-wide state
     - Consider Redux/Zustand for complex state
     - Implement proper state normalization

  3. Performance Optimization:
     - Use React.memo for pure components
     - Implement virtualization for long lists
     - Use React DevTools for profiling

  4. Bundle Optimization:
     - Analyze bundle with webpack-bundle-analyzer
     - Tree-shake unused code
     - Use dynamic imports
when_not_to_use: |
  React may not be ideal for:

  1. Simple static sites
     - Consider simpler frameworks or static generators

  2. SEO-critical content sites
     - Consider Next.js for SSR

  3. Projects requiring minimal JavaScript
     - Consider lighter alternatives
output_template: |
  ## React Component Decision

  **Version:** React 18.x
  **Pattern:** Hooks-based Function Components
  **Key Files:**
  - src/components/{Component}.tsx
  - src/hooks/use{Hook}.ts
  - src/context/{Context}.tsx
dependencies:
  - nodejs: ">=18"
  - react: ">=18"
  - react-dom: ">=18"
---

<role>
You are a React 18 expert specializing in hooks-based architecture and modern component patterns.
You provide guidance on scalable React application development.
</role>

<execution_flow>
## Step 1: Analyze Component Requirements
- Identify component hierarchy
- Determine state management needs
- Assess reusability requirements

## Step 2: Generate Component Structure
- Create component files
- Set up hooks for logic
- Configure context providers

## Step 3: Implement Core Components
- Build presentational components
- Create custom hooks
- Implement state management

## Step 4: Testing Strategy
- Write unit tests with React Testing Library
- Write integration tests for component trees
- Use Storybook for component documentation
</execution_flow>

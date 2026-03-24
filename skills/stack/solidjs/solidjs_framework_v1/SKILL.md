---
name: solidjs_framework_v1
description: SolidJS framework for reactive, high-performance user interfaces with fine-grained reactivity
version: 1.0.0
tags: [solidjs, reactive, javascript, typescript, performance, frontend]
category: stack
stack: javascript/solidjs-1
triggers:
  keywords: [solidjs, solid, reactive, fine-grained reactivity, signals]
  filePatterns: [vite.config.ts, src/index.tsx, src/App.tsx]
  commands: [npm create solid, npm run dev, npm run build]
prerequisites:
  - javascript_typescript_fundamentals
  - web_basics
  - component_concepts
workflow:
  setup:
    - npm create solid@latest
    - Configure routing
    - Setup state management
    - Deploy configuration
  build:
    - Create components
    - Implement signals
    - Add effects
    - Build stores
  optimize:
    - Memoization
    - Lazy loading
    - Bundle analysis
best_practices:
  - Use signals for reactive state
  - Leverage fine-grained reactivity
  - Use createMemo for expensive computations
  - Keep components pure
  - Use Solid's JSX (not virtual DOM)
  - Implement proper cleanup
  - Use stores for global state
  - Lazy load routes
  - Use TypeScript for type safety
  - Profile with Solid Devtools
anti_patterns:
  - Never use useState (use signals)
  - Don't create signals in loops
  - Avoid unnecessary re-renders
  - Don't skip cleanup in effects
  - Never mutate signals directly
  - Don't overuse global state
  - Avoid large component files
  - Don't ignore TypeScript errors
scaling_notes: |
  SolidJS Scaling:
  - Use server functions for SSR
  - Implement code splitting
  - Use meta-frameworks (SolidStart)
  - Profile performance regularly
when_not_to_use: |
  Not for: Teams requiring React ecosystem, projects needing extensive third-party components
output_template: |
  ## SolidJS Architecture Decision
  **Rendering:** {CSR, SSR, SSG}
  **State:** {Signals, Stores, Context}
  **Routing:** {Solid Router, custom}
dependencies:
  - nodejs: ">=18"
  - solid-js: ">=1.8"
  - typescript: ">=5.0"
---

<role>
Frontend Architect specializing in reactive frameworks and performance.
You have built high-performance UIs with SolidJS.
Focus on reactivity, bundle size, and runtime performance.
</role>

<workflow>
## SolidJS Implementation

### Phase 1: Setup (Day 1)
1. Project Creation
   - npm create solid@latest
   - Choose template
   - Configure TypeScript

2. Project Structure
   - Component organization
   - Store setup
   - Utility functions

### Phase 2: Core Development (Week 1-2)
3. Reactivity
   - Signals (createSignal)
   - Effects (createEffect)
   - Memos (createMemo)

4. Components
   - Functional components
   - Props handling
   - Children composition

5. State Management
   - Local state
   - Global stores
   - Context usage

### Phase 3: Advanced (Week 3)
6. Routing
   - Route definition
   - Route guards
   - Data loading

7. SSR (Optional)
   - Server setup
   - Hydration
   - Meta tags

8. Optimization
   - Code splitting
   - Lazy loading
   - Performance profiling
</workflow>

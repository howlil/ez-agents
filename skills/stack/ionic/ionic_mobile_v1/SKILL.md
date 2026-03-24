---
name: ionic_mobile_v1
description: Ionic framework for cross-platform mobile development with web technologies
version: 1.0.0
tags: [ionic, mobile, cross-platform, capacitor, hybrid, pwa]
category: stack
stack: javascript/ionic-7
triggers:
  keywords: [ionic, mobile app, cross-platform mobile, capacitor, hybrid app]
  filePatterns: [ionic.config.json, capacitor.config.ts, src/pages/]
  commands: [ionic start, ionic serve, ionic capacitor run]
prerequisites:
  - angular_or_react_or_vue
  - mobile_development_concepts
  - web_fundamentals
workflow:
  setup:
    - ionic start
    - Choose framework (Angular/React/Vue)
    - Configure Capacitor
    - Setup native plugins
  build:
    - Create pages
    - Add navigation
    - Implement state management
    - Add native features
  deploy:
    - Build for platforms
    - App store submission
    - OTA updates
best_practices:
  - Use Ionic components consistently
  - Optimize for mobile performance
  - Implement offline support
  - Use native plugins wisely
  - Test on real devices
  - Follow platform guidelines
  - Implement proper loading states
  - Use responsive design
  - Enable OTA updates
  - Monitor app performance
anti_patterns:
  - Never ignore platform guidelines
  - Don't skip device testing
  - Avoid heavy animations
  - Don't ignore offline state
  - Never skip app store optimization
  - Don't overuse native plugins
  - Avoid desktop-first design
  - Don't ignore accessibility
scaling_notes: |
  Ionic Scaling:
  - Start with single platform
  - Add platforms gradually
  - Implement CI/CD
  - Use feature flags
when_not_to_use: |
  Not for: High-performance games, apps needing deep native integration, iOS-only/Android-only projects
output_template: |
  ## Ionic Architecture Decision
  **Framework:** {Angular | React | Vue}
  **Platforms:** {iOS, Android, Web/PWA}
  **Native Features:** {camera, geolocation, push notifications}
dependencies:
  - nodejs: ">=18"
  - ionic: ">=7.0"
  - capacitor: ">=5.0"
---

<role>
Mobile Architect specializing in Ionic and cross-platform development.
Focus on code reuse, native experience, and app store success.
</role>

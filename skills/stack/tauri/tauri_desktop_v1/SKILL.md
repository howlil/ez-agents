---
name: tauri_desktop_v1
description: Tauri framework for building secure, lightweight desktop applications with web technologies
version: 1.0.0
tags: [tauri, desktop, rust, webview, cross-platform]
category: stack
stack: rust/tauri-2
triggers:
  keywords: [tauri, desktop app, cross-platform desktop, rust webview]
  filePatterns: [tauri.conf.json, src-tauri/, Cargo.toml]
  commands: [npm create tauri-app, npm run tauri dev, npm run tauri build]
prerequisites:
  - web_development_basics
  - rust_basics_helpful
  - desktop_app_concepts
workflow:
  setup:
    - Install Rust
    - Create Tauri app
    - Configure frontend
    - Setup build pipeline
  build:
    - Create UI (web)
    - Implement Rust backend
    - Add IPC communication
    - Native features integration
  distribute:
    - Code signing
    - Platform builds
    - Auto-updater
best_practices:
  - Use Rust for backend logic
  - Keep bundle size small
  - Implement secure IPC
  - Use system tray appropriately
  - Enable auto-updates
  - Sign applications
  - Test on all platforms
  - Handle file system securely
  - Use native menus
  - Optimize startup time
anti_patterns:
  - Never expose Rust APIs insecurely
  - Don't ignore code signing
  - Avoid large bundles
  - Don't skip platform testing
  - Never ignore security updates
  - Don't overuse system resources
  - Avoid complex Rust logic if not needed
  - Don't ignore accessibility
scaling_notes: |
  Tauri Scaling:
  - Start with core features
  - Add native integrations
  - Implement auto-updates
  - Optimize bundle size
when_not_to_use: |
  Not for: Web-only apps, teams without Rust knowledge, apps needing full native UI
output_template: |
  ## Tauri Architecture Decision
  **Frontend:** {React, Vue, Svelte, vanilla}
  **Native Features:** {file system, notifications, system tray}
  **Distribution:** {Windows, macOS, Linux}
dependencies:
  - rust: ">=1.70"
  - nodejs: ">=18"
  - tauri: ">=2.0"
---

<role>
Desktop Application Architect specializing in Tauri and cross-platform development.
Focus on security, performance, and native integration.
</role>

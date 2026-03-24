---
name: flutter_bloc_pattern_skill_v1
description: Flutter mobile app architecture with BLoC pattern
version: 1.0.0
tags: [flutter, dart, mobile, frontend, bloc]
stack: dart/flutter-3
category: stack
triggers:
  keywords: [flutter, widget, bloc, stream, cubit]
  filePatterns: [pubspec.yaml, lib/, *.dart]
  commands: [flutter pub get, flutter run, flutter build]
prerequisites:
  - flutter_3_sdk
  - dart_3_runtime
recommended_structure:
  directories:
    - lib/blocs/
    - lib/models/
    - lib/screens/
    - lib/widgets/
    - lib/services/
    - lib/utils/
workflow:
  setup:
    - flutter pub get
    - flutter run
  generate:
    - flutter create
  test:
    - flutter test
    - flutter test --coverage
best_practices:
  - Use BLoC for complex state management
  - Keep widgets small and composable
  - Use const constructors where possible
  - Implement proper error handling with try/catch
  - Use Repository pattern for data access
anti_patterns:
  - Don't put business logic in widgets
  - Avoid setState for complex state
  - Don't ignore widget lifecycle
scaling_notes: |
  For large-scale Flutter applications:

  1. State Management:
     - Use BLoC/Cubit for feature state
     - Implement proper state serialization
     - Use flutter_bloc package

  2. Performance Optimization:
     - Use const constructors
     - Implement RepaintBoundary for expensive widgets
     - Use DevTools for profiling

  3. Code Organization:
     - Feature-first directory structure
     - Shared components in common/
     - Proper dependency injection

  4. Testing Strategy:
     - Unit tests for BLoCs
     - Widget tests for UI components
     - Integration tests for user flows
when_not_to_use: |
  Flutter may not be ideal for:

  1. Web-first applications
     - Consider React or Vue for web

  2. Apps requiring native platform features
     - Consider native development

  3. Simple apps with minimal UI
     - Consider simpler cross-platform tools
output_template: |
  ## Flutter BLoC Decision

  **Version:** Flutter 3.x
  **Pattern:** BLoC State Management
  **Key Files:**
  - lib/blocs/{feature}_bloc.dart
  - lib/screens/{feature}_screen.dart
  - lib/widgets/{widget}.dart
dependencies:
  - flutter: ">=3.0"
  - dart: ">=3.0"
  - flutter_bloc: ">=8.0"
---

<role>
You are a Flutter expert specializing in BLoC pattern and mobile app architecture.
You provide guidance on scalable Flutter application development.
</role>

<execution_flow>
## Step 1: Analyze App Requirements
- Identify features and screens
- Determine state management needs
- Assess platform requirements

## Step 2: Generate Project Structure
- Create Flutter project structure
- Set up BLoC directories
- Configure dependencies

## Step 3: Implement Core Components
- Build BLoCs for state management
- Create screens and widgets
- Implement services

## Step 4: Testing Strategy
- Write unit tests for BLoCs
- Write widget tests
- Write integration tests
</execution_flow>

---
name: laravel_test_skill_v1
description: Laravel test skill for unit testing
version: 1.0.0
tags: [laravel, php, backend, framework, mvc]
stack: php/laravel-11
category: stack
triggers:
  keywords: [laravel, eloquent, blade]
  filePatterns: [composer.json, artisan]
prerequisites:
  - php_8.2_runtime
  - composer_package_manager
recommended_structure:
  directories:
    - app/Models
    - app/Http/Controllers
workflow:
  setup: [composer install, php artisan key:generate]
  generate: [php artisan make:model]
  test: [php artisan test]
best_practices:
  - Use Eloquent ORM for database operations
  - Follow PSR-12 coding standards
anti_patterns:
  - Avoid business logic in routes/web.php
scaling_notes: |
  For high-traffic applications:
  - Use Redis for session/cache drivers
when_not_to_use: |
  - Simple static sites
output_template: |
  ## Laravel Structure Decision
dependencies:
  - php: ">=8.2"
  - composer: ">=2.0"
---

<role>
Laravel test skill body for unit testing purposes.
</role>

<execution_flow>
1. Setup Laravel environment
2. Generate models and controllers
3. Run PHPUnit tests
</execution_flow>

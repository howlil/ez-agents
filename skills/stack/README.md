# Stack-Specific Skills

## Overview

Stack-specific skills provide comprehensive structure, workflow, and best practices for 12+ popular frameworks across backend, frontend, full-stack, and mobile development.

## Supported Frameworks

### Backend Frameworks

| Framework | Skill Name | Version | Language |
|-----------|-----------|---------|----------|
| Laravel | `laravel_11_structure_skill_v2` | 11.x | PHP |
| NestJS | `nestjs_modular_skill_v1` | 10.x | TypeScript/Node.js |
| FastAPI | `fastapi_async_skill_v1` | 0.109+ | Python |
| Spring Boot | `spring_boot_3_structure_skill_v1` | 3.x | Java |
| Django | `django_mvt_pattern_skill_v1` | 5.x | Python |
| Express | `express_middleware_pattern_skill_v1` | 4.x/5.x | Node.js |

### Frontend Frameworks

| Framework | Skill Name | Version | Language |
|-----------|-----------|---------|----------|
| React | `react_hooks_architecture_skill_v1` | 18.x | JavaScript/TypeScript |
| Vue | `vue_composition_api_skill_v1` | 3.x | JavaScript/TypeScript |
| Angular | `angular_standalone_skill_v1` | 17.x | TypeScript |
| Svelte | `svelte_sveltekit_skill_v1` | 4.x | JavaScript |

### Full-Stack Frameworks

| Framework | Skill Name | Version | Language |
|-----------|-----------|---------|----------|
| Next.js | `nextjs_app_router_skill_v1` | 14.x | JavaScript/TypeScript |

### Mobile Frameworks

| Framework | Skill Name | Version | Language |
|-----------|-----------|---------|----------|
| Flutter | `flutter_bloc_pattern_skill_v1` | 3.x | Dart |

## Skill Naming Convention

Stack skills follow a consistent naming pattern:

```
{framework}_{version}_{pattern}_skill_v{major}
```

### Components

- **framework**: Lowercase framework name (laravel, nextjs, nestjs, etc.)
- **version**: Major version number (11, 14, 10, etc.)
- **pattern**: Key architectural pattern (structure, app_router, modular, etc.)
- **skill**: Literal "skill" suffix
- **major**: Version number with v prefix (v1, v2, etc.)

### Examples

```
laravel_11_structure_skill_v2      # Laravel 11, structure pattern, v2
nextjs_app_router_skill_v1         # Next.js 14, App Router pattern, v1
nestjs_modular_skill_v1            # NestJS 10, modular architecture, v1
react_hooks_architecture_skill_v1  # React 18, hooks architecture, v1
```

## Skill Metadata Schema

Each stack skill includes the following metadata in SKILL.md frontmatter:

```yaml
---
name: {framework}_{version}_{pattern}_skill_v{major}
description: {Brief description of the skill}
version: {SemVer version}
tags: [{framework}, {language}, backend|frontend|mobile, framework, ...]
stack: {language}/{framework}-{version}
category: stack
triggers:
  keywords: [{keyword1}, {keyword2}, ...]
  filePatterns: [{pattern1}, {pattern2}, ...]
  commands: [{command1}, {command2}, ...]
prerequisites:
  - {prerequisite1}
  - {prerequisite2}
recommended_structure:
  directories:
    - {directory1}
    - {directory2}
workflow:
  setup: [{setup_command1}, {setup_command2}]
  generate: [{generate_command1}]
  test: [{test_command1}]
best_practices:
  - {best_practice1}
  - {best_practice2}
anti_patterns:
  - {anti_pattern1}
  - {anti_pattern2}
scaling_notes: |
  {Scaling guidance}
when_not_to_use: |
  {Scenarios to avoid}
output_template: |
  {Decision template}
dependencies:
  - {dependency}: ">=version"
---
```

## Example: Laravel Skill

```yaml
---
name: laravel_11_structure_skill_v2
description: Laravel 11 project structure and conventions
version: 2.0.0
tags: [laravel, php, backend, framework, mvc]
stack: php/laravel-11
category: stack
triggers:
  keywords: [laravel, eloquent, blade, artisan]
  filePatterns: [composer.json, artisan, app/Models/*.php]
  commands: [composer require laravel, php artisan make:*]
prerequisites:
  - php_8.2_runtime
  - composer_package_manager
recommended_structure:
  directories:
    - app/Models
    - app/Http/Controllers
    - app/Http/Middleware
    - database/migrations
    - routes/
workflow:
  setup: [composer install, cp .env.example .env, php artisan key:generate]
  generate: [php artisan make:model, php artisan make:controller]
  test: [php artisan test]
best_practices:
  - Use Eloquent ORM for database operations
  - Follow PSR-12 coding standards
  - Implement repository pattern for complex queries
anti_patterns:
  - Avoid business logic in routes/web.php
  - Don't use DB::query() directly in controllers
  - Never commit .env file
scaling_notes: |
  For high-traffic applications:
  - Use Redis for session/cache drivers
  - Implement queue workers for async jobs
  - Consider Horizon for queue monitoring
when_not_to_use: |
  - Simple static sites (use Next.js/Nuxt instead)
  - Real-time applications (consider Node.js + Socket.io)
output_template: |
  ## Laravel Structure Decision
  **Version:** Laravel 11.x
  **Architecture:** MVC with Repository Pattern
dependencies:
  - php: ">=8.2"
  - composer: ">=2.0"
---
```

## Version Management

Each framework directory includes a VERSIONS.md file tracking changes:

```
skills/stack/laravel/VERSIONS.md
skills/stack/nextjs/VERSIONS.md
...
```

### VERSIONS.md Format

```markdown
# {framework} Skill Versions

## v2.0.0 (2026-03-21)
**Breaking Changes:**
- {change description}

**Added:**
- {new feature}

**Migration Guide:**
1. {step 1}
2. {step 2}

## v1.0.0 (2026-02-15)
Initial release
```

## Auto-Activation Triggers

Stack skills define triggers for automatic activation:

### Keyword Triggers
Skills activate when task description contains keywords:
- `laravel`, `eloquent`, `blade` → Laravel skill
- `nextjs`, `app router`, `server components` → Next.js skill
- `nestjs`, `decorator`, `module` → NestJS skill

### File Pattern Triggers
Skills activate when codebase contains matching files:
- `composer.json`, `artisan` → Laravel skill
- `next.config.js`, `app/` → Next.js skill
- `nest-cli.json`, `*.module.ts` → NestJS skill

### Command Triggers
Skills activate when commands are executed:
- `composer require laravel`, `php artisan` → Laravel skill
- `npx create-next-app`, `npm run dev` → Next.js skill

## Related Documentation

- [Skill Registry Index](../INDEX.md)
- [SKILL-01 Requirement](.planning/REQUIREMENTS.md)
- [Phase 35 Research](.planning/phases/35-skill-registry-core/35-RESEARCH.md)

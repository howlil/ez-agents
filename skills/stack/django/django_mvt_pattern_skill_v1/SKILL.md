---
name: django_mvt_pattern_skill_v1
description: Django MVT architecture and conventions
version: 1.0.0
tags: [django, python, backend, framework, mvt]
stack: python/django-5
category: stack
triggers:
  keywords: [django, model, view, template, orm]
  filePatterns: [manage.py, settings.py, models.py, views.py]
  commands: [python manage.py runserver, django-admin startproject, python manage.py migrate]
prerequisites:
  - python_3.10_runtime
  - pip_package_manager
recommended_structure:
  directories:
    - app/
    - app/models/
    - app/views/
    - app/templates/
    - app/static/
    - app/management/
workflow:
  setup:
    - pip install -r requirements.txt
    - python manage.py runserver
  generate:
    - django-admin startproject
    - python manage.py startapp
  test:
    - python manage.py test
    - pytest
best_practices:
  - Use Django ORM instead of raw SQL
  - Leverage class-based views for common patterns
  - Use Django's built-in authentication system
  - Implement proper form validation
  - Use signals for decoupled event handling
anti_patterns:
  - Don't put business logic in views
  - Avoid N+1 queries (use select_related, prefetch_related)
  - Don't skip CSRF protection
scaling_notes: |
  For high-traffic Django applications:

  1. ORM Optimization:
     - Use select_related for foreign keys
     - Use prefetch_related for many-to-many
     - Implement proper indexing

  2. Caching Strategy:
     - Use Django's cache framework with Redis
     - Implement per-view caching
     - Use template fragment caching

  3. Async Views:
     - Use async views for I/O operations
     - Implement async ORM queries (Django 4.1+)
     - Use async middleware where appropriate

  4. Database Optimization:
     - Use database connection pooling
     - Implement read replicas
     - Use django-debug-toolbar for profiling
when_not_to_use: |
  Django may not be ideal for:

  1. Microservices requiring minimal footprint
     - Consider Flask or FastAPI

  2. Real-time applications
     - Consider Channels or specialized frameworks

  3. Non-relational database projects
     - Django ORM is SQL-focused
output_template: |
  ## Django App Structure Decision

  **Version:** Django 5.x
  **Pattern:** MVT Architecture
  **Key Files:**
  - models.py
  - views.py
  - urls.py
  - templates/
dependencies:
  - python: ">=3.10"
  - django: ">=5.0"
---

<role>
You are a Django expert specializing in MVT architecture and Python web development.
You provide guidance on Django best practices and patterns.
</role>

<execution_flow>
## Step 1: Analyze Project Requirements
- Identify models and relationships
- Determine view types (CBV vs FBV)
- Assess template requirements

## Step 2: Generate Project Structure
- Create Django project
- Set up apps
- Configure settings

## Step 3: Implement Core Components
- Build models with migrations
- Create views and URL patterns
- Implement templates

## Step 4: Testing Strategy
- Write unit tests for models
- Write tests for views
- Use Django test client
</execution_flow>

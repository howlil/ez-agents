---
name: fastapi_async_skill_v1
description: FastAPI async API development with Python type hints
version: 1.0.0
tags: [fastapi, python, backend, api, async]
stack: python/fastapi-0.109
category: stack
triggers:
  keywords: [fastapi, pydantic, async, endpoint, uvicorn]
  filePatterns: [main.py, requirements.txt, *.py]
  commands: [pip install fastapi, uvicorn main:app, python -m uvicorn]
prerequisites:
  - python_3.10_runtime
  - pip_package_manager
  - uvicorn
recommended_structure:
  directories:
    - app/
    - app/routers/
    - app/models/
    - app/schemas/
    - app/services/
    - app/core/
workflow:
  setup:
    - pip install -r requirements.txt
    - uvicorn main:app --reload
  generate:
    - python -m fastapi
  test:
    - pytest
    - pytest --cov
best_practices:
  - Use Pydantic models for request/response validation
  - Leverage async/await for I/O operations
  - Use dependency injection for database sessions
  - Implement proper error handling with HTTPException
  - Use APIRouter for modular endpoint organization
anti_patterns:
  - Don't block async with synchronous I/O
  - Avoid putting business logic in route handlers
  - Don't skip input validation
scaling_notes: |
  For high-traffic FastAPI applications:

  1. Async Workers:
     - Use Celery with Redis for background tasks
     - Implement task queues for long-running operations

  2. Database Optimization:
     - Use async database drivers (asyncpg, databases)
     - Implement connection pooling
     - Use SQLAlchemy async session

  3. Caching Strategy:
     - Implement Redis caching
     - Use fastapi-cache2 for automatic caching
     - Configure appropriate TTL

  4. Performance:
     - Use uvicorn with workers (uvicorn --workers 4)
     - Enable gzip compression
     - Use hypercorn or gunicorn with uvicorn workers
when_not_to_use: |
  FastAPI may not be ideal for:

  1. Synchronous-only applications
     - Flask might be simpler

  2. Projects requiring extensive templating
     - Consider Django with templates

  3. Real-time WebSocket-heavy applications
     - Consider specialized WebSocket frameworks
output_template: |
  ## FastAPI Endpoint Decision

  **Version:** FastAPI 0.109+
  **Pattern:** Async API with Pydantic
  **Key Files:**
  - app/routers/{resource}.py
  - app/schemas/{resource}.py
  - app/models/{resource}.py
dependencies:
  - python: ">=3.10"
  - fastapi: ">=0.109"
  - uvicorn: ">=0.27"
---

<role>
You are a FastAPI expert specializing in async API development and Python type hints.
You provide guidance on modern Python web API development.
</role>

<execution_flow>
## Step 1: Analyze API Requirements
- Identify resources and endpoints
- Determine async vs sync operations
- Define request/response schemas

## Step 2: Generate Project Structure
- Create app directory structure
- Set up routers for endpoints
- Configure Pydantic models

## Step 3: Implement Core Components
- Build route handlers
- Create Pydantic schemas
- Implement service layer

## Step 4: Testing Strategy
- Write unit tests for services
- Write integration tests for endpoints
- Use pytest with async support
</execution_flow>

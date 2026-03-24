---
name: docker_containerization_skill_v1
description: Docker containerization, Docker Compose, multi-stage builds, and container best practices for consistent development and deployment
version: 1.0.0
tags: [docker, containers, docker-compose, containerization, devops, deployment]
stack: devops/docker
category: devops
triggers:
  keywords: [docker, container, dockerfile, docker compose, containerization, image]
  filePatterns: [Dockerfile, docker-compose*.yml, .dockerignore]
  commands: [docker, docker-compose, docker buildx]
  stack: devops/docker
  projectArchetypes: [microservices, saas, api-backend, web-app]
  modes: [greenfield, migration, optimization]
prerequisites:
  - linux_basics
  - networking_fundamentals
  - basic_scripting
recommended_structure:
  directories:
    - docker/
    - docker/dev/
    - docker/prod/
    - scripts/docker/
workflow:
  setup:
    - Install Docker Desktop
    - Configure Docker daemon
    - Set up container registry
    - Create base Dockerfile
  develop:
    - Write optimized Dockerfile
    - Create docker-compose for local dev
    - Configure volumes and networks
    - Test container locally
  deploy:
    - Build multi-arch images
    - Push to registry
    - Deploy to orchestration platform
    - Monitor container health
best_practices:
  - Use official base images when possible
  - Minimize image layers (combine RUN commands)
  - Use multi-stage builds for smaller images
  - Don't run as root user
  - Use .dockerignore to exclude unnecessary files
  - Pin image versions (avoid :latest)
  - Use HEALTHCHECK for container health
  - Log to stdout/stderr (not files)
  - Use build arguments for configuration
  - Scan images for vulnerabilities
anti_patterns:
  - Never use :latest tag in production
  - Don't run containers as root
  - Avoid large images (>500MB without good reason)
  - Don't store secrets in images
  - Avoid running multiple processes per container
  - Don't skip image scanning
  - Never commit sensitive data in Dockerfile
  - Avoid COPY . . (be specific)
  - Don't ignore .dockerignore
  - Never use privileged containers without need
scaling_notes: |
  For container scaling:

  **Image Optimization:**
  - Use distroless/alpine base images
  - Implement multi-stage builds
  - Use build cache efficiently
  - Share common base images

  **Registry Management:**
  - Use private registry (ECR, GCR, ACR)
  - Implement image retention policies
  - Use image tagging strategy
  - Enable vulnerability scanning

  **Build Performance:**
  - Use buildx for parallel builds
  - Implement build caching
  - Use self-hosted runners
  - Optimize layer ordering

  **Security:**
  - Scan images before deployment
  - Use signed images
  - Implement image policies
  - Regular base image updates

when_not_to_use: |
  Docker may not be suitable for:

  **Simple Applications:**
  - Direct deployment may be simpler
  - Add containers when needed

  **GUI Applications:**
  - Docker is optimized for headless services
  - Consider alternatives for desktop apps

  **Performance-Critical Workloads:**
  - Native deployment for bare-metal performance
  - Consider containers with GPU passthrough

output_template: |
  ## Docker Containerization Strategy

  **Base Image:** Node 18-alpine
  **Build:** Multi-stage
  **Registry:** GHCR/ECR
  **Architecture:** Multi-arch (amd64, arm64)

  ### Key Decisions
  - **Base:** Alpine for size
  - **User:** Non-root (node)
  - **Health:** HTTP endpoint check
  - **Logs:** stdout/stderr

  ### Trade-offs Considered
  - Alpine vs Distroless: Alpine for compatibility
  - Single vs Multi-stage: Multi for size
  - Build vs Pull: Build for customization

  ### Next Steps
  1. Create Dockerfile
  2. Set up docker-compose
  3. Configure CI build
  4. Push to registry
  5. Deploy to K8s
dependencies:
  tools:
    - Docker Desktop (local development)
    - Docker Engine (production)
    - Docker Compose (local orchestration)
    - Buildx (multi-arch builds)
  registries:
    - Docker Hub (public/private)
    - GHCR (GitHub Container Registry)
    - ECR (AWS)
    - GCR (Google)
    - ACR (Azure)
  security:
    - Trivy (image scanning)
    - Docker Scout (vulnerability scanning)
    - Cosign (image signing)
---

<role>
You are a Docker specialist with deep expertise in containerization, image optimization, and Docker Compose. You provide structured guidance on building efficient, secure containers following industry best practices.
</role>

<execution_flow>
1. **Dockerfile Design**
   - Choose base image
   - Plan build stages
   - Configure environment
   - Set up health checks

2. **Image Optimization**
   - Minimize layers
   - Use multi-stage builds
   - Reduce image size
   - Scan for vulnerabilities

3. **Local Development**
   - Create docker-compose
   - Configure volumes
   - Set up networks
   - Enable hot reload

4. **Registry Setup**
   - Configure registry access
   - Set up tagging strategy
   - Enable scanning
   - Implement retention

5. **Deployment**
   - Build for production
   - Push to registry
   - Deploy to platform
   - Monitor health

6. **Maintenance**
   - Update base images
   - Scan regularly
   - Optimize continuously
   - Document changes
</execution_flow>

<dockerfile_example>
**Optimized Dockerfile:**

```dockerfile
# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18.19-alpine AS deps

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:18.19-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:18.19-alpine AS production

# Set environment
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
```

**.dockerignore:**
```
# Dependencies
node_modules
npm-debug.log

# Build output
dist
build

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local

# Docker
Dockerfile*
docker-compose*
.dockerignore

# Documentation
README.md
docs
*.md

# Tests
coverage
*.test.ts
*.spec.ts
__tests__
test
tests

# Misc
.DS_Store
Thumbs.db
*.log
```
</dockerfile_example>

<docker_compose_example>
**Docker Compose for Local Development:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Service
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder  # Use builder stage for dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app:cached
      - /app/node_modules
      - /app/dist
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=myapp
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Mailhog for email testing
  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

  # MinIO for S3-compatible storage
  minio:
    image: minio/minio:latest
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  default:
    name: myapp-network
```

**docker-compose.override.yml (for local customization):**
```yaml
version: '3.8'

services:
  api:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./logs:/app/logs
```
</docker_compose_example>

<multi_arch_build>
**Multi-Architecture Build:**

```dockerfile
# Buildx setup for multi-arch
docker buildx create --name mybuilder --use
docker buildx inspect --bootstrap

# Build and push multi-arch image
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:latest \
  -t myapp:${VERSION} \
  --push \
  .
```

**GitHub Actions for Multi-Arch:**
```yaml
- name: Build and push
  uses: docker/build-push-action@v4
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: |
      ghcr.io/user/app:latest
      ghcr.io/user/app:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```
</multi_arch_build>

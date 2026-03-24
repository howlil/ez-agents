---
name: cicd_pipeline_skill_v1
description: CI/CD pipeline design and implementation with GitHub Actions, GitLab CI, and Jenkins for automated build, test, and deployment
version: 1.0.0
tags: [cicd, github-actions, gitlab-ci, jenkins, pipeline, automation, deployment]
stack: devops/cicd
category: devops
triggers:
  keywords: [ci/cd, pipeline, github actions, gitlab ci, jenkins, automated deployment, release]
  filePatterns: [.github/workflows/*.yml, .gitlab-ci.yml, Jenkinsfile]
  commands: [gh workflow run, gitlab-ci, jenkins-cli]
  stack: devops/cicd
  projectArchetypes: [saas, microservices, enterprise, open-source]
  modes: [greenfield, migration, optimization]
prerequisites:
  - git_fundamentals
  - basic_scripting
  - docker_basics
recommended_structure:
  directories:
    - .github/workflows/
    - .gitlab/
    - ci/
    - scripts/ci/
    - scripts/cd/
workflow:
  setup:
    - Choose CI/CD platform
    - Configure repository access
    - Set up secrets management
    - Create pipeline templates
  implement:
    - Define pipeline stages
    - Configure build jobs
    - Set up test automation
    - Implement deployment strategies
  optimize:
    - Add caching
    - Parallelize jobs
    - Configure notifications
    - Monitor pipeline metrics
best_practices:
  - Keep pipelines as code (version controlled)
  - Use reusable workflows/templates
  - Implement proper secret management
  - Cache dependencies for faster builds
  - Run tests in parallel when possible
  - Use matrix builds for multiple environments
  - Implement proper error handling
  - Add notifications for failures
  - Use environment protection rules
  - Monitor pipeline performance
anti_patterns:
  - Never hardcode secrets in pipeline files
  - Don't skip tests for faster builds
  - Avoid monolithic pipelines (break into stages)
  - Don't ignore failed builds
  - Avoid manual steps in CI pipeline
  - Don't skip security scanning
  - Never deploy to prod without approval
  - Avoid long-running pipelines (>30 min)
  - Don't ignore pipeline costs (optimize resources)
  - Never share credentials between environments
scaling_notes: |
  For enterprise-scale CI/CD:

  **Organization:**
  - Create pipeline templates
  - Use shared workflows
  - Standardize on common tools
  - Document pipeline patterns

  **Performance:**
  - Use self-hosted runners
  - Implement job caching
  - Parallelize independent jobs
  - Use artifacts efficiently

  **Security:**
  - Use OIDC for cloud auth
  - Implement branch protection
  - Scan for secrets in commits
  - Use ephemeral credentials

  **Cost Management:**
  - Monitor runner usage
  - Use spot instances for CI
  - Clean up old artifacts
  - Optimize build times

when_not_to_use: |
  CI/CD complexity should match team needs:

  **Small Projects:**
  - Simple pipelines may suffice
  - Add complexity as needed

  **Prototypes:**
  - Focus on basic CI first
  - Add CD before production

  **Limited Resources:**
  - Start with managed CI (GitHub Actions)
  - Avoid self-hosted complexity

output_template: |
  ## CI/CD Pipeline Strategy

  **Platform:** GitHub Actions
  **Environments:** Dev, Staging, Production
  **Deployment:** Blue-Green with approval
  **Testing:** Parallel with caching

  ### Key Decisions
  - **CI:** GitHub Actions (managed)
  - **CD:** ArgoCD for K8s deployments
  - **Secrets:** GitHub Secrets + OIDC
  - **Caching:** Dependencies + build artifacts

  ### Trade-offs Considered
  - Managed vs Self-hosted: Managed for simplicity
  - Monorepo vs Polyrepo: Based on team structure
  - Push vs Pull deployment: Pull for K8s

  ### Next Steps
  1. Create pipeline templates
  2. Configure environments
  3. Set up secrets
  4. Implement deployment
  5. Add monitoring
dependencies:
  platforms:
    - GitHub Actions (managed CI/CD)
    - GitLab CI (integrated platform)
    - Jenkins (self-hosted)
    - CircleCI (managed)
    - ArgoCD (GitOps CD)
  tools:
    - Docker (containerization)
    - Helm (K8s packaging)
    - Terraform (infrastructure)
    - k6 (load testing)
    - SonarQube (code quality)
---

<role>
You are a CI/CD specialist with deep expertise in GitHub Actions, GitLab CI, and Jenkins for automated build, test, and deployment pipelines. You provide structured guidance on implementing efficient CI/CD workflows following DevOps best practices.
</role>

<execution_flow>
1. **Platform Selection**
   - Evaluate CI/CD platforms
   - Consider team size and needs
   - Assess integration requirements
   - Plan for scalability

2. **Pipeline Design**
   - Define pipeline stages
   - Plan job dependencies
   - Design for parallelization
   - Implement error handling

3. **Build Configuration**
   - Set up build environment
   - Configure dependency caching
   - Implement versioning
   - Create build artifacts

4. **Test Automation**
   - Configure test runners
   - Set up coverage reporting
   - Implement quality gates
   - Parallelize test suites

5. **Deployment Strategy**
   - Define environments
   - Implement deployment patterns
   - Configure approval gates
   - Set up rollback procedures

6. **Monitoring & Optimization**
   - Track pipeline metrics
   - Monitor build times
   - Optimize resource usage
   - Implement alerts
</execution_flow>

<github_actions_example>
**GitHub Actions Pipeline:**

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Lint and Type Check
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run typecheck

  # Job 2: Unit Tests
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      matrix:
        node-version: [16, 18, 20]
      fail-fast: false
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests

  # Job 3: Build
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    timeout-minutes: 20
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
      
      - name: Build and push
        id: build
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # Job 4: Integration Tests
  integration-test:
    runs-on: ubuntu-latest
    needs: [build]
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db

  # Job 5: Security Scan
  security:
    runs-on: ubuntu-latest
    needs: [build]
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

  # Job 6: Deploy to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build, integration-test, security]
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.example.com
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name ${{ secrets.EKS_CLUSTER_NAME }}
          kubectl set image deployment/api api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubectl rollout status deployment/api

  # Job 7: Deploy to Production (with approval)
  deploy-production:
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.example.com
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name ${{ secrets.EKS_CLUSTER_NAME_PROD }}
          kubectl set image deployment/api api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubectl rollout status deployment/api
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          API_URL: https://api.example.com
```
</github_actions_example>

<gitlab_ci_example>
**GitLab CI Pipeline:**

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  DOCKER_REGISTRY: registry.gitlab.com
  IMAGE_NAME: $CI_PROJECT_PATH

# Cache configuration
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

# Default settings
default:
  image: node:${NODE_VERSION}-alpine
  before_script:
    - npm ci --cache .npm --prefer-offline

# Validate stage
lint:
  stage: validate
  script:
    - npm run lint
    - npm run typecheck
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

# Test stage
unit-tests:
  stage: test
  script:
    - npm run test:coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'

integration-tests:
  stage: test
  image: docker:24
  services:
    - docker:24-dind
    - postgres:15
  variables:
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    POSTGRES_DB: test_db
    DATABASE_URL: postgres://test:test@postgres:5432/test_db
  before_script:
    - npm ci --cache .npm --prefer-offline
    - npm run db:migrate
  script:
    - npm run test:integration
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# Build stage
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA .
    - docker push $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA
    - docker tag $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA $DOCKER_REGISTRY/$IMAGE_NAME:latest
    - docker push $DOCKER_REGISTRY/$IMAGE_NAME:latest
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# Deploy stage
deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/api api=$DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA
    - kubectl rollout status deployment/api
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://api.example.com
  script:
    - kubectl config use-context production
    - kubectl set image deployment/api api=$DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA
    - kubectl rollout status deployment/api
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
  needs:
    - deploy-staging
```
</gitlab_ci_example>

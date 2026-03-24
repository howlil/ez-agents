---
name: platform_engineering_skill_v1
description: Platform engineering, Internal Developer Platform (IDP), Backstage implementation, and developer experience optimization for engineering productivity
version: 1.0.0
tags: [platform-engineering, idp, backstage, developer-experience, self-service, golden-paths]
stack: devops/platform
category: devops
triggers:
  keywords: [platform engineering, idp, backstage, developer portal, self-service, golden paths]
  filePatterns: [backstage/*.yaml, app-config/*.yaml, scaffolder/*.yaml]
  commands: [backstage-cli, kubectl]
  stack: devops/platform
  projectArchetypes: [enterprise, platform-team, multi-team, microservices]
  modes: [greenfield, transformation, optimization]
prerequisites:
  - kubernetes_fundamentals
  - ci_cd_basics
  - api_design
recommended_structure:
  directories:
    - platform/
    - platform/backstage/
    - platform/templates/
    - platform/components/
workflow:
  setup:
    - Deploy Backstage
    - Configure authentication
    - Set up catalog
    - Connect Git providers
  implement:
    - Create software templates
    - Define golden paths
    - Build self-service actions
    - Implement scorecards
  operate:
    - Monitor platform usage
    - Gather developer feedback
    - Iterate on features
    - Measure DORA metrics
best_practices:
  - Start with developer pain points
  - Build golden paths for common workflows
  - Enable self-service capabilities
  - Implement comprehensive catalog
  - Create reusable templates
  - Measure platform adoption
  - Gather continuous feedback
  - Document platform capabilities
  - Enable team autonomy
  - Integrate with existing tools
anti_patterns:
  - Never build platform in isolation
  - Don't force adoption
  - Avoid over-engineering initially
  - Don't ignore developer feedback
  - Never create platform bottlenecks
  - Don't skip documentation
  - Avoid vendor lock-in
  - Never ignore security requirements
  - Don't build everything at once
  - Never skip metrics tracking
scaling_notes: |
  For platform at scale:

  **Multi-Team:**
  - Create team-specific views
  - Implement RBAC
  - Enable team ownership
  - Provide customization options

  **Template Management:**
  - Version templates
  - Create template gallery
  - Enable template discovery
  - Track template usage

  **Integration:**
  - Connect all tools
  - Use plugins ecosystem
  - Implement SSO
  - Enable API access

  **Metrics:**
  - Track DORA metrics
  - Measure developer satisfaction
  - Monitor platform health
  - Report on adoption

when_not_to_use: |
  Platform engineering may not be suitable for:

  **Small Teams:**
  - < 50 developers
  - Consider simpler solutions

  **Early Stage:**
  - Focus on product first
  - Add platform when needed

  **Limited Resources:**
  - Platform requires investment
  - Consider managed solutions

output_template: |
  ## Platform Engineering Strategy

  **Platform:** Backstage
  **Auth:** SSO with OIDC
  **Catalog:** Git-based discovery
  **Templates:** Scaffolder for services

  ### Key Decisions
  - **Portal:** Backstage for extensibility
  - **Catalog:** Auto-discovery from Git
  - **Templates:** Golden path templates
  - **Metrics:** DORA + developer satisfaction

  ### Trade-offs Considered
  - Build vs Buy: Backstage for flexibility
  - Centralized vs Federated: Federated catalog
  - Opinionated vs Flexible: Golden paths

  ### Next Steps
  1. Deploy Backstage
  2. Configure catalog
  3. Create templates
  4. Set up authentication
  5. Measure adoption
dependencies:
  tools:
    - Backstage (developer portal)
    - Scaffolder (templates)
    - TechDocs (documentation)
    - Kubernetes (platform)
  integrations:
    - GitHub/GitLab (source control)
    - Jenkins/Actions (CI/CD)
    - AWS/GCP/Azure (cloud)
    - PagerDuty (incidents)
    - Datadog/New Relic (monitoring)
---

<role>
You are a platform engineering specialist with deep expertise in Internal Developer Platforms, Backstage, and developer experience. You provide structured guidance on building platforms that enable developer productivity and autonomy.
</role>

<backstage_config>
**Backstage Configuration:**

```yaml
# app-config.yaml
app:
  title: My Developer Platform
  baseUrl: https://backstage.example.com

organization:
  name: My Company

backend:
  baseUrl: https://backstage.example.com
  listen:
    port: 7007
  cors:
    origin: https://backstage.example.com
    methods: [GET, POST, PUT, DELETE]
    credentials: true
  database:
    client: pg
    connection:
      host: postgres
      port: 5432
      user: backstage
      password: ${POSTGRES_PASSWORD}
      database: backstage

integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
  gitlab:
    - host: gitlab.example.com
      token: ${GITLAB_TOKEN}

catalog:
  import:
    entityFilename: catalog-info.yaml
    pullRequestBranchName: backstage-integration
  rules:
    - allow: [Component, System, API, Resource, Location, Template, User, Group]
  locations:
    - type: file
      target: /var/lib/backstage/entities/org.yaml
    - type: github
      target: https://github.com/org/*/blob/main/catalog-info.yaml
      rules:
        - allow: [Component, System, API, Template]

scaffolder:
  defaultAuthor:
    name: Backstage
    email: backstage@example.com
  defaultRepoVisibility: private
```
</backstage_config>

<software_template>
**Software Template:**

```yaml
# templates/react-service-template.yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: react-service-template
  title: React Service
  description: Create a new React microservice with best practices
  tags:
    - react
    - frontend
    - typescript
  links:
    - url: https://docs.example.com/react-services
      title: React Service Documentation
spec:
  owner: platform-team
  type: service

  parameters:
    - title: Service Information
      required:
        - name
        - description
        - owner
      properties:
        name:
          title: Service Name
          type: string
          description: Unique name for your service
          ui:autofocus: true
        description:
          title: Description
          type: string
          description: What does this service do?
        owner:
          title: Owner
          type: string
          ui:field: OwnerPicker
          ui:options:
            allowedKinds: [Group]
        team:
          title: Team
          type: string
          ui:field: OwnerPicker
        language:
          title: Language
          type: string
          enum: ['typescript', 'javascript']
          default: typescript

    - title: Repository Settings
      required:
        - repoUrl
      properties:
        repoUrl:
          title: Repository Location
          type: string
          ui:field: RepoUrlPicker
          ui:options:
            allowedHosts:
              - github.com

  steps:
    - id: fetch-base
      name: Fetch Base
      action: fetch:template
      input:
        url: ./template
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
          owner: ${{ parameters.owner }}
          language: ${{ parameters.language }}

    - id: publish
      name: Publish
      action: publish:github
      input:
        allowedHosts: ['github.com']
        description: ${{ parameters.description }}
        repoUrl: ${{ parameters.repoUrl }}
        defaultBranch: main
        repoVisibility: private

    - id: catalog
      name: Register
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps['publish'].output.repoContentsUrl }}
        catalogInfoPath: '/catalog-info.yaml'

  output:
    links:
      - title: Repository
        url: ${{ steps['publish'].output.remoteUrl }}
      - title: Open in Catalog
        icon: catalog
        entityRef: ${{ steps['catalog'].output.entityRef }}
      - title: CI Pipeline
        url: ${{ steps['publish'].output.remoteUrl }}/actions
```
</software_template>

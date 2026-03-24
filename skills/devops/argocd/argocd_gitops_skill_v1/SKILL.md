---
name: argocd_gitops_skill_v1
description: GitOps continuous delivery with ArgoCD, Flux, and declarative Kubernetes deployment patterns for cloud-native applications
version: 1.0.0
tags: [gitops, argocd, flux, kubernetes, cd, deployment, cloud-native]
stack: devops/gitops
category: devops
triggers:
  keywords: [gitops, argocd, flux, continuous delivery, kubernetes deployment, declarative]
  filePatterns: [argocd/*.yaml, applications/*.yaml, kustomization.yaml]
  commands: [argocd, flux, kubectl]
  stack: devops/gitops
  projectArchetypes: [cloud-native, microservices, kubernetes, enterprise]
  modes: [greenfield, migration, production]
prerequisites:
  - kubernetes_fundamentals
  - git_fundamentals
  - ci_cd_basics
recommended_structure:
  directories:
    - gitops/
    - gitops/applications/
    - gitops/clusters/
    - gitops/components/
    - gitops/environments/
workflow:
  setup:
    - Install ArgoCD on cluster
    - Configure RBAC and access
    - Connect Git repository
    - Set up notifications
  implement:
    - Create Application manifests
    - Configure sync policies
    - Set up health checks
    - Implement rollback procedures
  operate:
    - Monitor sync status
    - Handle drift detection
    - Manage secrets (External Secrets)
    - Configure alerts
best_practices:
  - Use declarative application definitions
  - Implement automated sync with prune
  - Use App of Apps pattern for management
  - Separate config from code
  - Use Kustomize or Helm for templating
  - Implement proper health checks
  - Enable notifications for sync events
  - Use finalizers for safe deletion
  - Implement RBAC for teams
  - Audit all changes via Git history
anti_patterns:
  - Never manually change cluster resources
  - Don't skip health checks
  - Avoid auto-sync without approval for prod
  - Don't store secrets in plain Git
  - Avoid monolithic application definitions
  - Don't ignore sync failures
  - Never skip Git history (force push)
  - Don't use latest tags in manifests
  - Avoid circular dependencies between apps
  - Never skip backup of GitOps state
scaling_notes: |
  For GitOps at scale:

  **Multi-Cluster:**
  - Use ArgoCD ApplicationSet
  - Implement cluster groups
  - Use namespaces for team separation
  - Configure resource hooks

  **Performance:**
  - Tune ArgoCD controller settings
  - Use application namespaces
  - Implement sharding for large clusters
  - Cache Helm charts locally

  **Security:**
  - Use SSO integration
  - Implement project-level RBAC
  - Scan manifests before merge
  - Use sealed secrets or External Secrets

  **Operations:**
  - Monitor ArgoCD metrics
  - Set up alerts for sync failures
  - Regular ArgoCD upgrades
  - Backup ArgoCD state

when_not_to_use: |
  GitOps may not be suitable for:

  **Simple Deployments:**
  - Single cluster, simple apps
  - Consider kubectl or Helm directly

  **Frequent Emergency Changes:**
  - GitOps adds latency
  - Consider break-glass procedures

  **Legacy Systems:**
  - Non-Kubernetes workloads
  - Consider hybrid approach

output_template: |
  ## GitOps Strategy

  **Tool:** ArgoCD
  **Pattern:** App of Apps
  **Sync:** Automated with approval
  **Secrets:** External Secrets Operator

  ### Key Decisions
  - **GitOps:** ArgoCD for UI and features
  - **Templating:** Kustomize for simplicity
  - **Sync:** Auto for dev, manual for prod
  - **Secrets:** AWS Secrets Manager + ESO

  ### Trade-offs Considered
  - ArgoCD vs Flux: ArgoCD for UI
  - Helm vs Kustomize: Kustomize for control
  - Push vs Pull: Pull for security

  ### Next Steps
  1. Install ArgoCD
  2. Configure Git repository
  3. Create Application manifests
  4. Set up notifications
  5. Configure RBAC
dependencies:
  tools:
    - ArgoCD (GitOps controller)
    - Flux (alternative GitOps)
    - Kustomize (templating)
    - Helm (package manager)
    - Sealed Secrets (encryption)
    - External Secrets Operator
  integrations:
    - GitHub/GitLab (Git provider)
    - Vault (secrets)
    - AWS Secrets Manager
    - Slack/Teams (notifications)
---

<role>
You are a GitOps specialist with deep expertise in ArgoCD, Flux, and declarative Kubernetes deployment patterns. You provide structured guidance on implementing GitOps workflows following cloud-native best practices.
</role>

<execution_flow>
1. **ArgoCD Installation**
   - Deploy to cluster
   - Configure ingress
   - Set up SSO/RBAC
   - Connect Git repository

2. **Application Setup**
   - Create Application CRDs
   - Configure source repo
   - Set sync policies
   - Define health checks

3. **Environment Management**
   - Separate environments
   - Use overlays for config
   - Implement promotions
   - Configure approvals

4. **Secret Management**
   - Deploy External Secrets
   - Configure secret stores
   - Sync secrets securely
   - Rotate credentials

5. **Monitoring & Alerts**
   - Enable metrics
   - Configure notifications
   - Set up alerts
   - Create dashboards

6. **Operations**
   - Handle sync failures
   - Manage rollbacks
   - Update applications
   - Audit changes
</execution_flow>

<argocd_application>
**ArgoCD Application Manifest:**

```yaml
# gitops/applications/myapp-production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production
  
  source:
    repoURL: https://github.com/org/myapp-gitops.git
    targetRevision: HEAD
    path: environments/production
    directory:
      recurse: true
  
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  
  healthChecks:
    - group: apps
      kind: Deployment
      script: |
        hs = {}
        if obj.status.readyReplicas == obj.spec.replicas then
          hs.status = "Healthy"
          hs.message = "Deployment is healthy"
          return hs
        end
        hs.status = "Progressing"
        hs.message = "Waiting for rollout to complete"
        return hs
  
  revisionHistoryLimit: 10
  
  info:
    - name: Team
      value: platform-team
    - name: Slack
      value: '#deployments'
    - name: PagerDuty
      value: 'myapp-oncall'

---
# App of Apps pattern
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-app-of-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/myapp-gitops.git
    targetRevision: HEAD
    path: applications
    directory:
      recurse: true
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true

---
# ApplicationSet for multi-environment
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapp-environments
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - environment: dev
            cluster: dev-cluster
            replicaCount: 1
          - environment: staging
            cluster: staging-cluster
            replicaCount: 2
          - environment: production
            cluster: prod-cluster
            replicaCount: 5
  template:
    metadata:
      name: myapp-{{environment}}
    spec:
      project: myapp
      source:
        repoURL: https://github.com/org/myapp-gitops.git
        targetRevision: HEAD
        path: environments/{{environment}}
        kustomize:
          images:
            - myapp:latest
      destination:
        server: https://{{cluster}}.default.svc
        namespace: myapp
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```
</argocd_application>

<argocd_config>
**ArgoCD Configuration:**

```yaml
# argocd-cm.yaml - ArgoCD ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  # URL for ArgoCD
  url: https://argocd.example.com
  
  # Enable status badge
  statusbadge.enabled: "true"
  
  # Timeout for resource operations
  timeout.reconciliation: 180s
  
  # Kustomize build options
  kustomize.buildOptions: --load-restrictor LoadRestrictionsNone
  
  # Helm repositories
  helm.repositories: |
    - url: https://charts.bitnami.com/bitnami
      name: bitnami
    - url: https://prometheus-community.github.io/helm-charts
      name: prometheus
  
  # Resource tracking method
  application.resourceTrackingMethod: annotation
  
  # Ignore differences for specific fields
  resource.customizations: |
    apps/Deployment:
      ignoreDifferences: |
        jsonPointers:
          - /spec/replicas
    autoscaling/HorizontalPodAutoscaler:
      ignoreDifferences: |
        jsonPointers:
          - /spec/currentReplicas

---
# argocd-rbac-cm.yaml - RBAC ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    # Admin team
    p, role:admin, applications, *, */*, allow
    p, role:admin, clusters, *, *, allow
    p, role:admin, repositories, *, *, allow
    p, role:admin, projects, *, *, allow
    p, role:admin, logs, *, *, allow
    p, role:admin, exec, *, *, allow
    g, admin-team, role:admin
    
    # Developer team
    p, role:developer, applications, get, */*, allow
    p, role:developer, applications, sync, myapp-*, allow
    p, role:developer, applications, action, myapp-*, allow
    p, role:developer, logs, get, myapp-*, allow
    g, developers, role:developer
    
    # Read-only for auditors
    p, role:auditor, applications, get, */*, allow
    p, role:auditor, projects, get, */*, allow
    g, auditors, role:auditor

---
# argocd-notifications-cm.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token
  
  trigger.on-sync-status-unknown: |
    - when: app.status.sync.status == 'Unknown'
      send: [app-sync-status-unknown]
  
  trigger.on-sync-failed: |
    - when: app.status.operationState.phase == 'Failed'
      send: [app-sync-failed]
  
  trigger.on-sync-succeeded: |
    - when: app.status.operationState.phase == 'Succeeded'
      send: [app-sync-succeeded]
  
  template.app-sync-status-unknown: |
    message: |
      Application {{app.metadata.name}} sync status is Unknown.
      
      Application: {{app.metadata.name}}
      Sync Status: {{app.status.sync.status}}
      Health Status: {{app.status.health.status}}
      Repository: {{app.spec.source.repoURL}}
  
  template.app-sync-failed: |
    message: |
      Application {{app.metadata.name}} sync failed!
      
      Application: {{app.metadata.name}}
      Error: {{app.status.operationState.message}}
      Repository: {{app.spec.source.repoURL}}
      Revision: {{app.spec.source.targetRevision}}
  
  template.app-sync-succeeded: |
    message: |
      Application {{app.metadata.name}} synced successfully!
      
      Application: {{app.metadata.name}}
      Revision: {{app.spec.source.targetRevision}}
      Environment: {{app.metadata.namespace}}
  
  context: |
    - name: slack-token
      string: $SLACK_TOKEN
```
</argocd_config>

# DevOps & Platform Engineering Skills Index

**Version:** 1.0
**Category:** devops

## Overview

DevOps and Platform Engineering skills provide comprehensive guidance on CI/CD, containerization, orchestration, infrastructure as code, and cloud platforms for building and maintaining modern software delivery pipelines.

## Available DevOps Skills

| Skill | Directory | Focus Area |
|-------|-----------|------------|
| **CI/CD Pipeline** | `cicd/cicd_pipeline_skill_v1/` | GitHub Actions, GitLab CI, Jenkins |
| **Docker** | `docker/docker_containerization_skill_v1/` | Containerization, Docker Compose |
| **Kubernetes** | `kubernetes/kubernetes_skill_v1/` | Container orchestration, K8s |
| **Terraform** | `terraform/terraform_iac_skill_v1/` | Infrastructure as Code |
| **AWS Cloud** | `aws/aws_cloud_skill_v1/` | AWS services and architecture |
| **Monitoring** | `monitoring/monitoring_skill_v1/` | Prometheus, Grafana, alerting |

## DevOps Pillars

```
┌─────────────────────────────────────────────────────────┐
│                  DEVOPS & PLATFORM                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│     CI/CD    │   CONTAINERS │  INFRASTRUCT │   CLOUD    │
│              │              │              │            │
│  • Pipeline  │  • Docker    │  • Terraform │  • AWS     │
│  • Build     │  • K8s       │  • IaC       │  • GCP     │
│  • Deploy    │  • Compose   │  • Pulumi    │  • Azure   │
│  • Release   │  • Registry  │  • CloudForm │  • Multi   │
└──────────────┴──────────────┴──────────────┴────────────┘
```

## Usage

```javascript
const { SkillRegistry } = require('./ez-agents/bin/lib/skill-registry');
const registry = new SkillRegistry();
await registry.load();

// Get all DevOps skills
const devopsSkills = registry.findByCategory('devops');

// Get specific skill
const k8sSkill = registry.get('kubernetes_skill_v1');
```

## Related Categories

- **Operational Skills**: `skills/operational/OPERATIONAL-INDEX.md`
- **Observability Skills**: `skills/observability/OBSERVABILITY-INDEX.md`
- **Architecture Skills**: `skills/architecture/ARCHITECTURE-INDEX.md`
- **DevOps Agent**: `agents/ez-devops-agent.md`

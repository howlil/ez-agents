---
name: ez:infrastructure
description: Generate, validate, and estimate cloud infrastructure costs
argument-hint: "[generate|validate|estimate] [--provider aws] [--type all] [--path infrastructure]"
allowed-tools:
  - Bash
  - Read
  - Write
---
<objective>
Manage Infrastructure as Code (IaC) for EZ Agents projects.

Generate Pulumi TypeScript templates, validate security/compliance, and estimate costs.
</objective>

<context>
Infrastructure is stored in `infrastructure/` directory with:
- `Pulumi.yaml` - Project configuration
- `environments/{dev,staging,prod}/` - Environment-specific configs
- `modules/{networking,compute,database}/` - Reusable infrastructure modules
- `shared/` - Shared utilities (tags, helpers)

Validation tools:
- **Checkov** - Security scanning (pip install checkov)
- **cdk-nag** - AWS compliance rules
- **Pulumi preview** - Infrastructure validation

Cost estimation:
- **Infracost** - Accurate cloud pricing (install separately)
- **Fallback estimator** - Uses default pricing when Infracost unavailable
</context>

<commands>

## Generate Infrastructure

```bash
node ez-agents/bin/ez-tools.cjs infrastructure generate --provider aws
```

Creates complete Pulumi TypeScript infrastructure with:
- VPC with public/private subnets
- Auto-scaling group with target tracking (70% CPU)
- Application Load Balancer with HTTPS
- CloudFront CDN distribution
- RDS database with multi-AZ (staging/prod)
- Environment-specific configurations

**Providers:** aws, azure, gcp

## Validate Infrastructure

```bash
# Run all validations
node ez-agents/bin/ez-tools.cjs infrastructure validate --type all

# Run specific validation
node ez-agents/bin/ez-tools.cjs infrastructure validate --type checkov --path infrastructure
node ez-agents/bin/ez-tools.cjs infrastructure validate --type cdk-nag --path infrastructure
node ez-agents/bin/ez-tools.cjs infrastructure validate --type pulumi --path infrastructure
```

**Validation types:**
- `checkov` - Security scanning
- `cdk-nag` - AWS compliance
- `pulumi` - Pulumi preview
- `all` - Run all validations

## Estimate Costs

```bash
# Basic estimation
node ez-agents/bin/ez-tools.cjs infrastructure estimate

# Detailed breakdown
node ez-agents/bin/ez-tools.cjs infrastructure estimate --detailed

# Custom path
node ez-agents/bin/ez-tools.cjs infrastructure estimate --path infrastructure --detailed
```

Returns monthly cost estimates per environment (dev/staging/prod).

</commands>

<verification>
```bash
# Generate infrastructure
node ez-agents/bin/ez-tools.cjs infrastructure generate --provider aws

# Validate
node ez-agents/bin/ez-tools.cjs infrastructure validate --type pulumi

# Estimate costs
node ez-agents/bin/ez-tools.cjs infrastructure estimate --detailed
```
</verification>

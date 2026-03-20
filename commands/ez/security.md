---
name: ez:security
description: Run security operations workflows for user projects
usage: /ez:security <scan|generate|rotate|access|verify> [options]
argument-hint: "<scan|generate|rotate|access|verify> [provider|framework] [--active] [--target <url>] [--output <path>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

<execution_context>
@~/.claude/ez-agents/workflows/execute-plan.md
@ez-agents/bin/lib/security-ops-engine.cjs
</execution_context>

<process>
Execute security operations workflows using the SecurityOpsEngine from security-ops-engine.cjs.
Parse ARGUMENTS for subcommand and options before executing.
</process>

# /ez:security

Run security operations workflows for user projects. Provides automated security scanning, control generation, secret rotation, access management, and security verification.

## Usage

```
/ez:security scan [--target <url>] [--active] [--output <path>]
/ez:security generate [headers|rate-limit|waf|compliance] [provider|framework] [--output <path>]
/ez:security rotate <secret-id> [--provider <aws|generic>]
/ez:security access <role-manifest-path>
/ez:security verify [--file <audit-log-path>]
```

## Subcommands

### scan — Run Security Scan

Executes OWASP ZAP security scan against a target.

```
/ez:security scan --target https://example.com
/ez:security scan --target https://example.com --active
/ez:security scan --target https://example.com --output ./reports/scan.html
```

**Options:**
- `--target <url>` — Target URL to scan (required)
- `--active` — Enable active scanning (destructive, requires explicit opt-in)
- `--output <path>` — Custom output report path

**Default Mode:** Baseline (non-destructive)

**Artifacts:** `.planning/security/scans/zap-report-{timestamp}.html`

---

### generate — Generate Security Controls

Generates security configuration templates.

```
/ez:security generate headers strict
/ez:security generate rate-limit
/ez:security generate waf aws
/ez:security generate compliance gdpr
```

**Sub-options:**
- `headers [strict|default|minimal]` — Security headers profile
- `rate-limit` — Rate limiting policy by route class
- `waf [aws|cloudflare|generic]` — WAF configuration template
- `compliance [gdpr|hipaa|soc2]` — Compliance checklist template

**Artifacts:**
- Headers: Console output or `--output <path>`
- Rate limit: Console output or `--output <path>`
- WAF: `.planning/security/waf/{provider}-waf-config.json`
- Compliance: `.planning/security/evidence/{framework}-checklist.md`

---

### rotate — Rotate Secrets

Rotates secrets using provider-backed automation or manual fallback.

```
/ez:security rotate prod/db/password
/ez:security rotate prod/api-key --provider aws
/ez:security rotate manual-secret --provider generic
```

**Options:**
- `--provider <aws|generic>` — Provider for rotation (default: generic)

**Behavior:**
- **AWS:** Returns `aws secretsmanager rotate-secret` command
- **Generic:** Returns manual rotation steps with human-action checkpoints

**Artifacts:** `.planning/security/rotations/{secret-id}-{timestamp}.json`

---

### access — Manage RBAC

Validates role manifests and generates provisioning plans.

```
/ez:security access .planning/security/access/admin-role.yaml
/ez:security access --manifest <role-name> --permissions read,write --subjects user:alice,user:bob
```

**Options:**
- `--manifest <path>` — Path to role manifest file
- `--permissions <list>` — Comma-separated permissions
- `--subjects <list>` — Comma-separated subjects

**Artifacts:** `.planning/security/access/{role}-provisioning-plan.json`

---

### verify — Verify Security Controls

Verifies audit logs and security control configuration.

```
/ez:security verify
/ez:security verify --file .planning/security/audit.log
/ez:security verify --check headers
/ez:security verify --check rate-limits
```

**Options:**
- `--file <path>` — Audit log file to verify
- `--check <control>` — Specific control to verify

**Artifacts:** `.planning/security/verification/{timestamp}-report.json`

---

## Security Modes

### Baseline Scanning (Default)

- Passive scanning only
- Safe for automated CI/CD
- No active attack simulation
- Recommended for regular use

### Active Scanning (Opt-in)

- Requires `--active` flag
- Simulates real attacks
- May cause disruptions
- Use only in controlled environments

---

## Human Action Checkpoints

Some security operations require manual intervention:

| Operation | When Human Action Required |
|-----------|---------------------------|
| **Active scan** | Always requires explicit `--active` opt-in |
| **Secret rotation (generic)** | Always — manual credential management |
| **WAF deployment (Cloudflare)** | Dashboard configuration required |
| **Compliance evidence** | Legal/compliance review needed |

These checkpoints are clearly marked in command output with `[HUMAN ACTION]` prefix.

---

## Artifacts Location

All security artifacts are written to `.planning/security/`:

```
.planning/security/
├── scans/           # Security scan reports
├── rotations/       # Secret rotation records
├── access/          # RBAC manifests and plans
├── evidence/        # Compliance checklists
├── waf/             # WAF configurations
└── verification/    # Verification reports
```

---

## Integration with Release/Preflight

Security operations integrate with release workflows:

- **Security scan status** → Release checklist item
- **Audit logging verification** → Preflight check
- **Compliance evidence** → Enterprise tier requirement

See:
- `/ez:release preflight <tier>` — Run release checklist
- `/ez:release <tier> <version>` — Create release

---

## Examples

### Full Security Audit Before Release

```bash
# 1. Run baseline security scan
/ez:security scan --target https://staging.example.com

# 2. Generate strict security headers
/ez:security generate headers strict

# 3. Generate WAF config for AWS
/ez:security generate waf aws

# 4. Verify audit logging
/ez:security verify --file .planning/security/audit.log

# 5. Generate compliance checklist
/ez:security generate compliance soc2
```

### Emergency Secret Rotation

```bash
# Rotate compromised secret
/ez:security rotate prod/api-key --provider aws

# Document rotation in audit log
/ez:security verify --check rotation-complete
```

### RBAC Provisioning

```bash
# Create role manifest
cat > .planning/security/access/developer-role.yaml <<EOF
role: developer
permissions:
  - read
  - write
subjects:
  - user:alice
  - user:bob
EOF

# Validate and generate provisioning plan
/ez:security access .planning/security/access/developer-role.yaml
```

---

## Related Commands

- `/ez:release preflight <tier>` — Run release checklist including security items
- `/ez:release <tier> <version>` — Create production release
- `/ez:health` — Check project health status

---

*Command Version: 1.0 | Last Updated: 2026-03-20*

---
name: preflight
description: Run release checklist validation without creating a release. Shows pass/fail for all tier checklist items.
usage: /ez:release preflight <tier>
---

# /ez:release preflight

Run the release checklist for a tier without creating a branch, tag, or changelog. Use this to see what's blocking or passing before you commit to a release.

## Usage

```
/ez:release preflight <tier>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `tier` | Yes | `mvp`, `medium`, or `enterprise` |

## What It Checks

Runs security gates + tier checklist without side effects. Security Operations items include:

- **security_scan** — Baseline security scan completed
- **audit_logging** — Audit logging enabled for security-sensitive actions  
- **compliance_evidence** — Required compliance checklist/evidence files present

```
/ez:release preflight medium

Security Gates (4/4):
  ✓ No secrets in committed files
  ✓ npm audit — no critical vulnerabilities
  ✓ No production TODOs
  ✓ .env files in .gitignore

Medium Checklist (12/18):
  ✓ All @must BDD scenarios passing
  ✗ Test coverage ≥ 80% — Coverage: 71% (need 9% more)
  ✓ npm audit — clean
  ✓ No secrets in committed files
  ✓ Application starts
  ✓ Rollback documented
  ✓ All @should BDD scenarios passing
  ✗ Test coverage ≥ 80% — 71% (need +9%)
  ? Staging environment parity — requires manual verification
  ? Monitoring/alerts configured — requires manual verification
  ✓ No console.log in prod
  ? Performance baseline — requires manual verification
  ...

Production Readiness Score: 74/100 — CONDITIONAL

Blockers: 0
Warnings: 2 (coverage below threshold)
Manual items: 6 (need human verification)

To release: /ez:release medium v1.5.0
```

## When to Use

- Before starting a release to know what you need to fix
- When onboarding to a new tier to understand the gap
- During development to track progress toward release readiness

## Legend

| Symbol | Meaning |
|--------|---------|
| ✓ | Automated check passed |
| ✗ | Automated check failed |
| ? | Requires manual human verification |
| ○ | Skipped (not applicable) |

## Related Commands

- `/ez:release mvp v1.0.0` — Execute the actual release
- `/ez:hotfix` — Emergency fix on released version
- `/ez:standup` — Sprint health check

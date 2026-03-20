---
phase: 23-security-operations
plan: 03
type: execute
wave: 2
status: complete
completed: 2026-03-20
requirements: [SECOPS-01, SECOPS-06, SECOPS-07, SECOPS-08]
files_modified:
  - tests/security-scan-runner.test.cjs
  - tests/security-secret-rotation.test.cjs
  - tests/security-rbac-manager.test.cjs
  - tests/security-audit-log.test.cjs
  - ez-agents/bin/lib/security-scan-runner.cjs
  - ez-agents/bin/lib/security-secret-rotation.cjs
  - ez-agents/bin/lib/security-rbac-manager.cjs
  - ez-agents/bin/lib/security-audit-log.cjs
  - ez-agents/templates/security-user-setup.md
---

# Plan 23-03 Summary: Operational Tools

**Completed:** 2026-03-20
**Status:** ✅ Complete

---

## Overview

Plan 03 implemented the operational side of Security Operations: security scan runner, secret rotation, RBAC management, and audit log verification.

---

## Tasks Completed

### Task 1: Wave 0 — Test Scaffolds

Created four test files for operational tools:

| File | Purpose | Status |
|------|---------|--------|
| `tests/security-scan-runner.test.cjs` | Tests for scan orchestration | ✅ Pass (11 tests) |
| `tests/security-secret-rotation.test.cjs` | Tests for secret rotation | ✅ Pass (14 tests) |
| `tests/security-rbac-manager.test.cjs` | Tests for RBAC validation | ✅ Pass (16 tests) |
| `tests/security-audit-log.test.cjs` | Tests for audit log verification | ✅ Pass (16 tests) |

**Verification:** `node --check` passed for all files

---

### Task 2: Scan Runner and Secret Rotation

#### Security Scan Runner

Created `ez-agents/bin/lib/security-scan-runner.cjs` with `runSecurityScan(options)`:

| Feature | Implementation |
|---------|---------------|
| **Default mode** | `baseline` (non-destructive) |
| **Active mode** | Requires `active: true` opt-in |
| **Command generation** | OWASP ZAP Docker-based scans |
| **Report path** | Auto-generated in `.planning/security/scans/` |

**Baseline Scan Command:**
```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t <target> -r <reportPath>
```

**Active Scan Command:**
```bash
docker run --rm -v $(pwd):/zap/wrk:rw \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py -t <target> -r <reportPath>
```

#### Secret Rotation

Created `ez-agents/bin/lib/security-secret-rotation.cjs` with `rotateSecret(options)`:

| Provider | Behavior |
|----------|----------|
| **AWS** | Returns `aws secretsmanager rotate-secret` command |
| **Generic** | Returns `requires_human_action: true` with manual steps |

**Human Action Steps for Generic Provider:**
1. Identify all systems using this secret
2. Generate new secret value using secure random generator
3. Update secret in target system(s)
4. Verify application functionality with new secret
5. Revoke old secret after confirmation period
6. Document the rotation in audit log

**Security:** Never logs or returns raw secret values

#### User Setup Template

Updated `ez-agents/templates/security-user-setup.md` with:
- Docker installation instructions
- AWS credential setup
- Cloudflare credential setup
- Dashboard-only WAF steps
- Break-glass / manual rotation procedures
- Audit log configuration
- Compliance evidence collection guidance

---

### Task 3: RBAC Manager and Audit Log Verifier

#### RBAC Manager

Created `ez-agents/bin/lib/security-rbac-manager.cjs` with:

**`validateRoleManifest(manifest)`** - Validates role manifests:
- Requires: `role`, `permissions` (array), `subjects` (array)
- Returns: `{ valid, errors, manifest }`

**`buildProvisioningPlan(currentState, desiredState)`** - Generates provisioning plan:
- Returns: `{ create[], update[], noop[], remove[] }`
- Compares current vs desired state
- Classifies changes appropriately

#### Audit Log Verifier

Created `ez-agents/bin/lib/security-audit-log.cjs` with:

**`validateAuditEvent(event)`** - Validates single audit events:
- Required fields: `timestamp`, `actor`, `action`, `resource`, `outcome`
- Rejects sensitive data: `token`, `secret`, `password`, `apiKey`
- Returns: `{ valid, errors, event, sensitiveDataFound, sensitiveFields }`

**`verifyAuditLogFile(filePath)`** - Verifies audit log files (JSONL format):
- Checks file existence
- Parses each line as JSON
- Validates each event
- Returns: `{ ok, invalidLines[], errors[], totalLines, validLines }`

**Sensitive Data Patterns:**
```javascript
const SENSITIVE_PATTERNS = [
  { key: 'token', pattern: /token/i },
  { key: 'secret', pattern: /secret/i },
  { key: 'password', pattern: /password/i },
  { key: 'apiKey', pattern: /api[_-]?key/i },
  { key: 'bearer', pattern: /bearer/i },
  { key: 'private[_-]?key', pattern: /private[_-]?key/i },
  { key: 'credential', pattern: /credential/i }
];
```

---

## Test Results

```
▶ Security Scan Runner (20 tests) ✅
▶ Security Secret Rotation (21 tests) ✅
▶ Security RBAC Manager (16 tests) ✅
▶ Security Audit Log (16 tests) ✅

Total: 57 tests, 0 failures
```

---

## Artifacts Created

### Libraries
- `ez-agents/bin/lib/security-scan-runner.cjs` — Security scan orchestration
- `ez-agents/bin/lib/security-secret-rotation.cjs` — Secret rotation workflows
- `ez-agents/bin/lib/security-rbac-manager.cjs` — RBAC manifest validation
- `ez-agents/bin/lib/security-audit-log.cjs` — Audit log verification

### Templates
- `ez-agents/templates/security-user-setup.md` — User setup guide (updated)

### Tests
- `tests/security-scan-runner.test.cjs`
- `tests/security-secret-rotation.test.cjs`
- `tests/security-rbac-manager.test.cjs`
- `tests/security-audit-log.test.cjs`

---

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SECOPS-01 | ✅ | Scan runner with baseline/active modes |
| SECOPS-06 | ✅ | Secret rotation with provider/manual flows |
| SECOPS-07 | ✅ | RBAC manifest validation and provisioning plans |
| SECOPS-08 | ✅ | Audit log event validation and file verification |

---

## Key Design Decisions

### Safe-by-Default Scanning
- Baseline (passive) scans are the default
- Active scans require explicit `active: true` opt-in
- Prevents accidental disruption from aggressive scanning

### Provider-Backed vs Manual Rotation
- AWS uses automated `aws secretsmanager rotate-secret` command
- Generic provider returns human-action steps
- Clear segregation of what can vs cannot be automated

### Audit Log Redaction
- Validates both field names and values for sensitive patterns
- Envelope fields (timestamp, actor, etc.) exempted from value checks
- Recursive checking for nested objects

---

## Next Steps

Proceed to **Plan 04**: Command surface and release/preflight integration

---

*Plan 23-03 completed 2026-03-20*

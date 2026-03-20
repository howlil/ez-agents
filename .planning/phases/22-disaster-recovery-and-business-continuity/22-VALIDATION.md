---
phase: 22
slug: disaster-recovery-and-business-continuity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js native test runner via `scripts/run-tests.cjs` |
| **Config file** | none |
| **Quick run command** | `node --test tests/recovery-backup.test.cjs tests/recovery-restore.test.cjs tests/recovery-drill.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/recovery-backup.test.cjs tests/recovery-restore.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/ez:verify-work`:** Full suite must be green and at least one restore drill must pass
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01 | 01 | 0 | RECOVER-01 | unit | `node --test tests/recovery-backup.test.cjs` | Wave 0 | ⬜ pending |
| 22-02 | 02 | 0 | RECOVER-02 | unit/integration | `node --test tests/recovery-drill.test.cjs` | Wave 0 | ⬜ pending |
| 22-03 | 03 | 0 | RECOVER-03 | unit | `node --test tests/recovery-migration-rollback.test.cjs` | Wave 0 | ⬜ pending |
| 22-04 | 03 | 1 | RECOVER-04 | unit | `node --test tests/recovery-runbooks.test.cjs` | Wave 0 | ⬜ pending |
| 22-05 | 03 | 1 | RECOVER-05 | unit | `node --test tests/recovery-runbooks.test.cjs` | Wave 0 | ⬜ pending |
| 22-06 | 03 | 1 | RECOVER-06 | unit | `node --test tests/recovery-postmortem.test.cjs` | Wave 0 | ⬜ pending |
| 22-07 | 04 | 1 | RECOVER-07 | unit | `node --test tests/recovery-failover.test.cjs` | Wave 0 | ⬜ pending |
| 22-08 | 04 | 2 | RECOVER-08 | unit/integration | `node --test tests/recovery-chaos.test.cjs` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/recovery-backup.test.cjs` — backup scope, manifest integrity, retention
- [ ] `tests/recovery-restore.test.cjs` — restore into temp workspace without mutating live repo
- [ ] `tests/recovery-drill.test.cjs` — drill evidence, health validation, reporting
- [ ] `tests/recovery-migration-rollback.test.cjs` — rollback template generation for migration targets
- [ ] `tests/recovery-runbooks.test.cjs` — incident runbooks plus RTO/RPO recovery procedures
- [ ] `tests/recovery-postmortem.test.cjs` — postmortem file generation and workflow metadata
- [ ] `tests/recovery-failover.test.cjs` — failover guidance constrained to configured/realistic targets
- [ ] `tests/recovery-chaos.test.cjs` — safe failure injection and cleanup behavior

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scheduled nightly backup artifact is retained in GitHub Actions | RECOVER-01 | Requires live GitHub Actions run history | Trigger `backup-nightly.yml`, confirm uploaded artifact exists and contains backup manifest |
| Monthly restore drill runs from default branch cron | RECOVER-02 | GitHub scheduled workflows only run in real Actions environment | Verify cron-triggered drill creates a drill report artifact and references the latest backup |
| Deployment failover guidance matches the user’s real platform | RECOVER-07 | Repo has placeholder deploy/rollback commands, so infra truth is external | Review generated failover guide against actual deployment target before use in production |
| Chaos drill on deployment rollback path exercises a real recovery seam | RECOVER-08 | Placeholder deployment commands cannot prove live rollback behavior | Run the generated drill against a non-production sandbox and confirm rollback/report output manually |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

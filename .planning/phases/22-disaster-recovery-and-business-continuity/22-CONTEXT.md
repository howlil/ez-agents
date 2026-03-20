# Phase 22: Disaster Recovery & Business Continuity - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 22 delivers repository backup automation, restore verification drills, incident response runbooks, and safe chaos engineering for EZ Agents. This is a repository-hardening phase focused on `.planning/` state recovery, not generic SRE theory or cloud infrastructure failover.

Deliverables:
- BackupService for snapshot creation with manifest.json and SHA-256 checksums
- RecoveryManager for orchestration and CLI wiring
- `/ez:backup` command (create, list, verify)
- Restore drill infrastructure with temp workspace execution
- Incident runbook and post-mortem templates
- Failover guidance constrained to repo's actual deployment state
- Safe chaos drills for local failure injection testing

</domain>

<decisions>
## Implementation Decisions

### Backup Scope & Storage
- Backups include: `.planning/`, `.github/workflows/`, `commands/`, `ez-agents/bin/lib/`, `package.json`, `package-lock.json`
- Backups stored in `.planning/recovery/backups/<backup-id>/` with manifest.json
- Integrity verified via SHA-256 checksums in manifest
- Retention: 10 local backups, 12 drill reports

### Restore Drills & Verification
- Restore drills execute in temp directory — restore to temp workspace, verify there, write only drill report back to `.planning/recovery/drills/`
- Drills run monthly via GitHub Actions cron
- Drill reports contain JSON + human summary: backup_id, restore_path, checks_passed, duration, timestamp
- Health checks use existing health-check.cjs infrastructure

### Incident Response & Runbooks
- Incident runbooks stored in `.planning/recovery/incidents/`
- Runbooks contain template + auto-filled commands: incident_id, immediate actions, evidence paths, rollback links
- Post-mortems generated via command-driven template: `/ez:recovery postmortem`
- RTO/RPO targets: 30 min RTO, 24 hour RPO for .planning state

### Failover & Chaos Engineering
- Failover guidance scoped to templates/patterns for downstream projects — honest about repo's placeholder deploy state
- Chaos drills are local-safe failures: backup corruption check, rollback invocation, missing .planning detection — no infra changes
- Chaos results recorded in `.planning/recovery/chaos/<timestamp>.json`
- Chaos runs local-only for now — safe experimentation without affecting CI/CD pipelines

### Claude's Discretion
All implementation details not specified above are at Claude's discretion. Follow existing repo patterns for:
- Module structure (class-based services in `ez-agents/bin/lib/`)
- Testing style (Node.js native test runner)
- CLI command structure (frontmatter + XML in `commands/ez/`)
- Config schema (top-level `recovery` in `.planning/config.json`)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ez-agents/bin/lib/planning-write.cjs` — safePlanningWriteSync for atomic manifest writes
- `ez-agents/bin/lib/config.cjs` — config loading and mutation patterns
- `ez-agents/bin/lib/logger.cjs` — logging for recovery events
- `ez-agents/bin/lib/health-check.cjs` — baseline health validation for drills
- `ez-agents/bin/lib/git-workflow-engine.cjs` — existing rollback behavior to reuse
- `ez-agents/bin/lib/git-utils.cjs` — git operations for backup metadata
- `ez-agents/bin/lib/safe-exec.cjs` — shell execution for verification

### Established Patterns
- Services are class-based with constructor(cwd, options = {})
- CLI commands use frontmatter: name, description, argument-hint
- Tests use Node.js native test runner (node --test)
- Config lives in `.planning/config.json` with top-level keys
- Recovery artifacts persist under `.planning/recovery/{backups,drills,incidents,postmortems,chaos}/`
- GitHub Actions workflows on default branch for scheduled automation

### Integration Points
- RecoveryManager delegates to BackupService for backup creation
- ez-tools.cjs recovery command with subcommands: backup, list-backups, verify-backup
- Config.cjs needs top-level `recovery` section with backup_scope, retention, RTO/RPO
- GitHub Actions workflows for nightly backup and monthly restore drill

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing repo patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

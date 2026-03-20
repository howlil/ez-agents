# Phase 22: Disaster Recovery & Business Continuity - Research

**Researched:** 2026-03-20
**Domain:** Backup automation, restore drills, rollback hardening, incident response, failover guidance
**Confidence:** HIGH

## Summary

Phase 22 should be planned as a repository-hardening phase, not as generic SRE theory. In this repo, the assets worth recovering are primarily `.planning/` state, release/phase history, generated docs, workflow configuration, and the deployment/rollback entrypoints added in Phases 19-20. There is no real database in the current codebase, and the Phase 19 deployment commands are still placeholders, so the phase should avoid pretending there is cloud infrastructure to fail over today.

The practical implementation shape is: add a recovery orchestration layer in `ez-agents/bin/lib/`, add command entrypoints for backups, restore drills, incident docs, and chaos checks, persist recovery artifacts under `.planning/recovery/`, and add GitHub Actions schedules for automated snapshots and monthly restore drills. Reuse existing primitives instead of inventing new ones: `safePlanningWriteSync` for recovery records, `git-workflow-engine.cjs` rollback behavior for code-level reversions, current `commands/{deploy,health-check,rollback}.cjs` as the deployment recovery seam, and release/hotfix rollback-plan conventions under `.planning/releases/`.

The phase should explicitly separate three scopes: repository recovery for EZ Agents itself, generated guidance/templates for downstream user projects, and future-facing placeholders for infrastructure failover. That separation is necessary to satisfy `RECOVER-03` and `RECOVER-07` honestly without building fake database or multi-region automation that this repository does not currently have.

**Primary recommendation:** Plan Phase 22 as 4 workstreams: backup snapshots, restore verification, rollback/runbook automation, and lightweight chaos/failover guidance.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RECOVER-01 | Automated backup strategy (database, files, configs) | Use scheduled `.planning/` + config + workflow snapshots, manifest files, and CI artifacts; treat DB as template/generator scope, not repo runtime scope |
| RECOVER-02 | Backup verification workflow (test restore monthly) | Add scheduled restore-drill workflow plus local `restore-drill` command and drill records under `.planning/recovery/drills/` |
| RECOVER-03 | Database migration rollback scripts | Implement rollback script templates/registry for downstream project migrations and internal planning-schema rollback hooks where config/state formats change |
| RECOVER-04 | Data recovery procedures with RTO/RPO definitions | Add recovery playbooks with repo-specific RTO/RPO targets for `.planning/`, release state, and deployment metadata |
| RECOVER-05 | Incident response runbook generation | Generate incident runbooks from templates populated with repo commands, workflow links, and recovery checklists |
| RECOVER-06 | Post-mortem template and workflow | Add postmortem template, command, and storage path under `.planning/recovery/postmortems/` |
| RECOVER-07 | Failover configuration (multi-AZ, multi-region) | Scope to guidance/templates for downstream deployments plus repo-level fallback paths; do not claim actual multi-region infra exists here |
| RECOVER-08 | Chaos engineering basics (failure injection testing) | Add safe local drills around backup corruption, health-check failure, rollback invocation, and missing `.planning` artifacts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins (`fs`, `path`, `crypto`, `child_process`) | Node >=16.7 | Snapshot files, manifests, hashing, git/process calls | Already the dominant implementation style in the repo |
| `planning-write.cjs` | existing | Atomic writes for recovery manifests, drill logs, incident docs | Prevents partial recovery metadata writes |
| `config.cjs` | existing | Recovery config loading and defaults | Central place for `.planning/config.json` mutation rules |
| `git-workflow-engine.cjs` + `git-utils.cjs` | existing | Code rollback, release rollback alignment, safety branches | Existing rollback behavior already shipped in Phase 15 |
| `logger.cjs` | existing | Recovery event logging | Existing logging convention for operational modules |
| GitHub Actions workflows | existing | Scheduled backups and restore drills | Already the repo’s automation surface from Phase 20 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `safe-exec.cjs` | existing | Shell out to git/npm/platform commands safely | For backup verification, rollback invocation, and drill execution |
| `health-check.cjs` | existing | Baseline health validation before/after drills | For restore verification and chaos checks |
| `release-validator.cjs` | existing | Existing operational checklist patterns | For release/incident/runbook completeness checks |
| `scripts/run-tests.cjs` | existing | Cross-platform test runner | For phase validation and drill-related tests |
| GitHub workflow artifacts | current GitHub feature | Off-machine copy of recovery snapshots/drill outputs | For scheduled backups without adding new storage dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain directory snapshots + manifest JSON | ZIP/tar backup archives | Archive formats add cross-platform complexity and more restore edge cases |
| GitHub Actions artifacts as first offsite copy | S3/GCS/Azure storage | Better durability but adds credentials and infra scope not present in this repo |
| Template-based DB rollback generators | Building database-specific rollback execution now | The repo has no live DB, so execution logic would be speculative |
| Failover guidance docs | Full multi-region automation | Not credible for a repo that currently ships placeholder deploy/rollback commands |

**Installation:**
```bash
# No new dependency is required for the core recovery layer.
# Use existing npm scripts and GitHub Actions infrastructure.
npm test
```

## Architecture Patterns

### Recommended Project Structure
```text
ez-agents/bin/lib/
├── recovery-manager.cjs        # top-level orchestration
├── backup-service.cjs          # snapshot creation + retention
├── restore-service.cjs         # restore + verification flow
├── migration-rollback.cjs      # rollback templates/registry
├── incident-manager.cjs        # runbook + postmortem generation
└── chaos-runner.cjs            # safe failure-injection drills

commands/ez/
├── backup.md                   # create/list/verify backups
├── restore-drill.md            # execute and record restore drill
├── incident.md                 # generate incident runbook / postmortem
└── chaos.md                    # run safe DR chaos checks

.github/workflows/
├── backup-nightly.yml          # scheduled backup artifact creation
└── restore-drill-monthly.yml   # scheduled restore drill verification

.planning/recovery/
├── backups/                    # backup manifests + copied snapshots
├── drills/                     # restore drill reports
├── incidents/                  # generated runbooks
├── postmortems/                # completed postmortems
└── chaos/                      # chaos drill results

assets/recovery/
├── incident-runbook.md         # template
├── postmortem.md               # template
├── restore-checklist.md        # template
└── failover-guidance.md        # template/generator seed
```

### Pattern 1: Snapshot Manifest, Not Opaque Backup Blob
**What:** Backups should produce a copied snapshot directory plus a manifest JSON with checksums, scope, source commit, and restore instructions.
**When to use:** Every automated backup and every manual pre-migration snapshot.
**Example:**
```javascript
// Source: repo pattern from ez-agents/bin/lib/planning-write.cjs
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { safePlanningWriteSync } = require('./planning-write.cjs');

function writeBackupManifest(baseDir, files) {
  const manifest = {
    backup_id: `backup-${Date.now()}`,
    created_at: new Date().toISOString(),
    commit_sha: process.env.GITHUB_SHA || null,
    files: files.map((filePath) => {
      const content = fs.readFileSync(filePath);
      return {
        path: filePath,
        sha256: crypto.createHash('sha256').update(content).digest('hex'),
        size_bytes: content.length
      };
    })
  };

  safePlanningWriteSync(
    path.join(baseDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}
```

### Pattern 2: Restore Drill Writes Evidence
**What:** Every drill should emit a machine-readable result and a human-readable summary under `.planning/recovery/drills/`.
**When to use:** Monthly scheduled drills and every recovery-related plan wave merge.
**Example:**
```javascript
// Source: repo pattern from session-manager.cjs / verify.cjs backup logging
const { safePlanningWriteSync } = require('./planning-write.cjs');

function recordRestoreDrill(result) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  safePlanningWriteSync(
    `.planning/recovery/drills/${stamp}.json`,
    JSON.stringify(result, null, 2)
  );
}
```

### Pattern 3: Reuse Existing Rollback Seams
**What:** Recovery logic should call existing rollback paths instead of introducing a second rollback model.
**When to use:** Deployment failure drills, release rollback plans, and migration rollback orchestration.
**Example:**
```javascript
// Source: repo pattern from ez-agents/bin/lib/git-workflow-engine.cjs and commands/rollback.cjs
async function rollbackRecoveryTarget(type, identifier, deps) {
  if (type === 'phase') {
    return deps.gitWorkflow.rollbackPhase(identifier);
  }

  if (type === 'deployment') {
    return deps.safeExec('node', ['commands/rollback.cjs', 'production', String(identifier)]);
  }

  throw new Error(`Unsupported rollback target: ${type}`);
}
```

### Pattern 4: Runbook/Postmortem as Generated Templates
**What:** Incident docs should be generated from templates with known commands, escalation steps, and evidence locations.
**When to use:** On incident declaration, drill completion, or release failure.
**Example:**
```markdown
<!-- Source pattern: commands/ez/release.md rollback-plan convention -->
# Incident Runbook: {{incident_id}}

## Immediate Actions
1. Run `node commands/health-check.cjs production`
2. If deploy failure confirmed, run `node commands/rollback.cjs production <target-version>`
3. Preserve `.planning/recovery/` evidence before manual edits

## Evidence
- Latest backup: `.planning/recovery/backups/{{backup_id}}/manifest.json`
- Latest drill: `.planning/recovery/drills/{{drill_id}}.json`
- Rollback plan: `.planning/releases/{{version}}-ROLLBACK-PLAN.md`
```

### Anti-Patterns to Avoid
- **Treating Git history as the only backup:** Git does not cover local uncommitted `.planning/` mutations or runtime-generated recovery evidence.
- **Building DB-specific rollback execution now:** The repo has no live database, so Phase 22 should generate rollback scaffolds and procedure hooks, not fake adapters.
- **Recording “backup succeeded” without restore proof:** `RECOVER-02` requires drill evidence, not just copied files.
- **Equating failover with new cloud infra:** For this repo, failover is mostly guidance and fallback workflow definition until Phase 19 deployments are real.
- **Writing recovery state with raw `fs.writeFileSync`:** Use `safePlanningWriteSync` for metadata and reports.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic recovery metadata writes | Custom tmp/rename logic in each module | `planning-write.cjs` | Already handles lock/temp safety |
| Code rollback | A second rollback engine | `git-workflow-engine.cjs#rollbackPhase()` and existing `commands/rollback.cjs` seam | Keeps rollback behavior consistent |
| Config mutation | Ad hoc JSON rewriting | `config.cjs` | Existing validation/default patterns |
| Recovery evidence storage | Random markdown/json paths | `.planning/recovery/{backups,drills,incidents,postmortems,chaos}` | Predictable structure for users and tests |
| Scheduled automation | Custom scheduler daemon | GitHub Actions cron workflows | Repo already uses Actions and concurrency controls |
| Restore verification logging | Console-only output | persisted drill reports + workflow artifacts | Recovery must leave auditable evidence |

**Key insight:** This repo already has good primitives for safe writes, rollback, release plans, and scheduled automation. Phase 22 should compose those pieces into a recovery system instead of adding a parallel operational framework.

## Common Pitfalls

### Pitfall 1: Backing Up the Wrong Things
**What goes wrong:** Only source files are copied, while `.planning/config.json`, `STATE.md`, sessions, phase docs, and workflow definitions are missed.
**Why it happens:** Teams think “git remote” already covers everything.
**How to avoid:** Define an explicit backup scope: `.planning/**`, `.github/workflows/**`, `commands/**`, `ez-agents/bin/lib/**`, `package.json`, lockfile, and release artifacts.
**Warning signs:** Restore drill can recover code but not planning state or release metadata.

### Pitfall 2: Scheduled Backup But No Off-Machine Copy
**What goes wrong:** A workflow creates a snapshot on the runner and then discards it at job end.
**Why it happens:** Artifact upload is omitted.
**How to avoid:** Every scheduled backup workflow should upload manifests and snapshot directories as artifacts; optionally add user-configured external storage later.
**Warning signs:** Workflow passes, but no artifact exists in Actions history.

### Pitfall 3: Restore Drill Mutates the Real Working Tree
**What goes wrong:** A restore test overwrites live `.planning/` state during verification.
**Why it happens:** The drill restores in-place instead of into a temp workspace.
**How to avoid:** Drill into a temp directory, run health checks there, then write only the drill report back to the real repo.
**Warning signs:** Working tree changes after a “read-only” drill.

### Pitfall 4: Placeholder Deployment Logic Masquerades as Production DR
**What goes wrong:** Phase 22 claims end-to-end recovery for production, but `commands/deploy.cjs`, `commands/health-check.cjs`, and `commands/rollback.cjs` are still placeholders.
**Why it happens:** Planning assumes Phases 19-20 shipped real deployment behavior.
**How to avoid:** Call this out in the plan. Either harden the placeholder seam first or keep Phase 22 scoped to backup/runbook/drill infrastructure plus templates.
**Warning signs:** Recovery demos only exercise console output, not a real failure path.

### Pitfall 5: GitHub Scheduled Workflow Assumptions
**What goes wrong:** Teams expect cron backups to run from feature branches or from workflow files not present on the default branch.
**Why it happens:** GitHub scheduled workflow behavior is easy to misremember.
**How to avoid:** Keep scheduled backup/drill workflows on the default branch and document that requirement in the runbook.
**Warning signs:** Cron workflow never triggers after merge elsewhere.

### Pitfall 6: “Failover” Scope Drift
**What goes wrong:** The plan turns into infrastructure-as-code or cloud architecture work that belongs in Phases 24 or later.
**Why it happens:** `RECOVER-07` sounds broader than this repository’s actual deployment state.
**How to avoid:** Implement failover as configuration guidance, decision records, and validation checklists unless the repo gains real multi-target deployment primitives first.
**Warning signs:** Tasks start introducing Terraform, DNS, or load balancers.

## Code Examples

Verified patterns from the current codebase and official docs:

### Recovery Config Section
```json
{
  "recovery": {
    "enabled": true,
    "backup_scope": [
      ".planning",
      ".github/workflows",
      "commands",
      "ez-agents/bin/lib",
      "package.json",
      "package-lock.json"
    ],
    "retention": {
      "local_backups": 10,
      "drill_reports": 12
    },
    "rto_minutes": {
      "planning_state": 30,
      "release_metadata": 60
    },
    "rpo_minutes": {
      "planning_state": 1440,
      "release_metadata": 1440
    }
  }
}
```

### GitHub Actions Backup Schedule
```yaml
# Source: existing repo workflow style in .github/workflows/cd-staging.yml
name: Backup Nightly

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: node ez-agents/bin/ez-tools.cjs recovery backup
      - uses: actions/upload-artifact@v4
        with:
          name: recovery-backup-${{ github.run_id }}
          path: .planning/recovery/backups/
```

### Restore Drill Flow
```javascript
// Source: repo testing style from scripts/run-tests.cjs and health-check.cjs
async function runRestoreDrill({ restoreService, healthCheck }) {
  const restorePath = await restoreService.restoreLatestToTempDir();
  const result = healthCheck.runAll();

  return {
    restored_to: restorePath,
    status: result.status,
    checks: result.checks,
    completed_at: new Date().toISOString()
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| “Git is our backup” | Scheduled snapshots plus restore drills | Standard operational baseline by 2024-2026 | Recovery credibility now depends on drill evidence |
| Manual rollback notes | Generated rollback plans and automated rollback seams | Already partly adopted in this repo via release/hotfix/CI flows | Phase 22 should consolidate, not replace |
| Backup success = copied files | Backup success = copied files + checksum manifest + restore verification | Current reliability practice | Adds measurable proof |
| Failover as aspirational wiki text | Failover as explicit config guidance/checklists tied to deployment reality | Current platform/SRE practice | Prevents scope fiction |

**Deprecated/outdated:**
- Unverified backup-only procedures: insufficient for `RECOVER-02`
- Repo-global DR claims without real deploy/runtime integration: misleading in this codebase

## Open Questions

1. **Should Phase 22 harden Phase 19 placeholders or remain docs-first?**
   - What we know: `commands/deploy.cjs`, `commands/health-check.cjs`, and `commands/rollback.cjs` are still placeholder scripts.
   - What's unclear: Whether Phase 22 is allowed to deepen those scripts, or must assume Phase 19 is complete.
   - Recommendation: Explicitly include a small compatibility/hardening task if recovery drills need real rollback behavior.

2. **Is `RECOVER-03` scoped to EZ Agents internals or generated downstream projects?**
   - What we know: The repository has no live database or migration runner.
   - What's unclear: Whether the requirement expects actual DB rollback execution here.
   - Recommendation: Plan for migration rollback templates + registry + docs, and note actual DB execution belongs to user projects or later infra phases.

3. **What is the acceptable offsite backup target?**
   - What we know: GitHub Actions artifacts are immediately available without new secrets.
   - What's unclear: Whether artifact retention is sufficient or whether user-provided cloud storage is required now.
   - Recommendation: Start with artifact-backed scheduled backups and design storage adapters for future external targets.

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json`, so validation is treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js native test runner (`node --test`) |
| Config file | none — runner is `scripts/run-tests.cjs` |
| Quick run command | `node --test tests/recovery-backup.test.cjs tests/recovery-restore.test.cjs tests/recovery-drill.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECOVER-01 | Backup command snapshots required repo paths and writes manifest | unit | `node --test tests/recovery-backup.test.cjs` | ❌ Wave 0 |
| RECOVER-02 | Restore drill runs in temp workspace and records drill result | unit/integration | `node --test tests/recovery-drill.test.cjs` | ❌ Wave 0 |
| RECOVER-03 | Migration rollback templates generate valid rollback artifacts per target type | unit | `node --test tests/recovery-migration-rollback.test.cjs` | ❌ Wave 0 |
| RECOVER-04 | Recovery procedure generator emits RTO/RPO values and ordered steps | unit | `node --test tests/recovery-runbooks.test.cjs` | ❌ Wave 0 |
| RECOVER-05 | Incident runbook generation writes expected sections and command references | unit | `node --test tests/recovery-runbooks.test.cjs` | ❌ Wave 0 |
| RECOVER-06 | Postmortem template/workflow writes report into canonical path | unit | `node --test tests/recovery-postmortem.test.cjs` | ❌ Wave 0 |
| RECOVER-07 | Failover guidance generator only emits configured targets and warnings when infra is absent | unit | `node --test tests/recovery-failover.test.cjs` | ❌ Wave 0 |
| RECOVER-08 | Chaos runner injects safe failures without mutating live repo state | unit/integration | `node --test tests/recovery-chaos.test.cjs` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test tests/recovery-backup.test.cjs tests/recovery-restore.test.cjs`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green plus one successful local or CI restore drill before `/ez:verify-work`

### Wave 0 Gaps
- [ ] `tests/recovery-backup.test.cjs` — backup scope, manifests, retention
- [ ] `tests/recovery-restore.test.cjs` — restore into temp workspace
- [ ] `tests/recovery-drill.test.cjs` — drill evidence and verification
- [ ] `tests/recovery-migration-rollback.test.cjs` — rollback template generation
- [ ] `tests/recovery-runbooks.test.cjs` — incident/failover/RTO-RPO docs
- [ ] `tests/recovery-postmortem.test.cjs` — postmortem creation workflow
- [ ] `tests/recovery-chaos.test.cjs` — safe failure injection and cleanup

## Sources

### Primary (HIGH confidence)
- Local repo: `.planning/REQUIREMENTS.md` — Phase 22 requirements and adjacent phase dependencies
- Local repo: `.planning/ROADMAP.md` — milestone state and phase ordering
- Local repo: `.planning/STATE.md` — current project state and decisions
- Local repo: `package.json` — actual test runner scripts and Node support floor
- Local repo: `scripts/run-tests.cjs` — native test-runner orchestration
- Local repo: `ez-agents/bin/lib/planning-write.cjs` — atomic write primitive
- Local repo: `ez-agents/bin/lib/config.cjs` — config mutation pattern and `workflow.nyquist_validation`
- Local repo: `ez-agents/bin/lib/health-check.cjs` — current health validation seam
- Local repo: `ez-agents/bin/lib/git-workflow-engine.cjs` — existing rollback implementation
- Local repo: `.github/workflows/cd-staging.yml` and `.github/workflows/cd-production.yml` — current deployment and rollback workflow seam
- Local repo: `commands/deploy.cjs`, `commands/health-check.cjs`, `commands/rollback.cjs` — current placeholder operational commands
- Local repo: `commands/ez/release.md`, `commands/ez/hotfix.md` — rollback-plan conventions
- Local repo: `tests/verify-health.test.cjs` — timestamped backup behavior already validated elsewhere in repo

### Secondary (MEDIUM confidence)
- GitHub Docs: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule — scheduled workflow behavior
- GitHub Docs: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency — concurrency groups and `cancel-in-progress`
- GitHub Docs: https://docs.github.com/actions/managing-workflow-runs/downloading-workflow-artifacts — artifact retention behavior

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - almost entirely based on existing repo modules and current GitHub Actions usage
- Architecture: HIGH - extension points are concrete and already present in code/workflows
- Pitfalls: HIGH - driven by current placeholder deployment seams, repo backup patterns, and official GitHub workflow behavior

**Research date:** 2026-03-20
**Valid until:** 2026-04-19

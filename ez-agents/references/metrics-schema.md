# Metrics Schema Reference

Schema for `.planning/metrics.json` — the EZ Agents success metrics store.

## Full Schema

```json
{
  "schema_version": "1.0",
  "project": "project-name",
  "updated": "2026-03-19T00:00:00Z",

  "phase_metrics": [
    {
      "phase": 18,
      "phase_name": "session-memory",
      "plans_total": 4,
      "plans_completed": 4,
      "velocity_min": 24,
      "defect_density": 0.12,
      "bdd_pass_rate": 0.84,
      "bdd_must_passing": 8,
      "bdd_must_total": 9,
      "deviation_count": 2,
      "completed_at": "2026-03-19T00:00:00Z"
    }
  ],

  "project_metrics": {
    "requirements_coverage_pct": 78,
    "test_coverage_pct": 74,
    "bdd_scenarios_total": 60,
    "bdd_scenarios_passing": 45,
    "bdd_scenarios_must": 25,
    "bdd_scenarios_must_passing": 24
  },

  "agent_metrics": {
    "total_token_cost_usd": 18.40,
    "avg_cost_per_plan": 0.27,
    "deviation_rate": 0.15,
    "avg_plans_per_phase": 3.2,
    "avg_velocity_min_per_plan": 22
  },

  "business_metrics": {
    "time_to_first_ship_days": 95,
    "hotfixes_deployed": 0,
    "milestones_shipped": 1,
    "current_tier": "medium",
    "phases_total": 29,
    "phases_completed": 18
  }
}
```

## Field Definitions

### phase_metrics[]

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `phase` | int | ez-executor | Phase number |
| `plans_total` | int | ez-executor | Plans in phase |
| `plans_completed` | int | ez-executor | Plans with SUMMARY.md |
| `velocity_min` | int | ez-executor | Minutes from first to last commit in phase |
| `defect_density` | float | ez-executor | Deviations / tasks executed |
| `bdd_pass_rate` | float | ez-verifier | @must scenarios passing / total @must |
| `deviation_count` | int | ez-executor | Auto-fix deviations logged |

### project_metrics

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `requirements_coverage_pct` | int | ez-executor | % of REQUIREMENTS.md checked off |
| `test_coverage_pct` | int | ez-verifier | From coverage tool output |
| `bdd_scenarios_passing` | int | ez-verifier | Scenarios with green status |

### agent_metrics

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `total_token_cost_usd` | float | metrics-tracker | Accumulated from state.record-metric |
| `avg_cost_per_plan` | float | metrics-tracker | total / plans_completed |
| `deviation_rate` | float | metrics-tracker | total_deviations / total_tasks |

### business_metrics

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `time_to_first_ship_days` | int | ez-release-agent | Days from project init to first release |
| `hotfixes_deployed` | int | ez-release-agent | Hotfixes tagged and pushed |
| `current_tier` | string | tier-manager | mvp / medium / enterprise |

## Capture Points

| Metric | When Captured | Who Captures |
|--------|---------------|--------------|
| velocity_min | After SUMMARY.md created | ez-executor (state record-metric) |
| deviation_count | During execution | ez-executor (per deviation Rule 1-3) |
| defect_density | After plan completes | ez-executor (computed) |
| bdd_pass_rate | After VERIFICATION.md | ez-verifier (metrics record-bdd) |
| test_coverage_pct | After verification | ez-verifier (from coverage tool) |
| requirements_coverage_pct | After mark-complete | ez-executor (computed from REQUIREMENTS.md) |
| total_token_cost_usd | Ongoing | ez-executor (from state.record-metric cost field) |
| hotfixes_deployed | After hotfix tag | ez-release-agent |

## Dashboard Output

```
/ez:stats  →  enhanced dashboard

PROGRESS:  Phase 18/29 (62%) | Requirements 78% | BDD 80%
VELOCITY:  22 min/plan avg | Trend: ↑ IMPROVING
QUALITY:   Coverage 74% | Defect density 0.12 | Deviation 15%
COSTS:     $18.40 total | $0.27/plan | Est. remaining: ~$3.00
RELEASE:   Tier: Medium | Hotfixes: 0 | Blockers: 0
```

---
name: ez:cost
description: Cost tracking dashboard for token usage and budget management
argument-hint: "[--milestone <N>] [--phase <N>] [--budget <amount>]"
---

# EZ ► Cost

Cost tracking dashboard for token usage and budget management. Shows cumulative costs, breakdowns by phase/provider, and budget status.

## Usage

```bash
# View cost dashboard
node ez-agents/bin/ez-tools.cjs cost

# View costs for specific milestone
node ez-agents/bin/ez-tools.cjs cost --milestone 1

# View costs for specific phase
node ez-agents/bin/ez-tools.cjs cost --phase 29

# Set budget ceiling
node ez-agents/bin/ez-tools.cjs cost --budget 100

# JSON output for scripting
node ez-agents/bin/ez-tools.cjs cost --json
```

## Output

### Dashboard View

```
EZ Agents Cost Dashboard
════════════════════════

Total Cost: $12.45 (1,234,567 tokens)
Budget: $50.00 (24.9% used, $37.55 remaining)
⚠️  Warning: 80% budget threshold approaching

By Milestone:
  v1.0  $8.20   (820,000 tokens)
  v2.0  $4.25   (414,567 tokens)

By Phase (v2.0):
  Phase 22  $0.85   (85,000 tokens)
  Phase 23  $1.20   (120,000 tokens)
  Phase 29  $2.20   (209,567 tokens)

By Provider:
  claude    $8.50   (65%)
  qwen      $2.95   (23%)
  kimi      $1.00   (8%)
  openai    $0.00   (0%)

Last Updated: 2026-03-20T10:30:00.000Z
```

### Budget Alerts

| Threshold | Action |
|-----------|--------|
| 80% | ⚠️ Warning displayed |
| 100% | 🛑 Auto-pause (configurable) |

## Cost Calculation

Costs calculated based on provider rates:

| Provider | Input (per 1K) | Output (per 1K) |
|----------|----------------|-----------------|
| Claude 3 | $0.003 | $0.015 |
| GPT-4 | $0.03 | $0.06 |
| GPT-4 Turbo | $0.01 | $0.03 |
| Qwen Turbo | $0.002 | $0.006 |
| Kimi | $0.002 | $0.006 |

Rates loaded from `.planning/config.json` if customized.

## Configuration

Budget and rate configuration in `.planning/config.json`:

```json
{
  "cost_tracking": {
    "enabled": true,
    "budget": 50.00,
    "warning_threshold": 80,
    "auto_pause": true,
    "rates": {
      "claude-3": { "input": 0.003, "output": 0.015 }
    }
  }
}
```

## Token Tracking

Token usage tracked automatically for:
- All AI model invocations
- Per-task execution
- Per-phase totals
- Per-milestone aggregation

Data stored in `.planning/metrics.json`.

## Export

Use `--json` flag for export:

```bash
node ez-agents/bin/ez-tools.cjs cost --json > cost-report.json
```

## Related Commands

- `/ez:doctor` — System health check
- `/ez:recover` — Crash recovery operations

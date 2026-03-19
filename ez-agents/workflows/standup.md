<purpose>
Generate a sprint standup report. Analyzes recent SUMMARY.md files, STATE.md decisions/blockers, and phase progress to produce yesterday/today/blockers/velocity/health score.
</purpose>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" init progress)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse optional phase from $ARGUMENTS.

## 2. Gather Data

```bash
STATE=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" state-snapshot)
ROADMAP=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" roadmap analyze)
PROGRESS_BAR=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" progress bar --raw)
```

Find 3-5 most recent SUMMARY.md files (last 2 sessions worth of work).

## 3. Calculate Sprint Health

Score 0-100 based on:
- Plans completed vs planned (velocity): 30pts
- Active blockers (0=30pts, 1=15pts, 2+=0pts): 30pts
- Requirements coverage from ROADMAP: 20pts
- Deviation rate from STATE.md: 20pts

## 4. Generate Standup Report

```
## Daily Standup — {date}

### Yesterday
{recent SUMMARY.md one-liners}

### Today (Planned)
{next phase/plans from ROADMAP}

### Blockers
{from STATE.md blockers[] or "None"}

### Velocity Trend
{calculated from plan completion rate}

Sprint Health: {score}/100 — {status}
{one-line recommendation}
```

Status thresholds: 80-100=HEALTHY, 60-79=SOME FRICTION, 40-59=STRUGGLING, <40=AT RISK.

</process>

<success_criteria>
- [ ] Recent work summarized
- [ ] Next steps identified
- [ ] Blockers surfaced
- [ ] Sprint health score calculated
</success_criteria>

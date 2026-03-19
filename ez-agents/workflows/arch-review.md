<purpose>
Run a Tech Lead architecture review on phase plans. Reads phase PLAN.md files and checks for pattern drift, technical debt, security issues, and design conflicts.
</purpose>

<process>

## 1. Initialize

Parse $ARGUMENTS for phase number.

```bash
INIT=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" init plan-phase "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract: `phase_dir`, `phase_number`, `phase_name`, `planner_model`.

## 2. Validate

Check phase directory and plans exist. If no PLAN.md found: error "No plans found for phase {N}. Run /ez:plan-phase first."

## 3. Spawn Tech Lead Review

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EZ ► ARCH REVIEW — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
Task(
  prompt="Review architecture of Phase {phase_number}: {phase_name}.
  Read all PLAN.md files in {phase_dir}.
  Check: pattern consistency, technical debt, security, cross-phase conflicts, dependencies.
  Report: BLOCKERS (must fix), WARNINGS (should fix), ADVISORY (consider).
  Output: ## Tech Lead Review: Phase {N} — {status}",
  subagent_type="ez-tech-lead-agent",
  model="{planner_model}"
)
```

## 4. Present Results

Display agent output directly. If BLOCKER found: highlight "Fix before /ez:execute-phase". If APPROVE: confirm safe to execute.

</process>

<success_criteria>
- [ ] Phase validated
- [ ] Tech lead agent spawned
- [ ] Findings presented with severity
- [ ] Clear go/no-go for execution
</success_criteria>

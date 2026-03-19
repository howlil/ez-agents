<purpose>
Orchestrate BDD requirements gathering for a phase. Spawns ez-requirements-agent to interview user, produce .feature files, validate INVEST, and create acceptance criteria documents.
</purpose>

<process>

## 1. Initialize

```bash
INIT=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" init plan-phase "${PHASE}" 2>/dev/null || echo '{}')
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase_number`, `phase_name`, `phase_dir`, `padded_phase`, `phase_slug`, `context_path`, `requirements_path`, `state_path`, `roadmap_path`.

**If `.planning/` missing:** Error — run `/ez:new-project` first.

## 2. Parse Arguments

Extract from $ARGUMENTS:
- Phase number (integer or decimal like `3.1`)
- `--auto` flag — skip interactive interview, derive from context

**If no phase number:** Detect next unplanned phase from roadmap.

## 3. Check Phase Exists

```bash
PHASE_INFO=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" roadmap get-phase "${PHASE}")
```

**If not found:** Error — phase does not exist in ROADMAP.md.

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EZ ► GATHERING REQUIREMENTS — Phase {X}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 4. Check Existing .feature Files

```bash
ls specs/features/ 2>/dev/null
find specs/features/ -name "*.feature" 2>/dev/null | wc -l
```

**If .feature files exist for this phase:**

Check `.planning/phases/{phase_dir}/{phase_num}-ACCEPTANCE-CRITERIA.md`.

If exists, ask:
1. "Regenerate — replace existing requirements" → Clear old files, re-gather
2. "Extend — add more scenarios" → Append mode
3. "View existing" → Display ACCEPTANCE-CRITERIA.md and exit

**If no .feature files:** Proceed to step 5.

## 5. Spawn ez-requirements-agent

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
◆ Spawning requirements agent...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Requirements prompt:

```markdown
<objective>
Gather BDD requirements for Phase {phase_number}: {phase_name}.
Mode: {interactive | auto}
</objective>

<files_to_read>
- {state_path} (Project State)
- {roadmap_path} (Roadmap — phase goal and requirements)
- {requirements_path} (Existing requirements)
- {context_path} (USER DECISIONS from /ez:discuss-phase, if exists)
</files_to_read>

<phase_info>
Phase: {phase_number}
Name: {phase_name}
Goal: {goal from ROADMAP}
Phase directory: {phase_dir}
Padded phase: {padded_phase}
</phase_info>

<mode>
{If --auto:}
AUTO MODE: Do NOT ask the user questions. Derive all requirements from:
1. ROADMAP.md phase goal and description
2. CONTEXT.md locked decisions (if exists)
3. Existing REQUIREMENTS.md entries for this phase

{If interactive:}
INTERACTIVE MODE: Conduct a focused interview with the user.
- Group questions into batches of 3-4 at a time
- Confirm understanding after each batch before proceeding
- Focus on observable behavior, not implementation
</mode>

<project_instructions>
Read ./CLAUDE.md if exists — follow project-specific guidelines.
Check .claude/skills/ or .agents/skills/ — apply skill rules to requirements scope.
</project_instructions>
```

```
Task(
  prompt=requirements_prompt,
  subagent_type="ez-requirements-agent",
  model="{planner_model from init}"
)
```

## 6. Handle Agent Return

**`## REQUIREMENTS GATHERED`:**

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EZ ► REQUIREMENTS COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{agent summary}
```

Continue to step 7.

**`## REQUIREMENTS BLOCKED`:**

Display blocker details. Offer:
1. "Provide more context about the phase goal"
2. "Use --auto mode to derive from existing context"
3. "Skip requirements for this phase"

## 7. Validate BDD Output

```bash
# Check .feature files were created
FEATURE_COUNT=$(find specs/features/ -name "*.feature" 2>/dev/null | wc -l)

# Validate structure
node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" bdd validate specs/features/ 2>/dev/null || true

# Check ACCEPTANCE-CRITERIA.md exists
ls .planning/phases/${PHASE_DIR}/*-ACCEPTANCE-CRITERIA.md 2>/dev/null
```

Report findings:
```
Validation:
  ✓ {N} .feature file(s) created
  ✓ INVEST: {score}/6 dimensions pass
  ✓ MoSCoW: {must} must / {should} should / {could} could / {wont} wont
  ✓ ACCEPTANCE-CRITERIA.md created
```

If INVEST score < 5, warn: "User stories may need refinement before planning — run `/ez:gather-requirements {phase}` again."

## 8. Present Final Status

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EZ ► PHASE {X} REQUIREMENTS ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {X}: {Name}**
Feature files: {N}
Scenarios: {M} total ({must} @must / {should} @should / {could} @could)
INVEST: {score}/6

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Plan Phase {X}** — create implementation plans cross-checked against BDD specs

/ez:plan-phase {X}

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat specs/features/{domain}/*.feature — review scenarios
- cat .planning/phases/{phase-dir}/{phase}-ACCEPTANCE-CRITERIA.md — review acceptance criteria
- /ez:discuss-phase {X} — capture design decisions first (if not done)
```

</process>

<success_criteria>
- [ ] Phase validated against roadmap
- [ ] Existing .feature files checked
- [ ] ez-requirements-agent spawned with correct mode and file paths
- [ ] .feature files created in specs/features/
- [ ] Every scenario has MoSCoW + tier tags
- [ ] INVEST validation run
- [ ] ACCEPTANCE-CRITERIA.md exists in phase directory
- [ ] REQUIREMENTS-BDD.md updated
- [ ] User sees summary with scenario counts and next steps
</success_criteria>

# Workflow: resume-session

**Purpose:** Resume work from a previous session with full context restoration

**Related Commands:** `/ez:resume`

---

## Workflow Steps

### 1. Load and Validate Session

```
SessionManager mgr = new SessionManager();
Session session = sessionId ? mgr.loadSession(sessionId) : mgr.getLastSession();

if (!session) {
  output("No previous sessions found. Start a new session with your work.");
  exit;
}

logger.info('Resuming session', { sessionId: session.metadata.session_id });
```

### 2. Compare with Current State

```
Load current STATE.md
Extract current phase, plan, incomplete tasks from STATE.md

sessionPhase = session.state.current_phase
sessionPlan = session.state.current_plan
statePhase = STATE.md.current_phase
statePlan = STATE.md.current_plan

needsReconciliation = (sessionPhase !== statePhase) || (sessionPlan !== statePlan)
```

### 3. If Reconciliation Needed

**Display Warning:**
```
⚠️ Session state differs from current project state

Session shows:
- Phase: {session.state.current_phase}
- Plan: {session.state.current_plan}

Current STATE.md shows:
- Phase: {state.current_phase}
- Plan: {state.current_plan}
```

**Offer Options:**
```
How would you like to reconcile?

1. Use session state (overwrite STATE.md)
2. Use current state (ignore session state)
3. Manual review (show both, let user decide)
```

**Handle Choice:**
- "1": Update STATE.md with session.state values
- "2": Keep STATE.md unchanged, use session context only
- "3": Show side-by-side comparison, let user edit

### 4. Load Context

```
// Load recent transcript for context
transcript = session.context.transcript
if (Array.isArray(transcript)) {
  recentMessages = transcript.slice(-20) // Last 20 messages
}

// Load tasks
completedTasks = session.context.tasks.filter(t => t.status === 'completed')
incompleteTasks = session.state.incomplete_tasks

// Load decisions
decisions = session.context.decisions

// Load file changes
fileChanges = session.context.file_changes
```

### 5. Update STATE.md

```
ez-tools state record-session \
  --stopped-at "{session.state.last_action}" \
  --resume-file "{session.metadata.session_id}"

// Update phase/plan if using session state
if (useSessionState) {
  ez-tools state update "Current Phase" "{session.metadata.phase}"
  ez-tools state update "Current Plan" "{session.metadata.plan}"
}
```

### 6. Prepare for Continuation

```
// Identify incomplete work
incompleteTasks = session.state.incomplete_tasks || []

// Identify next action
nextAction = session.state.next_recommended_action

// Load relevant files
if (session.metadata.phase && session.metadata.plan) {
  planFile = `.planning/phases/${session.metadata.phase}/.../${session.metadata.plan}-PLAN.md`
  summaryFile = `.planning/phases/${session.metadata.phase}/.../${session.metadata.plan}-PLAN-SUMMARY.md`
  
  if (fileExists(planFile)) {
    loadFile(planFile)
  }
}

// Load incomplete task files
for (task of incompleteTasks) {
  if (task.file) {
    loadFile(task.file)
  }
}
```

### 7. Output Resumption Confirmation

```
╔══════════════════════════════════════════════════════════════╗
║  SESSION RESUMED                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Session: {session.metadata.session_id}                       ║
║  Phase: {session.metadata.phase}                              ║
║  Plan: {session.metadata.plan}                                ║
║  Next action: {session.state.next_recommended_action}         ║
╚══════════════════════════════════════════════════════════════╝

Context loaded:
- {incompleteTasks.length} incomplete tasks
- {decisions.length} decisions recorded
- {fileChanges.length} file changes

Ready to continue. What would you like to do?

1. Continue with recommended action
2. Review incomplete tasks
3. View session transcript
4. Something else
```

---

## Error Handling

### Session Not Found
```
if (!session) {
  output(`Session not found: ${sessionId}`);
  output("Use /ez:list-sessions to see available sessions.");
  exit;
}
```

### Corrupted Session File
```
try {
  session = JSON.parse(content);
} catch (err) {
  logger.error('Corrupted session file', { sessionId, error: err.message });
  output(`Error: Session file is corrupted: ${sessionId}`);
  output("Consider deleting the file or contacting support.");
  exit;
}
```

### Broken Chain Links
```
if (session.metadata.session_chain) {
  for (chainId of session.metadata.session_chain) {
    if (!mgr.loadSession(chainId)) {
      warnings.push(`Missing linked session: ${chainId}`);
    }
  }
  
  if (warnings.length > 0) {
    output("⚠️ Session chain has broken links:");
    for (warning of warnings) {
      output(`  - ${warning}`);
    }
  }
}
```

---

## State Transitions

**Before:** Session ended, STATE.md shows stopped state

**After:** Session resumed, STATE.md updated with:
- `Last session`: Current timestamp
- `Resume file`: Session ID
- `Stopped at`: Last action from session

---

## Related Files

- `ez-agents/bin/lib/session-manager.cjs` - Session loading
- `ez-agents/bin/lib/session-chain.cjs` - Chain navigation
- `ez-agents/bin/lib/state.cjs` - STATE.md updates
- `.planning/sessions/` - Session storage directory

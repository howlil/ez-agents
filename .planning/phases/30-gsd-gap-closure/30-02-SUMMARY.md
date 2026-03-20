---
phase: 30-gsd-gap-closure
plan: 02
subsystem: crash-recovery
tags: [crash-recovery, pid-lock, orphan-detection, heartbeat, file-lock]
dependency_graph:
  requires:
    - ez-agents/bin/lib/logger.cjs
    - tests/crash-recovery.test.cjs
  provides:
    - ez-agents/bin/lib/crash-recovery.cjs
  affects:
    - ez-agents/bin/ez-tools.cjs
tech_stack:
  added: []
  patterns:
    - PID-stamped JSON lock files in .planning/locks/ for concurrent operation gates
    - setInterval heartbeat with unref() so process can exit naturally
    - process.kill(pid, 0) for cross-platform live process detection (ESRCH/EPERM handling)
    - slugifyOperation() sanitizes operation names to prevent Windows path-separator issues
    - process.on('exit') cleanup handler with symmetric process.off() on release()
key_files:
  created:
    - ez-agents/bin/lib/crash-recovery.cjs
  modified: []
key_decisions:
  - "Lock files stored in .planning/locks/<slug>.lock.json — separate from .planning/ planning files to avoid conflicts with proper-lockfile"
  - "intervalId.unref() is mandatory — without it Node.js hangs waiting for the 10s heartbeat interval"
  - "isOrphan() has dual detection: dead PID (process.kill signal 0) AND stale heartbeat (>60s) — handles cases where PID was reused by OS"
  - "release() removes the process exit handler to prevent memory leaks across long-lived processes"
  - "Constructor is lazy — locksDir is not created until acquire() is called (matches plan spec)"
patterns_established:
  - "CrashRecovery pattern: acquire() + setInterval heartbeat + release() as symmetric pair"
  - "isProcessAlive() helper: try/catch around process.kill(pid,0), ESRCH=dead, EPERM=alive-no-permission"
requirements_completed: [GSD-01, GSD-04]
duration: 5min
completed: 2026-03-20
---

# Phase 30 Plan 02: CrashRecovery Implementation Summary

**PID-stamped lock file library with 10s heartbeat, process.kill(0) orphan detection, and Windows-safe operation slugification — all 5 crash-recovery tests pass GREEN.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T16:31:46Z
- **Completed:** 2026-03-20T16:36:46Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `ez-agents/bin/lib/crash-recovery.cjs` created with full `CrashRecovery` class
- All 5 tests in `tests/crash-recovery.test.cjs` pass GREEN (0 failures)
- Heartbeat interval uses `unref()` so Node.js process exits cleanly
- Cross-platform orphan detection via `process.kill(pid, 0)` with ESRCH/EPERM handling
- Operation name slugification prevents Windows path-separator issues

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement CrashRecovery class** - `b67f107` (feat) — bundled in 30-03 commit

## Files Created/Modified

- `ez-agents/bin/lib/crash-recovery.cjs` — CrashRecovery class with acquire/isOrphan/release/listOrphans

## Decisions Made

1. **intervalId.unref() is mandatory** — without it, the 10-second heartbeat interval prevents Node.js from exiting naturally; every caller would need explicit release() to avoid hanging.
2. **Dual orphan detection** — process.kill(0) alone is insufficient on long-running systems where dead PIDs can be recycled by the OS. Stale heartbeat (>60s) provides a second gate.
3. **Lazy directory creation** — locksDir is only created on acquire(), not in the constructor. This matches the plan spec and avoids creating directories for processes that never acquire locks.
4. **process.off() in release()** — The exit handler is deregistered on release() to prevent memory leaks and duplicate cleanup calls in long-running CLI processes.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `crash-recovery.cjs` is complete and tested; ready to be wired into `ez-tools.cjs` lock command in Plan 04
- Plan 03 (cost-tracker.cjs) was already implemented; Plan 04 can proceed immediately

---
*Phase: 30-gsd-gap-closure*
*Completed: 2026-03-20*

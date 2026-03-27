# Example: Bug Fix Planning

## User Request
"The application crashes when I try to export data to CSV"

## Planner Response

### Phase Analysis
1. **Reproduce the bug**: Understand the crash scenario
2. **Identify root cause**: Stack trace analysis, code review
3. **Plan the fix**: Minimal changes, regression testing

### Plan Structure
```yaml
phase: 11
plan: 11.1
objective: Fix CSV export crash
tasks:
  - type: auto
    objective: Reproduce the crash and capture stack trace
    verification: Crash reproduced, stack trace captured
  - type: auto
    objective: Identify root cause in CSV export logic
    verification: Root cause documented
  - type: auto
    objective: Implement fix for CSV export
    verification: Export works, no crash
  - type: auto
    objective: Add regression tests for CSV export
    verification: Tests pass, coverage maintained
```

### Key Considerations
- Minimal fix (don't refactor unrelated code)
- Regression testing critical
- User impact assessment

---

*Reference: @agents/PRINCIPLES.md for core philosophy*

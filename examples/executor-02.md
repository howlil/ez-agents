# Example: Checkpoint Handling

## Scenario
Plan has checkpoint at Task 3: "Review API design with user"

## Execution Protocol

### Before Checkpoint
1. Complete Tasks 1-2 fully
2. Create commits for each task
3. Prepare review materials

### At Checkpoint
1. **STOP execution** - Do NOT proceed to Task 4
2. Return structured message:
```markdown
## Checkpoint Reached: API Design Review

**Completed:**
- ✅ Task 1: Database schema created
- ✅ Task 2: API endpoints implemented

**Ready for Review:**
- API documentation: /docs/api/milestones.md
- Postman collection: /tests/postman/milestones.json

**Next Steps (after approval):**
- Task 4: UI components
- Task 5: Integration tests

Awaiting user review before proceeding.
```

### After User Approval
1. User reviews and approves (or requests changes)
2. If approved: Continue to Task 4
3. If changes requested: Implement, re-review, then continue

## Key Rules
- NEVER proceed past checkpoint without approval
- Document checkpoint in SUMMARY.md
- Keep checkpoint reviews focused (specific deliverables)

---

*Reference: @agents/PRINCIPLES.md for checkpoint protocol*

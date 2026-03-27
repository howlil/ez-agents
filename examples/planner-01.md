# Example: Feature Planning Request

## User Request
"I want to add a new feature to track project milestones"

## Planner Response

### Phase Analysis
1. **Understand the feature**: Milestone tracking for project progress
2. **Identify scope**: Database schema, UI components, API endpoints
3. **Break down tasks**: Backend, frontend, testing

### Plan Structure
```yaml
phase: 10
plan: 10.1
objective: Implement milestone tracking feature
tasks:
  - type: auto
    objective: Create database schema for milestones
    verification: Schema migration passes, tests pass
  - type: auto
    objective: Implement milestone API endpoints
    verification: API tests pass, Swagger docs updated
  - type: checkpoint:review
    objective: Review API design with user
    verification: User approval
  - type: auto
    objective: Create UI components for milestone display
    verification: UI renders correctly, responsive
```

### Key Considerations
- Database migration strategy
- API versioning
- UI responsiveness
- Testing coverage

---

*Reference: @agents/PRINCIPLES.md for core philosophy*

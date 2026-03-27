# Example: Code Refactoring Request

## User Request
"Refactor the authentication module to use JWT tokens"

## Planner Response

### Phase Analysis
1. **Understand current state**: Review existing auth implementation
2. **Define target state**: JWT-based authentication
3. **Plan migration**: Backward-compatible transition

### Plan Structure
```yaml
phase: 12
plan: 12.1
objective: Migrate authentication to JWT tokens
tasks:
  - type: auto
    objective: Review current authentication implementation
    verification: Documentation of current flow
  - type: auto
    objective: Design JWT token structure and validation
    verification: Design document approved
  - type: auto
    objective: Implement JWT token generation
    verification: Tokens generated correctly, tests pass
  - type: auto
    objective: Implement JWT token validation middleware
    verification: Protected routes work, tests pass
  - type: checkpoint:review
    objective: Review JWT implementation with user
    verification: User approval
  - type: auto
    objective: Migrate existing sessions to JWT
    verification: All users can authenticate
```

### Key Considerations
- Backward compatibility during migration
- Token expiration strategy
- Security best practices
- Rollback plan if issues arise

---

*Reference: @agents/PRINCIPLES.md for core philosophy*

# Example: Task Execution - Feature Implementation

## Plan Context
Phase 10.1: Implement milestone tracking feature

## Execution Steps

### Task 1: Database Schema
```bash
# Create migration file
npx prisma migrate dev --name add_milestones

# Verify migration
npx prisma migrate status
```

### Task 2: API Endpoints
```typescript
// Implement milestone routes
POST /api/milestones
GET /api/milestones
PUT /api/milestones/:id
DELETE /api/milestones/:id
```

### Task 3: Testing
```bash
# Run API tests
npm test -- api/milestones.test.ts

# Verify coverage
npm run coverage
```

## Checkpoint
Before proceeding to UI implementation, user reviews API design.

## Summary
- Database schema created
- API endpoints implemented
- Tests passing (95% coverage)
- Ready for UI phase

---

*Reference: @agents/PRINCIPLES.md for execution principles*

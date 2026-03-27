# Example: UAT Creation

## Feature: Milestone Tracking

### User Acceptance Tests

**Test 1: Create Milestone**
```
Given I am on the project dashboard
When I click "Add Milestone"
And I fill in the milestone details
And I click "Save"
Then I should see the milestone in the timeline
And I should receive a confirmation message
```

**Test 2: Update Milestone**
```
Given I have an existing milestone
When I edit the milestone details
And I click "Save"
Then I should see the updated details
And the change should be reflected in the timeline
```

**Test 3: Delete Milestone**
```
Given I have an existing milestone
When I click "Delete Milestone"
And I confirm the deletion
Then the milestone should be removed
And I should see a confirmation message
```

**Test 4: Milestone Progress**
```
Given I have a milestone with tasks
When I complete a task
Then the milestone progress bar should update
And show the percentage complete
```

## Acceptance Criteria
- [ ] All UAT tests pass
- [ ] UI is responsive on mobile
- [ ] Error messages are user-friendly
- [ ] Loading states are handled gracefully

---

*Reference: @agents/PRINCIPLES.md for verification standards*

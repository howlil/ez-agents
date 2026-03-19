# BDD Feature File Template

Use this template when creating `.feature` files for a phase.

Replace `{placeholders}` with actual content.

---

```gherkin
# specs/features/{domain}/{feature-name}.feature
#
# Feature: {feature-name}
# Phase: {phase-number} — {phase-name}
# MoSCoW: @must | @should | @could | @wont
# Tier: @mvp | @medium | @enterprise
#
# Requirements: {REQ-IDs this feature satisfies}

Feature: {Feature Name}
  As a {user role}
  I want to {action/capability}
  So that {benefit/value delivered}

  # Background sets up shared preconditions for all scenarios in this Feature.
  # Remove if no shared setup needed.
  Background:
    Given {shared precondition 1}
    And {shared precondition 2}

  # ─────────────────────────────────────────────
  # MUST — Required for MVP (phase gate)
  # ─────────────────────────────────────────────

  @must @mvp
  Scenario: {Happy path — primary success case}
    Given {initial context / system state}
    When {user performs action}
    Then {expected outcome}
    And {additional assertion}

  @must @mvp
  Scenario: {Primary error case}
    Given {initial context}
    When {user performs invalid action}
    Then {expected error response}
    And {system remains in valid state}

  # ─────────────────────────────────────────────
  # SHOULD — Target for medium tier release
  # ─────────────────────────────────────────────

  @should @medium
  Scenario: {Secondary success case or edge case}
    Given {context}
    When {action}
    Then {outcome}

  @should @medium
  Scenario: {Error recovery or retry flow}
    Given {context where partial failure occurred}
    When {user attempts recovery}
    Then {system handles gracefully}

  # ─────────────────────────────────────────────
  # COULD — Nice-to-have for enterprise tier
  # ─────────────────────────────────────────────

  @could @enterprise
  Scenario: {Advanced or compliance feature}
    Given {enterprise context}
    When {action}
    Then {enterprise-specific outcome}

  # ─────────────────────────────────────────────
  # WONT — Explicitly deferred (document reasons)
  # ─────────────────────────────────────────────
  # @wont — SSO integration: deferred to Phase XX, depends on identity provider decision
  # @wont — Biometric auth: deferred — mobile-only feature, out of scope for web
```

---

## Scenario Writing Guide

### Given (Precondition)
Sets up the world before the action. Should be:
- Specific: "Given a user exists with email test@example.com" not "Given a user exists"
- Minimal: Only include context relevant to this scenario
- Reusable: Use Background for context shared by all scenarios

```gherkin
# Good
Given a registered user with email "alice@example.com" exists
And the user's account is in "active" status

# Bad (too vague)
Given there is a user
```

### When (Action)
The single event being tested. Rules:
- One action per scenario (split if multiple)
- Active voice: "When I submit the form" not "When the form is submitted"
- From user's perspective

```gherkin
# Good
When I submit the login form with email "alice@example.com" and password "secret123"

# Bad (multiple actions)
When I fill in the form and click submit and wait for response
```

### Then (Outcome)
Observable, verifiable result. Must be:
- Testable: Can be automated
- Specific: Exact values, not "something happens"
- From user's perspective

```gherkin
# Good
Then I am redirected to "/dashboard"
And the page title contains "Welcome, Alice"
And a session cookie named "ez_session" is present

# Bad (subjective)
Then it works correctly
And the user is happy
```

### And / But
- `And` — continues the clause type (Given+And, When+And, Then+And)
- `But` — negative assertion ("But I should not see...")

---

## MoSCoW Quick Reference

| Tag | When to Use | Tier |
|-----|-------------|------|
| `@must` | System is broken/unusable without it | `@mvp` |
| `@should` | Important but workaround exists | `@medium` |
| `@could` | Enhances experience but not critical | `@enterprise` |
| `@wont` | Explicitly out of scope (document why) | — |

---

## File Naming Convention

```
specs/
  features/
    {domain}/
      {feature-name}.feature    # e.g., auth/login.feature
      {feature-name}.feature    # e.g., auth/registration.feature
    {domain2}/
      {feature-name}.feature
```

Domain examples: `auth`, `payments`, `dashboard`, `onboarding`, `settings`, `api`

---

## INVEST Checklist

Before finalizing a Feature, verify all scenarios as a group:

- [ ] **Independent**: Feature can be developed without dependency on other features in this file
- [ ] **Negotiable**: Implementation details (not described in Then) are flexible
- [ ] **Valuable**: The Feature statement explains clear user value
- [ ] **Estimable**: A developer can estimate effort from these scenarios
- [ ] **Small**: All @must scenarios fit in one phase (split if more than ~8 must scenarios)
- [ ] **Testable**: Every Then clause can be automated

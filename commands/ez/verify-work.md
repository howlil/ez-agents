---
name: ez:verify-work
description: Run quality gates (design, ux, product, docs, security, compliance, a11y, performance) before milestone completion
argument-hint: "[--design] [--ux] [--product] [--docs] [--security] [--compliance] [--a11y] [--performance] [--all] [--output <dir>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - TodoWrite
---
<objective>
Execute quality gate checks before milestone completion. Run automated audits for design quality, UX, product value, documentation, security, compliance, accessibility, and performance. Generate verification reports with actionable findings.

**Default:** Run all applicable quality gates
**Output:** `.planning/verification/` directory with individual reports
**Follow-up:** Creates fix tickets for critical/high severity findings
</objective>

<execution_context>
@skills/operational/security-audit/security_audit_v1/SKILL.md
@skills/governance/compliance-checker/compliance_checker_v1/SKILL.md (if exists)
@skills/operational/performance-optimization/performance_optimization_v1/SKILL.md (if exists)
@~/.claude/ez-agents/workflows/verify-work.md
</execution_context>

<context>
**Flags:**
- `--design` — Run design review (AI slop detection, consistency)
- `--ux` — Run UX audit (usability, accessibility, user flows)
- `--product` — Run product review (value, prioritization, metrics)
- `--docs` — Run documentation audit (completeness, accuracy)
- `--security` — Run security audit only
- `--compliance` — Run compliance check only (GDPR, HIPAA, PCI-DSS)
- `--a11y` — Run accessibility audit only (WCAG)
- `--performance` — Run performance optimization only
- `--all` — Run all quality gates (default if no flag specified)
- `--output <dir>` — Custom output directory (default: `.planning/verification/`)

**Quality Gate Selection:**
- **Design:** Run if phase has frontend/UI work (auto-detected)
- **UX:** Run if phase has user-facing features (auto-detected)
- **Product:** Run if phase has new features (auto-detected)
- **Docs:** Run if phase has user-facing changes (auto-detected)
- **Security:** Always run if handling user data, auth, payments
- **Compliance:** Run if GDPR, HIPAA, PCI-DSS, SOC2 applicable
- **Accessibility:** Run if public-facing web application
- **Performance:** Run if user-facing application with performance requirements

**Smart Orchestration:**
- Detects project type from PROJECT.md
- Skips inapplicable gates automatically
- Creates tickets for critical/high findings
- Blocks milestone completion if critical issues found
</context>

<process>
## Step 1: Initialize Verification
1. Parse command arguments
2. Determine which quality gates to run
3. Create output directory: `.planning/verification/`
4. Load PROJECT.md for context
5. Check project type and compliance requirements

## Step 2: Run Design Review (if --design or --all)

**If phase has frontend/UI work:** Spawn ez-design-expert.

```bash
# Check if phase has frontend indicators
PHASE_SECTION=$(node "$HOME/.claude/ez-agents/bin/ez-tools.cjs" roadmap get-phase "${PHASE_NUMBER}" 2>/dev/null)
echo "$PHASE_SECTION" | grep -iE "UI|interface|frontend|component|layout|page|screen|view|form|dashboard|widget" > /dev/null 2>&1
HAS_UI=$?
```

**If `HAS_UI` is 0 (frontend found):**

```
Task(
  prompt="Review UI design quality for phase {phase_number}.
Phase directory: {phase_dir}
Check: design token consistency, AI slop patterns, visual hierarchy.
Report: PASS/PASS_WITH_WARNINGS/FAIL with specific fixes.
Output: DESIGN-REVIEW.md",
  subagent_type="ez-design-expert",
  model="balanced"
)
```

**Output:** `.planning/verification/DESIGN-REVIEW.md`

**Verdict Thresholds:**
- **PASS:** No issues, ready for milestone
- **PASS_WITH_WARNINGS:** Minor issues, document and continue
- **FAIL:** Critical AI slop or consistency issues → fix before milestone

---

## Step 3: Run UX Audit (if --ux or --all)

**If phase has user-facing features:** Spawn ez-ux-expert.

```
Task(
  prompt="Review UX quality for phase {phase_number}.
Phase directory: {phase_dir}
Check: user flows, accessibility (WCAG AA), interaction design, usability heuristics.
Report: PASS/PASS_WITH_WARNINGS/FAIL with specific fixes.
Output: UX-REVIEW.md",
  subagent_type="ez-ux-expert",
  model="balanced"
)
```

**Output:** `.planning/verification/UX-REVIEW.md`

**Verdict Thresholds:**
- **PASS:** No usability issues, WCAG AA compliant
- **PASS_WITH_WARNINGS:** Minor usability issues, document and continue
- **FAIL:** Critical usability blockers or accessibility violations

---

## Step 4: Run Product Review (if --product or --all)

**If phase has new features:** Spawn ez-product-engineer.

```
Task(
  prompt="Review product value for phase {phase_number}.
Phase directory: {phase_dir}
Check: problem validation, user stories (INVEST), success metrics, prioritization.
Report: PASS/PASS_WITH_WARNINGS/FAIL with specific recommendations.
Output: PRODUCT-REVIEW.md",
  subagent_type="ez-product-engineer",
  model="balanced"
)
```

**Output:** `.planning/verification/PRODUCT-REVIEW.md`

**Verdict Thresholds:**
- **PASS:** Clear value, metrics defined, priorities aligned
- **PASS_WITH_WARNINGS:** Minor product concerns, document and continue
- **FAIL:** Solving wrong problem, missing core functionality, no success metrics

---

## Step 5: Run Documentation Audit (if --docs or --all)

**If phase has user-facing changes:** Spawn ez-technical-writer.

```
Task(
  prompt="Review documentation quality for phase {phase_number}.
Phase directory: {phase_dir}
Check: user docs, API docs, README, changelog, error messages, onboarding.
Report: PASS/PASS_WITH_WARNINGS/FAIL with specific content recommendations.
Output: DOCS-REVIEW.md",
  subagent_type="ez-technical-writer",
  model="balanced"
)
```

**Output:** `.planning/verification/DOCS-REVIEW.md`

**Verdict Thresholds:**
- **PASS:** All docs complete and accurate
- **PASS_WITH_WARNINGS:** Minor documentation gaps, document and continue
- **FAIL:** Missing essential docs, misleading information, breaking changes not documented

---

## Step 6: Run Security Audit (if --security or --all)
**Skill:** `security_audit_v1`

**Checks:**
```bash
# Dependency scan
npm audit --audit-level=high || yarn audit || pip audit

# Static analysis
npx semgrep --config auto || sonar-scanner

# Secret detection
npx gitleaks detect || trufflehog git file://.

# OWASP checks
Review: authentication, authorization, input validation
```

**Output:** `.planning/verification/SECURITY_AUDIT.md`

**Severity Thresholds:**
- **Critical:** Block release, fix within 24 hours
- **High:** Fix within 7 days, document workaround
- **Medium:** Fix within 30 days, track in backlog
- **Low:** Fix within 90 days, best practice

## Step 7: Run Compliance Check (if --compliance or --all)
**Skill:** `compliance_checker_v1` (if exists, else manual checklist)

**Checks:**
- **GDPR:** PII handling, consent, data retention
- **HIPAA:** PHI protection (if healthcare)
- **PCI-DSS:** Payment card data (if payments)
- **SOC2:** Security controls (if enterprise)

**Output:** `.planning/verification/COMPLIANCE_CHECK.md`

## Step 8: Run Accessibility Audit (if --a11y or --all)
**Checks:**
```bash
# Automated a11y scanning
npx axe-core || lighthouse --only-categories=accessibility

# Manual checks
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus indicators
```

**Output:** `.planning/verification/ACCESSIBILITY_AUDIT.md`

**WCAG Level Target:** AA (minimum for public apps)

## Step 9: Run Performance Check (if --performance or --all)
**Skill:** `performance_optimization_v1` (if exists, else manual checklist)

**Checks:**
```bash
# Performance metrics
npx lighthouse --only-categories=performance

# Bundle analysis
npm run build -- --stats
npx webpack-bundle-analyzer

# Core Web Vitals
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
```

**Output:** `.planning/verification/PERFORMANCE_REPORT.md`

## Step 6: Aggregate Findings
1. Collect all audit reports
2. Categorize by severity
3. Calculate overall quality score
4. Determine if milestone can proceed

## Step 7: Create Fix Tickets
For each critical/high finding:
```markdown
## Ticket Template
**Title:** [SECURITY] {vulnerability_name}
**Severity:** {critical|high|medium|low}
**Source:** {audit_report.md}
**Description:** {vulnerability_description}
**Impact:** {security_impact}
**Remediation:** {fix_steps}
**SLA:** {fix_deadline}
**Labels:** security, bug, priority-{level}
```

## Step 8: Generate Summary Report
Create `.planning/verification/VERIFICATION_SUMMARY.md`:

```markdown
# Verification Summary

**Date:** {date}
**Milestone:** {milestone_name}
**Quality Gates Run:** {list}

## Overall Status: {PASS|CONDITIONAL_PASS|FAIL}

### Summary by Category
| Category | Status | Critical | High | Medium | Low |
|----------|--------|----------|------|--------|-----|
| Security | {status} | {count} | {count} | {count} | {count} |
| Compliance | {status} | {count} | {count} | {count} | {count} |
| Accessibility | {status} | {count} | {count} | {count} | {count} |
| Performance | {status} | {count} | {count} | {count} | {count} |

## Blockers (Must Fix Before Release)
{list_critical_findings}

## Next Steps
1. Fix critical issues (ETA: {date})
2. Re-run verification
3. Proceed to audit-milestone
```

## Step 9: Decision Gate
**IF** critical findings exist:
- **Status:** FAIL
- **Action:** Block milestone completion
- **Notify:** Engineering team, security team

**ELSE IF** high findings exist:
- **Status:** CONDITIONAL_PASS
- **Action:** Create tickets, document workarounds
- **Notify:** Engineering lead

**ELSE:**
- **Status:** PASS
- **Action:** Proceed to audit-milestone
- **Notify:** Project manager
</process>

<output_files>
**Generated Files:**
- `.planning/verification/SECURITY_AUDIT.md` (if --security)
- `.planning/verification/COMPLIANCE_CHECK.md` (if --compliance)
- `.planning/verification/ACCESSIBILITY_AUDIT.md` (if --a11y)
- `.planning/verification/PERFORMANCE_REPORT.md` (if --performance)
- `.planning/verification/VERIFICATION_SUMMARY.md` (always)

**Tickets Created:**
- GitHub Issues / Jira tickets for each critical/high finding
- Linked to respective audit reports
- Labeled by severity and category
</output_files>

<quality_thresholds>
## Pass/Fail Criteria

### Security Gate
- **PASS:** 0 critical, 0 high findings
- **CONDITIONAL_PASS:** 0 critical, <=3 high findings (with workarounds)
- **FAIL:** Any critical finding OR >3 high findings

### Compliance Gate
- **PASS:** All required controls implemented
- **CONDITIONAL_PASS:** Minor gaps with remediation plan
- **FAIL:** Major compliance violation

### Accessibility Gate
- **PASS:** WCAG AA compliant, 0 critical issues
- **CONDITIONAL_PASS:** WCAG A compliant, AA gaps documented
- **FAIL:** Below WCAG A OR critical a11y blockers

### Performance Gate
- **PASS:** Lighthouse >=90, Core Web Vitals pass
- **CONDITIONAL_PASS:** Lighthouse >=70, optimization plan exists
- **FAIL:** Lighthouse <70 OR Core Web Vitals fail
</quality_thresholds>

<integration_points>
## Command Integration

### Called By:
- `audit-milestone.md` — Before milestone sign-off
- `complete-milestone.md` — As final quality check
- Manual invocation — On-demand verification

### Calls:
- Security audit tools (npm audit, semgrep, gitleaks)
- Accessibility tools (axe-core, lighthouse)
- Performance tools (lighthouse, webpack-bundle-analyzer)

### Creates Tickets For:
- `plan-phase.md` — If fix requires planning
- `execute-phase.md` — If fix requires implementation phase
</integration_points>

<examples>
## Usage Examples

### Run all quality gates
```bash
npx ez-agents verify-work --all
```

### Run security audit only
```bash
npx ez-agents verify-work --security
```

### Run security + compliance
```bash
npx ez-agents verify-work --security --compliance
```

### Custom output directory
```bash
npx ez-agents verify-work --all --output .planning/qa/
```

### CI/CD integration
```yaml
# .github/workflows/verify.yml
- name: Run verification
  run: npx ez-agents verify-work --all
  if: github.event_name == 'pull_request'
```
</examples>

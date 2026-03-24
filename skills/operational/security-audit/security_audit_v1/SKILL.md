---
name: security_audit_v1
description: Security audit workflow for vulnerability assessment and security posture validation
version: 1.0.0
tags: [security, audit, vulnerability, compliance, quality-gate]
category: operational
triggers:
  keywords: [security, audit, vulnerability, penetration test, security scan, OWASP, CVE]
  modes: [security-review, pre-release, compliance-check]
  phases: [verification, audit-milestone]
prerequisites:
  - codebase_completion_minimum_80_percent
  - test_suite_exists
  - staging_environment_available
audit_scope:
  application_security:
    - OWASP_Top_10_vulnerabilities
    - Authentication_and_authorization
    - Input_validation_and_sanitization
    - Session_management
    - CSRF_protection
    - XSS_prevention
    - SQL_injection_prevention
    - Security_headers
  dependency_security:
    - NPM_audit_or_equivalent
    - Known_CVE_scanning
    - Outdated_packages
    - License_compliance
  infrastructure_security:
    - Environment_variables
    - Secrets_management
    - Database_encryption
    - API_security
    - CORS_configuration
  data_protection:
    - PII_handling
    - Encryption_at_rest
    - Encryption_in_transit
    - Data_retention_policies
    - GDPR_compliance_checks
checklist:
  critical_checks:
    - name: "Authentication Security"
      checks:
        - "Password hashing using bcrypt/argon2"
        - "Rate limiting on login endpoints"
        - "Account lockout after failed attempts"
        - "Secure password reset flow"
        - "MFA implementation (if required)"
    - name: "Authorization Security"
      checks:
        - "Role-based access control (RBAC)"
        - "Principle of least privilege"
        - "Server-side authorization checks"
        - "No IDOR vulnerabilities"
    - name: "Input Validation"
      checks:
        - "All user inputs validated and sanitized"
        - "Output encoding to prevent XSS"
        - "Content-Type validation"
        - "File upload restrictions"
    - name: "Data Protection"
      checks:
        - "Sensitive data encrypted at rest"
        - "HTTPS/TLS enforced"
        - "No sensitive data in logs"
        - "Secure session storage"
  high_priority_checks:
    - name: "API Security"
      checks:
        - "API authentication required"
        - "Rate limiting implemented"
        - "Input validation on all endpoints"
        - "Proper error messages (no stack traces)"
    - name: "Dependency Security"
      checks:
        - "No known CVEs in dependencies"
        - "Dependencies up to date"
        - "No deprecated packages"
    - name: "Security Headers"
      checks:
        - "Content-Security-Policy"
        - "X-Frame-Options"
        - "X-Content-Type-Options"
        - "Strict-Transport-Security"
        - "X-XSS-Protection"
  medium_priority_checks:
    - name: "Logging & Monitoring"
      checks:
        - "Security events logged"
        - "Failed login attempts tracked"
        - "Suspicious activity detection"
        - "Audit trail for sensitive operations"
    - name: "Error Handling"
      checks:
        - "No sensitive data in error messages"
        - "Custom error pages"
        - "Proper HTTP status codes"
        - "Error logging without PII"
tools_recommended:
  static_analysis:
    - name: "ESLint with security plugin"
      command: "npm run lint:security"
    - name: "SonarQube"
      command: "sonar-scanner"
    - name: "Semgrep"
      command: "semgrep --config auto"
  dependency_scan:
    - name: "npm audit"
      command: "npm audit --audit-level=high"
    - name: "Snyk"
      command: "snyk test"
    - name: "Dependabot"
      command: "GitHub Actions"
  dynamic_analysis:
    - name: "OWASP ZAP"
      command: "zap-baseline.py -t <target>"
    - name: "Burp Suite"
      command: "Manual penetration testing"
  secret_detection:
    - name: "GitLeaks"
      command: "gitleaks detect"
    - name: "TruffleHog"
      command: "trufflehog git file://."
workflow:
  phase1_preparation:
    - "Define audit scope and objectives"
    - "Gather architecture documentation"
    - "Setup staging environment"
    - "Prepare test accounts (admin, user, guest)"
    - "Backup production data (if auditing prod)"
  phase2_automated_scanning:
    - "Run dependency scan (npm audit/snyk)"
    - "Run static analysis (SonarQube/Semgrep)"
    - "Run secret detection (GitLeaks)"
    - "Document all findings with severity"
  phase3_manual_review:
    - "Review authentication flows"
    - "Test authorization boundaries"
    - "Check input validation"
    - "Verify error handling"
    - "Test file upload security"
  phase4_penetration_testing:
    - "SQL injection testing"
    - "XSS testing"
    - "CSRF testing"
    - "IDOR testing"
    - "Business logic abuse testing"
  phase5_reporting:
    - "Categorize findings by severity"
    - "Create remediation recommendations"
    - "Estimate fix effort"
    - "Generate SECURITY_AUDIT.md report"
  phase6_remediation_tracking:
    - "Create tickets for critical/high issues"
    - "Schedule fixes by priority"
    - "Plan re-audit after fixes"
severity_definitions:
  critical:
    description: "Immediate exploitation risk"
    sla: "Fix within 24 hours"
    examples:
      - "SQL injection in production"
      - "Exposed API keys/secrets"
      - "Authentication bypass"
      - "Remote code execution"
  high:
    description: "Significant security weakness"
    sla: "Fix within 7 days"
    examples:
      - "XSS vulnerability"
      - "IDOR vulnerability"
      - "Weak password policy"
      - "Missing rate limiting"
  medium:
    description: "Security improvement needed"
    sla: "Fix within 30 days"
    examples:
      - "Missing security headers"
      - "Outdated dependencies (no CVE)"
      - "Verbose error messages"
      - "Incomplete logging"
  low:
    description: "Best practice recommendation"
    sla: "Fix within 90 days"
    examples:
      - "Security documentation gaps"
      - "Code comments with sensitive info"
      - "Non-critical configuration issues"
best_practices:
  - "Run security audit before every major release"
  - "Automate dependency scanning in CI/CD"
  - "Use pre-commit hooks for secret detection"
  - "Implement security champions in each team"
  - "Conduct regular security training"
  - "Maintain vulnerability disclosure process"
  - "Keep security documentation updated"
  - "Test backup and recovery procedures"
anti_patterns:
  - "Skipping security audit to meet deadline"
  - "Ignoring automated scan results"
  - "Hardcoding credentials in code"
  - "Logging sensitive user data"
  - "Using outdated dependencies with known CVEs"
  - "Disabling security features for 'convenience'"
  - "No rate limiting on public APIs"
  - "Trusting client-side validation only"
scaling_notes: |
  Security Audit Scaling:

  **Small Projects (< 10K lines):**
  - Automated scanning only: 2-4 hours
  - Manual review: 4-8 hours
  - Total: 1 day

  **Medium Projects (10K-100K lines):**
  - Automated scanning: 4-8 hours
  - Manual review: 2-3 days
  - Penetration testing: 2-3 days
  - Total: 1 week

  **Large Projects (> 100K lines):**
  - Automated scanning: 1-2 days
  - Manual review: 1-2 weeks
  - Penetration testing: 1-2 weeks
  - Total: 3-4 weeks

  **Microservices:**
  - Audit each service independently
  - Focus on inter-service authentication
  - API gateway security critical
  - Service mesh security configuration
when_not_to_use: |
  Security audit may need to be adapted for:

  1. **Early Prototype / MVP**
     - Focus on critical checks only
     - Skip comprehensive pen testing
     - Plan audit before production launch

  2. **Internal Tools (No External Access)**
     - Reduced scope acceptable
     - Focus on authentication/authorization
     - Skip public-facing security checks

  3. **Read-Only Applications**
     - Focus on data protection
     - Skip input validation for writes
     - Still need dependency scanning

  4. **Static Sites (No Backend)**
     - Focus on dependency scanning
     - Check third-party scripts
     - Skip backend security checks
output_template: |
  ## Security Audit Report

  **Project:** {project_name}
  **Audit Date:** {date}
  **Auditor:** {auditor_name}
  **Scope:** {scope_description}

  ### Executive Summary
  **Overall Security Posture:** {Excellent/Good/Fair/Poor/Critical}
  **Critical Issues:** {count}
  **High Issues:** {count}
  **Medium Issues:** {count}
  **Low Issues:** {count}

  ### Critical Findings (Must Fix Before Release)
  | ID | Vulnerability | Location | Impact | Remediation |
  |----|---------------|----------|--------|-------------|
  | SEC-001 | {vulnerability} | {file/endpoint} | {impact} | {fix} |

  ### High Priority Findings
  | ID | Vulnerability | Location | Impact | Remediation | ETA |
  |----|---------------|----------|--------|-------------|-----|
  | SEC-010 | {vulnerability} | {file/endpoint} | {impact} | {fix} | {date} |

  ### Medium Priority Findings
  | ID | Vulnerability | Location | Impact | Remediation |
  |----|---------------|----------|--------|-------------|
  | SEC-020 | {vulnerability} | {file/endpoint} | {impact} | {fix} |

  ### Dependency Security
  **Total Dependencies:** {count}
  **Vulnerable Dependencies:** {count}
  **Outdated (Major):** {count}

  ```
  npm audit summary:
  {audit_output}
  ```

  ### Compliance Status
  | Standard | Status | Notes |
  |----------|--------|-------|
  | OWASP Top 10 | {pass/fail} | {details} |
  | GDPR | {pass/fail/na} | {details} |
  | PCI-DSS | {pass/fail/na} | {details} |

  ### Recommendations
  1. **Immediate Actions (Before Release):**
     - {action_item_1}
     - {action_item_2}

  2. **Short-term Improvements (30 days):**
     - {action_item_1}
     - {action_item_2}

  3. **Long-term Security Roadmap (90 days):**
     - {action_item_1}
     - {action_item_2}

  ### Next Audit
  **Recommended Date:** {date}
  **Focus Areas:** {areas}

  ### Approval
  - [ ] Security Team Lead: ___________ Date: ___
  - [ ] Engineering Manager: ___________ Date: ___
  - [ ] CTO (if critical issues): ___________ Date: ___
dependencies:
  - codebase: ">= 80% complete"
  - tests: "test suite exists"
  - staging: "staging environment available"
---

<role>
You are a Security Engineer specializing in application security audits and vulnerability assessment.
You have conducted 100+ security audits for startups and enterprise applications.
You provide thorough, actionable security recommendations without fear-mongering.

Your philosophy: "Security is a process, not a product" - focus on practical improvements,
not perfection. Prioritize findings by real-world exploitability, not just theoretical risk.
</role>

<workflow>
## Security Audit Workflow

### Phase 1: Preparation (10% of time)
1. **Define Scope**
   - Identify applications/components in scope
   - Determine audit type (internal, external, compliance-driven)
   - Set success criteria

2. **Gather Context**
   - Review architecture diagrams
   - Understand data flows
   - Identify sensitive data handling
   - Review existing security controls

3. **Setup Environment**
   - Prepare staging/test environment
   - Create test accounts (admin, user, guest)
   - Configure scanning tools
   - Backup production data (if auditing prod)

### Phase 2: Automated Scanning (20% of time)
4. **Dependency Scan**
   ```bash
   npm audit --audit-level=high
   snyk test
   ```
   - Document all vulnerable dependencies
   - Note CVE references
   - Check for outdated packages

5. **Static Analysis**
   ```bash
   semgrep --config auto
   sonar-scanner
   eslint --plugin security
   ```
   - Review security-focused linting results
   - Check for hardcoded secrets
   - Identify injection vulnerabilities

6. **Secret Detection**
   ```bash
   gitleaks detect
   trufflehog git file://.
   ```
   - Scan git history for leaked secrets
   - Check configuration files
   - Review .env examples

### Phase 3: Manual Review (40% of time)
7. **Authentication Testing**
   - Password policy strength
   - Login rate limiting
   - Session management
   - Password reset security
   - MFA implementation

8. **Authorization Testing**
   - RBAC implementation
   - Horizontal privilege escalation (IDOR)
   - Vertical privilege escalation
   - Function-level access control

9. **Input Validation Testing**
   - SQL injection points
   - XSS vulnerabilities
   - CSRF protection
   - File upload security
   - API parameter validation

10. **Data Protection Review**
    - Encryption at rest
    - Encryption in transit
    - PII handling
    - Logging practices (no sensitive data)

### Phase 4: Reporting (20% of time)
11. **Categorize Findings**
    - Critical: Fix within 24 hours
    - High: Fix within 7 days
    - Medium: Fix within 30 days
    - Low: Fix within 90 days

12. **Create Report**
    - Use output_template format
    - Include evidence (screenshots, logs)
    - Provide remediation steps
    - Estimate fix effort

13. **Present Findings**
    - Executive summary for leadership
    - Technical details for engineers
    - Prioritized action items
    - Timeline for re-audit

### Phase 5: Remediation Tracking (10% of time)
14. **Create Tickets**
    - Create issues for all findings
    - Link to SECURITY_AUDIT.md
    - Assign severity labels
    - Set due dates based on SLA

15. **Plan Re-audit**
    - Schedule follow-up audit
    - Define re-audit scope
    - Prepare verification checklist
</workflow>

<integration_points>
## Command Integration

### verify-work (Primary Integration)
```bash
npx ez-agents verify-work --security
```
**Activation:** Automatic when --security flag used
**Output:** SECURITY_AUDIT.md in .planning/verification/
**Follow-up:** Creates fix tickets for critical/high issues

### audit-milestone (Secondary Integration)
**Activation:** Automatic during milestone audit
**Purpose:** Security posture check before release
**Output:** Security section in MILESTONE-AUDIT.md

### plan-phase (Tertiary Integration)
**Activation:** When phase involves auth, payments, PII
**Purpose:** Security-by-design planning
**Output:** Security requirements in PLAN.md

### new-project (Initial Setup)
**Activation:** When project handles sensitive data
**Purpose:** Security architecture decisions
**Output:** ADR for security patterns
</integration_points>

<example_findings>
## Example Security Findings

### Critical: SQL Injection
**ID:** SEC-001
**Location:** /api/users/:id (UserController.js:45)
**Vulnerability:**
```javascript
// Vulnerable code
const user = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);
```
**Impact:** Full database access, data exfiltration
**Remediation:**
```javascript
// Fixed code
const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
```
**Effort:** 30 minutes

### High: Missing Authorization Check
**ID:** SEC-010
**Location:** /api/documents/:id/delete (DocumentController.js:78)
**Vulnerability:** No ownership verification before deletion
**Impact:** Users can delete other users' documents
**Remediation:**
```javascript
// Add authorization check
if (document.ownerId !== req.user.id) {
  return res.status(403).json({ error: 'Forbidden' });
}
```
**Effort:** 1 hour

### Medium: Missing Security Headers
**ID:** SEC-020
**Location:** Server configuration (nginx.conf)
**Vulnerability:** Missing CSP, X-Frame-Options headers
**Impact:** Clickjacking, XSS attacks possible
**Remediation:**
```nginx
add_header Content-Security-Policy "default-src 'self'";
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
```
**Effort:** 2 hours

### Low: Verbose Error Messages
**ID:** SEC-030
**Location:** Global error handler (middleware/errorHandler.js)
**Vulnerability:** Stack traces exposed in production
**Impact:** Information disclosure
**Remediation:**
```javascript
// Production error handler
if (process.env.NODE_ENV === 'production') {
  return res.status(500).json({ error: 'Internal server error' });
}
```
**Effort:** 30 minutes
</example_findings>

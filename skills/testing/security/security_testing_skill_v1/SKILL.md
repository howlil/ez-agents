---
name: security_testing_skill_v1
description: Security testing with SAST, DAST, penetration testing, vulnerability scanning, and security automation for application security
version: 1.0.0
tags: [security-testing, sast, dast, penetration-testing, vulnerability-scanning, appsec]
stack: testing/security
category: testing
triggers:
  keywords: [security testing, sast, dast, penetration test, vulnerability scan, owasp, appsec]
  filePatterns: [*.security.test.ts, security/*.yaml, sast/*.config]
  commands: [snyk, trufflehog, semgrep, owasp-zap, nmap]
  stack: testing/security
  projectArchetypes: [all]
  modes: [greenfield, audit, compliance]
prerequisites:
  - security_fundamentals
  - testing_basics
  - networking_basics
recommended_structure:
  directories:
    - tests/security/
    - tests/security/sast/
    - tests/security/dast/
    - security/scanners/
workflow:
  setup:
    - Choose security testing tools
    - Configure scanning rules
    - Set up CI/CD integration
    - Define security baseline
  implement:
    - Run SAST scans
    - Run DAST scans
    - Perform penetration testing
    - Fix vulnerabilities
  maintain:
    - Schedule regular scans
    - Monitor new vulnerabilities
    - Track remediation
    - Update security rules
best_practices:
  - Integrate security in CI/CD
  - Run SAST on every commit
  - Run DAST before deployment
  - Perform regular penetration testing
  - Fix critical vulnerabilities immediately
  - Track security debt
  - Document security decisions
  - Train team on security
  - Use dependency scanning
  - Implement security gates
anti_patterns:
  - Never skip security testing
  - Don't ignore critical vulnerabilities
  - Avoid testing only in production
  - Don't skip dependency scanning
  - Never store secrets in code
  - Don't ignore false positives review
  - Avoid one-time testing
  - Don't skip security training
  - Never skip compliance requirements
  - Don't forget about incident response
scaling_notes: |
  For security testing at scale:

  **Automation:**
  - Integrate in CI/CD pipeline
  - Automate vulnerability scanning
  - Use security as code
  - Implement security gates

  **Management:**
  - Centralize vulnerability tracking
  - Set up security dashboard
  - Track remediation SLAs
  - Report to stakeholders

  **Continuous:**
  - Run scans on schedule
  - Monitor new CVEs
  - Track dependency updates
  - Regular penetration testing

when_not_to_use: |
  Security testing tools may not catch:

  **Business Logic Flaws:**
  - Require manual review
  - Consider threat modeling

  **Social Engineering:**
  - Requires human testing
  - Consider security awareness

  **Physical Security:**
  - Requires on-site assessment
  - Consider physical penetration testing

output_template: |
  ## Security Testing Strategy

  **SAST:** Semgrep + CodeQL
  **DAST:** OWASP ZAP
  **Dependencies:** Snyk
  **Secrets:** TruffleHog

  ### Key Decisions
  - **SAST:** Run on every PR
  - **DAST:** Run on staging
  - **Dependencies:** Daily scans
  - **Penetration:** Quarterly

  ### Next Steps
  1. Set up SAST tools
  2. Configure DAST scanning
  3. Integrate with CI/CD
  4. Define security gates
  5. Schedule penetration testing
dependencies:
  sast:
    - Semgrep (static analysis)
    - CodeQL (GitHub)
    - SonarQube (code quality + security)
    - ESLint security plugin
  dast:
    - OWASP ZAP (web scanning)
    - Burp Suite (professional)
    - Nikto (web server scanner)
  dependencies:
    - Snyk (dependency scanning)
    - npm audit (Node.js)
    - Dependabot (GitHub)
  secrets:
    - TruffleHog (secret scanning)
    - GitLeaks (git scanning)
    - detect-secrets (pre-commit)
---

<role>
You are a security testing specialist with deep expertise in SAST, DAST, penetration testing, and vulnerability management. You provide structured guidance on building comprehensive security testing programs.
</role>

<security_testing_example>
**Security Testing Implementation:**

```yaml
# .github/workflows/security-testing.yml
name: Security Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
      
      - name: Run CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript
        with:
          languages: javascript,typescript
      
      - uses: github/codeql-action/analyze@v2
      
      - name: Run ESLint security plugin
        run: |
          npm install eslint-plugin-security
          npx eslint --plugins security .

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}

  dast:
    runs-on: ubuntu-latest
    needs: [sast, dependency-scan]
    if: github.event_name == 'schedule'
    steps:
      - name: Run OWASP ZAP scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'https://staging.example.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

  penetration-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' && github.ref == 'refs/heads/main'
    steps:
      - name: Run penetration test
        run: |
          # Run automated penetration testing
          npm run test:security:penetration
          
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: penetration-test-results
          path: security/reports/penetration-test.pdf
```
</security_testing_example>

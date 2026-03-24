---
name: compliance_checker_v1
description: Automated compliance validation for GDPR, HIPAA, PCI-DSS, SOC2 with checklists and audit trails
version: 1.0.0
tags: [compliance, gdpr, hipaa, pci-dss, soc2, audit, regulatory]
category: governance
triggers:
  keywords: [compliance, gdpr, hipaa, pci-dss, soc2, audit, regulatory]
  projectArchetypes: [healthcare, fintech, enterprise, saas]
prerequisites:
  - security_fundamentals
  - privacy_basics
  - audit_processes
workflow:
  setup:
    - Identify applicable regulations
    - Create compliance checklist
    - Setup audit trail system
    - Define compliance roles
  assess:
    - Gap analysis
    - Risk assessment
    - Control mapping
    - Evidence collection
  remediate:
    - Implement controls
    - Policy creation
    - Training
    - Monitoring
best_practices:
  - Start compliance early (not before audit)
  - Automate evidence collection
  - Maintain audit trails for all sensitive operations
  - Regular compliance reviews (quarterly)
  - Document all policies and procedures
  - Train team on compliance requirements
  - Use compliance management software
  - Engage compliance consultant for complex regulations
  - Implement data classification
  - Regular penetration testing
anti_patterns:
  - Never fake compliance (legal risk)
  - Don't wait until audit to start
  - Avoid manual evidence collection
  - Don't ignore third-party compliance
  - Never skip employee training
  - Don't treat compliance as one-time
  - Avoid overly complex controls
  - Don't ignore incident response planning
scaling_notes: |
  Compliance Scaling:
  - Start with self-assessment
  - Add automated checks
  - Engage external auditors
  - Continuous compliance monitoring
when_not_to_use: |
  Not a substitute for: Legal advice, certified auditor, industry-specific compliance consultant
output_template: |
  ## Compliance Assessment
  **Regulations:** {GDPR, HIPAA, PCI-DSS, SOC2}
  **Status:** {compliant, partial, non-compliant}
  **Gaps:** {list of gaps with severity}
  **Remediation Plan:** {actions, owners, deadlines}
dependencies:
  - compliance_framework: "Compliance management tool"
  - audit_trail: "Logging system"
---

<role>
Compliance Specialist with expertise in GDPR, HIPAA, PCI-DSS, and SOC2.
You have helped 50+ companies achieve compliance certification.
Focus on practical, auditable compliance implementation.
</role>

<workflow>
## Compliance Implementation

### Phase 1: Assessment (Week 1-2)
1. Regulation Mapping
   - Identify applicable regulations
   - Map requirements to controls
   - Gap analysis

2. Risk Assessment
   - Data classification
   - Risk identification
   - Risk scoring

### Phase 2: Implementation (Week 3-8)
3. Control Implementation
   - Technical controls
   - Administrative controls
   - Physical controls

4. Documentation
   - Policies
   - Procedures
   - Work instructions

### Phase 3: Verification (Week 9-10)
5. Internal Audit
   - Control testing
   - Evidence review
   - Finding remediation

6. External Audit
   - Engage auditor
   - Provide evidence
   - Address findings
</workflow>

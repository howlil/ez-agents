---
name: telemedicine_platform_v1
description: Telemedicine and healthcare platform architecture with HIPAA compliance, video consultations, and patient management
version: 1.0.0
tags: [telemedicine, healthcare, hipaa, video-consultation, patient-management, health-tech]
category: domain
triggers:
  keywords: [telemedicine, telehealth, healthcare, patient, doctor, consultation, HIPAA]
  projectArchetypes: [telemedicine, healthcare-platform, patient-portal]
prerequisites:
  - healthcare_compliance_basics
  - video_streaming_fundamentals
  - security_privacy_fundamentals
workflow:
  setup:
    - HIPAA compliance assessment
    - Choose video provider
    - Design patient data model
    - Setup EHR integration
  build:
    - Patient registration
    - Doctor scheduling
    - Video consultations
    - E-prescriptions
  secure:
    - Data encryption
    - Access controls
    - Audit logging
    - BA agreements
best_practices:
  - Ensure HIPAA compliance from day 1
  - Use HIPAA-compliant video provider
  - Encrypt all PHI (Protected Health Information)
  - Implement strong authentication (MFA)
  - Maintain complete audit trails
  - Enable screen sharing for consultations
  - Provide patient portal access
  - Integrate with EHR systems
  - Support e-prescriptions
  - Enable appointment reminders
anti_patterns:
  - Never store PHI unencrypted
  - Don't use non-HIPAA video providers
  - Avoid consumer-grade tools
  - Don't skip BA agreements
  - Never log PHI in plain text
  - Don't allow unauthorized access
  - Avoid complex patient onboarding
  - Don't skip emergency protocols
scaling_notes: |
  Telemedicine Scaling:
  - Start with video + scheduling
  - Add EHR integration
  - Enable remote monitoring
  - Add AI diagnostics
when_not_to_use: |
  Not for: Non-healthcare consultations, emergency care, conditions requiring physical examination
output_template: |
  ## Telemedicine Architecture Decision
  **Compliance:** HIPAA compliant
  **Video Provider:** {Twilio, Zoom for Healthcare, Doxy.me}
  **Key Features:** {scheduling, video, e-rx, patient portal}
  **EHR Integration:** {HL7, FHIR, custom}
dependencies:
  - video_provider: "HIPAA-compliant (Twilio, Zoom Healthcare)"
  - ehr_system: "For patient records integration"
  - encryption: "AES-256 for data at rest"
---

<role>
Healthcare Technology Architect specializing in telemedicine and HIPAA compliance.
You have built telemedicine platforms serving millions of patients.
Focus on compliance, security, and patient experience.
</role>

<workflow>
## Telemedicine Implementation

### Phase 1: Compliance (Week 1-2)
1. HIPAA Assessment
   - Identify PHI data flows
   - Implement safeguards
   - Create policies

2. Security Setup
   - Encryption (at rest, in transit)
   - Access controls
   - Audit logging

### Phase 2: Core Features (Week 3-6)
3. Patient Management
   - Registration
   - Medical history
   - Insurance info

4. Scheduling
   - Doctor availability
   - Appointment booking
   - Reminders (SMS, email)

5. Video Consultations
   - HD video quality
   - Screen sharing
   - Recording (with consent)

6. E-Prescriptions
   - Pharmacy integration
   - Drug interaction checks
   - Controlled substances

### Phase 3: Integration (Week 7-8)
7. EHR Integration
   - HL7/FHIR standards
   - Data synchronization
   - Patient records

8. Patient Portal
   - Medical records access
   - Lab results
   - Secure messaging
</workflow>

---
name: Medical Records System (EMR)
description: Patient intake, diagnosis, treatment, billing with HIPAA compliance and comprehensive audit trails
version: 1.0.0
tags: [medical, healthcare, emr, hipaa, patient-records]
category: domain
domain_type: medical
triggers:
  keywords: [medical records, emr, ehr, patient management, healthcare, clinic]
  projectArchetypes: [medical-records, healthcare-system, clinic-management]
  constraints: [hipaa-required, phi-protection, audit-trails]
prerequisites:
  - hipaa_compliance_basics
  - audit_logging_basics
  - encryption_at_rest_basics
key_workflows:
  - name: Patient Intake
    steps:
      - Register new patient with demographics
      - Verify identity and collect contact information
      - Insurance verification and eligibility check
      - Collect signed consent forms
      - Document medical history and allergies
    entities: [Patient, Demographics, Insurance, ConsentForm, MedicalHistory, Allergy]
  - name: Diagnosis and Treatment
    steps:
      - Record chief complaint and symptoms
      - Document vital signs and examination findings
      - Enter clinical notes and observations
      - Record diagnosis with ICD-10 codes
      - Create treatment plan
      - Issue prescriptions with e-prescribing
    entities: [Encounter, VitalSigns, ClinicalNote, Diagnosis, TreatmentPlan, Prescription]
  - name: Lab Orders and Results
    steps:
      - Order laboratory tests
      - Send order to lab information system
      - Receive and record lab results
      - Flag abnormal values for provider review
      - Notify provider of critical values
      - Document provider response to results
    entities: [LabOrder, LabResult, AbnormalFlag, CriticalValue, ProviderNotification]
  - name: Billing and Claims
    steps:
      - Generate superbill from encounter codes
      - Submit insurance claim with CPT and ICD codes
      - Track claim status and payer response
      - Process patient payment and copays
      - Handle claim denials and appeals
      - Generate patient statements
    entities: [Superbill, InsuranceClaim, ClaimStatus, Payment, Denial, PatientStatement]
compliance_requirements:
  - HIPAA compliance (Protected Health Information protection)
  - Audit trails for all PHI access and modifications
  - Data retention requirements (7+ years for medical records)
  - Consent management for treatment and data sharing
  - Meaningful Use (ONC certification for US providers)
  - FHIR/HL7 interoperability standards
data_model_patterns:
  - Problem lists with active/resolved status
  - Medication reconciliation across care episodes
  - Referral tracking and specialist communications
  - Immunization records with lot numbers
  - Allergy tracking with reaction severity
  - Care team assignments and role-based access
integration_points:
  - Lab systems via HL7 or FHIR (LabCorp, Quest)
  - Pharmacy systems for e-prescribing (Surescripts)
  - Insurance clearinghouses for claims (Availity, Change Healthcare)
  - Immunization registries (state-level)
  - Health information exchanges (HIE)
scaling_considerations: Encrypted storage for all PHI at rest, comprehensive audit log retention with separate storage, backup and disaster recovery with RTO/RPO requirements, access logging for all record views
when_not_to_use: Wellness apps without clinical diagnosis, fitness tracking, non-clinical health apps, simple appointment scheduling without clinical workflows
output_template: |
  ## Medical Records System Decision

  **Domain:** Medical Records System (EMR)
  **Version:** 1.0.0

  **Provider Type:** [Primary Care, Specialist, Hospital, Clinic]
  **HIPAA Scope:** [Full PHI, De-identified Only]
  **FHIR Required:** [Yes/No]
  **Billing Integration:** [In-house, Outsourced, Both]

  **Key Workflows:**
  - Intake: [Self-service, Staff-assisted]
  - Clinical: [Provider workflow type]
  - Lab: [In-house, Reference labs]
  - Billing: [Insurance, Self-pay, Both]

  **Integration Points:**
  - Lab System: [Provider]
  - Pharmacy: [e-Prescribing network]
  - Insurance: [Clearinghouse]
dependencies:
  - hipaa_compliance_basics
  - audit_logging_basics
  - encryption_at_rest_basics
---

<role>
You are an expert in Electronic Medical Records (EMR) systems with deep experience in HIPAA compliance, clinical workflows, HL7/FHIR interoperability, and healthcare billing.
You help teams design secure, compliant patient record systems that support clinical care while maintaining strict data privacy.
</role>

<execution_flow>
## Step 1: Compliance Architecture
- Define PHI data classification
- Implement encryption at rest and in transit
- Set up comprehensive audit logging
- Configure role-based access controls (RBAC)

## Step 2: Patient Demographics
- Implement patient registration with MRN assignment
- Handle duplicate patient detection
- Store demographics with privacy controls
- Implement patient merge/unmerge capabilities

## Step 3: Clinical Documentation
- Build encounter-based documentation
- Implement SOAP note templates
- Add vital signs tracking with trending
- Create diagnosis coding interface (ICD-10)

## Step 4: Medication Management
- Implement e-prescribing integration
- Build medication reconciliation workflow
- Add drug interaction checking
- Create medication administration records (MAR)

## Step 5: Lab and Imaging
- Build HL7 order/result integration
- Implement critical value alerting
- Create result review workflow
- Store images via DICOM if needed

## Step 6: Billing Integration
- Generate superbills from encounter data
- Implement claim scrubbing
- Build denial management workflow
- Create patient statement generation
</execution_flow>

<best_practices_detail>
### HIPAA Audit Trail Requirements

```
Every PHI access must be logged:
- Who accessed the record (user ID, role)
- What was accessed (patient ID, record type)
- When it was accessed (timestamp with timezone)
- From where (IP address, workstation)
- What action was taken (read, create, update, delete)

Implementation:
- Use append-only audit log table
- Log at the application level (not just DB)
- Include failed access attempts
- Retain for 6+ years
- Separate storage from clinical data
- Regular audit log reviews required
```

### PHI Encryption Strategy

```
At Rest:
- Database column-level encryption for sensitive fields
- Storage encryption (AES-256)
- Encrypted backups
- Key management via HSM or key management service

In Transit:
- TLS 1.2+ for all connections
- End-to-end encryption for external integrations
- Secure file transfer (SFTP/FTPS) for batch data

Access Controls:
- Minimum necessary access principle
- Role-based access (provider, nurse, admin, billing)
- Break-the-glass for emergency access with audit
- Automatic session timeout
```

### FHIR Resource Structure

```
Patient FHIR Resource:
{
  "resourceType": "Patient",
  "id": "patient-mrn-12345",
  "identifier": [{ "system": "MRN", "value": "12345" }],
  "name": [{ "family": "Smith", "given": ["John"] }],
  "birthDate": "1980-01-15",
  "gender": "male"
}

Observation (Vital Sign) FHIR Resource:
{
  "resourceType": "Observation",
  "status": "final",
  "code": { "coding": [{ "system": "LOINC", "code": "8480-6", "display": "Systolic BP" }] },
  "subject": { "reference": "Patient/patient-mrn-12345" },
  "valueQuantity": { "value": 120, "unit": "mmHg" }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Storing PHI Without Encryption

**Problem:** Patient data exposed in case of breach.

```
BAD: Plain text PHI storage
- Patient names and SSNs in plain text DB columns
- Backup files unencrypted
- Breach exposes all patient data
- HIPAA violation with major fines

GOOD: Column-level encryption + storage encryption
- Sensitive fields encrypted before storage
- Application decrypts only when needed for display
- Breach exposes only encrypted data
- Encryption keys stored separately
```

### Missing Audit Trails

**Problem:** HIPAA requires knowing who accessed what PHI and when.

```
BAD: No audit logging
- Can't answer "who viewed this patient's record?"
- Can't detect unauthorized access
- HIPAA violation
- No forensic capability after breach

GOOD: Comprehensive audit logging
- Every PHI access logged with user, timestamp, action
- Separate, tamper-evident audit log storage
- Automated alerts for suspicious access patterns
- Regular compliance reports from audit logs
```
</anti_patterns_detail>

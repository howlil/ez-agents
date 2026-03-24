---
name: privacy_gdpr_ccpa_skill_v1
description: GDPR, CCPA, and privacy compliance implementation including data subject rights, consent management, data retention, and privacy-by-design principles
version: 1.0.0
tags: [privacy, gdpr, ccpa, compliance, data-protection, consent, data-subject-rights]
stack: compliance/framework-agnostic
category: governance
triggers:
  keywords: [gdpr, ccpa, privacy, data protection, consent, data subject, right to be forgotten, data portability]
  filePatterns: [*.ts, *.js, *.py, privacy-policy.md, terms.md]
  commands: [data export, data deletion, consent audit]
  stack: compliance/framework-agnostic
  projectArchetypes: [saas, ecommerce, healthcare, fintech]
  modes: [greenfield, compliance-audit, privacy-review]
prerequisites:
  - web_development_fundamentals
  - database_basics
  - legal_compliance_awareness
recommended_structure:
  directories:
    - src/services/privacy/
    - src/services/consent/
    - src/services/data-export/
    - src/services/data-deletion/
    - docs/privacy/
    - docs/compliance/
workflow:
  setup:
    - Conduct data mapping exercise
    - Identify lawful basis for processing
    - Create privacy policy
    - Set up consent management
  implement:
    - Data subject access request (DSAR) handling
    - Right to erasure implementation
    - Data portability export
    - Consent management system
  test:
    - Privacy impact assessment
    - Consent audit
    - Data retention review
    - DSAR process testing
best_practices:
  - Implement privacy by design and by default
  - Obtain explicit consent before data collection
  - Provide clear privacy notices
  - Enable data subject access requests
  - Implement right to erasure (right to be forgotten)
  - Enable data portability
  - Maintain data processing records
  - Set up data retention policies
  - Implement data minimization
  - Use encryption for personal data
  - Log consent and withdrawal
  - Appoint DPO if required
anti_patterns:
  - Never collect data without lawful basis
  - Don't use pre-ticked consent boxes
  - Never hide privacy settings
  - Don't retain data longer than necessary
  - Avoid bundling consent with terms of service
  - Don't make services conditional on unnecessary data
  - Never ignore data subject requests
  - Don't transfer data without adequate protections
  - Avoid dark patterns in consent UI
  - Never process data beyond stated purpose
scaling_notes: |
  For enterprise-scale privacy compliance:

  **Data Mapping:**
  - Maintain comprehensive data inventory
  - Document data flows across systems
  - Identify data processors and sub-processors
  - Create records of processing activities (ROPA)

  **Consent Management:**
  - Implement consent management platform (CMP)
  - Track consent granularly by purpose
  - Enable easy consent withdrawal
  - Maintain consent audit trail

  **Data Subject Rights:**
  - Automate DSAR fulfillment where possible
  - Set up identity verification for requests
  - Implement response templates
  - Track request SLAs (30 days for GDPR)

  **International Transfers:**
  - Use Standard Contractual Clauses (SCCs)
  - Implement Transfer Impact Assessments
  - Consider data localization for sensitive data
  - Document transfer mechanisms

  **Vendor Management:**
  - Execute Data Processing Agreements (DPAs)
  - Conduct vendor privacy assessments
  - Monitor sub-processor changes
  - Audit high-risk processors

  **Privacy Operations:**
  - Conduct Privacy Impact Assessments (PIAs)
  - Maintain breach notification procedures
  - Train employees on privacy practices
  - Regular compliance audits

when_not_to_use: |
  This skill provides general guidance. Consider specialized legal counsel for:

  **Industry-Specific Regulations:**
  - Healthcare: HIPAA requires additional protections
  - Finance: GLBA, PSD2 have specific requirements
  - Children's data: COPPA has strict requirements
  - Employment data: Labor laws may apply

  **Jurisdiction-Specific Requirements:**
  - Brazil: LGPD has unique requirements
  - China: PIPL has data localization rules
  - Japan: APPI has specific provisions
  - US State laws: VCDPA, CPA, CTDPA vary by state

  **High-Risk Processing:**
  - Biometric data: Requires explicit consent
  - Genetic data: Special category under GDPR
  - Criminal records: Requires official authority
  - Large-scale monitoring: Requires DPIA

output_template: |
  ## Privacy Compliance Decision

  **Regulations:** GDPR, CCPA compliant
  **Lawful Basis:** Consent + Legitimate Interest
  **Data Retention:** 3 years after last activity
  **DPO Required:** Yes (large-scale processing)

  ### Key Decisions
  - **Consent:** Explicit opt-in with granular purposes
  - **DSAR:** Automated portal with 30-day fulfillment
  - **Erasure:** Soft delete with 30-day grace period
  - **Portability:** JSON export with common schema
  - **International:** SCCs for EU-US transfers

  ### Trade-offs Considered
  - Consent vs Legitimate Interest: Based on processing purpose
  - Deletion vs Backup: Grace period for recovery
  - Automation vs Manual: Hybrid approach for complex requests

  ### Next Steps
  1. Complete data mapping exercise
  2. Update privacy policy
  3. Implement consent management
  4. Set up DSAR portal
  5. Conduct privacy training
dependencies:
  nodejs_packages:
    - node-gdpr: ^1.2 (GDPR utilities)
    - consent-manager: ^2.0 (Consent management)
    - data-export: ^1.0 (Data portability)
  python_packages:
    - gdpr-tools
    - consent-manager
  tools:
    - OneTrust (enterprise CMP)
    - Osano (SMB CMP)
    - Privacy engineering tools
---

<role>
You are a privacy compliance specialist with deep expertise in GDPR, CCPA, and global privacy regulations. You provide structured guidance on implementing privacy-by-design principles, data subject rights, and compliance frameworks following legal requirements.
</role>

<execution_flow>
1. **Data Mapping**
   - Identify all personal data collected
   - Document data sources and flows
   - Identify processing purposes
   - Map data retention periods

2. **Lawful Basis Assessment**
   - Determine lawful basis for each purpose
   - Document legitimate interest assessments
   - Identify consent requirements
   - Review contractual necessities

3. **Consent Management**
   - Implement consent collection UI
   - Set up consent storage and audit
   - Enable consent withdrawal
   - Track consent versions

4. **Data Subject Rights**
   - Implement access request handling
   - Set up erasure procedures
   - Enable data portability
   - Handle rectification requests

5. **Privacy Notices**
   - Create clear privacy policy
   - Implement just-in-time notices
   - Update cookie notices
   - Translate for jurisdictions

6. **Compliance Operations**
   - Conduct privacy impact assessments
   - Set up breach notification
   - Train staff on privacy
   - Audit compliance regularly
</execution_flow>

<gdpr_requirements>
**GDPR Implementation Guide:**

### Article 6: Lawful Basis for Processing

```javascript
// Lawful bases under GDPR Article 6
const LAWFUL_BASES = {
  CONSENT: 'consent',           // User gave explicit consent
  CONTRACT: 'contract',         // Necessary for contract performance
  LEGAL_OBLIGATION: 'legal',    // Necessary for legal obligation
  VITAL_INTERESTS: 'vital',     // Necessary to protect vital interests
  PUBLIC_TASK: 'public',        // Necessary for public interest
  LEGITIMATE_INTEREST: 'legitimate'  // Necessary for legitimate interests
};

// Document lawful basis for each processing activity
const processingActivities = {
  userRegistration: {
    purpose: 'Create and manage user account',
    lawfulBasis: LAWFUL_BASES.CONTRACT,
    dataCategories: ['email', 'password', 'name'],
    retention: 'Account lifetime + 3 years',
    recipients: ['Internal systems', 'Email provider']
  },
  marketingEmails: {
    purpose: 'Send promotional communications',
    lawfulBasis: LAWFUL_BASES.CONSENT,
    dataCategories: ['email', 'name', 'preferences'],
    retention: 'Until consent withdrawn',
    recipients: ['Email marketing platform']
  },
  fraudPrevention: {
    purpose: 'Detect and prevent fraud',
    lawfulBasis: LAWFUL_BASES.LEGITIMATE_INTEREST,
    dataCategories: ['ip', 'userAgent', 'transactionData'],
    retention: '5 years',
    legitimateInterestAssessment: 'LIA-2024-001'
  }
};

// Legitimate Interest Assessment (LIA) template
class LegitimateInterestAssessment {
  constructor(id, purpose) {
    this.id = id;
    this.purpose = purpose;
    this.assessment = {
      purposeTest: {
        legitimateInterest: 'What is the legitimate interest?',
        necessity: 'Is processing necessary for this interest?',
        balancing: 'Balance against individual interests'
      },
      necessityTest: {
        alternativeAnalysis: 'Are there less intrusive means?',
        proportionality: 'Is processing proportionate?'
      },
      balancingTest: {
        impactAssessment: 'What is the impact on individuals?',
        safeguards: 'What safeguards are in place?',
        conclusion: 'Do interests override individual rights?'
      }
    };
  }

  document() {
    return {
      id: this.id,
      purpose: this.purpose,
      date: new Date().toISOString(),
      assessment: this.assessment,
      conclusion: 'PASS|FAIL',
      reviewDate: this.calculateReviewDate()
    };
  }
}
```

### Article 7: Conditions for Consent

```javascript
// ✅ GOOD: Granular consent management
const ConsentManager = {
  // Consent categories
  categories: {
    ESSENTIAL: 'essential',      // Always active, no consent needed
    FUNCTIONAL: 'functional',    // Preferences, personalization
    ANALYTICS: 'analytics',      // Usage analytics
    MARKETING: 'marketing',      // Marketing communications
    ADVERTISING: 'advertising'   // Targeted advertising
  },

  // Store consent with audit trail
  async recordConsent(userId, consents) {
    const consentRecord = {
      userId,
      consents: {
        [this.categories.FUNCTIONAL]: consents.functional || false,
        [this.categories.ANALYTICS]: consents.analytics || false,
        [this.categories.MARKETING]: consents.marketing || false,
        [this.categories.ADVERTISING]: consents.advertising || false
      },
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      consentVersion: '2.0',  // Track version for re-consent
      method: 'explicit_opt_in'
    };

    // Store in database with audit trail
    await db.consentRecords.insertOne(consentRecord);
    
    // Also store in user document for quick lookup
    await db.users.updateOne(
      { _id: userId },
      { $set: { consents: consentRecord.consents, consentUpdatedAt: new Date() } }
    );

    return consentRecord;
  },

  // Verify consent before processing
  async hasConsent(userId, category) {
    const user = await db.users.findOne({ _id: userId });
    if (!user) return false;

    // Essential always allowed
    if (category === this.categories.ESSENTIAL) return true;

    return user.consents?.[category] === true;
  },

  // Withdraw consent
  async withdrawConsent(userId, category) {
    const update = {
      consents: { [category]: false },
      consentWithdrawnAt: new Date(),
      consentWithdrawnCategory: category
    };

    await db.users.updateOne(
      { _id: userId },
      { $set: update }
    );

    // Log withdrawal for audit
    await db.consentWithdrawals.insertOne({
      userId,
      category,
      timestamp: new Date().toISOString(),
      reason: 'user_request'
    });

    // Trigger data deletion if required
    if (category === this.categories.MARKETING) {
      await this.deleteMarketingData(userId);
    }
  },

  // Get consent history for audit
  async getConsentHistory(userId) {
    return await db.consentRecords.find(
      { userId },
      { sort: { timestamp: -1 } }
    ).toArray();
  }
};

// ✅ Consent UI component (React example)
function ConsentBanner({ onSave }) {
  const [consents, setConsents] = useState({
    functional: false,
    analytics: false,
    marketing: false,
    advertising: false
  });

  return (
    <div className="consent-banner" role="dialog" aria-labelledby="consent-title">
      <h2 id="consent-title">Your Privacy Choices</h2>
      <p>We use cookies to enhance your experience. Choose which types you allow:</p>
      
      <div className="consent-options">
        <ConsentToggle
          category="functional"
          title="Functional Cookies"
          description="Remember your preferences and settings"
          checked={consents.functional}
          onChange={(checked) => setConsents({...consents, functional: checked})}
        />
        
        <ConsentToggle
          category="analytics"
          title="Analytics Cookies"
          description="Help us improve by collecting usage data"
          checked={consents.analytics}
          onChange={(checked) => setConsents({...consents, analytics: checked})}
        />
        
        <ConsentToggle
          category="marketing"
          title="Marketing Cookies"
          description="Receive personalized offers and newsletters"
          checked={consents.marketing}
          onChange={(checked) => setConsents({...consents, marketing: checked})}
        />
        
        <ConsentToggle
          category="advertising"
          title="Advertising Cookies"
          description="See relevant ads across websites"
          checked={consents.advertising}
          onChange={(checked) => setConsents({...consents, advertising: checked})}
        />
      </div>
      
      <div className="consent-actions">
        <button onClick={() => onSave(consents)} className="btn-primary">
          Save Preferences
        </button>
        <button onClick={() => onSave({})} className="btn-secondary">
          Reject All Optional
        </button>
      </div>
      
      <a href="/privacy-policy" target="_blank" rel="noopener">
        Learn more in our Privacy Policy
      </a>
    </div>
  );
}

// ❌ BAD: Pre-ticked consent boxes (not valid under GDPR)
<input type="checkbox" checked defaultChecked /> Accept marketing emails

// ✅ GOOD: Explicit opt-in (unchecked by default)
<input type="checkbox" id="marketing" name="marketing" />
<label for="marketing">I agree to receive marketing emails</label>
```

### Article 15: Right of Access (DSAR)

```javascript
// Data Subject Access Request Handler
class DSARHandler {
  // Initiate DSAR
  async initiateRequest(userId, requestType, verificationData) {
    const request = {
      id: generateUUID(),
      userId,
      type: requestType,  // 'access', 'erasure', 'portability', 'rectification'
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      verificationData,
      dueDate: this.calculateDueDate()  // 30 days from receipt
    };

    await db.dsarRequests.insertOne(request);

    // Send confirmation email
    await this.sendDSARConfirmation(userId, request.id);

    return request;
  }

  // Verify identity before fulfilling
  async verifyIdentity(requestId, verificationProof) {
    const request = await db.dsarRequests.findOne({ _id: requestId });
    
    // Verify based on verification method
    const verified = await this.verifyProof(request.userId, verificationProof);
    
    if (verified) {
      await db.dsarRequests.updateOne(
        { _id: requestId },
        { $set: { status: 'verified', verifiedAt: new Date().toISOString() } }
      );
      
      // Start fulfillment process
      await this.fulfillRequest(request);
    } else {
      await db.dsarRequests.updateOne(
        { _id: requestId },
        { $set: { status: 'verification_failed' } }
      );
    }

    return verified;
  }

  // Fulfill access request
  async fulfillAccessRequest(userId) {
    const userData = await db.users.findOne({ _id: userId });
    
    // Collect all personal data across systems
    const personalData = {
      // Profile information
      profile: {
        email: userData.email,
        name: userData.name,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      },
      
      // Orders and transactions
      orders: await db.orders.find({ userId }).toArray(),
      
      // Communications
      communications: await db.communications.find({ userId }).toArray(),
      
      // Preferences and settings
      preferences: userData.preferences,
      
      // Consent history
      consents: await db.consentRecords.find({ userId }).toArray(),
      
      // Activity logs
      activity: await db.activityLogs.find({ userId }).toArray(),
      
      // Support tickets
      supportTickets: await db.tickets.find({ userId }).toArray()
    };

    // Generate export file
    const exportData = {
      requestId: generateUUID(),
      userId,
      generatedAt: new Date().toISOString(),
      format: 'json',
      version: '1.0',
      data: personalData
    };

    // Store securely with expiration
    const exportId = await this.storeExport(exportData, 30);  // 30 days

    // Send secure download link
    await this.sendExportEmail(userId, exportId);

    return exportData;
  }
}

// Data export endpoint
app.post('/api/privacy/export', authenticate, async (req, res) => {
  try {
    const dsarHandler = new DSARHandler();
    
    // Initiate DSAR
    const request = await dsarHandler.initiateRequest(
      req.user.id,
      'access',
      { method: 'email_verification' }
    );

    res.json({
      requestId: request.id,
      status: 'pending',
      message: 'Verification email sent. Request will be processed within 30 days.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate export request' });
  }
});
```

### Article 17: Right to Erasure

```javascript
// Right to Erasure (Right to be Forgotten) Handler
class ErasureHandler {
  async processErasureRequest(userId, reason) {
    const request = {
      id: generateUUID(),
      userId,
      type: 'erasure',
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await db.erasureRequests.insertOne(request);

    // Check for legal obligations to retain
    const retentionCheck = await this.checkRetentionRequirements(userId);
    
    if (retentionCheck.mustRetain) {
      // Partial erasure - delete what we can
      await this.partialErasure(userId, retentionCheck.retentionList);
      
      await db.erasureRequests.updateOne(
        { _id: request.id },
        { 
          $set: { 
            status: 'partial_erasure',
            retainedData: retentionCheck.retentionList,
            legalBasis: retentionCheck.legalBasis
          }
        }
      );
    } else {
      // Full erasure
      await this.fullErasure(userId);
      
      await db.erasureRequests.updateOne(
        { _id: request.id },
        { $set: { status: 'completed', completedAt: new Date().toISOString() } }
      );
    }

    // Notify user
    await this.notifyErasureComplete(userId, request.id);

    return request;
  }

  async fullErasure(userId) {
    // Anonymize or delete personal data
    const operations = [
      // Delete or anonymize user account
      db.users.updateOne(
        { _id: userId },
        { 
          $set: {
            email: `deleted_${userId}@deleted`,
            name: 'Deleted User',
            deletedAt: new Date(),
            isActive: false
          },
          $unset: {
            phone: '',
            address: '',
            preferences: ''
          }
        }
      ),
      
      // Delete user sessions
      db.sessions.deleteMany({ userId }),
      
      // Delete consents
      db.consentRecords.deleteMany({ userId }),
      
      // Anonymize orders (keep for legal requirements)
      db.orders.updateMany(
        { userId },
        { 
          $set: { 
            userEmail: 'deleted@deleted.com',
            anonymized: true 
          },
          $unset: { userId: '' }
        }
      ),
      
      // Delete communications
      db.communications.deleteMany({ userId }),
      
      // Delete activity logs
      db.activityLogs.deleteMany({ userId }),
      
      // Delete support tickets or anonymize
      db.tickets.updateMany(
        { userId },
        { $set: { anonymized: true }, $unset: { userId: '' } }
      )
    ];

    await Promise.all(operations);

    // Log erasure for audit
    await db.erasureAudit.insertOne({
      userId,
      erasedAt: new Date().toISOString(),
      requestType: 'full_erasure',
      systemsAffected: ['users', 'sessions', 'consents', 'orders', 'communications', 'activity', 'tickets']
    });
  }

  async checkRetentionRequirements(userId) {
    const retentionList = [];
    
    // Check for active orders
    const activeOrders = await db.orders.countDocuments({ 
      userId, 
      status: { $in: ['pending', 'processing', 'shipped'] }
    });
    
    if (activeOrders > 0) {
      retentionList.push({
        data: 'user_account',
        reason: 'Active orders require account for fulfillment',
        legalBasis: 'Contract performance',
        retentionPeriod: 'Until order completion + warranty period'
      });
    }

    // Check for legal obligations (tax, accounting)
    const hasTransactions = await db.transactions.exists({ userId });
    if (hasTransactions) {
      retentionList.push({
        data: 'transaction_records',
        reason: 'Tax and accounting legal requirements',
        legalBasis: 'Legal obligation (Tax Code)',
        retentionPeriod: '7 years from transaction date'
      });
    }

    return {
      mustRetain: retentionList.length > 0,
      retentionList
    };
  }
}
```

### Article 20: Right to Data Portability

```javascript
// Data Portability Handler
class DataPortabilityHandler {
  async exportPortableData(userId, format = 'json') {
    // Only data provided by user and processed by automated means
    const userData = await db.users.findOne({ _id: userId });
    
    const portableData = {
      // Data provided by user
      profile: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        address: userData.address,
        dateOfBirth: userData.dateOfBirth
      },
      
      // User-generated content
      reviews: await db.reviews.find({ userId }).toArray(),
      comments: await db.comments.find({ userId }).toArray(),
      wishlist: await db.wishlist.find({ userId }).toArray(),
      
      // Preferences provided by user
      preferences: userData.preferences,
      
      // Order history (data generated through user activity)
      orders: await db.orders.find({ userId }).toArray()
    };

    // Format based on request
    let exportContent;
    let mimeType;
    let extension;

    if (format === 'json') {
      exportContent = JSON.stringify(portableData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else if (format === 'csv') {
      exportContent = this.convertToCSV(portableData);
      mimeType = 'text/csv';
      extension = 'csv';
    } else if (format === 'xml') {
      exportContent = this.convertToXML(portableData);
      mimeType = 'application/xml';
      extension = 'xml';
    }

    return {
      content: exportContent,
      mimeType,
      extension,
      generatedAt: new Date().toISOString()
    };
  }

  // Convert to common schema for interoperability
  convertToCommonSchema(portableData) {
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Person',
      id: `user:${portableData.profile.email}`,
      email: portableData.profile.email,
      name: portableData.profile.name,
      preferredUsername: portableData.profile.username,
      url: portableData.profile.website,
      attachments: [
        {
          type: 'DataCollection',
          name: 'Reviews',
          items: portableData.reviews.map(r => ({
            type: 'Review',
            content: r.content,
            rating: r.rating,
            published: r.createdAt
          }))
        }
      ]
    };
  }
}
```

### Article 30: Records of Processing Activities

```javascript
// Records of Processing Activities (ROPA)
const processingRecords = {
  controller: {
    name: 'Your Company Ltd.',
    contact: 'privacy@yourcompany.com',
    dpo: 'dpo@yourcompany.com'
  },
  
  activities: [
    {
      id: 'PROC-001',
      purpose: 'User Account Management',
      categories: {
        dataSubjects: ['Customers', 'Users'],
        personalData: ['Email', 'Name', 'Password', 'Profile information'],
        specialCategories: []  // Special category data if any
      },
      processing: {
        description: 'Create and manage user accounts for service access',
        activities: ['Collection', 'Storage', 'Use', 'Deletion'],
        automatedDecisionMaking: false
      },
      recipients: {
        internal: ['Customer Support', 'Technical Team'],
        external: [
          { name: 'AWS', role: 'Hosting provider', location: 'EU' },
          { name: 'SendGrid', role: 'Email provider', location: 'US', safeguards: 'SCCs' }
        ]
      },
      transfers: {
        international: true,
        countries: ['United States'],
        safeguards: 'Standard Contractual Clauses'
      },
      retention: {
        period: 'Account lifetime + 3 years',
        criteria: 'Last user activity + statutory limitation period'
      },
      security: {
        measures: [
          'Encryption in transit (TLS 1.3)',
          'Encryption at rest (AES-256)',
          'Access control (RBAC)',
          'Regular security audits'
        ]
      },
      lawfulBasis: {
        basis: 'Contract',
        article: 'Article 6(1)(b)'
      }
    },
    {
      id: 'PROC-002',
      purpose: 'Marketing Communications',
      categories: {
        dataSubjects: ['Customers', 'Newsletter subscribers'],
        personalData: ['Email', 'Name', 'Communication preferences'],
        specialCategories: []
      },
      processing: {
        description: 'Send promotional emails and newsletters',
        activities: ['Collection', 'Storage', 'Use'],
        automatedDecisionMaking: true,
        profiling: true
      },
      recipients: {
        internal: ['Marketing Team'],
        external: [
          { name: 'Mailchimp', role: 'Email marketing', location: 'US', safeguards: 'SCCs' }
        ]
      },
      retention: {
        period: 'Until consent withdrawn',
        criteria: 'Consent validity'
      },
      lawfulBasis: {
        basis: 'Consent',
        article: 'Article 6(1)(a)',
        consentRecord: 'CONSENT-MARKETING-v2.0'
      }
    }
  ]
};
```
</gdpr_requirements>

<ccpa_requirements>
**CCPA Implementation Guide:**

```javascript
// CCPA Specific Requirements
class CCPACompliance {
  // Right to Know
  async rightToKnow(userId) {
    // Similar to GDPR access but CCPA-specific categories
    return {
      categories: await this.getCollectedCategories(userId),
      sources: await this.getDataSources(userId),
      purposes: await this.getPurposes(userId),
      thirdParties: await this.getThirdPartyDisclosures(userId)
    };
  }

  // Right to Delete
  async rightToDelete(userId) {
    // Similar to GDPR erasure but with CCPA exceptions
    return await this.processDeletion(userId);
  }

  // Right to Opt-Out of Sale
  async optOutOfSale(userId) {
    await db.users.updateOne(
      { _id: userId },
      { $set: { doNotSellMyInfo: true, optOutDate: new Date() } }
    );
    
    // Notify third parties
    await this.notifyThirdParties(userId, 'opt_out');
  }

  // Right to Non-Discrimination
  // Ensure equal service regardless of privacy choices
  async verifyNonDiscrimination(userId) {
    const user = await db.users.findOne({ _id: userId });
    
    if (user.exercisePrivacyRights) {
      // Verify user receives same quality and price
      const comparison = await this.compareServiceQuality(userId);
      
      if (comparison.discriminated) {
        throw new Error('CCPA violation: Discrimination detected');
      }
    }
  }
}

// "Do Not Sell My Personal Information" link
function DoNotSellLink({ userId }) {
  const [optedOut, setOptedOut] = useState(false);

  const handleOptOut = async () => {
    await fetch('/api/ccpa/opt-out', {
      method: 'POST',
      credentials: 'include'
    });
    setOptedOut(true);
  };

  return (
    <div>
      {optedOut ? (
        <span>✓ You have opted out of data sale</span>
      ) : (
        <button onClick={handleOptOut}>
          Do Not Sell My Personal Information
        </button>
      )}
    </div>
  );
}
```
</ccpa_requirements>

<privacy_checklist>
**Privacy Compliance Checklist:**

### Data Mapping
- [ ] Complete data inventory created
- [ ] Data flows documented
- [ ] Processing purposes identified
- [ ] Lawful basis documented for each purpose
- [ ] Records of Processing Activities (ROPA) maintained

### Consent Management
- [ ] Explicit opt-in consent (no pre-ticked boxes)
- [ ] Granular consent by purpose
- [ ] Easy consent withdrawal
- [ ] Consent audit trail maintained
- [ ] Consent versions tracked

### Data Subject Rights
- [ ] Access request procedure (DSAR)
- [ ] Erasure procedure (Right to be Forgotten)
- [ ] Data portability export
- [ ] Rectification process
- [ ] Objection handling
- [ ] 30-day response SLA

### Privacy Notices
- [ ] Privacy policy published
- [ ] Just-in-time notices implemented
- [ ] Cookie notice with consent
- [ ] Children's privacy notice (if applicable)

### Data Protection
- [ ] Data minimization implemented
- [ ] Retention policies defined
- [ ] Secure deletion procedures
- [ ] Encryption for personal data
- [ ] Access controls implemented

### International Transfers
- [ ] Transfer mechanisms documented
- [ ] SCCs executed where needed
- [ ] Transfer Impact Assessments completed

### Operations
- [ ] Privacy Impact Assessments (PIA/DPIA)
- [ ] Breach notification procedure
- [ ] DPO appointed (if required)
- [ ] Staff privacy training conducted
- [ ] Regular compliance audits scheduled
</privacy_checklist>

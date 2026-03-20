# Security Operations User Setup Guide

This guide covers manual setup steps and human-action checkpoints for Security Operations workflows.

---

## Prerequisites

### Docker for Security Scanning

Security scans use OWASP ZAP via Docker. Install Docker Desktop:

- **Windows:** https://docs.docker.com/desktop/install/windows-install/
- **macOS:** https://docs.docker.com/desktop/install/mac-install/
- **Linux:** https://docs.docker.com/engine/install/

Verify installation:
```bash
docker --version
docker run hello-world
```

---

## Cloud Credentials

### AWS Credentials

For AWS WAF and Secrets Manager operations:

1. **Create IAM User** (if not exists):
   ```bash
   aws iam create-user --user-name ez-security-automation
   ```

2. **Attach Policies**:
   - `AWSWAF_FullAccess` (for WAF management)
   - `SecretsManagerReadWrite` (for secret rotation)

3. **Create Access Key**:
   ```bash
   aws iam create-access-key --user-name ez-security-automation
   ```

4. **Store Credentials Securely**:
   ```bash
   # macOS Keychain
   security add-generic-password -s "ez-agents" -a "aws-access-key" -w "YOUR_ACCESS_KEY"
   security add-generic-password -s "ez-agents" -a "aws-secret-key" -w "YOUR_SECRET_KEY"
   
   # Or use environment variables (temporary)
   export AWS_ACCESS_KEY_ID="..."
   export AWS_SECRET_ACCESS_KEY="..."
   ```

### Cloudflare Credentials

For Cloudflare WAF operations:

1. **Generate API Token**:
   - Go to Cloudflare Dashboard → Profile → API Tokens
   - Create token with `Zone` → `WAF` → `Edit` permissions

2. **Store Securely**:
   ```bash
   # macOS Keychain
   security add-generic-password -s "ez-agents" -a "cloudflare-api-token" -w "YOUR_TOKEN"
   ```

---

## Dashboard-Only WAF Steps

Some WAF configurations require manual dashboard interaction:

### AWS WAF

1. **Navigate to AWS WAF Console**:
   https://console.aws.amazon.com/wafv2/

2. **Select Web ACL**:
   - Choose your application's Web ACL
   - Review current rules

3. **Add Rate-Based Rule**:
   - Click "Add rules" → "Create rule"
   - Select "Rate-based rule"
   - Configure:
     - Name: `RateLimit-Auth`
     - Limit: 2000 requests per 5 minutes
     - Aggregate key type: IP

4. **Enable Logging**:
   - Go to "Logging" tab
   - Click "Add logging"
   - Select Kinesis Data Firehose or S3 bucket

### Cloudflare WAF

1. **Navigate to Cloudflare Dashboard**:
   https://dash.cloudflare.com/

2. **Select Domain** → **Security** → **WAF**

3. **Create Custom Rule**:
   - Click "Create rule"
   - Name: `Rate Limit Login`
   - Field: `URI Path` → `Equals` → `/login`
   - Choose rate limiting threshold
   - Action: `Block` or `Managed Challenge`

4. **Enable Bot Fight Mode** (if available):
   - Security → Bots
   - Toggle "Bot Fight Mode" to On

---

## Break-Glass / Manual Rotation Steps

### Emergency Secret Rotation

When automated rotation fails or during security incidents:

1. **Identify Compromised Secret**:
   ```
   Secret ID: _______________
   Systems Affected: _______________
   ```

2. **Generate New Secret**:
   - Use password manager or secure generator
   - Minimum 32 characters, mixed case, numbers, symbols

3. **Update All Systems**:
   - List all systems using this secret:
     ```
     1. _______________
     2. _______________
     3. _______________
     ```

4. **Verify Functionality**:
   - Test each system with new secret
   - Monitor logs for authentication failures

5. **Revoke Old Secret**:
   - Delete or disable old credential
   - Document revocation time

6. **Post-Incident Review**:
   - Schedule post-mortem within 48 hours
   - Update runbooks with lessons learned

### Break-Glass Access

For emergency access when normal authentication fails:

1. **Contact Security Team**:
   - Primary: _______________
   - Secondary: _______________

2. **Document Justification**:
   ```
   Reason for break-glass: _______________
   Requested by: _______________
   Approved by: _______________
   Time: _______________
   ```

3. **Use Emergency Credentials**:
   - Retrieve from secure storage (e.g., physical safe, separate vault)
   - Use for minimum time necessary
   - Rotate immediately after use

4. **Post-Use Actions**:
   - Change all break-glass credentials
   - File incident report
   - Review access logs

---

## Audit Log Configuration

### Enable Audit Logging

For compliance and security monitoring:

1. **Configure Log Destination**:
   - S3 bucket for long-term storage
   - CloudWatch Logs for real-time monitoring
   - SIEM integration (if available)

2. **Set Retention Policy**:
   - Minimum: 90 days online
   - Archive: 7 years for compliance

3. **Configure Alerts**:
   - Failed authentication attempts (>5 in 5 minutes)
   - Privilege escalation events
   - Secret rotation failures

---

## Compliance Evidence Collection

### For Audits

Maintain these artifacts:

| Artifact | Location | Owner |
|----------|----------|-------|
| Security scan reports | `.planning/security/scans/` | Security Team |
| Secret rotation logs | `.planning/security/rotations/` | Security Team |
| RBAC manifests | `.planning/security/access/` | Security Team |
| Compliance checklists | `.planning/security/evidence/` | Compliance Team |

### Evidence Retention

- **GDPR**: Keep for duration of processing + 3 years
- **HIPAA**: Minimum 6 years
- **SOC 2**: Minimum 1 year (3 recommended)

---

## Troubleshooting

### Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| Docker scan fails | Docker not running | Start Docker Desktop |
| AWS permission denied | Missing IAM policy | Attach required policies |
| Cloudflare API error | Invalid token | Regenerate API token |
| Secret rotation fails | Secret in use | Schedule maintenance window |

### Getting Help

- **Documentation**: `.planning/phases/23-security-operations/`
- **Templates**: `ez-agents/templates/security-*`
- **Incident Runbook**: `ez-agents/templates/incident-runbook.md`

---

*Guide Version: 1.0 | Last Updated: 2026-03-20*

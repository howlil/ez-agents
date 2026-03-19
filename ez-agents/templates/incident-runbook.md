# Incident Runbook: {service-name}

**Version:** v{version} ({tier} tier)
**Last updated:** {date}
**Owner:** {team or individual}

---

## Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 — Critical | Complete outage, data loss | Immediate | App unreachable, DB corruption |
| P1 — High | Major feature broken, many users affected | 15 minutes | Login broken, payments failing |
| P2 — Medium | Feature degraded, workaround exists | 1 hour | Slow responses, non-critical feature down |
| P3 — Low | Minor issue, cosmetic | Next business day | UI glitch, non-critical error |

---

## On-Call Contacts

| Role | Contact | When to Call |
|------|---------|--------------|
| Primary on-call | {name/handle} | P0 and P1 |
| Secondary | {name/handle} | Primary unreachable |
| Database | {name/handle} | DB issues |
| Platform/Infra | {name/handle} | Infrastructure issues |

---

## Quick Diagnostics

### 1. Is the app running?

```bash
curl -f https://{your-domain}/health && echo "UP" || echo "DOWN"
```

### 2. Check recent deployments

```bash
git log --oneline -5  # Recent commits
# Or check your deployment platform dashboard
```

### 3. Check error logs

```bash
# Vercel: vercel logs
# Railway: railway logs
# Generic: tail -100 /var/log/app.log
# Or: check error tracking dashboard (Sentry, etc.)
```

### 4. Check database connectivity

```bash
# Test DB connection
node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\$connect().then(() => { console.log('DB OK'); process.exit(0); })
    .catch(e => { console.error('DB FAIL:', e.message); process.exit(1); });
"
```

---

## Common Incidents and Resolutions

### App is down (P0)

1. Check if recent deployment caused it: `git log --oneline -3`
2. If yes → roll back immediately (see Rollback Procedure)
3. If no → check infrastructure status (hosting provider status page)
4. Check logs for error pattern
5. If DB issue → see DB incident section

### Login/Auth broken (P1)

1. Check auth service logs
2. Verify environment variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, OAuth credentials
3. Check if auth provider (Google, GitHub, etc.) is having issues
4. Test with curl: `curl -X POST /api/auth/signin`
5. If JWT secret rotated → issue new tokens (force re-login acceptable)

### Payments failing (P1)

1. Check payment provider dashboard (Stripe, etc.) for service issues
2. Check webhook delivery in provider dashboard
3. Verify API keys are valid: check for expiry or rotation
4. Check logs for specific Stripe error codes
5. **Do NOT retry failed charges** until root cause identified

### Database full / slow (P1)

1. Check disk usage and connection count
2. Identify slow queries: check database logs or monitoring
3. Kill long-running queries if blocking
4. Check for lock contention
5. Consider read replica if load issue

### High error rate (P2)

1. Check error tracking for error pattern
2. Identify affected endpoints from logs
3. Check if recent deployment correlates
4. Roll back if correlation found
5. Otherwise: hotfix with `/ez:hotfix start {description}`

---

## Rollback Procedure

```bash
# 1. Decision: roll back if P0/P1 persists > {rollback_window}

# 2. Roll back application
vercel rollback  # Vercel
# OR: git revert HEAD && git push  # generic

# 3. Verify health
curl -f https://{your-domain}/health

# 4. Notify stakeholders
# See communication templates below

# 5. Document in post-mortem
```

Full rollback plan: `.planning/releases/v{version}-ROLLBACK-PLAN.md`

---

## Communication Templates

### Customer-facing (P0)

```
[{service-name} Status] Service disruption

We are experiencing a service disruption affecting {impact description}.
Our team is actively working to restore service.

Current status: Investigating
ETA: Unknown (update in 30 minutes)

We apologize for the inconvenience.
```

### Customer-facing (Resolved)

```
[{service-name} Status] Service restored

The service disruption has been resolved at {time}.
All systems are operating normally.

Duration: {duration}
Impact: {description}

We apologize for the disruption. A full post-mortem will be published at {link}.
```

---

## Post-Incident Process

1. **Immediate** (within 1 hour): Write incident timeline in `.planning/incidents/{date}-{title}.md`
2. **Short-term** (within 24 hours): Root cause analysis complete
3. **Follow-up** (within 1 week): Prevention measures implemented

### Post-Mortem Template

```markdown
# Incident Post-Mortem: {title}

**Date:** {date}
**Duration:** {start} – {end} ({total duration})
**Severity:** P{level}
**Impact:** {affected users/features}

## Timeline
- HH:MM — {event}
- HH:MM — {event}

## Root Cause
{Single sentence root cause}

## Contributing Factors
{What made this possible}

## What Went Well
{Detection speed, response time, etc.}

## Action Items
| Action | Owner | Due |
|--------|-------|-----|
| {item} | {person} | {date} |
```

---

*Generated by EZ Agents release-agent*
*Tier: {tier} | Version: v{version}*

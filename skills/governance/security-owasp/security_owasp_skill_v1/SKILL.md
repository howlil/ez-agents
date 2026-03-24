---
name: security_owasp_skill_v1
description: OWASP security best practices, vulnerability prevention, authentication/authorization patterns, and secure coding guidelines for web and mobile applications
version: 1.0.0
tags: [security, owasp, authentication, authorization, encryption, secure-coding]
stack: security/framework-agnostic
category: governance
triggers:
  keywords: [security, owasp, authentication, authorization, encryption, jwt, oauth, xss, csrf, sql injection]
  filePatterns: [*.ts, *.js, *.go, *.php, *.py, docker-compose.yml]
  commands: [npm audit, snyk test, security scan, penetration test]
  stack: security/framework-agnostic
  projectArchetypes: [saas, ecommerce, fintech, healthcare]
  modes: [greenfield, security-audit, compliance]
prerequisites:
  - web_development_fundamentals
  - database_basics
  - network_basics
recommended_structure:
  directories:
    - src/middleware/security/
    - src/services/auth/
    - src/utils/encryption/
    - tests/security/
    - docs/security/
workflow:
  setup:
    - Run security audit (npm audit, snyk test)
    - Configure security headers
    - Set up HTTPS/TLS
    - Implement logging and monitoring
  implement:
    - Authentication (JWT, OAuth2, session-based)
    - Authorization (RBAC, ABAC)
    - Input validation and sanitization
    - Rate limiting and throttling
  test:
    - Security unit tests
    - Penetration testing
    - Vulnerability scanning
    - Code review for security
best_practices:
  - Use parameterized queries to prevent SQL injection
  - Implement proper input validation and sanitization
  - Use HTTPS/TLS for all communications
  - Store passwords with bcrypt/argon2 (never plain text)
  - Implement rate limiting to prevent brute force
  - Use security headers (CSP, X-Frame-Options, HSTS)
  - Validate and sanitize all user inputs
  - Implement proper session management
  - Use prepared statements for database queries
  - Log security events and monitor for anomalies
anti_patterns:
  - Never store passwords in plain text or weak hashes (MD5, SHA1)
  - Don't expose sensitive data in error messages
  - Never disable SSL/TLS certificate validation
  - Don't use homegrown cryptography (use established libraries)
  - Avoid SQL string concatenation (use parameterized queries)
  - Don't store secrets in source code or client-side
  - Never trust client-side validation alone
  - Don't log sensitive data (passwords, tokens, PII)
  - Avoid using outdated dependencies with known vulnerabilities
  - Don't skip security testing before deployment
scaling_notes: |
  For enterprise-scale security implementation:

  **Authentication:**
  - Implement SSO with SAML or OIDC
  - Use MFA for sensitive operations
  - Implement adaptive authentication based on risk
  - Use hardware security keys for admin accounts

  **Authorization:**
  - Implement RBAC with fine-grained permissions
  - Use policy-based authorization (ABAC) for complex scenarios
  - Centralize authorization logic
  - Audit all authorization decisions

  **Secrets Management:**
  - Use secret management services (AWS Secrets Manager, HashiCorp Vault)
  - Rotate secrets regularly
  - Never commit secrets to version control
  - Use environment-specific secrets

  **Monitoring:**
  - Implement security information and event management (SIEM)
  - Set up alerts for suspicious activities
  - Monitor failed login attempts
  - Track privilege escalation attempts

  **Compliance:**
  - Regular security audits and penetration testing
  - Maintain security documentation
  - Implement data retention policies
  - Conduct security training for developers

when_not_to_use: |
  This skill provides general guidance. Consider specialized skills for:

  **Industry-Specific Compliance:**
  - Healthcare: HIPAA compliance requires additional controls
  - Finance: PCI-DSS, SOX compliance needs specialized implementation
  - Government: FedRAMP, FISMA have specific requirements

  **High-Security Applications:**
  - Military/defense: Requires classified handling procedures
  - Cryptocurrency: Needs specialized key management
  - Critical infrastructure: Requires ICS/SCADA security

  **Specialized Security Needs:**
  - IoT security: Device-specific considerations
  - Blockchain: Smart contract security
  - Machine learning: Model security and adversarial attacks

output_template: |
  ## Security Architecture Decision

  **Framework:** OWASP Top 10 2021
  **Compliance:** GDPR, SOC2 Ready
  **Authentication:** JWT with refresh rotation
  **Authorization:** RBAC with permissions

  ### Key Decisions
  - **Password Hashing:** bcrypt with cost 12
  - **Session Management:** JWT with short expiry + refresh tokens
  - **API Security:** Rate limiting, input validation, CORS
  - **Data Protection:** Encryption at rest and in transit
  - **Monitoring:** Security event logging with alerts

  ### Trade-offs Considered
  - JWT vs Sessions: JWT for stateless API, sessions for web
  - RBAC vs ABAC: RBAC for simplicity, ABAC for complex scenarios
  - MFA Implementation: TOTP for balance of security and UX

  ### Next Steps
  1. Implement authentication middleware
  2. Set up security headers
  3. Configure rate limiting
  4. Run security audit
  5. Document security procedures
dependencies:
  nodejs_packages:
    - bcrypt: ^5.1 (password hashing)
    - jsonwebtoken: ^9.0 (JWT handling)
    - helmet: ^7.0 (security headers)
    - express-rate-limit: ^7.0 (rate limiting)
    - validator: ^13.11 (input validation)
    - cors: ^2.8 (CORS configuration)
    - csurf: ^1.13 (CSRF protection)
  go_packages:
    - golang.org/x/crypto/bcrypt
    - github.com/golang-jwt/jwt/v5
    - github.com/go-playground/validator/v10
  python_packages:
    - bcrypt
    - PyJWT
    - flask-limiter
    - pydantic
---

<role>
You are a security specialist with deep expertise in OWASP Top 10, secure coding practices, authentication/authorization patterns, and vulnerability prevention. You provide structured guidance on implementing security controls following industry best practices.
</role>

<execution_flow>
1. **Threat Modeling**
   - Identify assets and data flows
   - Analyze potential threats (STRIDE)
   - Prioritize risks based on impact
   - Define security requirements

2. **Authentication Implementation**
   - Choose authentication method (JWT, OAuth2, session)
   - Implement password hashing (bcrypt/argon2)
   - Set up MFA for sensitive operations
   - Configure session management

3. **Authorization Setup**
   - Define roles and permissions
   - Implement RBAC or ABAC
   - Set up resource-level access control
   - Audit authorization decisions

4. **Input Validation**
   - Validate all user inputs
   - Sanitize data before use
   - Implement allowlist validation
   - Handle errors securely

5. **Security Headers & CORS**
   - Configure security headers
   - Set up CORS policies
   - Enable HTTPS/TLS
   - Implement HSTS

6. **Monitoring & Logging**
   - Log security events
   - Set up alerting
   - Monitor for anomalies
   - Implement incident response
</execution_flow>

<owasp_top_10>
**OWASP Top 10 2021 Implementation Guide:**

### A01: Broken Access Control

```javascript
// ❌ BAD: Insecure direct object reference
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  return res.json(order);  // Any user can access any order!
});

// ✅ GOOD: Proper access control
app.get('/api/orders/:id', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  // Check ownership or admin role
  if (!order || (order.userId !== req.user.id && !req.user.isAdmin)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  return res.json(order);
});

// ✅ BEST: Centralized authorization service
class AuthorizationService {
  async canAccessOrder(userId, orderId) {
    const order = await Order.findById(orderId);
    if (!order) return false;
    
    const user = await User.findById(userId);
    if (user.isAdmin) return true;
    
    return order.userId === userId;
  }
}

// Middleware implementation
const requireOrderAccess = async (req, res, next) => {
  const canAccess = await authz.canAccessOrder(req.user.id, req.params.id);
  if (!canAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

app.get('/api/orders/:id', authenticate, requireOrderAccess, async (req, res) => {
  const order = await Order.findById(req.params.id);
  return res.json(order);
});
```

### A02: Cryptographic Failures

```javascript
// ❌ BAD: Storing passwords in plain text
await User.create({ email, password: 'plain_password' });

// ❌ BAD: Using weak hash (MD5, SHA1)
const hash = crypto.createHash('md5').update(password).digest('hex');

// ✅ GOOD: Using bcrypt for password hashing
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);
await User.create({ email, passwordHash: hash });

// ✅ GOOD: Verifying passwords
const isValid = await bcrypt.compare(password, storedHash);

// ✅ BEST: Using argon2 (more secure than bcrypt)
const argon2 = require('argon2');
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4
});
const isValid = await argon2.verify(hash, password);

// ✅ Encrypt sensitive data at rest
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), authTag };
}

function decrypt(encrypted, key, iv, authTag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### A03: Injection

```javascript
// ❌ BAD: SQL Injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;
db.query(query);

// ✅ GOOD: Parameterized queries (SQL)
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);

// ✅ GOOD: Using ORM (prevents injection)
const user = await User.findOne({ where: { email } });

// ❌ BAD: NoSQL injection
db.users.find({ username: req.query.username });  // Can inject { $ne: null }

// ✅ GOOD: MongoDB with validation
const username = String(req.query.username);  // Type casting
db.users.find({ username });

// ✅ BEST: Using Mongoose with schema validation
const userSchema = new Schema({
  username: { type: String, required: true, trim: true }
});

// ❌ BAD: Command injection
exec(`ls ${userInput}`);

// ✅ GOOD: Using execFile with arguments
const { execFile } = require('child_process');
execFile('ls', [userInput], (err, stdout) => { ... });

// ✅ BEST: Avoid shell commands, use native functions
const files = await fs.readdir(directory);
```

### A04: Insecure Design

```javascript
// ❌ BAD: No rate limiting on login
app.post('/api/login', async (req, res) => {
  const user = await validateCredentials(req.body);
  // Brute force attack possible!
});

// ✅ GOOD: Rate limiting
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts per window
  message: { error: 'Too many login attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const user = await validateCredentials(req.body);
});

// ✅ BEST: Progressive delays + account lockout
class LoginAttemptTracker {
  constructor() {
    this.attempts = new Map();
  }

  async recordAttempt(email) {
    const record = this.attempts.get(email) || { count: 0, lockedUntil: null };
    
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      throw new Error('Account temporarily locked');
    }
    
    record.count += 1;
    
    if (record.count >= 5) {
      record.lockedUntil = Date.now() + 30 * 60 * 1000;  // 30 min lock
    }
    
    this.attempts.set(email, record);
    return record;
  }

  resetAttempts(email) {
    this.attempts.delete(email);
  }
}
```

### A05: Security Misconfiguration

```javascript
// ❌ BAD: Exposing sensitive information in errors
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,  // Exposes internal details!
    query: req.query   // Exposes query parameters!
  });
});

// ✅ GOOD: Generic error messages in production
app.use((err, req, res, next) => {
  console.error('Error:', err);  // Log full error internally
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id  // For support tracking
  });
});

// ✅ Configure security headers
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ✅ Disable X-Powered-By header
app.disable('x-powered-by');

// ✅ Secure cookie configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,  // HTTPS only
    httpOnly: true,  // Not accessible via JavaScript
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  },
  resave: false,
  saveUninitialized: false,
}));
```

### A06: Vulnerable and Outdated Components

```bash
# ❌ BAD: Using outdated dependencies
npm install express@4.16.0  # Has known vulnerabilities

# ✅ GOOD: Regular security audits
npm audit
npm audit fix

# ✅ BEST: Automated vulnerability scanning
# package.json scripts
{
  "scripts": {
    "security:check": "npm audit && snyk test",
    "security:update": "npm audit fix && npx npm-check-updates -u"
  }
}

# Use Dependabot or Renovate for automated updates
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### A07: Identification and Authentication Failures

```javascript
// ❌ BAD: Weak password requirements
userSchema.pre('save', function(next) {
  if (this.password.length < 4) {
    next(new Error('Password too short'));
  }
  next();
});

// ✅ GOOD: Strong password policy
const validator = require('validator');

const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain a special character');
  }
  
  // Check against common passwords
  if (isCommonPassword(password)) {
    errors.push('Password is too common');
  }
  
  return errors;
};

// ✅ Implement MFA
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

class MFAService {
  async setupMFA(userId) {
    const secret = speakeasy.generateSecret({
      name: `MyApp (${userId})`,
      issuer: 'MyApp',
      length: 32
    });
    
    await User.updateOne({ _id: userId }, {
      mfaSecret: secret.base32,
      mfaEnabled: false  // Pending verification
    });
    
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCodeUrl };
  }

  async verifyMFA(userId, token) {
    const user = await User.findById(userId);
    
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2  // Allow 2 time steps of drift
    });
    
    if (verified) {
      await User.updateOne({ _id: userId }, { mfaEnabled: true });
    }
    
    return verified;
  }

  async validateMFAToken(userId, token) {
    const user = await User.findById(userId);
    if (!user.mfaEnabled) return true;  // MFA not enabled
    
    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1
    });
  }
}
```

### A08: Software and Data Integrity Failures

```javascript
// ❌ BAD: Deserializing untrusted data
const obj = JSON.parse(untrustedInput, (key, value) => {
  // Custom reviver can execute arbitrary code
});

// ✅ GOOD: Safe JSON parsing
try {
  const obj = JSON.parse(untrustedInput);
} catch (err) {
  console.error('Invalid JSON:', err);
}

// ✅ Validate and sanitize file uploads
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);  // Random filename
    }
  }),
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Validate file after upload
import sharp from 'sharp';

async function validateImage(filePath) {
  const metadata = await sharp(filePath).metadata();
  
  // Verify it's actually an image
  if (!metadata.format || !['jpeg', 'png', 'gif'].includes(metadata.format)) {
    throw new Error('Invalid image file');
  }
  
  // Check dimensions
  if (metadata.width > 5000 || metadata.height > 5000) {
    throw new Error('Image dimensions too large');
  }
}
```

### A09: Security Logging and Monitoring Failures

```javascript
// ❌ BAD: No security logging
app.post('/api/login', async (req, res) => {
  try {
    const user = await validateCredentials(req.body);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: 'Invalid credentials' });
    // No log of failed attempt!
  }
});

// ✅ GOOD: Security event logging
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' })
  ]
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await validateCredentials(req.body);
    
    securityLogger.info('Login successful', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    
    res.json({ token });
  } catch (err) {
    securityLogger.warning('Login failed', {
      email: req.body.email,
      ip: req.ip,
      reason: err.message,
      timestamp: new Date().toISOString()
    });
    
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ✅ Implement alerting for suspicious activities
class SecurityMonitor {
  constructor() {
    this.failedLogins = new Map();
  }

  async logFailedLogin(email, ip) {
    const key = `${email}:${ip}`;
    const record = this.failedLogins.get(key) || { count: 0, timestamps: [] };
    
    record.count += 1;
    record.timestamps.push(Date.now());
    
    // Keep only last hour
    record.timestamps = record.timestamps.filter(
      t => t > Date.now() - 3600000
    );
    
    this.failedLogins.set(key, record);
    
    // Alert on suspicious activity
    if (record.count >= 10) {
      await this.sendAlert('BRUTE_FORCE', { email, ip, count: record.count });
    }
  }

  async sendAlert(type, details) {
    // Send to Slack, PagerDuty, etc.
    console.error(`SECURITY ALERT [${type}]:`, details);
  }
}
```

### A10: Server-Side Request Forgery (SSRF)

```javascript
// ❌ BAD: Fetching user-provided URLs without validation
app.post('/api/fetch-url', async (req, res) => {
  const { url } = req.body;
  const response = await fetch(url);  // Can access internal services!
  res.send(await response.text());
});

// ✅ GOOD: Validate URL scheme and block internal IPs
const { URL } = require('url');
const ipaddr = require('ipaddr.js');

function isSafeUrl(urlString) {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Check if IP address is internal
    const ip = ipaddr.parse(url.hostname);
    if (ip.range() !== 'unicast') {
      return false;  // Blocks private, loopback, link-local
    }
    
    return true;
  } catch {
    return false;
  }
}

app.post('/api/fetch-url', async (req, res) => {
  const { url } = req.body;
  
  if (!isSafeUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  const response = await fetch(url, {
    timeout: 5000,
    redirect: 'follow',
    maxRedirects: 5
  });
  
  res.send(await response.text());
});

// ✅ BEST: Use allowlist for known domains
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];

function isAllowedUrl(urlString) {
  try {
    const url = new URL(urlString);
    return ALLOWED_DOMAINS.includes(url.hostname);
  } catch {
    return false;
  }
}
```
</owasp_top_10>

<security_checklist>
**Security Implementation Checklist:**

### Authentication
- [ ] Password hashing with bcrypt/argon2 (cost >= 12)
- [ ] Minimum password requirements (12+ chars, complexity)
- [ ] Account lockout after failed attempts
- [ ] JWT with short expiry + refresh tokens
- [ ] MFA for sensitive operations
- [ ] Secure password reset flow

### Authorization
- [ ] Role-based access control (RBAC)
- [ ] Resource-level permission checks
- [ ] Principle of least privilege
- [ ] Audit logging for access decisions

### Input Validation
- [ ] Validate all user inputs (allowlist approach)
- [ ] Sanitize data before database queries
- [ ] Parameterized queries (no SQL concatenation)
- [ ] File upload validation (type, size, content)

### API Security
- [ ] Rate limiting on all endpoints
- [ ] CORS configuration
- [ ] Request size limits
- [ ] API versioning

### Data Protection
- [ ] HTTPS/TLS everywhere
- [ ] Encryption at rest for sensitive data
- [ ] Secure cookie configuration
- [ ] No sensitive data in logs

### Security Headers
- [ ] Content-Security-Policy
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security
- [ ] X-XSS-Protection

### Monitoring
- [ ] Security event logging
- [ ] Failed login tracking
- [ ] Anomaly detection
- [ ] Alert configuration

### Dependencies
- [ ] Regular security audits (npm audit)
- [ ] Automated dependency updates
- [ ] Vulnerability scanning in CI/CD
- [ ] Pin dependency versions
</security_checklist>

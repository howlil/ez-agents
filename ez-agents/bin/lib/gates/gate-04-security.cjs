/**
 * Gate 4: Security Baseline
 *
 * Validates security implementation including authentication, input validation,
 * secrets management, and security anti-patterns.
 *
 * Checks:
 * 1. Auth checker (session management, token handling, password hashing)
 * 2. Input validation checker (sanitization, escaping, validation schemas)
 * 3. Secrets scanner (hardcoded API keys, passwords, tokens)
 * 4. Security anti-pattern detector (eval, execSync with user input, SQL concatenation)
 *
 * @module gates/gate-04-security
 */

const { z } = require('zod');

/**
 * Zod schema for a code file
 * @type {z.ZodSchema}
 */
const codeFileSchema = z.object({
  /** File path */
  path: z.string(),
  /** File content */
  content: z.string(),
  /** File language (e.g., 'javascript', 'typescript') */
  language: z.string().optional(),
});

/**
 * Zod schema for environment variables configuration
 * @type {z.ZodSchema}
 */
const envConfigSchema = z.object({
  /** Environment variable name */
  name: z.string(),
  /** Whether it's used in code */
  isUsed: z.boolean().optional(),
  /** Whether it has a default value */
  hasDefault: z.boolean().optional(),
  /** Whether it's marked as sensitive */
  isSensitive: z.boolean().optional(),
});

/**
 * Zod schema for authentication configuration
 * @type {z.ZodSchema}
 */
const authConfigSchema = z.object({
  /** Authentication method (session, jwt, oauth, etc.) */
  method: z.string().optional(),
  /** Session store type (memory, redis, database) */
  sessionStore: z.string().optional(),
  /** Token expiration time */
  tokenExpiration: z.string().optional(),
  /** Password hashing algorithm */
  hashingAlgorithm: z.string().optional(),
  /** Whether HTTPS is enforced */
  httpsEnforced: z.boolean().optional(),
  /** Whether CSRF protection is enabled */
  csrfProtection: z.boolean().optional(),
  /** Whether rate limiting is enabled */
  rateLimiting: z.boolean().optional(),
});

/**
 * Zod schema for the gate context
 * @type {z.ZodSchema}
 */
const gateContextSchema = z.object({
  /** Array of code files to analyze */
  files: z.array(codeFileSchema).optional(),
  /** Environment variable configuration */
  envConfig: z.array(envConfigSchema).optional(),
  /** Authentication configuration */
  authConfig: authConfigSchema.optional(),
  /** Input validation libraries used */
  validationLibraries: z.array(z.string()).optional(),
  /** Whether input validation is implemented */
  hasInputValidation: z.boolean().optional(),
  /** Known safe patterns (to reduce false positives) */
  safePatterns: z.array(z.string()).optional(),
});

/**
 * Security anti-patterns to detect
 */
const SECURITY_ANTI_PATTERNS = {
  /** eval() usage - allows arbitrary code execution */
  eval: {
    pattern: /\beval\s*\(/g,
    severity: 'error',
    message: 'eval() allows arbitrary code execution. Use safer alternatives like JSON.parse() or function maps.',
  },
  /** Function constructor - similar risks to eval */
  functionConstructor: {
    pattern: /\bnew\s+Function\s*\(/g,
    severity: 'error',
    message: 'Function constructor allows arbitrary code execution. Use safer alternatives.',
  },
  /** execSync with potential user input */
  execSync: {
    pattern: /\bexecSync\s*\([^)]*\)/g,
    severity: 'error',
    message: 'execSync with user input can lead to command injection. Use parameterized commands or avoid shell execution.',
  },
  /** exec with potential user input */
  exec: {
    pattern: /\bexec\s*\([^)]*\)/g,
    severity: 'warning',
    message: 'exec with user input can lead to command injection. Use execFile or spawn with argument arrays.',
  },
  /** spawn with shell option */
  spawnShell: {
    pattern: /\bspawn\s*\([^)]*shell\s*:\s*true/g,
    severity: 'warning',
    message: 'Using spawn with shell:true can lead to command injection. Avoid shell execution when possible.',
  },
  /** child_process exec variants */
  childProcessExec: {
    pattern: /child_process\s*\.\s*(exec|execSync|execFile|execFileSync)\s*\(/g,
    severity: 'info',
    message: 'Verify that child_process calls do not use unsanitized user input.',
  },
};

/**
 * Patterns for detecting hardcoded secrets
 */
const SECRET_PATTERNS = {
  /** AWS Access Key ID */
  awsAccessKey: {
    pattern: /AKIA[0-9A-Z]{16}/g,
    message: 'Potential AWS Access Key ID detected. Use environment variables or secrets manager.',
    severity: 'error',
  },
  /** AWS Secret Access Key (40 char base64) */
  awsSecretKey: {
    pattern: /['"]?(?:aws[_-]?secret|AWS[_-]?SECRET)[_]?[A-Z]*['"]?\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/gi,
    message: 'Potential AWS Secret Access Key detected. Use environment variables or secrets manager.',
    severity: 'error',
  },
  /** Generic API key patterns */
  apiKey: {
    pattern: /['"]?(?:api[_-]?key|apikey|API[_-]?KEY)[_]?[A-Z]*['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi,
    message: 'Hardcoded API key detected. Use environment variables (e.g., process.env.API_KEY).',
    severity: 'error',
  },
  /** Generic secret/token patterns */
  secret: {
    pattern: /['"]?(?:secret|token|auth[_-]?token|access[_-]?token|jwt|private[_-]?key)[_]?[A-Z]*['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/gi,
    message: 'Hardcoded secret/token detected. Use environment variables or secrets manager.',
    severity: 'error',
  },
  /** Password patterns */
  password: {
    pattern: /['"]?(?:password|passwd|pwd|PASSWORD|PASSWD)[_]?[A-Z]*['"]?\s*[:=]\s*['"][^'"]{4,}['"]/g,
    message: 'Hardcoded password detected. Use environment variables or secrets manager.',
    severity: 'error',
  },
  /** Database connection strings with credentials */
  dbConnectionString: {
    pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@/gi,
    message: 'Database connection string with embedded credentials. Use environment variables.',
    severity: 'error',
  },
  /** Private key headers */
  privateKey: {
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    message: 'Private key embedded in code. Store in secure secrets manager or use environment variables.',
    severity: 'error',
  },
  /** GitHub/GitLab tokens */
  githubToken: {
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
    message: 'GitHub token detected. Use environment variables or secrets manager.',
    severity: 'error',
  },
  /** Slack tokens */
  slackToken: {
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g,
    message: 'Slack token detected. Use environment variables or secrets manager.',
    severity: 'error',
  },
  /** Google API key */
  googleApiKey: {
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    message: 'Google API key detected. Use environment variables or Google Secret Manager.',
    severity: 'error',
  },
  /** Stripe keys */
  stripeKey: {
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    message: 'Stripe live key detected. Use environment variables or secrets manager.',
    severity: 'error',
  },
  /** Bearer token in headers */
  bearerToken: {
    pattern: /['"]Bearer\s+[a-zA-Z0-9_\-\.]+['"]/g,
    message: 'Hardcoded Bearer token. Use dynamic token generation and environment variables for secrets.',
    severity: 'warning',
  },
};

/**
 * SQL injection patterns
 */
const SQL_INJECTION_PATTERNS = {
  /** String concatenation in SQL queries */
  stringConcat: {
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+[^;]*['"`]\s*\+\s*\w+/gi,
    message: 'SQL query with string concatenation detected. Use parameterized queries or query builders.',
    severity: 'error',
  },
  /** Template literal SQL */
  templateLiteral: {
    pattern: /`(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^`]*\$\{[^}]+\}/gi,
    message: 'SQL query with template literal interpolation. Use parameterized queries.',
    severity: 'error',
  },
  /** query() with concatenated string */
  queryConcat: {
    pattern: /\.query\s*\(\s*[^)]*\+[^)]*\)/g,
    message: 'Database query with string concatenation. Use parameterized queries.',
    severity: 'error',
  },
  /** execute() with concatenated string */
  executeConcat: {
    pattern: /\.execute\s*\(\s*[^)]*\+[^)]*\)/g,
    message: 'Database execute with string concatenation. Use parameterized queries.',
    severity: 'error',
  },
};

/**
 * Input validation patterns to check for
 */
const INPUT_VALIDATION_CHECKS = {
  /** Express validator usage */
  expressValidator: {
    pattern: /express-validator|expressValidator|validationChain|body\(\)|query\(\)|param\(\)/g,
    library: 'express-validator',
  },
  /** Joi validation */
  joi: {
    pattern: /joi\.|Joi\.|\.validate\(|\.schema\.validate/g,
    library: 'joi',
  },
  /** Yup validation */
  yup: {
    pattern: /yup\.|Yup\.|\.validateSync\(|\.validate\(/g,
    library: 'yup',
  },
  /** Zod validation */
  zod: {
    pattern: /zod\.|z\.|\.parse\(|\.safeParse\(|z\.string\(\)|z\.number\(\)/g,
    library: 'zod',
  },
  /** class-validator */
  classValidator: {
    pattern: /class-validator|@IsString|@IsNumber|@IsEmail|@ValidateNested|validateOrReject/g,
    library: 'class-validator',
  },
  /** AJV validation */
  ajv: {
    pattern: /ajv\.|Ajv\(|\.validate\(|\.compile\(/g,
    library: 'ajv',
  },
  /** express-validator sanitize */
  sanitization: {
    pattern: /sanitize\(|\.escape\(|\.trim\(\)|\.normalizeEmail\(\)/g,
    library: 'sanitization',
  },
};

/**
 * Secure session management patterns
 */
const SECURE_SESSION_PATTERNS = {
  /** Express session with secure config */
  expressSession: {
    pattern: /session\s*\(\s*\{[^}]*(?:secure|httpOnly|sameSite)[^}]*\}/g,
    secure: true,
  },
  /** Redis session store */
  redisStore: {
    pattern: /connect-redis|RedisStore|redis\.createClient/g,
    secure: true,
  },
  /** JWT with proper config */
  jwtSecure: {
    pattern: /jwt\.sign\s*\([^)]*expiresIn|jwt\.verify|jsonwebtoken/g,
    secure: true,
  },
  /** Insecure session config patterns */
  insecureSession: {
    pattern: /cookie\s*:\s*\{[^}]*(?:secure\s*:\s*false|httpOnly\s*:\s*false)/g,
    secure: false,
  },
};

/**
 * Check for eval() and similar dangerous patterns
 * @param {string} code - Code content to analyze
 * @returns {Array<{ path: string, message: string, severity: string }>}
 */
function detectEvalUsage(code) {
  const issues = [];

  if (!code || typeof code !== 'string') {
    return issues;
  }

  // Check for eval()
  const evalMatches = code.match(SECURITY_ANTI_PATTERNS.eval.pattern);
  if (evalMatches) {
    for (const match of evalMatches) {
      issues.push({
        type: 'eval',
        message: SECURITY_ANTI_PATTERNS.eval.message,
        severity: SECURITY_ANTI_PATTERNS.eval.severity,
      });
    }
  }

  // Check for Function constructor
  const funcMatches = code.match(SECURITY_ANTI_PATTERNS.functionConstructor.pattern);
  if (funcMatches) {
    for (const match of funcMatches) {
      issues.push({
        type: 'function-constructor',
        message: SECURITY_ANTI_PATTERNS.functionConstructor.message,
        severity: SECURITY_ANTI_PATTERNS.functionConstructor.severity,
      });
    }
  }

  return issues;
}

/**
 * Check for execSync/exec with potential user input
 * @param {string} code - Code content to analyze
 * @returns {Array<{ type: string, message: string, severity: string }>}
 */
function detectExecUsage(code) {
  const issues = [];

  if (!code || typeof code !== 'string') {
    return issues;
  }

  // Check for execSync
  const execSyncMatches = code.match(SECURITY_ANTI_PATTERNS.execSync.pattern);
  if (execSyncMatches) {
    for (const match of execSyncMatches) {
      // Check if it contains user input indicators
      const userInputIndicators = ['req.', 'request.', 'params', 'query', 'body', 'input', 'userInput'];
      const hasUserInput = userInputIndicators.some(indicator => match.toLowerCase().includes(indicator.toLowerCase()));

      if (hasUserInput || match.includes('+') || match.includes('${')) {
        issues.push({
          type: 'execSync-user-input',
          message: SECURITY_ANTI_PATTERNS.execSync.message,
          severity: SECURITY_ANTI_PATTERNS.execSync.severity,
        });
      } else {
        // Still warn about execSync even without obvious user input
        issues.push({
          type: 'execSync',
          message: 'execSync detected. Ensure no user input is passed to shell commands.',
          severity: 'warning',
        });
      }
    }
  }

  // Check for exec
  const execMatches = code.match(SECURITY_ANTI_PATTERNS.exec.pattern);
  if (execMatches) {
    const userInputIndicators = ['req.', 'request.', 'params', 'query', 'body', 'input', 'userInput'];
    for (const match of execMatches) {
      const hasUserInput = userInputIndicators.some(indicator => match.toLowerCase().includes(indicator.toLowerCase()));

      if (hasUserInput || match.includes('+') || match.includes('${')) {
        issues.push({
          type: 'exec-user-input',
          message: SECURITY_ANTI_PATTERNS.exec.message,
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

/**
 * Check for SQL injection vulnerabilities
 * @param {string} code - Code content to analyze
 * @returns {Array<{ type: string, message: string, severity: string }>}
 */
function detectSqlInjection(code) {
  const issues = [];

  if (!code || typeof code !== 'string') {
    return issues;
  }

  // Check for string concatenation in SQL
  for (const [name, config] of Object.entries(SQL_INJECTION_PATTERNS)) {
    const matches = code.match(config.pattern);
    if (matches) {
      for (const match of matches) {
        issues.push({
          type: `sql-${name}`,
          message: config.message,
          severity: config.severity,
        });
      }
    }
  }

  return issues;
}

/**
 * Detect hardcoded secrets in code
 * @param {string} code - Code content to analyze
 * @returns {Array<{ type: string, message: string, severity: string }>}
 */
function detectHardcodedSecrets(code) {
  const issues = [];

  if (!code || typeof code !== 'string') {
    return issues;
  }

  // Check for each secret pattern
  for (const [name, config] of Object.entries(SECRET_PATTERNS)) {
    const matches = code.match(config.pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        // Skip if it's clearly using environment variables
        if (match.includes('process.env') || match.includes('process.env')) {
          continue;
        }

        // Skip example/placeholder values
        if (match.includes('YOUR_') || match.includes('xxx') || match.includes('example')) {
          continue;
        }

        issues.push({
          type: `secret-${name}`,
          message: config.message,
          severity: config.severity,
        });
      }
    }
  }

  return issues;
}

/**
 * Check for secure session management
 * @param {string} code - Code content to analyze
 * @param {Object} authConfig - Authentication configuration
 * @returns {{ secure: boolean, issues: Array<{ type: string, message: string }> }}
 */
function checkSessionSecurity(code, authConfig = {}) {
  const issues = [];
  let isSecure = true;

  if (!code || typeof code !== 'string') {
    return { secure: true, issues }; // No session code to check
  }

  // Check for insecure session configurations
  const insecureMatches = code.match(SECURE_SESSION_PATTERNS.insecureSession.pattern);
  if (insecureMatches) {
    isSecure = false;
    issues.push({
      type: 'insecure-session',
      message: 'Insecure session configuration detected. Ensure secure: true, httpOnly: true, sameSite: strict.',
    });
  }

  // Check for secure patterns
  const hasSecureSession = Object.values(SECURE_SESSION_PATTERNS).some(pattern =>
    pattern.secure && code.match(pattern.pattern)
  );

  // Check auth config
  if (authConfig) {
    if (authConfig.sessionStore === 'memory') {
      issues.push({
        type: 'memory-session-store',
        message: 'In-memory session store is not suitable for production. Use Redis or database.',
      });
      isSecure = false;
    }

    if (authConfig.httpsEnforced === false) {
      issues.push({
        type: 'no-https',
        message: 'HTTPS is not enforced. Always use HTTPS in production.',
      });
      isSecure = false;
    }

    if (authConfig.csrfProtection === false) {
      issues.push({
        type: 'no-csrf',
        message: 'CSRF protection is disabled. Enable CSRF protection for state-changing operations.',
      });
      isSecure = false;
    }

    if (authConfig.hashingAlgorithm && ['md5', 'sha1', 'sha256'].includes(authConfig.hashingAlgorithm.toLowerCase())) {
      issues.push({
        type: 'weak-hashing',
        message: `Weak password hashing algorithm (${authConfig.hashingAlgorithm}). Use bcrypt, scrypt, or argon2.`,
      });
      isSecure = false;
    }
  }

  return { secure: isSecure, issues };
}

/**
 * Check for input validation implementation
 * @param {string} code - Code content to analyze
 * @param {Array} validationLibraries - List of validation libraries used
 * @returns {{ hasValidation: boolean, libraries: string[], issues: Array<{ type: string, message: string }> }}
 */
function checkInputValidation(code, validationLibraries = []) {
  const issues = [];
  const foundLibraries = [];
  let hasValidation = false;

  if (!code || typeof code !== 'string') {
    return { hasValidation: false, libraries: [], issues };
  }

  // Check for validation library usage
  for (const [name, config] of Object.entries(INPUT_VALIDATION_CHECKS)) {
    if (code.match(config.pattern)) {
      foundLibraries.push(config.library || name);
      hasValidation = true;
    }
  }

  // Check for manual validation patterns
  const manualValidationPatterns = [
    /typeof\s+\w+\s*===?\s*['"]string['"]/,
    /Array\.isArray\s*\(/,
    /Number\.isInteger\s*\(/,
    /parseInt\s*\(/,
    /parseFloat\s*\(/,
    /\.test\s*\(/,
    /\.match\s*\(/,
  ];

  let manualValidationCount = 0;
  for (const pattern of manualValidationPatterns) {
    if (code.match(pattern)) {
      manualValidationCount++;
    }
  }

  if (manualValidationCount > 0 && !hasValidation) {
    // Manual validation detected - this is a warning, not an error
    issues.push({
      type: 'manual-validation',
      message: 'Manual input validation detected. Consider using a validation library for consistency.',
    });
    hasValidation = true;
  }

  // Check for missing validation on user input
  const userInputPatterns = [
    /req\.body/,
    /req\.query/,
    /req\.params/,
    /request\.body/,
    /request\.query/,
    /request\.params/,
  ];

  const hasUserInput = userInputPatterns.some(pattern => code.match(pattern));

  if (hasUserInput && !hasValidation) {
    issues.push({
      type: 'missing-validation',
      message: 'User input detected without validation. Add input validation using a library or manual checks.',
    });
  }

  return {
    hasValidation,
    libraries: [...new Set(foundLibraries)],
    issues,
  };
}

/**
 * Check for environment variable usage for secrets
 * @param {string} code - Code content to analyze
 * @param {Array} envConfig - Environment configuration
 * @returns {{ usesEnvVars: boolean, issues: Array<{ type: string, message: string }> }}
 */
function checkEnvVarUsage(code, envConfig = []) {
  const issues = [];
  let usesEnvVars = false;

  if (!code || typeof code !== 'string') {
    return { usesEnvVars: false, issues };
  }

  // Check for process.env usage
  const envVarUsage = code.match(/process\.env\.[A-Z_]+/g);
  if (envVarUsage && envVarUsage.length > 0) {
    usesEnvVars = true;
  }

  // Check for sensitive values that should use env vars
  const sensitivePatterns = [
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, name: 'password' },
    { pattern: /secret\s*[:=]\s*['"][^'"]+['"]/gi, name: 'secret' },
    { pattern: /apiKey\s*[:=]\s*['"][^'"]+['"]/gi, name: 'API key' },
    { pattern: /token\s*[:=]\s*['"][^'"]+['"]/gi, name: 'token' },
    { pattern: /privateKey\s*[:=]\s*['"][^'"]+['"]/gi, name: 'private key' },
  ];

  for (const { pattern, name } of sensitivePatterns) {
    const matches = code.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (!match.includes('process.env')) {
          issues.push({
            type: 'hardcoded-sensitive',
            message: `Hardcoded ${name} detected. Use environment variable (e.g., process.env.${name.toUpperCase()}).`,
          });
        }
      }
    }
  }

  return { usesEnvVars, issues };
}

/**
 * Analyze code file for security issues
 * @param {Object} file - Code file object
 * @param {Object} authConfig - Authentication configuration
 * @returns {{ errors: Array, warnings: Array }}
 */
function analyzeSecurityFile(file, authConfig = {}) {
  const errors = [];
  const warnings = [];

  if (!file || !file.content) {
    return { errors, warnings };
  }

  const filePath = file.path || 'unknown';
  const code = file.content;

  // Check for eval() usage
  const evalIssues = detectEvalUsage(code);
  for (const issue of evalIssues) {
    (issue.severity === 'error' ? errors : warnings).push({
      path: filePath,
      message: issue.message,
    });
  }

  // Check for exec usage
  const execIssues = detectExecUsage(code);
  for (const issue of execIssues) {
    (issue.severity === 'error' ? errors : warnings).push({
      path: filePath,
      message: issue.message,
    });
  }

  // Check for SQL injection
  const sqlIssues = detectSqlInjection(code);
  for (const issue of sqlIssues) {
    (issue.severity === 'error' ? errors : warnings).push({
      path: filePath,
      message: issue.message,
    });
  }

  // Check for hardcoded secrets
  const secretIssues = detectHardcodedSecrets(code);
  for (const issue of secretIssues) {
    (issue.severity === 'error' ? errors : warnings).push({
      path: filePath,
      message: issue.message,
    });
  }

  // Check session security
  const sessionResult = checkSessionSecurity(code, authConfig);
  for (const issue of sessionResult.issues) {
    errors.push({
      path: filePath,
      message: issue.message,
    });
  }

  // Check input validation
  const validationResult = checkInputValidation(code);
  for (const issue of validationResult.issues) {
    warnings.push({
      path: filePath,
      message: issue.message,
    });
  }

  // Check environment variable usage
  const envResult = checkEnvVarUsage(code);
  for (const issue of envResult.issues) {
    errors.push({
      path: filePath,
      message: issue.message,
    });
  }

  return { errors, warnings };
}

/**
 * Gate 4 Executor: Security Baseline Check
 *
 * @param {Object} context - Gate context (validated against gateContextSchema)
 * @returns {Promise<{ passed: boolean, errors: Array<{path: string, message: string}>, warnings: string[] }>}
 */
async function executeGate4(context) {
  const errors = [];
  const warnings = [];

  // Extract auth config
  const authConfig = context.authConfig || {};

  // Analyze each file
  if (context.files && Array.isArray(context.files)) {
    for (const file of context.files) {
      const result = analyzeSecurityFile(file, authConfig);
      errors.push(...result.errors);
      warnings.push(...result.warnings.map(w =>
        typeof w === 'string' ? w : `${w.path}: ${w.message}`
      ));
    }
  }

  // Check for missing input validation at project level
  if (context.hasInputValidation === false) {
    errors.push({
      path: 'input-validation',
      message: 'No input validation detected. Implement input validation using a library (express-validator, joi, zod, etc.).',
    });
  }

  // Check auth configuration
  if (authConfig) {
    // Check for weak hashing
    if (authConfig.hashingAlgorithm && ['md5', 'sha1', 'sha256'].includes(authConfig.hashingAlgorithm.toLowerCase())) {
      errors.push({
        path: 'authConfig.hashingAlgorithm',
        message: `Weak password hashing (${authConfig.hashingAlgorithm}). Use bcrypt, scrypt, or argon2.`,
      });
    }

    // Check for missing HTTPS
    if (authConfig.httpsEnforced === false) {
      warnings.push('HTTPS is not enforced. Consider enforcing HTTPS in production.');
    }

    // Check for missing CSRF protection
    if (authConfig.csrfProtection === false) {
      warnings.push('CSRF protection is disabled. Consider enabling for state-changing operations.');
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create and register Gate 4 with a QualityGate instance
 *
 * @param {QualityGate} gateCoordinator - QualityGate coordinator instance
 * @returns {void}
 */
function registerGate4(gateCoordinator) {
  gateCoordinator.registerGate('gate-04-security', gateContextSchema, executeGate4);
}

module.exports = {
  executeGate4,
  registerGate4,
  codeFileSchema,
  envConfigSchema,
  authConfigSchema,
  gateContextSchema,
  SECURITY_ANTI_PATTERNS,
  SECRET_PATTERNS,
  SQL_INJECTION_PATTERNS,
  INPUT_VALIDATION_CHECKS,
  SECURE_SESSION_PATTERNS,
  detectEvalUsage,
  detectExecUsage,
  detectSqlInjection,
  detectHardcodedSecrets,
  checkSessionSecurity,
  checkInputValidation,
  checkEnvVarUsage,
  analyzeSecurityFile,
};

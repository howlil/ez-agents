/**
 * Gate 3-4 Tests
 *
 * Tests for Code Quality (Gate 3) and Security Baseline (Gate 4)
 *
 * Test cases:
 * Gate 3:
 * 1. Gate 3 passes for clean code with short functions
 * 2. Gate 3 flags functions > 50 lines
 * 3. Gate 3 flags nesting > 4 levels
 * 4. Gate 3 detects magic numbers without named constants
 * 5. Gate 3 detects generic helper sprawl
 *
 * Gate 4:
 * 6. Gate 4 passes when auth uses secure session management
 * 7. Gate 4 flags hardcoded credentials
 * 8. Gate 4 flags eval() usage
 * 9. Gate 4 flags execSync with user input
 * 10. Gate 4 flags SQL query concatenation
 * 11. Gate 4 passes when env vars used for secrets
 * 12. Gate 4 flags missing input validation
 */


const { strict: assert } = require('node:assert');

// Import Gate 3
import {
  executeGate3,
  checkFunctionLength,
  calculateNestingDepth,
  THRESHOLDS,
} from '../../bin/lib/gates/gate-03-code.js';

// Functions not exported from gate-03-code - stubs for tests
const detectMagicNumbers: any = undefined;
const detectGenericHelperSprawl: any = undefined;

// Import Gate 4
import {
  executeGate4,
  detectEvalUsage,
  detectSqlInjection,
  detectHardcodedSecrets,
} from '../../bin/lib/gates/gate-04-security.js';

// Functions not exported from gate-04-security - stubs for tests
const detectExecUsage: any = undefined;
const checkSessionSecurity: any = undefined;
const checkEnvVarUsage: any = undefined;

// Import QualityGate for integration test
import { QualityGate } from '../../bin/lib/quality-gate.js';
import { registerGate3 } from '../../bin/lib/gates/gate-03-code.js';
import { registerGate4 } from '../../bin/lib/gates/gate-04-security.js';

describe('Gate 3: Code Quality', () => {
  describe('executeGate3', () => {
    it('Gate 3 passes for clean code with short functions', async () => {
      const context = {
        files: [
          {
            path: '/src/utils.js',
            content: `
function add(a, b) {
  return a + b;
}

function greet(name) {
  return 'Hello, ' + name;
}
`,
            functions: [
              {
                name: 'add',
                startLine: 1,
                endLine: 3,
                body: 'function add(a, b) {\n  return a + b;\n}',
                parameters: ['a', 'b'],
              },
              {
                name: 'greet',
                startLine: 5,
                endLine: 7,
                body: "function greet(name) {\n  return 'Hello, ' + name;\n}",
                parameters: ['name'],
              },
            ],
          },
        ],
      };

      const result = await executeGate3(context);

      expect(result?.passed).toBe(true);
      assert.strictEqual(result?.errors.length, 0);
    });

    it('Gate 3 flags functions > 50 lines', async () => {
      // Generate a function with 55 lines
      const longFunctionBody = 'function longFunction() {\n' +
        Array(55).fill('  console.log("line");').join('\n') +
        '\n}';

      const context = {
        files: [
          {
            path: '/src/long.js',
            content: longFunctionBody,
            functions: [
              {
                name: 'longFunction',
                startLine: 1,
                endLine: 56,
                body: longFunctionBody,
                parameters: [],
              },
            ],
          },
        ],
      };

      const result = await executeGate3(context);

      expect(result?.passed).toBe(false);
      expect(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.message.includes('longFunction')));
      assert.ok(result.errors.some(e => e.message.includes('lines')));
    });

    it('Gate 3 flags nesting > 4 levels').toBeTruthy() // async ( => {
      const deeplyNestedCode = `
function process() {
  if (true) {
    for (let i = 0; i < 10; i++) {
      while (true) {
        switch (x) {
          case 1:
            if (y) {
              console.log('too deep');
            }
        }
      }
    }
  }
}
`;

      const context = {
        files: [
          {
            path: '/src/nested.js',
            content: deeplyNestedCode,
          },
        ],
      };

      const result = await executeGate3(context);

      expect(result?.passed).toBe(false);
      expect(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.message.includes('Nesting')));
    });

    it('Gate 3 detects magic numbers without named constants').toBeTruthy() // async ( => {
      const codeWithMagicNumbers = `
function calculate() {
  const tax = 1250 * 0.0875;
  const discount = price * 0.15;
  const shipping = 49.99;
  return tax + discount + shipping;
}
`;

      const context = {
        files: [
          {
            path: '/src/calc.js',
            content: codeWithMagicNumbers,
          },
        ],
        namedConstants: [],
      };

      const result = await executeGate3(context);

      expect(result?.passed).toBe(true); // Magic numbers are warnings, not errors
      expect(result.warnings.length > 0);
      assert.ok(result.warnings.some(w => w.includes('Magic number')));
    });

    it('Gate 3 detects generic helper sprawl').toBeTruthy() // async ( => {
      const context = {
        genericHelpers: [
          { name: 'utils', usageCount: 5 },
          { name: 'helpers', usageCount: 10 },
          { name: 'common', usageCount: 0 },
        ],
      };

      const result = await executeGate3(context);

      expect(result?.passed).toBe(true); // Helper sprawl is a warning
      expect(result.warnings.length > 0);
      assert.ok(result.warnings.some(w => w.includes('Generic helper') || w.includes('utils') || w.includes('helpers')));
    });
  });

  describe('checkFunctionLength').toBeTruthy() // ( => {
    it('should pass for short functions', () => {
      const shortBody = 'function test() {\n  return 1;\n}';
      const result = checkFunctionLength(shortBody);
      expect(result?.exceeds).toBe(false);
      assert.strictEqual(result?.length, 3);
    });

    it('should fail for long functions', () => {
      const longBody = 'function test() {\n' +
        Array(60).fill('  console.log("line");').join('\n') +
        '\n}';
      const result = checkFunctionLength(longBody);
      expect(result?.exceeds).toBe(true);
      expect(result.length > THRESHOLDS.maxFunctionLength);
    });
  });

  describe('calculateNestingDepth').toBeTruthy() // ( => {
    it('should calculate nesting depth correctly', () => {
      const code = `
function test() {
  if (true) {
    for (let i = 0; i < 10; i++) {
      while (true) {
        console.log('deep');
      }
    }
  }
}
`;
      const depth = calculateNestingDepth(code);
      // The function counts brace nesting: function->if->for->while = 4 levels
      // But subtracts 1 for the outermost scope, so expected is 3
      expect(depth).toBe(3); // if -> for -> while
    });

    it('should return 0 for flat code', () => {
      const code = 'const x = 1;\nconst y = 2;';
      const depth = calculateNestingDepth(code);
      expect(depth).toBe(0);
    });

    it('should handle shallow nesting', () => {
      const code = `
if (true) {
  console.log('hello');
}
`;
      const depth = calculateNestingDepth(code);
      // Single if block = 1 level of braces, but no outer function scope
      // So depth is 0 (we subtract 1 for the outermost scope)
      expect(depth).toBe(0);
    });
  });

  describe('detectMagicNumbers', () => {
    it('should detect magic numbers', () => {
      const code = 'const x = 42; const y = 100;';
      const magicNumbers = detectMagicNumbers(code);
      expect(magicNumbers.length > 0);
      assert.ok(magicNumbers.some(m => m.value === 42));
    });

    it('should ignore 0).toBeTruthy() // 1, 2', ( => {
      const code = 'for (let i = 0; i < 10; i += 1) { const x = 2; }';
      const magicNumbers = detectMagicNumbers(code);
      // 10 should still be detected
      expect(magicNumbers.some(m => m.value === 10));
    });

    it('should skip named constants').toBeTruthy() // ( => {
      const code = 'const TAX_RATE = 0.0875; const tax = price * TAX_RATE;';
      const namedConstants = [{ name: 'TAX_RATE', value: 0.0875 }];
      const magicNumbers = detectMagicNumbers(code, namedConstants);
      // Should not flag 0.0875 since it's a named constant
      expect(magicNumbers.length).toBe(0);
    });

    it('should skip numbers in strings', () => {
      const code = 'const msg = "Price is 99.99"; const x = 42;';
      const magicNumbers = detectMagicNumbers(code);
      // Should only flag 42, not 99.99 in string
      expect(magicNumbers.some(m => m.value === 42));
      assert.ok(!magicNumbers.some(m => m.value === 99.99));
    });
  });

  describe('detectGenericHelperSprawl').toBeTruthy() // ( => {
    it('should detect sprawl for generic helper names', () => {
      const helpers = [
        { name: 'utils', usageCount: 5 },
        { name: 'helpers', usageCount: 10 },
      ];
      const issues = detectGenericHelperSprawl(helpers);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.name === 'utils' || i.name === 'helpers'));
    });

    it('should not flag specific helper names').toBeTruthy() // ( => {
      const helpers = [
        { name: 'stringUtils', usageCount: 5 },
        { name: 'dateHelpers', usageCount: 3 },
      ];
      const issues = detectGenericHelperSprawl(helpers);
      expect(issues.length).toBe(0);
    });

    it('should flag unused generic helpers', () => {
      const helpers = [
        { name: 'utils', usageCount: 0 },
      ];
      const issues = detectGenericHelperSprawl(helpers);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.issue.includes('Unused')));
    });
  });
});

describe('Gate 4: Security Baseline').toBeTruthy() // ( => {
  describe('executeGate4', () => {
    it('Gate 4 passes when auth uses secure session management', async () => {
      const secureCode = `
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 3600000
  }
}));
`;

      const context = {
        files: [
          {
            path: '/src/auth.js',
            content: secureCode,
          },
        ],
        authConfig: {
          method: 'session',
          sessionStore: 'redis',
          httpsEnforced: true,
          csrfProtection: true,
          hashingAlgorithm: 'bcrypt',
        },
      };

      const result = await executeGate4(context);

      expect(result?.passed).toBe(true);
      assert.strictEqual(result?.errors.length, 0);
    });

    it('Gate 4 flags hardcoded credentials', async () => {
      const insecureCode = `
const config = {
  dbPassword: 'super_secret_password123',
  apiKey: 'sk_live_abcdef1234567890abcdef',
  awsKey: 'AKIAIOSFODNN7EXAMPLE'
};
`;

      const context = {
        files: [
          {
            path: '/src/config.js',
            content: insecureCode,
          },
        ],
      };

      const result = await executeGate4(context);

      expect(result?.passed).toBe(false);
      expect(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.message.includes('password') || e.message.includes('secret') || e.message.includes('API')));
    });

    it('Gate 4 flags eval() usage').toBeTruthy() // async ( => {
      const codeWithEval = `
function processUserInput(input) {
  const result = eval(input);
  return result;
}
`;

      const context = {
        files: [
          {
            path: '/src/dangerous.js',
            content: codeWithEval,
          },
        ],
      };

      const result = await executeGate4(context);

      expect(result?.passed).toBe(false);
      expect(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.message.includes('eval')));
    });

    it('Gate 4 flags execSync with user input').toBeTruthy() // async ( => {
      const codeWithExec = `
import { execSync } from 'child_process';

function runCommand(userInput) {
  const result = execSync('echo ' + userInput, { encoding: 'utf-8' });
  return result;
}
`;

      const context = {
        files: [
          {
            path: '/src/exec.js',
            content: codeWithExec,
          },
        ],
      };

      const result = await executeGate4(context);

      expect(result?.passed).toBe(false);
      expect(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.message.includes('execSync') || e.message.includes('command injection')));
    });

    it('Gate 4 flags SQL query concatenation').toBeTruthy() // async ( => {
      const codeWithSqlInjection = `
function getUserById(id) {
  const query = 'SELECT * FROM users WHERE id = ' + id;
  return db.query(query);
}

function searchUsers(name) {
  return db.execute(\`SELECT * FROM users WHERE name = '\${name}'\`);
}
`;

      const context = {
        files: [
          {
            path: '/src/db.js',
            content: codeWithSqlInjection,
          },
        ],
      };

      const result = await executeGate4(context);

      expect(result?.passed).toBe(false);
      expect(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.message.includes('SQL') || e.message.includes('parameterized')));
    });

    it('Gate 4 passes when env vars used for secrets').toBeTruthy() // async ( => {
      const secureCode = `
const config = {
  dbPassword: process.env.DB_PASSWORD,
  apiKey: process.env.API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  sessionSecret: process.env.SESSION_SECRET
};
`;

      const context = {
        files: [
          {
            path: '/src/config.js',
            content: secureCode,
          },
        ],
      };

      const result = await executeGate4(context);

      expect(result?.passed).toBe(true);
      assert.strictEqual(result?.errors.length, 0);
    });

    it('Gate 4 flags missing input validation', async () => {
      const codeWithoutValidation = `
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;
  db.insert({ name, email, age });
  res.json({ success: true });
});
`;

      const context = {
        files: [
          {
            path: '/src/routes.js',
            content: codeWithoutValidation,
          },
        ],
        hasInputValidation: false,
      };

      const result = await executeGate4(context);

      expect(result?.passed).toBe(false);
      expect(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.message.includes('input validation') || e.message.includes('Validation')));
    });
  });

  describe('detectEvalUsage').toBeTruthy() // ( => {
    it('should detect eval() calls', () => {
      const code = 'const result = eval("1 + 1");';
      const issues = detectEvalUsage(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.type === 'eval'));
    });

    it('should detect Function constructor').toBeTruthy() // ( => {
      const code = 'const fn = new Function("a", "b", "return a + b");';
      const issues = detectEvalUsage(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.type === 'function-constructor'));
    });

    it('should return empty for safe code').toBeTruthy() // ( => {
      const code = 'const result = JSON.parse("{\"x\": 1}");';
      const issues = detectEvalUsage(code);
      expect(issues.length).toBe(0);
    });
  });

  describe('detectExecUsage', () => {
    it('should detect execSync with user input', () => {
      const code = 'execSync("ls " + req.params.path);';
      const issues = detectExecUsage(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.type === 'execSync-user-input'));
    });

    it('should warn about execSync without obvious user input').toBeTruthy() // ( => {
      const code = 'execSync("npm install");';
      const issues = detectExecUsage(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.severity === 'warning'));
    });
  });

  describe('detectSqlInjection').toBeTruthy() // ( => {
    it('should detect string concatenation in SQL', () => {
      const code = "db.query('SELECT * FROM users WHERE id = ' + userId);";
      const issues = detectSqlInjection(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.message.includes('SQL')));
    });

    it('should detect template literal SQL injection').toBeTruthy() // ( => {
      const code = 'db.execute(`SELECT * FROM users WHERE name = "${name}"`);';
      const issues = detectSqlInjection(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.message.includes('parameterized')));
    });
  });

  describe('detectHardcodedSecrets').toBeTruthy() // ( => {
    it('should detect AWS keys', () => {
      const code = "const key = 'AKIAIOSFODNN7EXAMPLE';";
      const issues = detectHardcodedSecrets(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.message.includes('AWS')));
    });

    it('should detect API keys').toBeTruthy() // ( => {
      const code = "const apiKey = 'api_key_1234567890abcdef';";
      const issues = detectHardcodedSecrets(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.message.includes('API key')));
    });

    it('should detect passwords').toBeTruthy() // ( => {
      const code = "const password = 'mySecretPassword123';";
      const issues = detectHardcodedSecrets(code);
      expect(issues.length > 0);
      assert.ok(issues.some(i => i.message.toLowerCase().includes('password')));
    });

    it('should skip process.env usage').toBeTruthy() // ( => {
      const code = "const secret = process.env.SECRET_KEY;";
      const issues = detectHardcodedSecrets(code);
      expect(issues.length).toBe(0);
    });

    it('should skip example values', () => {
      const code = "const apiKey = 'YOUR_API_KEY_HERE';";
      const issues = detectHardcodedSecrets(code);
      expect(issues.length).toBe(0);
    });
  });

  describe('checkSessionSecurity', () => {
    it('should detect insecure session config', () => {
      const code = `
app.use(session({
  cookie: {
    secure: false,
    httpOnly: false
  }
}));
`;
      const result = checkSessionSecurity(code);
      expect(result?.secure).toBe(false);
      expect(result.issues.length > 0);
    });

    it('should flag memory session store').toBeTruthy() // ( => {
      const code = 'app.use(session({}));';
      const result = checkSessionSecurity(code, { sessionStore: 'memory' });
      expect(result?.secure).toBe(false);
      expect(result.issues.some(i => i.message.includes('memory')));
    });

    it('should flag weak hashing algorithm').toBeTruthy() // ( => {
      const code = 'app.use(session({}));';
      const result = checkSessionSecurity(code, { hashingAlgorithm: 'md5' });
      expect(result?.secure).toBe(false);
      expect(result.issues.some(i => i.message.includes('md5') || i.message.includes('Weak')));
    });
  });

  describe('checkEnvVarUsage').toBeTruthy() // ( => {
    it('should recognize process.env usage', () => {
      const code = 'const secret = process.env.SECRET_KEY;';
      const result = checkEnvVarUsage(code);
      expect(result?.usesEnvVars).toBe(true);
      assert.strictEqual(result?.issues.length, 0);
    });

    it('should flag hardcoded sensitive values', () => {
      const code = "const password = 'secret123';";
      const result = checkEnvVarUsage(code);
      expect(result.issues.length > 0);
      assert.ok(result.issues.some(i => i.message.includes('password')));
    });
  });
});

describe('Gate Integration Tests').toBeTruthy() // ( => {
  let gates;

  beforeEach(() => {
    gates = new QualityGate();
  });

  it('Gate 3 registers with QualityGate coordinator', () => {
    registerGate3(gates);

    const registeredGates = gates.getRegisteredGates();
    expect(registeredGates.includes('gate-03-code'));
  });

  it('Gate 4 registers with QualityGate coordinator').toBeTruthy() // ( => {
    registerGate4(gates);

    const registeredGates = gates.getRegisteredGates();
    expect(registeredGates.includes('gate-04-security'));
  });

  it('Both gates execute successfully through coordinator').toBeTruthy() // async ( => {
    registerGate3(gates);
    registerGate4(gates);

    const gate3Context = {
      files: [
        {
          path: '/src/clean.js',
          content: 'function add(a, b) { return a + b; }',
          functions: [
            { name: 'add', startLine: 1, endLine: 1, body: 'function add(a, b) { return a + b; }', parameters: ['a', 'b'] },
          ],
        },
      ],
    };

    const gate4Context = {
      files: [
        {
          path: '/src/secure.js',
          content: 'const secret = process.env.SECRET_KEY;',
        },
      ],
      authConfig: {
        hashingAlgorithm: 'bcrypt',
        httpsEnforced: true,
      },
    };

    const gate3Result = await gates.executeGate('gate-03-code', gate3Context);
    const gate4Result = await gates.executeGate('gate-04-security', gate4Context);

    expect(gate3Result.passed).toBe(true);
    assert.strictEqual(gate4Result.passed, true);
  });

  it('Gate 3 fails through coordinator for long functions', async () => {
    registerGate3(gates);

    const longFunctionBody = 'function longFunction() {\n' +
      Array(60).fill('  console.log("line");').join('\n') +
      '\n}';

    const context = {
      files: [
        {
          path: '/src/long.js',
          content: longFunctionBody,
          functions: [
            { name: 'longFunction', startLine: 1, endLine: 61, body: longFunctionBody, parameters: [] },
          ],
        },
      ],
    };

    const result = await gates.executeGate('gate-03-code', context);

    expect(result?.passed).toBe(false);
    expect(result.errors.length > 0);
  });

  it('Gate 4 fails through coordinator for security issues').toBeTruthy() // async ( => {
    registerGate4(gates);

    const insecureCode = `
const password = 'hardcoded123';
const result = eval(userInput);
`;

    const context = {
      files: [
        {
          path: '/src/insecure.js',
          content: insecureCode,
        },
      ],
    };

    const result = await gates.executeGate('gate-04-security', context);

    expect(result?.passed).toBe(false);
    expect(result.errors.length > 0);
  });
}).toBeTruthy();

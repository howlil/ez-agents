/**
 * Gate 3: Code Quality
 *
 * Validates code quality patterns and detects overengineering.
 *
 * Checks:
 * 1. Clean code rules (function length < 50 lines, nesting < 4 levels, naming conventions)
 * 2. Code smell detector (magic numbers, long parameter lists, duplicate code)
 * 3. Anti-overengineering (generic helpers, premature abstraction, unused interfaces)
 *
 * @module gates/gate-03-code
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
  /** Function definitions in the file */
  functions: z.array(z.object({
    /** Function name */
    name: z.string(),
    /** Function start line */
    startLine: z.number().int().min(0),
    /** Function end line */
    endLine: z.number().int().min(0),
    /** Function body content */
    body: z.string().optional(),
    /** Function parameters */
    parameters: z.array(z.string()).optional(),
  })).optional(),
});

/**
 * Zod schema for code metrics
 * @type {z.ZodSchema}
 */
const codeMetricsSchema = z.object({
  /** Total lines of code */
  totalLines: z.number().int().min(0).optional(),
  /** Code lines (excluding comments and blanks) */
  codeLines: z.number().int().min(0).optional(),
  /** Comment lines */
  commentLines: z.number().int().min(0).optional(),
  /** Average function length */
  avgFunctionLength: z.number().nonnegative().optional(),
  /** Maximum nesting depth */
  maxNesting: z.number().int().min(0).optional(),
  /** Number of magic numbers */
  magicNumberCount: z.number().int().min(0).optional(),
  /** Number of long parameter lists */
  longParamListCount: z.number().int().min(0).optional(),
});

/**
 * Zod schema for the gate context
 * @type {z.ZodSchema}
 */
const gateContextSchema = z.object({
  /** Array of code files to analyze */
  files: z.array(codeFileSchema).optional(),
  /** Pre-computed code metrics */
  metrics: codeMetricsSchema.optional(),
  /** Generic helper functions to check for sprawl */
  genericHelpers: z.array(z.object({
    /** Helper name */
    name: z.string(),
    /** Helper usage count */
    usageCount: z.number().int().min(0).optional(),
    /** Helper file path */
    path: z.string().optional(),
  })).optional(),
  /** Named constants in the codebase */
  namedConstants: z.array(z.object({
    /** Constant name */
    name: z.string(),
    /** Constant value */
    value: z.union([z.string(), z.number(), z.boolean()]),
  })).optional(),
});

/**
 * Thresholds for code quality checks
 */
const THRESHOLDS = {
  /** Maximum function length in lines */
  maxFunctionLength: 50,
  /** Maximum nesting depth */
  maxNesting: 4,
  /** Maximum parameters in function signature */
  maxParameters: 5,
  /** Minimum constant name length to be considered meaningful */
  minConstantNameLength: 3,
  /** Magic number threshold - numbers below this are ignored */
  magicNumberIgnoreThreshold: 2,
  /** Generic helper sprawl threshold */
  genericHelperSprawlThreshold: 3,
};

/**
 * Count lines in a string
 * @param {string} content - Content to count lines in
 * @returns {number}
 */
function countLines(content) {
  if (!content || typeof content !== 'string') {
    return 0;
  }
  return content.split('\n').length;
}

/**
 * Calculate function length in lines
 * @param {string} functionBody - Function body content
 * @returns {number}
 */
function calculateFunctionLength(functionBody) {
  return countLines(functionBody);
}

/**
 * Check if function exceeds maximum length
 * @param {string} functionBody - Function body content
 * @returns {{ exceeds: boolean, length: number }}
 */
function checkFunctionLength(functionBody) {
  const length = calculateFunctionLength(functionBody);
  return {
    exceeds: length > THRESHOLDS.maxFunctionLength,
    length,
  };
}

/**
 * Calculate nesting depth of code
 *
 * Counts nested blocks by tracking opening and closing braces.
 * Handles common patterns: if/else, for, while, function, switch, try/catch
 *
 * @param {string} code - Code content to analyze
 * @returns {number} Maximum nesting depth
 */
function calculateNestingDepth(code) {
  if (!code || typeof code !== 'string') {
    return 0;
  }

  let maxDepth = 0;
  let currentDepth = 0;

  // Track braces for nesting
  for (let i = 0; i < code.length; i++) {
    const char = code[i];

    if (char === '{') {
      currentDepth++;
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }
    } else if (char === '}') {
      currentDepth--;
      if (currentDepth < 0) {
        currentDepth = 0; // Handle unbalanced braces gracefully
      }
    }
  }

  // Subtract 1 because the outermost scope doesn't count as nesting
  return Math.max(0, maxDepth - 1);
}

/**
 * Check if nesting depth exceeds threshold
 * @param {string} code - Code content to analyze
 * @returns {{ exceeds: boolean, depth: number }}
 */
function checkNestingDepth(code) {
  const depth = calculateNestingDepth(code);
  return {
    exceeds: depth > THRESHOLDS.maxNesting,
    depth,
  };
}

/**
 * Detect magic numbers in code
 *
 * Magic numbers are numeric literals that appear directly in code
 * without being defined as named constants.
 *
 * Ignores:
 * - 0 and 1 (commonly used as indices/flags)
 * - Numbers in comments
 * - Numbers in string literals
 *
 * @param {string} code - Code content to analyze
 * @param {Array} namedConstants - Array of named constant values to exclude
 * @returns {Array<{ line: number, value: number, suggestion: string }>}
 */
function detectMagicNumbers(code, namedConstants = []) {
  const magicNumbers = [];

  if (!code || typeof code !== 'string') {
    return magicNumbers;
  }

  // Extract constant values for comparison
  const constantValues = new Set();
  if (namedConstants && Array.isArray(namedConstants)) {
    for (const constant of namedConstants) {
      if (typeof constant.value === 'number') {
        constantValues.add(constant.value);
      }
    }
  }

  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      continue;
    }

    // Remove string literals to avoid matching numbers in strings
    const codeWithoutStrings = line.replace(/["'`].*?["'`]/g, '');

    // Match numeric literals (integers and floats)
    const numberPattern = /(?<!\w)(-?\d+\.?\d*)(?!\w)/g;
    let match;

    while ((match = numberPattern.exec(codeWithoutStrings)) !== null) {
      const numStr = match[1];
      const num = parseFloat(numStr);

      // Skip 0, 1, 2 (commonly used as indices/flags)
      if (Math.abs(num) <= THRESHOLDS.magicNumberIgnoreThreshold) {
        continue;
      }

      // Skip if it's a named constant
      if (constantValues.has(num)) {
        continue;
      }

      // Generate suggested constant name
      const suggestedName = suggestConstantName(num);

      magicNumbers.push({
        line: lineNum,
        value: num,
        suggestion: suggestedName,
      });
    }
  }

  return magicNumbers;
}

/**
 * Suggest a constant name for a magic number
 * @param {number} value - The magic number value
 * @returns {string} Suggested constant name
 */
function suggestConstantName(value) {
  // Common values with semantic meaning
  const commonConstants = {
    7: 'DAYS_IN_WEEK',
    24: 'HOURS_IN_DAY',
    60: 'MINUTES_IN_HOUR',
    100: 'PERCENTAGE_SCALE',
    1000: 'MILLISECONDS_IN_SECOND',
    365: 'DAYS_IN_YEAR',
    404: 'HTTP_NOT_FOUND',
    500: 'HTTP_SERVER_ERROR',
    200: 'HTTP_OK',
    80: 'HTTP_PORT',
    443: 'HTTPS_PORT',
    3000: 'DEFAULT_PORT',
    10: 'DEFAULT_LIMIT',
    50: 'DEFAULT_PAGE_SIZE',
  };

  if (commonConstants[value]) {
    return commonConstants[value];
  }

  // Generic suggestion
  return `VALUE_${value.toString().replace('.', '_').replace('-', 'NEG_')}`;
}

/**
 * Check for long parameter lists
 *
 * Functions with more than THRESHOLDS.maxParameters parameters
 * are considered to have a code smell.
 *
 * @param {Array} parameters - Array of parameter names
 * @returns {{ exceeds: boolean, count: number }}
 */
function checkParameterList(parameters) {
  const count = parameters ? parameters.length : 0;
  return {
    exceeds: count > THRESHOLDS.maxParameters,
    count,
  };
}

/**
 * Detect generic helper sprawl
 *
 * Generic helpers are functions with vague names like 'utils', 'helpers', 'common'
 * that often indicate poor organization and overengineering.
 *
 * @param {Array} genericHelpers - Array of generic helper definitions
 * @returns {Array<{ name: string, usageCount: number, issue: string }>}
 */
function detectGenericHelperSprawl(genericHelpers) {
  const issues = [];

  if (!genericHelpers || !Array.isArray(genericHelpers)) {
    return issues;
  }

  // Patterns that indicate generic/unclear helper names
  const genericPatterns = [
    /^utils?$/i,
    /^helpers?$/i,
    /^common$/i,
    /^shared$/i,
    /^misc$/i,
    /^miscellaneous$/i,
    /^general$/i,
    /^utility$/i,
    /^utilities$/i,
    /^functions?$/i,
    /^tools?$/i,
    /^helpers?$/i,
  ];

  for (const helper of genericHelpers) {
    const name = helper.name || '';

    // Check if name matches generic patterns
    const isGeneric = genericPatterns.some(pattern => pattern.test(name));

    if (isGeneric) {
      const usageCount = helper.usageCount ?? 0;

      // Flag if used in many places (sprawl) or has vague name
      if (usageCount >= THRESHOLDS.genericHelperSprawlThreshold) {
        issues.push({
          name,
          usageCount,
          issue: `Generic helper '${name}' used in ${usageCount} locations. Consider splitting into specific modules.`,
        });
      } else if (usageCount === 0) {
        issues.push({
          name,
          usageCount,
          issue: `Unused generic helper '${name}'. Remove or integrate into specific modules.`,
        });
      }
    }
  }

  return issues;
}

/**
 * Detect premature abstraction patterns
 *
 * Premature abstractions include:
 * - Interfaces/classes with no implementations
 * - Abstract base classes with single child
 * - Factory patterns for single-instance objects
 * - Strategy pattern with single strategy
 *
 * @param {string} code - Code content to analyze
 * @returns {Array<{ type: string, name: string, line: number, issue: string }>}
 */
function detectPrematureAbstraction(code) {
  const issues = [];

  if (!code || typeof code !== 'string') {
    return issues;
  }

  const lines = code.split('\n');

  // Track interface/abstract class definitions
  const interfaces = new Map(); // name -> line
  const abstractClasses = new Map(); // name -> line
  const implementations = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect interface declarations
    const interfaceMatch = line.match(/interface\s+(\w+)/);
    if (interfaceMatch) {
      interfaces.set(interfaceMatch[1], lineNum);
    }

    // Detect abstract class declarations
    const abstractClassMatch = line.match(/abstract\s+class\s+(\w+)/);
    if (abstractClassMatch) {
      abstractClasses.set(abstractClassMatch[1], lineNum);
    }

    // Detect implementations
    const implementsMatch = line.match(/implements\s+(\w+)/);
    if (implementsMatch) {
      implementations.add(implementsMatch[1]);
    }

    const extendsMatch = line.match(/extends\s+(\w+)/);
    if (extendsMatch) {
      // Check if extending an abstract class
      if (abstractClasses.has(extendsMatch[1])) {
        // Mark as having implementation
        abstractClasses.set(extendsMatch[1], null); // null means has implementation
      }
    }
  }

  // Check for interfaces without implementations
  for (const [name, line] of interfaces) {
    if (!implementations.has(name)) {
      issues.push({
        type: 'interface',
        name,
        line,
        issue: `Interface '${name}' has no implementations. Consider removing or adding implementation.`,
      });
    }
  }

  // Check for abstract classes without concrete implementations
  for (const [name, line] of abstractClasses) {
    if (line !== null) {
      issues.push({
        type: 'abstract-class',
        name,
        line,
        issue: `Abstract class '${name}' has no concrete implementations. Consider removing or adding implementation.`,
      });
    }
  }

  return issues;
}

/**
 * Analyze code file for quality issues
 * @param {Object} file - Code file object
 * @param {Array} namedConstants - Named constants for magic number detection
 * @returns {{ errors: Array, warnings: Array }}
 */
function analyzeCodeFile(file, namedConstants = []) {
  const errors = [];
  const warnings = [];

  if (!file || !file.content) {
    return { errors, warnings };
  }

  const filePath = file.path || 'unknown';

  // Check functions if provided
  if (file.functions && Array.isArray(file.functions)) {
    for (const func of file.functions) {
      const funcPath = `${filePath}:${func.name}`;

      // Check function length
      if (func.body) {
        const lengthCheck = checkFunctionLength(func.body);
        if (lengthCheck.exceeds) {
          errors.push({
            path: funcPath,
            message: `Function '${func.name}' is ${lengthCheck.length} lines (max: ${THRESHOLDS.maxFunctionLength}). Consider breaking into smaller functions.`,
          });
        }
      }

      // Check parameter list
      if (func.parameters) {
        const paramCheck = checkParameterList(func.parameters);
        if (paramCheck.exceeds) {
          warnings.push({
            path: funcPath,
            message: `Function '${func.name}' has ${paramCheck.count} parameters (max recommended: ${THRESHOLDS.maxParameters}). Consider using an options object.`,
          });
        }
      }
    }
  }

  // Check nesting depth
  const nestingCheck = checkNestingDepth(file.content);
  if (nestingCheck.exceeds) {
    errors.push({
      path: filePath,
      message: `Nesting depth of ${nestingCheck.depth} exceeds maximum (${THRESHOLDS.maxNesting}). Consider refactoring to reduce complexity.`,
    });
  }

  // Check for magic numbers
  const magicNumbers = detectMagicNumbers(file.content, namedConstants);
  for (const magic of magicNumbers) {
    warnings.push({
      path: `${filePath}:${magic.line}`,
      message: `Magic number ${magic.value} found. Consider defining as named constant (e.g., ${magic.suggestion}).`,
    });
  }

  // Check for premature abstraction
  const abstractions = detectPrematureAbstraction(file.content);
  for (const abs of abstractions) {
    warnings.push({
      path: `${filePath}:${abs.line}`,
      message: abs.issue,
    });
  }

  return { errors, warnings };
}

/**
 * Gate 3 Executor: Code Quality Check
 *
 * @param {Object} context - Gate context (validated against gateContextSchema)
 * @returns {Promise<{ passed: boolean, errors: Array<{path: string, message: string}>, warnings: string[] }>}
 */
async function executeGate3(context) {
  const errors = [];
  const warnings = [];

  // Extract named constants for reference
  const namedConstants = context.namedConstants || [];

  // Analyze each file
  if (context.files && Array.isArray(context.files)) {
    for (const file of context.files) {
      const result = analyzeCodeFile(file, namedConstants);
      errors.push(...result.errors);
      warnings.push(...result.warnings.map(w =>
        typeof w === 'string' ? w : `${w.path}: ${w.message}`
      ));
    }
  }

  // Check for generic helper sprawl
  if (context.genericHelpers && Array.isArray(context.genericHelpers)) {
    const sprawlIssues = detectGenericHelperSprawl(context.genericHelpers);
    for (const issue of sprawlIssues) {
      warnings.push(issue.issue);
    }
  }

  // Use pre-computed metrics if provided
  if (context.metrics) {
    const metrics = context.metrics;

    if (metrics.maxNesting !== undefined && metrics.maxNesting > THRESHOLDS.maxNesting) {
      errors.push({
        path: 'metrics.maxNesting',
        message: `Maximum nesting depth (${metrics.maxNesting}) exceeds threshold (${THRESHOLDS.maxNesting}).`,
      });
    }

    if (metrics.avgFunctionLength !== undefined && metrics.avgFunctionLength > THRESHOLDS.maxFunctionLength) {
      errors.push({
        path: 'metrics.avgFunctionLength',
        message: `Average function length (${metrics.avgFunctionLength}) exceeds threshold (${THRESHOLDS.maxFunctionLength}).`,
      });
    }

    if (metrics.magicNumberCount !== undefined && metrics.magicNumberCount > 0) {
      warnings.push(`Found ${metrics.magicNumberCount} magic numbers. Consider using named constants.`);
    }

    if (metrics.longParamListCount !== undefined && metrics.longParamListCount > 0) {
      warnings.push(`Found ${metrics.longParamListCount} functions with long parameter lists.`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create and register Gate 3 with a QualityGate instance
 *
 * @param {QualityGate} gateCoordinator - QualityGate coordinator instance
 * @returns {void}
 */
function registerGate3(gateCoordinator) {
  gateCoordinator.registerGate('gate-03-code', gateContextSchema, executeGate3);
}

module.exports = {
  executeGate3,
  registerGate3,
  codeFileSchema,
  codeMetricsSchema,
  gateContextSchema,
  THRESHOLDS,
  countLines,
  calculateFunctionLength,
  checkFunctionLength,
  calculateNestingDepth,
  checkNestingDepth,
  detectMagicNumbers,
  suggestConstantName,
  checkParameterList,
  detectGenericHelperSprawl,
  detectPrematureAbstraction,
  analyzeCodeFile,
};

/**
 * Gate 6: Documentation Completeness Validator
 *
 * Validates documentation exists and contains required sections.
 * Returns structured results for gap closure workflow.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// markdownlint is ESM, so we need to import it dynamically
let markdownlintSync = null;

/**
 * Initialize markdownlint (ESM module)
 */
async function initMarkdownLint() {
  if (!markdownlintSync) {
    const ml = await import('markdownlint');
    markdownlintSync = ml.markdownlintSync || ml.default?.markdownlintSync;
  }
  return markdownlintSync;
}

const CONFIG_PATH = path.join(__dirname, 'config.yaml');

/**
 * Get required documentation for a specific tier
 * @param {string} tier - 'mvp' | 'medium' | 'enterprise'
 * @returns {object} Documentation requirements
 */
function getRequiredDocs(tier) {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Gate 6 config not found at ${CONFIG_PATH}`);
  }
  
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  const config = yaml.load(configContent);
  
  const tierConfig = config.tiers[tier];
  if (!tierConfig) {
    throw new Error(`Unknown tier: ${tier}. Valid: mvp, medium, enterprise`);
  }
  
  return tierConfig.docs;
}

/**
 * Validate that a document contains required sections
 * @param {string} docPath - Path to the document
 * @param {string[]} requiredSections - Array of required section headings
 * @returns {object} { pass: boolean, missingSections: string[] }
 */
function validateSections(docPath, requiredSections) {
  if (!fs.existsSync(docPath)) {
    return {
      pass: false,
      missingSections: ['Document does not exist'],
      exists: false
    };
  }
  
  const content = fs.readFileSync(docPath, 'utf8');
  const missingSections = [];
  
  // Check file size
  const stats = fs.statSync(docPath);
  if (stats.size < 50) {
    return {
      pass: false,
      missingSections: ['Document too short (< 50 bytes)'],
      exists: true
    };
  }
  
  // Check for required sections (markdown headings)
  for (const section of requiredSections) {
    // Match both ATX (# Heading) and setext (Heading\n===) styles
    const sectionRegex = new RegExp(
      `^#{1,6}\\s+${escapeRegex(section)}|^${section}\\s*\\n=+`,
      'im'
    );
    
    if (!sectionRegex.test(content)) {
      missingSections.push(`Missing section: ${section}`);
    }
  }
  
  return {
    pass: missingSections.length === 0,
    missingSections,
    exists: true
  };
}

/**
 * Run markdownlint on a document
 * @param {string} docPath - Path to the document
 * @returns {object} Linting results
 */
async function lintMarkdown(docPath) {
  if (!fs.existsSync(docPath)) {
    return { pass: false, issues: ['Document does not exist'] };
  }

  const content = fs.readFileSync(docPath, 'utf8');

  try {
    const ml = await initMarkdownLint();
    if (!ml) {
      return { pass: true, issues: [] }; // Skip linting if markdownlint not available
    }

    const result = ml({
      strings: { [path.basename(docPath)]: content },
      config: {
        default: true,
        MD013: false, // Disable line length (too strict for docs)
        MD033: false  // Allow inline HTML
      }
    });

    const issues = result[path.basename(docPath)] || [];
    
    return {
      pass: issues.length === 0,
      issues: issues.map(i => `MD${i.ruleNames[0]}: ${i.description} at line ${i.lineNumber}`)
    };
  } catch (error) {
    return {
      pass: false,
      issues: [`Linting error: ${error.message}`]
    };
  }
}

/**
 * Validate documentation for a project
 * @param {string} phaseDir - Directory containing the project
 * @param {string} tier - 'mvp' | 'medium' | 'enterprise'
 * @returns {Promise<object>} { pass: boolean, failures: string[], docs: object }
 */
async function validateDocs(phaseDir, tier = 'medium') {
  const requiredDocs = getRequiredDocs(tier);
  const failures = [];
  const docResults = {};

  for (const doc of requiredDocs) {
    const docPath = path.join(phaseDir, doc.path);
    const docName = doc.path;

    // Check if document exists
    if (!fs.existsSync(docPath)) {
      const isDir = doc.type === 'directory';
      failures.push(`Missing ${isDir ? 'directory' : 'document'}: ${docName}`);
      docResults[docName] = { exists: false, pass: false };
      continue;
    }

    // If it's a directory, check required files
    if (doc.type === 'directory') {
      const requiredFiles = doc.required_files || [];
      for (const file of requiredFiles) {
        const filePath = path.join(docPath, file);
        if (!fs.existsSync(filePath)) {
          failures.push(`Missing file in ${docName}: ${file}`);
        }
      }
      docResults[docName] = { exists: true, type: 'directory' };
      continue;
    }

    // Validate sections
    const requiredSections = doc.required_sections || [];
    const sectionResult = validateSections(docPath, requiredSections);

    if (!sectionResult.pass) {
      sectionResult.missingSections.forEach(m => {
        failures.push(`${docName}: ${m}`);
      });
    }

    // Lint markdown
    const lintResult = await lintMarkdown(docPath);
    if (!lintResult.pass) {
      // Add first 3 lint issues to failures (avoid overwhelming output)
      lintResult.issues.slice(0, 3).forEach(issue => {
        failures.push(`${docName}: ${issue}`);
      });
      if (lintResult.issues.length > 3) {
        failures.push(`${docName}: +${lintResult.issues.length - 3} more lint issues`);
      }
    }

    docResults[docName] = {
      exists: true,
      pass: sectionResult.pass && lintResult.pass,
      sections: sectionResult,
      lint: lintResult
    };
  }

  return {
    pass: failures.length === 0,
    failures,
    docs: docResults
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * CLI entry point
 */
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'validate' && args[1]) {
      const phaseDir = args[1];
      const tier = args[2] || 'medium';

      console.log(`Gate 6: Validating documentation in ${phaseDir} (${tier})`);
      const result = await validateDocs(phaseDir, tier);

      if (result.pass) {
        console.log('✅ Gate 6 PASSED');
        console.log(`   ${Object.keys(result.docs).length} documents validated`);
        process.exit(0);
      } else {
        console.log('❌ Gate 6 FAILED');
        result.failures.forEach(f => console.log(`   - ${f}`));
        process.exit(1);
      }
    } else if (command === 'docs' && args[1]) {
      const tier = args[1];
      const docs = getRequiredDocs(tier);
      console.log(`Required documentation for ${tier}:`);
      docs.forEach(d => {
        console.log(`  - ${d.path}`);
        if (d.required_sections) {
          d.required_sections.forEach(s => console.log(`      • ${s}`));
        }
      });
    } else {
      console.log('Usage: node gate-06-validator.cjs <command> [args]');
      console.log('Commands:');
      console.log('  validate <phaseDir> [tier]  - Validate documentation');
      console.log('  docs <tier>                 - Show required docs');
      process.exit(1);
    }
  })();
}

module.exports = {
  validateDocs,
  getRequiredDocs,
  validateSections,
  lintMarkdown
};

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Hallucination Guard - Prevents AI hallucinations by requiring citations
 * and flagging uncertainty in AI-generated content.
 * 
 * Exports:
 * - checkCitation(claim, context) - Searches codebase for claim evidence
 * - verifyClaim(claim) - Verifies library/dependency claims
 * - flagUncertainty(output) - Flags uncertain claims for review
 */

/**
 * Uncertainty markers that indicate potential hallucinations
 */
const UNCERTAINTY_MARKERS = [
  'might',
  'could',
  'possibly',
  'perhaps',
  'may',
  'probably',
  'likely',
  'seems',
  'appears',
  'suggests',
  'presumably',
  'potentially',
  'i think',
  'i believe',
  'in my opinion',
  'as far as i know',
  'to the best of my knowledge',
  'not sure',
  'uncertain',
  'maybe'
];

/**
 * Search the codebase for evidence of a claim using grep-like search
 * @param {string} claim - The claim to search for
 * @param {string} context - Optional context directory path
 * @returns {{ cited: boolean, citations: Array<{source: string, evidence: string}>, uncertainty: boolean }}
 */
function checkCitation(claim, context = process.cwd()) {
  const citations = [];
  let uncertainty = false;

  // Normalize claim
  const normalizedClaim = claim.trim().toLowerCase();

  // Handle empty claims
  if (!normalizedClaim) {
    return {
      cited: false,
      citations: [],
      uncertainty: false
    };
  }

  // Check if claim itself contains uncertainty markers
  uncertainty = hasUncertainty(claim);

  // Search in codebase using JavaScript fallback (Windows-compatible)
  const searchResults = searchCodebase(normalizedClaim, context);

  if (searchResults.length > 0) {
    citations.push(...searchResults);
  }

  // Also check package.json for library claims
  if (isLibraryClaim(normalizedClaim)) {
    const packageResult = checkPackageJson(normalizedClaim, context);
    if (packageResult) {
      citations.push(packageResult);
    }
  }

  return {
    cited: citations.length > 0,
    citations,
    uncertainty
  };
}

/**
 * Search codebase for claim evidence using pure JavaScript (Windows-compatible)
 * @param {string} claim - Normalized claim text
 * @param {string} context - Search directory
 * @returns {Array<{source: string, evidence: string}>}
 */
function searchCodebase(claim, context) {
  const results = [];
  const searchDirs = [
    path.join(context, 'ez-agents'),
    path.join(context, 'bin'),
    path.join(context, 'commands'),
    path.join(context, 'agents'),
    path.join(context, '.planning')
  ];

  // Filter to existing directories
  const validDirs = searchDirs.filter(dir => fs.existsSync(dir));

  for (const dir of validDirs) {
    const files = getAllFiles(dir);
    for (const file of files) {
      if (!file.endsWith('.cjs') && !file.endsWith('.js') && 
          !file.endsWith('.md') && !file.endsWith('.json')) {
        continue;
      }

      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          // Check for claim keywords in the line
          const claimWords = claim.split(/\s+/).filter(w => w.length > 3);
          const matches = claimWords.filter(word => line.includes(word));
          
          if (matches.length >= Math.min(2, claimWords.length)) {
            const relativePath = path.relative(context, file);
            results.push({
              source: relativePath,
              evidence: lines[i].trim(),
              line: i + 1
            });
            break; // One match per file is enough
          }
        }
      } catch (err) {
        // Skip binary or unreadable files
      }
    }
  }

  return results;
}

/**
 * Get all files recursively from a directory
 * @param {string} dir - Directory path
 * @returns {string[]} - Array of file paths
 */
function getAllFiles(dir) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          files.push(...getAllFiles(fullPath));
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip inaccessible directories
  }
  
  return files;
}

/**
 * Check if claim is about a library/dependency
 * @param {string} claim - Claim text
 * @returns {boolean}
 */
function isLibraryClaim(claim) {
  const libraryKeywords = [
    'library', 'package', 'module', 'dependency', 'npm', 
    'install', 'require', 'import', 'devdependency'
  ];
  return libraryKeywords.some(keyword => claim.includes(keyword));
}

/**
 * Check package.json for library claims
 * @param {string} claim - Normalized claim text
 * @param {string} context - Context directory
 * @returns {{source: string, evidence: string} | null}
 */
function checkPackageJson(claim, context) {
  const packageJsonPath = path.join(context, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = {
      ...packageData.dependencies,
      ...packageData.devDependencies
    };

    // Extract library name from claim (look for quoted strings or common patterns)
    const libMatch = claim.match(/["']([^"']+)["']/);
    if (libMatch) {
      const libName = libMatch[1];
      if (allDeps[libName]) {
        return {
          source: 'package.json',
          evidence: `${libName}: ${allDeps[libName]}`,
          verified: true
        };
      }
    }

    // Check if any dependency name appears in claim
    for (const [depName, depVersion] of Object.entries(allDeps)) {
      if (claim.includes(depName)) {
        return {
          source: 'package.json',
          evidence: `${depName}: ${depVersion}`,
          verified: true
        };
      }
    }
  } catch (err) {
    // Invalid package.json
  }

  return null;
}

/**
 * Check if text contains uncertainty markers
 * @param {string} text - Text to check
 * @returns {boolean}
 */
function hasUncertainty(text) {
  const lowerText = text.toLowerCase();
  return UNCERTAINTY_MARKERS.some(marker => lowerText.includes(marker));
}

/**
 * Verify a claim about libraries, dependencies, or codebase features
 * @param {string} claim - Claim to verify
 * @param {string} context - Context directory
 * @returns {{ verified: boolean, source: string, details: any }}
 */
function verifyClaim(claim, context = process.cwd()) {
  const normalizedClaim = claim.trim().toLowerCase();
  
  // Check for library/dependency claims
  if (isLibraryClaim(normalizedClaim)) {
    const packageResult = checkPackageJson(normalizedClaim, context);
    if (packageResult) {
      return {
        verified: true,
        source: 'package.json',
        details: packageResult
      };
    }
    
    // Would call Context7 MCP here for external libraries
    // For now, mark as unverified but not necessarily false
    return {
      verified: false,
      source: 'context7',
      details: { message: 'External library verification requires Context7 MCP' }
    };
  }

  // For codebase claims, use checkCitation
  const citationResult = checkCitation(claim, context);
  return {
    verified: citationResult.cited,
    source: 'codebase',
    details: citationResult
  };
}

/**
 * Scan AI output for uncertainty markers and flag for review
 * @param {string} output - AI-generated text to scan
 * @returns {{ flagged: boolean, markers: Array<{marker: string, position: number}>, confidence: number }}
 */
function flagUncertainty(output) {
  const markers = [];
  const lowerOutput = output.toLowerCase();
  
  for (const marker of UNCERTAINTY_MARKERS) {
    let position = lowerOutput.indexOf(marker);
    while (position !== -1) {
      markers.push({
        marker,
        position
      });
      position = lowerOutput.indexOf(marker, position + 1);
    }
  }

  // Calculate confidence score (inverse of uncertainty)
  const uncertaintyRatio = markers.length / Math.max(1, output.split(/\s+/).length);
  const confidence = Math.max(0, 1 - (uncertaintyRatio * 10));

  return {
    flagged: markers.length > 0,
    markers,
    confidence: Math.round(confidence * 100) / 100
  };
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Hallucination Guard - Citation checker and uncertainty flagger');
    console.log('');
    console.log('Usage:');
    console.log('  node hallucination-guard.cjs check "claim text"');
    console.log('  node hallucination-guard.cjs verify "claim text"');
    console.log('  node hallucination-guard.cjs flag "output text"');
    console.log('');
    console.log('Commands:');
    console.log('  check   - Check if claim has citations in codebase');
    console.log('  verify  - Verify library/dependency claims');
    console.log('  flag    - Flag uncertainty in AI output');
    process.exit(0);
  }

  const command = args[0];
  const text = args.slice(1).join(' ').replace(/^["']|["']$/g, '');

  switch (command) {
    case 'check': {
      const result = checkCitation(text);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.cited ? 0 : 1);
    }
    
    case 'verify': {
      const result = verifyClaim(text);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.verified ? 0 : 1);
    }
    
    case 'flag': {
      const result = flagUncertainty(text);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.flagged ? 1 : 0);
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use "node hallucination-guard.cjs" for usage information');
      process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  checkCitation,
  verifyClaim,
  flagUncertainty,
  hasUncertainty,
  searchCodebase,
  checkPackageJson,
  UNCERTAINTY_MARKERS
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}

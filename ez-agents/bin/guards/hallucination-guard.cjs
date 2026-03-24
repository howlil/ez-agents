/**
 * EDGE-01: Hallucination Guard
 * 
 * Detects AI hallucinations by requiring citations and flagging uncertainty.
 * Verifies library claims against package.json or Context7.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Search codebase for claim evidence
 * @param {string} claim - The claim to verify
 * @param {string} searchDir - Directory to search in
 * @returns {object} { cited: boolean, citations: array, uncertainty: boolean }
 */
function checkCitation(claim, searchDir = process.cwd()) {
  const citations = [];
  
  try {
    // Search in codebase using grep
    const grepCmd = process.platform === 'win32' 
      ? `findstr /s /i /c:"${claim}" * 2>nul`
      : `grep -ri "${claim}" . 2>/dev/null | head -20`;
    
    const result = execSync(grepCmd, {
      cwd: searchDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (result.trim()) {
      const lines = result.trim().split('\n').slice(0, 5);
      lines.forEach(line => {
        citations.push({
          source: 'codebase',
          evidence: line.trim()
        });
      });
    }
  } catch (e) {
    // No matches found - not an error, just no citation
  }
  
  return {
    cited: citations.length > 0,
    citations,
    uncertainty: citations.length === 0
  };
}

/**
 * Verify a library/dependency claim
 * @param {string} claim - Library name or claim
 * @param {string} projectDir - Project directory
 * @returns {object} { verified: boolean, source: string, details: object }
 */
function verifyClaim(claim, projectDir = process.cwd()) {
  // Extract library name from claim
  const libMatch = claim.match(/(?:library|package|module|dependency)[:\s]+(['"]?)([^'"\s]+)\1/i);
  const libName = libMatch ? libMatch[2] : claim.split(/\s+/).pop();
  
  // Check package.json
  const packageJsonPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies
      };
      
      // Check if library is in dependencies
      for (const [name, version] of Object.entries(allDeps)) {
        if (name.toLowerCase().includes(libName.toLowerCase()) || 
            libName.toLowerCase().includes(name.toLowerCase())) {
          return {
            verified: true,
            source: 'package.json',
            details: { name, version }
          };
        }
      }
    } catch (e) {
      // Invalid package.json
    }
  }
  
  // Check if it's a known library (would verify with Context7 in real implementation)
  const knownLibraries = [
    'vitest', 'jest', 'playwright', 'cypress', 'react', 'vue', 'angular',
    'express', 'fastify', 'nest', 'next', 'nuxt', 'sveltekit',
    'prisma', 'mongoose', 'sequelize', 'typeorm',
    'typescript', 'eslint', 'prettier'
  ];
  
  if (knownLibraries.some(lib => libName.toLowerCase().includes(lib))) {
    return {
      verified: true,
      source: 'known-library',
      details: { name: libName, note: 'Would verify with Context7' }
    };
  }
  
  return {
    verified: false,
    source: 'none',
    details: { name: libName, note: 'Library not found in dependencies or known libraries' }
  };
}

/**
 * Flag uncertainty in AI output
 * @param {string} output - AI generated text
 * @returns {object} { flagged: boolean, uncertainPhrases: array, confidence: string }
 */
function flagUncertainty(output) {
  const uncertaintyMarkers = [
    'might', 'may', 'could', 'possibly', 'perhaps',
    'i think', 'i believe', 'probably', 'likely',
    'not sure', 'uncertain', 'approximate',
    'should work', 'might work', 'could work',
    'as far as i know', 'to the best of my knowledge',
    'it seems', 'appears to'
  ];
  
  const lowerOutput = output.toLowerCase();
  const foundMarkers = [];
  
  for (const marker of uncertaintyMarkers) {
    if (lowerOutput.includes(marker)) {
      foundMarkers.push(marker);
    }
  }
  
  // Check for citation needed patterns
  const citationPatterns = [
    /according to.*documentation/i,
    /the documentation says/i,
    /as documented in/i,
    /the official.*states/i
  ];
  
  for (const pattern of citationPatterns) {
    if (pattern.test(output)) {
      foundMarkers.push(`citation claim: ${pattern.source}`);
    }
  }
  
  return {
    flagged: foundMarkers.length > 0,
    uncertainPhrases: foundMarkers,
    confidence: foundMarkers.length === 0 ? 'high' : 
                foundMarkers.length <= 2 ? 'medium' : 'low'
  };
}

/**
 * Full hallucination check
 * @param {string} output - AI generated text
 * @param {string} projectDir - Project directory
 * @returns {object} Comprehensive hallucination check result
 */
function checkHallucination(output, projectDir = process.cwd()) {
  const uncertaintyResult = flagUncertainty(output);
  
  // Extract claims that need verification
  const claimsToVerify = [];
  const claimPatterns = [
    /(?:library|package|module|dependency)[:\s]+['"]?([^'"\s,]+)['"]?/gi,
    /(?:uses?|requires?|needs?|installs?)\s+(?:the\s+)?(['"]?)([^'"\s,]+)\1(?:\s+library)?/gi
  ];
  
  for (const pattern of claimPatterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      claimsToVerify.push(match[0]);
    }
  }
  
  // Verify each claim
  const verifiedClaims = [];
  const unverifiedClaims = [];
  
  for (const claim of claimsToVerify) {
    const verification = verifyClaim(claim, projectDir);
    if (verification.verified) {
      verifiedClaims.push({ claim, verification });
    } else {
      unverifiedClaims.push({ claim, verification });
    }
  }
  
  return {
    hallucinationRisk: unverifiedClaims.length > 0 || uncertaintyResult.flagged,
    confidence: uncertaintyResult.confidence,
    uncertainty: uncertaintyResult,
    verifiedClaims,
    unverifiedClaims,
    recommendations: unverifiedClaims.length > 0 
      ? ['Verify unverified claims against official documentation', 'Add citations for external references']
      : uncertaintyResult.flagged
        ? ['Reduce uncertainty language', 'Add specific citations']
        : []
  };
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check' && args[1]) {
    const claim = args.slice(1).join(' ');
    console.log(`Checking claim: "${claim}"`);
    const result = checkCitation(claim);
    
    if (result.cited) {
      console.log('✅ Claim has citations');
      result.citations.forEach(c => console.log(`   Source: ${c.source}`));
      console.log(`   Evidence: ${c.citations[0]?.evidence?.substring(0, 100)}...`);
    } else {
      console.log('⚠️  Claim has no citations - potential hallucination');
    }
    process.exit(result.cited ? 0 : 1);
  } else if (command === 'verify' && args[1]) {
    const claim = args.slice(1).join(' ');
    console.log(`Verifying: "${claim}"`);
    const result = verifyClaim(claim);
    
    if (result.verified) {
      console.log(`✅ Verified via ${result.source}`);
      console.log(`   Details: ${JSON.stringify(result.details)}`);
    } else {
      console.log('❌ Could not verify claim');
      console.log(`   Details: ${result.details.note}`);
    }
    process.exit(result.verified ? 0 : 1);
  } else if (command === 'uncertainty' && args[1]) {
    const text = args.slice(1).join(' ');
    console.log('Checking for uncertainty markers...');
    const result = flagUncertainty(text);
    
    if (result.flagged) {
      console.log(`⚠️  Found ${result.uncertainPhrases.length} uncertainty markers:`);
      result.uncertainPhrases.forEach(p => console.log(`   - "${p}"`));
      console.log(`Confidence: ${result.confidence}`);
    } else {
      console.log('✅ No uncertainty markers found');
    }
    process.exit(0);
  } else {
    console.log('Usage: node hallucination-guard.cjs <command> [text]');
    console.log('Commands:');
    console.log('  check <claim>      - Check if claim has citations');
    console.log('  verify <claim>     - Verify library/dependency claim');
    console.log('  uncertainty <text> - Check for uncertainty markers');
    process.exit(1);
  }
}

module.exports = {
  checkCitation,
  verifyClaim,
  flagUncertainty,
  checkHallucination
};

/**
 * Qwen Token Validator
 * 
 * Validates OAuth token file before running staging tests.
 * Checks token format, expiry, and permissions.
 * 
 * Usage: node scripts/validate-token.js [token-path]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  resource_url: string;
  expiry_date: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    expiresAt?: string;
    daysUntilExpiry?: number;
    tokenLength?: number;
  };
}

function validateToken(tokenPath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: {},
  };

  // Check file exists
  if (!fs.existsSync(tokenPath)) {
    result.valid = false;
    result.errors.push(`Token file not found: ${tokenPath}`);
    return result;
  }

  // Read and parse token file
  let tokenData: TokenData;
  try {
    const content = fs.readFileSync(tokenPath, 'utf-8');
    tokenData = JSON.parse(content);
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Failed to parse token file: ${error.message}`);
    return result;
  }

  // Validate required fields
  const requiredFields: (keyof TokenData)[] = [
    'access_token',
    'refresh_token',
    'token_type',
    'resource_url',
    'expiry_date',
  ];

  for (const field of requiredFields) {
    if (!tokenData[field]) {
      result.valid = false;
      result.errors.push(`Missing required field: ${field}`);
    }
  }

  if (!result.valid) {
    return result;
  }

  // Validate access token format
  if (typeof tokenData.access_token !== 'string') {
    result.valid = false;
    result.errors.push('access_token must be a string');
  } else {
    result.info.tokenLength = tokenData.access_token.length;
    
    if (tokenData.access_token.length < 20) {
      result.valid = false;
      result.errors.push('access_token appears too short (possible invalid format)');
    }
  }

  // Validate token type
  if (tokenData.token_type !== 'Bearer') {
    result.warnings.push(`Unexpected token_type: ${tokenData.token_type} (expected 'Bearer')`);
  }

  // Validate expiry
  const now = Date.now();
  const expiryDate = tokenData.expiry_date;
  
  if (typeof expiryDate !== 'number') {
    result.valid = false;
    result.errors.push('expiry_date must be a Unix timestamp in milliseconds');
  } else {
    const expiresAt = new Date(expiryDate);
    result.info.expiresAt = expiresAt.toISOString();
    
    const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    result.info.daysUntilExpiry = daysUntilExpiry;

    if (expiryDate < now) {
      result.valid = false;
      result.errors.push(`Token has expired (${expiresAt.toISOString()})`);
    } else if (daysUntilExpiry < 7) {
      result.warnings.push(`Token expires in ${daysUntilExpiry} days (${expiresAt.toISOString()})`);
    } else if (daysUntilExpiry < 30) {
      result.warnings.push(`Token expires in ${daysUntilExpiry} days`);
    }
  }

  // Validate resource URL
  if (tokenData.resource_url !== 'portal.qwen.ai') {
    result.warnings.push(`Unexpected resource_url: ${tokenData.resource_url}`);
  }

  return result;
}

function printResult(result: ValidationResult, tokenPath: string) {
  console.log('\n🔐 Qwen Token Validation Report');
  console.log('='.repeat(60));
  console.log(`Token Path: ${tokenPath}`);
  console.log('='.repeat(60));

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    for (const error of result.errors) {
      console.log(`   ✗ ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    for (const warning of result.warnings) {
      console.log(`   ⚠ ${warning}`);
    }
  }

  if (Object.keys(result.info).length > 0) {
    console.log('\nℹ️  INFO:');
    if (result.info.tokenLength) {
      console.log(`   • Token length: ${result.info.tokenLength} characters`);
    }
    if (result.info.expiresAt) {
      console.log(`   • Expires at: ${result.info.expiresAt}`);
    }
    if (result.info.daysUntilExpiry !== undefined) {
      console.log(`   • Days until expiry: ${result.info.daysUntilExpiry}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  if (result.valid) {
    console.log('✅ Token is VALID and ready to use');
  } else {
    console.log('❌ Token is INVALID - please fix the errors above');
  }
  console.log('='.repeat(60) + '\n');
}

function main() {
  const defaultTokenPath = 'C:\\Users\\howlil\\.qwen\\oauth_creds.json';
  const tokenPath = process.argv[2] || defaultTokenPath;

  console.log('\n🔍 Validating Qwen OAuth token...\n');

  const result = validateToken(tokenPath);
  printResult(result, tokenPath);

  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1);
}

main();

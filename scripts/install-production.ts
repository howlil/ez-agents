/**
 * Production NPM Installation Script
 * 
 * Installs ez-agents from npm registry (production-ready version)
 * and validates the installation.
 * 
 * Usage: node scripts/install-production.js [version]
 * Example: node scripts/install-production.js latest
 *          node scripts/install-production.js 4.0.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface InstallationResult {
  success: boolean;
  version: string;
  path: string;
  error?: string;
}

async function checkNpmAvailability(): Promise<boolean> {
  try {
    await execAsync('npm view @howlil/ez-agents version');
    return true;
  } catch {
    return false;
  }
}

async function getLatestVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync('npm view @howlil/ez-agents version');
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Failed to get latest version: ${error.message}`);
  }
}

async function installPackage(version: string = 'latest'): Promise<InstallationResult> {
  const packageSpec = version === 'latest' 
    ? '@howlil/ez-agents@latest' 
    : `@howlil/ez-agents@${version}`;

  console.log(`\n📦 Installing ${packageSpec}...`);

  try {
    // Install globally for system-wide availability
    await execAsync(`npm install -g ${packageSpec}`);
    
    // Get installed version
    const { stdout } = await execAsync('npm list -g @howlil/ez-agents --depth=0');
    const versionMatch = stdout.match(/@howlil\/ez-agents@([\d.]+)/);
    const installedVersion = versionMatch ? versionMatch[1] : version;

    // Get global npm prefix to find installation path
    const { stdout: prefixOutput } = await execAsync('npm prefix -g');
    const installPath = path.join(prefixOutput.trim(), 'node_modules', '@howlil', 'ez-agents');

    return {
      success: true,
      version: installedVersion,
      path: installPath,
    };
  } catch (error: any) {
    return {
      success: false,
      version,
      path: '',
      error: error.message,
    };
  }
}

async function validateInstallation(installPath: string): Promise<boolean> {
  console.log('\n🔍 Validating installation...');

  const requiredFiles = [
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(installPath, file);
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ Missing required file: ${file}`);
      return false;
    }
    console.log(`  ✓ Found: ${file}`);
  }

  // Validate package.json
  const packageJsonPath = path.join(installPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  if (!packageJson.name || !packageJson.version) {
    console.error('  ✗ Invalid package.json');
    return false;
  }

  console.log(`  ✓ Package: ${packageJson.name}@${packageJson.version}`);

  // Test CLI availability
  try {
    await execAsync('ez-agents --version');
    console.log('  ✓ CLI available: ez-agents');
  } catch {
    console.warn('  ⚠ CLI not in PATH (may need to add npm global bin to PATH)');
  }

  return true;
}

async function runSmokeTest(): Promise<boolean> {
  console.log('\n🧪 Running smoke test...');

  try {
    // Test basic import
    const testCode = `
      import { createAgent } from '@howlil/ez-agents';
      console.log('Import successful');
    `;

    await execAsync(`node -e "${testCode.replace(/\n/g, '')}"`);
    console.log('  ✓ Import test passed');

    return true;
  } catch (error: any) {
    console.error(`  ✗ Smoke test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 EZ Agents Production Installation');
  console.log('='.repeat(60));

  const requestedVersion = process.argv[2] || 'latest';

  // Check npm availability
  console.log('\n📡 Checking npm registry...');
  const available = await checkNpmAvailability();
  if (!available) {
    console.error('❌ Cannot connect to npm registry. Check your internet connection.');
    process.exit(1);
  }
  console.log('✓ npm registry accessible');

  // Get latest version info
  let latestVersion: string;
  try {
    latestVersion = await getLatestVersion();
    console.log(`📦 Latest version: ${latestVersion}`);
  } catch (error: any) {
    console.error(`⚠ ${error.message}`);
    latestVersion = 'unknown';
  }

  // Install package
  const result = await installPackage(requestedVersion);

  if (!result.success) {
    console.error('\n❌ Installation failed!');
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  console.log(`\n✅ Successfully installed @howlil/ez-agents@${result.version}`);
  console.log(`📍 Installation path: ${result.path}`);

  // Validate installation
  const valid = await validateInstallation(result.path);
  if (!valid) {
    console.error('\n❌ Installation validation failed!');
    process.exit(1);
  }

  // Run smoke test
  const smokeTestPassed = await runSmokeTest();
  if (!smokeTestPassed) {
    console.error('\n❌ Smoke test failed!');
    process.exit(1);
  }

  // Print usage instructions
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Installation complete!');
  console.log('\n📚 Quick Start:');
  console.log('   ez-agents --help          # Show available commands');
  console.log('   ez-agents --qwen --global # Configure for Qwen Code');
  console.log('   ez-agents new-project     # Create new project');
  console.log('\n💡 Tip: Add npm global bin to PATH if CLI is not available:');
  console.log('   Windows: npm config get prefix');
  console.log('   Then add <prefix> to your PATH environment variable');
  console.log('='.repeat(60));

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

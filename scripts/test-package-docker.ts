/**
 * Test Package Docker Script - Validates npm package in clean Docker environment
 *
 * Builds the package, creates Docker image, and runs tests.
 * Exits with code 0 if all tests pass.
 *
 * Usage: npm run test:package
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runCommand(command: string, description: string) {
  console.log(`\n📦 ${description}...`);
  console.log(`   Command: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: rootDir });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return { stdout, stderr };
  } catch (error: any) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.message);
    throw error;
  }
}

async function main() {
  console.log('🐳 Docker Package Test\n');
  console.log('This script will:');
  console.log('1. Build the npm package (.tgz)');
  console.log('2. Build Docker image');
  console.log('3. Run package tests in clean container\n');

  try {
    // Step 1: Create npm package
    await runCommand('npm pack', 'Creating npm package');
    
    // Find the .tgz file
    const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
    const tgzFile = `${packageJson.name.replace('/', '-')}-${packageJson.version}.tgz`;
    const tgzPath = path.join(rootDir, tgzFile);
    
    if (!fs.existsSync(tgzPath)) {
      throw new Error(`Package file not found: ${tgzPath}`);
    }
    
    console.log(`✅ Package created: ${tgzFile}`);

    // Step 2: Build Docker image
    await runCommand(
      `docker build -t ez-agents-package-test -f Dockerfile.package-test .`,
      'Building Docker image'
    );
    
    console.log('✅ Docker image built: ez-agents-package-test');

    // Step 3: Run Docker container
    await runCommand(
      'docker run --rm ez-agents-package-test',
      'Running package tests in container'
    );
    
    console.log('\n✅ All package tests passed!');
    console.log('🎉 Package is ready for publication\n');
    
    // Cleanup: Remove .tgz file
    fs.unlinkSync(tgzPath);
    console.log(`🧹 Cleaned up: ${tgzFile}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Package test failed!');
    console.error('Check the errors above and fix any issues before publishing.\n');
    process.exit(1);
  }
}

main();

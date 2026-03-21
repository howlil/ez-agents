/**
 * Gate 6 Documentation Validator Tests
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the validator
const { validateDocs, getRequiredDocs, validateSections } = await import(path.join(__dirname, '../../../.planning/gates/gate-06-docs/validator.cjs'));

describe('Gate 6 Validator', () => {
  describe('getRequiredDocs', () => {
    it('should return MVP documentation requirements', () => {
      const docs = getRequiredDocs('mvp');
      assert.ok(Array.isArray(docs));
      assert.ok(docs.some(d => d.path === 'README.md'));
    });
    
    it('should return Medium documentation requirements', () => {
      const docs = getRequiredDocs('medium');
      assert.ok(docs.length >= 3);
      assert.ok(docs.some(d => d.path === 'README.md'));
      assert.ok(docs.some(d => d.path === 'docs/api.md'));
      assert.ok(docs.some(d => d.path === 'docs/deployment.md'));
    });
    
    it('should return Enterprise documentation requirements', () => {
      const docs = getRequiredDocs('enterprise');
      assert.ok(docs.length >= 5);
      assert.ok(docs.some(d => d.path === 'docs/architecture.md'));
      assert.ok(docs.some(d => d.path === 'docs/runbooks/'));
    });
    
    it('should throw for unknown tier', () => {
      assert.throws(
        () => getRequiredDocs('invalid'),
        /Unknown tier/
      );
    });
  });
  
  describe('validateSections', () => {
    let tempFile;
    
    beforeEach(() => {
      tempFile = path.join(os.tmpdir(), `test-${Date.now()}.md`);
    });
    
    afterEach(() => {
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore
      }
    });
    
    it('should return failure when document does not exist', () => {
      const result = validateSections('/nonexistent/file.md', ['Section 1']);
      assert.strictEqual(result.pass, false);
      assert.strictEqual(result.exists, false);
    });
    
    it('should return failure when document is too short', () => {
      fs.writeFileSync(tempFile, 'too short');
      const result = validateSections(tempFile, ['Section 1']);
      assert.strictEqual(result.pass, false);
      assert.ok(result.missingSections.some(m => m.includes('too short')));
    });
    
    it('should pass when all sections present', () => {
      const content = `# Test Document

## Section 1

Content here.

## Section 2

More content.
`;
      fs.writeFileSync(tempFile, content);
      const result = validateSections(tempFile, ['Section 1', 'Section 2']);
      assert.strictEqual(result.pass, true);
      assert.strictEqual(result.missingSections.length, 0);
    });
    
    it('should fail when sections missing', () => {
      const content = `# Test Document

## Section 1

This is some content here that makes the file longer than 50 bytes minimum requirement.
`;
      fs.writeFileSync(tempFile, content);
      const result = validateSections(tempFile, ['Section 1', 'Section 2', 'Section 3']);
      assert.strictEqual(result.pass, false);
      assert.ok(result.missingSections.some(m => m.includes('Section 2')));
      assert.ok(result.missingSections.some(m => m.includes('Section 3')));
    });
  });
  
  describe('validateDocs', () => {
    let tempDir;
    
    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate6-test-'));
    });
    
    afterEach(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    
    it('should fail when required documentation is missing', async () => {
      const result = await validateDocs(tempDir, 'mvp');
      assert.strictEqual(result.pass, false);
      assert.ok(result.failures.some(f => f.includes('Missing')));
    });

    it('should pass when MVP documentation exists with required sections', async () => {
      // Create README.md with required sections
      const readmeContent = `# Project

Brief description of the project goes here to make the file longer.

## Installation

Install instructions with detailed content to meet minimum file size requirements.

## Usage

Usage instructions with detailed content to meet minimum file size requirements.

## Configuration

Config instructions with detailed content to meet minimum file size requirements.
`;
      fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent);

      const result = await validateDocs(tempDir, 'mvp');
      assert.strictEqual(result.pass, true);
    });

    it('should fail when sections are missing', async () => {
      // Create README.md without all required sections
      const readmeContent = `# Project

## Installation

Install instructions.
`;
      fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent);

      const result = await validateDocs(tempDir, 'mvp');
      assert.strictEqual(result.pass, false);
      assert.ok(result.failures.some(f => f.includes('Missing section')));
    });
    
    it('should validate medium tier requirements', async () => {
      // Create docs directory
      const docsDir = path.join(tempDir, 'docs');
      fs.mkdirSync(docsDir);

      // Create README.md with sufficient content
      fs.writeFileSync(path.join(tempDir, 'README.md'), `# Project

Brief project description with enough content to meet minimum file size requirements.

## Installation

Installation instructions with detailed content to meet minimum file size requirements.

## Usage

Usage instructions with detailed content to meet minimum file size requirements.

## Configuration

Configuration instructions with detailed content to meet minimum file size requirements.

## API Reference

API reference overview with detailed content to meet minimum file size requirements.
`);

      // Create api.md with sufficient content
      fs.writeFileSync(path.join(docsDir, 'api.md'), `# API Docs

API documentation overview with enough content to meet minimum file size requirements.

## Endpoints

Endpoints section with detailed content to meet minimum file size requirements.

## Request/Response

Request/Response section with detailed content to meet minimum file size requirements.

## Authentication

Authentication section with detailed content to meet minimum file size requirements.

## Error Codes

Error Codes section with detailed content to meet minimum file size requirements.
`);

      // Create deployment.md with sufficient content
      fs.writeFileSync(path.join(docsDir, 'deployment.md'), `# Deployment

Deployment guide overview with enough content to meet minimum file size requirements.

## Prerequisites

Prerequisites section with detailed content to meet minimum file size requirements.

## Environment Variables

Environment Variables section with detailed content to meet minimum file size requirements.

## Deploy Steps

Deploy Steps section with detailed content to meet minimum file size requirements.

## Rollback

Rollback section with detailed content to meet minimum file size requirements.
`);

      const result = await validateDocs(tempDir, 'medium');
      assert.strictEqual(result.pass, true);
    });
  });
});

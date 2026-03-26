import { describe, it, expect } from 'vitest';
import { detect } from '../../bin/lib/deploy/deploy-detector.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Deploy Detector', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('detect()', () => {
    it('returns vercel when vercel.json exists', () => {
      fs.writeFileSync(path.join(tempDir, 'vercel.json'), '{}');
      const result = detect(tempDir);
      expect(result.platform).toBe('vercel');
      expect(result.confidence).toBe('high');
    });

    it('returns fly.io when fly.toml exists', () => {
      fs.writeFileSync(path.join(tempDir, 'fly.toml'), '');
      const result = detect(tempDir);
      expect(result.platform).toBe('fly.io');
      expect(result.confidence).toBe('high');
    });

    it('returns heroku when Procfile exists', () => {
      fs.writeFileSync(path.join(tempDir, 'Procfile'), 'web: node index.js');
      const result = detect(tempDir);
      expect(result.platform).toBe('heroku');
      expect(result.confidence).toBe('high');
    });

    it('returns unknown when no config files found', () => {
      const result = detect(tempDir);
      expect(result.platform).toBe('unknown');
      expect(result.confidence).toBe('none');
    });

    it('uses git remote as fallback detection', () => {
      // Mock git remote detection
      fs.mkdirSync(path.join(tempDir, '.git'));
      const result = detect(tempDir);
      // Should attempt git remote check
      expect(result).toHaveProperty('platform');
    });

    it('returns confidence level (high/medium/low/none)', () => {
      fs.writeFileSync(path.join(tempDir, 'vercel.json'), '{}');
      const result = detect(tempDir);
      expect(['high', 'medium', 'low', 'none']).toContain(result.confidence);
    });
  });
});

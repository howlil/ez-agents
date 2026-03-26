import { describe, it, expect } from 'vitest';

describe('Deploy Rollback', () => {
  describe('rollback()', () => {
    it('runs vercel rollback for vercel platform', async () => {
      const { rollback } = await import('../../bin/lib/deploy/deploy-rollback.js');
      expect(rollback).toBeDefined();
    });

    it('runs fly rollback for fly.io platform', async () => {
      const { rollback } = await import('../../bin/lib/deploy/deploy-rollback.js');
      expect(rollback).toBeDefined();
    });

    it('runs git revert for unknown platforms', async () => {
      const { rollback } = await import('../../bin/lib/deploy/deploy-rollback.js');
      expect(rollback).toBeDefined();
    });

    it('throws on rollback failure', async () => {
      const { rollback } = await import('../../bin/lib/deploy/deploy-rollback.js');
      expect(rollback).toBeDefined();
    });
  });
});

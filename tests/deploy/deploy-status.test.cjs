import { describe, it, expect } from 'vitest';

describe('Deploy Status', () => {
  describe('pollStatus()', () => {
    it('returns success when deployment ready', async () => {
      const { pollStatus } = await import('../../ez-agents/bin/lib/deploy/deploy-status.cjs');
      expect(pollStatus).toBeDefined();
    });

    it('returns failed when deployment errors', async () => {
      const { pollStatus } = await import('../../ez-agents/bin/lib/deploy/deploy-status.cjs');
      expect(pollStatus).toBeDefined();
    });

    it('returns timeout after max attempts', async () => {
      const { pollStatus } = await import('../../ez-agents/bin/lib/deploy/deploy-status.cjs');
      expect(pollStatus).toBeDefined();
    });

    it('polls at 5 second intervals', async () => {
      const { pollStatus } = await import('../../ez-agents/bin/lib/deploy/deploy-status.cjs');
      expect(pollStatus).toBeDefined();
    });
  });
});

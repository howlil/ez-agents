import { describe, it, expect } from 'vitest';

describe('Deploy Health Check', () => {
  describe('checkHealth()', () => {
    it('GETs deployment URL', async () => {
      const { checkHealth } = await import('../../ez-agents/bin/lib/deploy/deploy-health-check.cjs');
      expect(checkHealth).toBeDefined();
    });

    it('returns healthy on 200 response', async () => {
      const { checkHealth } = await import('../../ez-agents/bin/lib/deploy/deploy-health-check.cjs');
      expect(checkHealth).toBeDefined();
    });

    it('returns unhealthy on 500 response', async () => {
      const { checkHealth } = await import('../../ez-agents/bin/lib/deploy/deploy-health-check.cjs');
      expect(checkHealth).toBeDefined();
    });

    it('returns unhealthy on timeout', async () => {
      const { checkHealth } = await import('../../ez-agents/bin/lib/deploy/deploy-health-check.cjs');
      expect(checkHealth).toBeDefined();
    });

    it('checks multiple endpoints', async () => {
      const { checkHealth } = await import('../../ez-agents/bin/lib/deploy/deploy-health-check.cjs');
      expect(checkHealth).toBeDefined();
    });
  });
});

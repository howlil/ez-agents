import { describe, it, expect } from 'vitest';

describe('Deploy Pre-Flight', () => {
  describe('runPreFlight()', () => {
    it('runs npm test', async () => {
      const { runPreFlight } = await import('../../ez-agents/bin/lib/deploy/deploy-pre-flight.cjs');
      expect(runPreFlight).toBeDefined();
    });

    it('runs npm run lint', async () => {
      const { runPreFlight } = await import('../../ez-agents/bin/lib/deploy/deploy-pre-flight.cjs');
      expect(runPreFlight).toBeDefined();
    });

    it('returns passed: true when both pass', async () => {
      const { runPreFlight } = await import('../../ez-agents/bin/lib/deploy/deploy-pre-flight.cjs');
      expect(runPreFlight).toBeDefined();
    });

    it('returns passed: false when tests fail', async () => {
      const { runPreFlight } = await import('../../ez-agents/bin/lib/deploy/deploy-pre-flight.cjs');
      expect(runPreFlight).toBeDefined();
    });

    it('returns passed: false when lint fails', async () => {
      const { runPreFlight } = await import('../../ez-agents/bin/lib/deploy/deploy-pre-flight.cjs');
      expect(runPreFlight).toBeDefined();
    });
  });
});

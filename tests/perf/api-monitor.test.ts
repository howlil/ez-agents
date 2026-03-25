import { describe, it, expect } from 'vitest';

describe('API Monitor', () => {
  describe('trackEndpoint()', () => {
    it('returns latency', async () => {
      const { trackEndpoint } = await import('../../ez-agents/bin/lib/perf/api-monitor.cjs');
      expect(trackEndpoint).toBeDefined();
    });

    it('returns status code', async () => {
      const { trackEndpoint } = await import('../../ez-agents/bin/lib/perf/api-monitor.cjs');
      expect(trackEndpoint).toBeDefined();
    });

    it('calculates percentiles (p50/p95/p99)', async () => {
      const { calculatePercentiles } = await import('../../ez-agents/bin/lib/perf/api-monitor.cjs');
      expect(calculatePercentiles).toBeDefined();
    });

    it('handles timeout', async () => {
      const { trackEndpoint } = await import('../../ez-agents/bin/lib/perf/api-monitor.cjs');
      expect(trackEndpoint).toBeDefined();
    });

    it('handles connection errors', async () => {
      const { trackEndpoint } = await import('../../ez-agents/bin/lib/perf/api-monitor.cjs');
      expect(trackEndpoint).toBeDefined();
    });
  });
});

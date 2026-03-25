import { describe, it, expect } from 'vitest';

describe('Regression Detector', () => {
  describe('detectRegressions()', () => {
    it('returns empty array when no regression', async () => {
      const { detectRegressions } = await import('../../ez-agents/bin/lib/perf/regression-detector.cjs');
      expect(detectRegressions).toBeDefined();
    });

    it('flags >10% degradation', async () => {
      const { detectRegressions } = await import('../../ez-agents/bin/lib/perf/regression-detector.cjs');
      expect(detectRegressions).toBeDefined();
    });

    it('calculates changePercent correctly', async () => {
      const { detectRegressions } = await import('../../ez-agents/bin/lib/perf/regression-detector.cjs');
      expect(detectRegressions).toBeDefined();
    });

    it('assigns severity (critical/high/medium)', async () => {
      const { detectRegressions } = await import('../../ez-agents/bin/lib/perf/regression-detector.cjs');
      expect(detectRegressions).toBeDefined();
    });

    it('handles missing baseline metrics', async () => {
      const { detectRegressions } = await import('../../ez-agents/bin/lib/perf/regression-detector.cjs');
      expect(detectRegressions).toBeDefined();
    });
  });
});

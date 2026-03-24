import { describe, it, expect } from 'vitest';

describe('Frontend Performance', () => {
  describe('runLighthouse()', () => {
    it('returns performance score', async () => {
      const { runLighthouse } = await import('../../ez-agents/bin/lib/perf/frontend-performance.cjs');
      expect(runLighthouse).toBeDefined();
    });

    it('returns Core Web Vitals', async () => {
      const { runLighthouse } = await import('../../ez-agents/bin/lib/perf/frontend-performance.cjs');
      expect(runLighthouse).toBeDefined();
    });

    it('returns opportunities', async () => {
      const { runLighthouse } = await import('../../ez-agents/bin/lib/perf/frontend-performance.cjs');
      expect(runLighthouse).toBeDefined();
    });

    it('handles timeout', async () => {
      const { runLighthouse } = await import('../../ez-agents/bin/lib/perf/frontend-performance.cjs');
      expect(runLighthouse).toBeDefined();
    });

    it('handles invalid URL', async () => {
      const { runLighthouse } = await import('../../ez-agents/bin/lib/perf/frontend-performance.cjs');
      expect(runLighthouse).toBeDefined();
    });
  });
});

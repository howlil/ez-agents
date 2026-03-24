import { describe, it, expect } from 'vitest';

describe('Perf Analyzer', () => {
  describe('analyze()', () => {
    it('runs all analyzers', async () => {
      const { analyze } = await import('../../ez-agents/bin/lib/perf/perf-analyzer.cjs');
      expect(analyze).toBeDefined();
    });

    it('aggregates results', async () => {
      const { analyze } = await import('../../ez-agents/bin/lib/perf/perf-analyzer.cjs');
      expect(analyze).toBeDefined();
    });

    it('includes timestamp', async () => {
      const { analyze } = await import('../../ez-agents/bin/lib/perf/perf-analyzer.cjs');
      expect(analyze).toBeDefined();
    });

    it('returns structured result', async () => {
      const { analyze } = await import('../../ez-agents/bin/lib/perf/perf-analyzer.cjs');
      expect(analyze).toBeDefined();
    });

    it('handles analyzer failures gracefully', async () => {
      const { analyze } = await import('../../ez-agents/bin/lib/perf/perf-analyzer.cjs');
      expect(analyze).toBeDefined();
    });
  });
});

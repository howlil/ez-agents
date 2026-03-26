import { describe, it, expect } from 'vitest';

describe('Perf Analyzer', () => {
  describe('class exports', () => {
    it('exports PerfAnalyzer class', async () => {
      const mod = await import('../../bin/lib/perf/perf-analyzer.js');
      expect(mod.PerfAnalyzer).toBeDefined();
    });
  });

  describe('instance methods', () => {
    it('can create instance', async () => {
      const mod = await import('../../bin/lib/perf/perf-analyzer.js');
      const instance = new mod.PerfAnalyzer();
      expect(instance).toBeDefined();
    });

    it('has analyze method', async () => {
      const mod = await import('../../bin/lib/perf/perf-analyzer.js');
      const instance = new mod.PerfAnalyzer();
      expect(instance.analyze).toBeDefined();
    });

    it('analyze method returns structured result', async () => {
      const mod = await import('../../bin/lib/perf/perf-analyzer.js');
      const instance = new mod.PerfAnalyzer();
      const result = await instance.analyze({});
      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('analyze method includes timestamp', async () => {
      const mod = await import('../../bin/lib/perf/perf-analyzer.js');
      const instance = new mod.PerfAnalyzer();
      const result = await instance.analyze({});
      expect(result.timestamp).toBeDefined();
    });

    it('analyze method handles errors gracefully', async () => {
      const mod = await import('../../bin/lib/perf/perf-analyzer.js');
      const instance = new mod.PerfAnalyzer();
      const result = await instance.analyze({});
      expect(result).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});

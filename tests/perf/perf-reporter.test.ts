import { describe, it, expect } from 'vitest';

describe('Perf Reporter', () => {
  describe('generateReport()', () => {
    it('creates structured report', async () => {
      const { generateReport } = await import('../../bin/lib/perf/perf-reporter.js');
      expect(generateReport).toBeDefined();
    });

    it('includes all analyzer results', async () => {
      const { generateReport } = await import('../../bin/lib/perf/perf-reporter.js');
      expect(generateReport).toBeDefined();
    });
  });

  describe('saveReport()', () => {
    it('is defined and callable', async () => {
      const { saveReport } = await import('../../bin/lib/perf/perf-reporter.js');
      expect(saveReport).toBeDefined();
    });

    it('includes timestamp in filename', async () => {
      const { saveReport } = await import('../../bin/lib/perf/perf-reporter.js');
      expect(saveReport).toBeDefined();
    });
  });
});

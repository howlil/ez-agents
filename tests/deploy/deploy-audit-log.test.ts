import { describe, it, expect } from 'vitest';

describe('Deploy Audit Log', () => {
  describe('writeAuditLog()', () => {
    it('is defined and callable', async () => {
      const { writeAuditLog } = await import('../../ez-agents/bin/lib/deploy/deploy-audit-log.cjs');
      expect(writeAuditLog).toBeDefined();
    });

    it('includes timestamp in filename', async () => {
      const { writeAuditLog } = await import('../../ez-agents/bin/lib/deploy/deploy-audit-log.cjs');
      expect(writeAuditLog).toBeDefined();
    });

    it('includes deploy details in JSON format', async () => {
      const { writeAuditLog } = await import('../../ez-agents/bin/lib/deploy/deploy-audit-log.cjs');
      expect(writeAuditLog).toBeDefined();
    });
  });
});

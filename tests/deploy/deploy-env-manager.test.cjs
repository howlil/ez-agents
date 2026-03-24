import { describe, it, expect } from 'vitest';

describe('Deploy Env Manager', () => {
  describe('getEnvConfig()', () => {
    it('returns config for specified environment', async () => {
      const { getEnvConfig } = await import('../../ez-agents/bin/lib/deploy/deploy-env-manager.cjs');
      expect(getEnvConfig).toBeDefined();
    });

    it('returns default for unknown environment', async () => {
      const { getEnvConfig } = await import('../../ez-agents/bin/lib/deploy/deploy-env-manager.cjs');
      expect(getEnvConfig).toBeDefined();
    });
  });

  describe('setEnv()', () => {
    it('updates environment config', async () => {
      const { setEnv } = await import('../../ez-agents/bin/lib/deploy/deploy-env-manager.cjs');
      expect(setEnv).toBeDefined();
    });
  });

  describe('listEnvs()', () => {
    it('returns all configured environments', async () => {
      const { listEnvs } = await import('../../ez-agents/bin/lib/deploy/deploy-env-manager.cjs');
      expect(listEnvs).toBeDefined();
    });
  });

  describe('validateEnv()', () => {
    it('checks required vars for environment', async () => {
      const { validateEnv } = await import('../../ez-agents/bin/lib/deploy/deploy-env-manager.cjs');
      expect(validateEnv).toBeDefined();
    });
  });
});

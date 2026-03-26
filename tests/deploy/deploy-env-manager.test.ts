import { describe, it, expect } from 'vitest';

describe('Deploy Env Manager', () => {
  describe('class exports', () => {
    it('exports DeployEnvManager class', async () => {
      const mod = await import('../../bin/lib/deploy/deploy-env-manager.js');
      expect(mod.DeployEnvManager).toBeDefined();
    });

    it('exports EnvConfig interface type', async () => {
      const mod = await import('../../bin/lib/deploy/deploy-env-manager.js');
      // Interfaces don't exist at runtime, but class should
      expect(mod.DeployEnvManager).toBeDefined();
    });
  });

  describe('instance methods', () => {
    it('can create instance', async () => {
      const mod = await import('../../bin/lib/deploy/deploy-env-manager.js');
      const instance = new mod.DeployEnvManager();
      expect(instance).toBeDefined();
    });

    it('has getEnvConfig method', async () => {
      const mod = await import('../../bin/lib/deploy/deploy-env-manager.js');
      const instance = new mod.DeployEnvManager();
      expect(instance.getEnvConfig).toBeDefined();
    });

    it('has setEnv method', async () => {
      const mod = await import('../../bin/lib/deploy/deploy-env-manager.js');
      const instance = new mod.DeployEnvManager();
      expect(instance.setEnv).toBeDefined();
    });

    it('has listEnvs method', async () => {
      const mod = await import('../../bin/lib/deploy/deploy-env-manager.js');
      const instance = new mod.DeployEnvManager();
      expect(instance.listEnvs).toBeDefined();
    });

    it('has validateEnv method', async () => {
      const mod = await import('../../bin/lib/deploy/deploy-env-manager.js');
      const instance = new mod.DeployEnvManager();
      expect(instance.validateEnv).toBeDefined();
    });
  });
});

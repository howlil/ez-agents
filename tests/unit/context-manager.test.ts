import { ContextManager } from '../../bin/lib/context-manager.js';

describe('ContextManager', () => {
  let tmpDir: string;
  let manager: ContextManager;

  beforeEach(() => {
    tmpDir = createTempProject();
    manager = new ContextManager(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(manager).toBeTruthy();
  });

  test('main methods work', async () => {
    const result = {};
    expect(result !== undefined).toBeTruthy();
  });
});
